import { ref, computed } from 'vue'

// Cache keys
const CACHE_KEY_DATA = 'paramilitary-leaks-parquet-data'
const CACHE_KEY_METADATA = 'paramilitary-leaks-parquet-metadata'

/**
 * Enhanced composable for reliable fetching from R2 with retries, progress tracking, and caching
 */
export function useR2Storage() {
  const config = useRuntimeConfig()
  
  // Track download progress
  const downloadProgress = ref(0)
  const downloadedBytes = ref(0)
  const totalBytes = ref(0)
  const isDownloading = ref(false)
  const downloadStartTime = ref(null)
  const downloadStatus = ref('Initializing...')
  
  // Cache status
  const isCacheAvailable = ref(false)
  const cacheMetadata = ref(null)
  const isCacheChecked = ref(false)
  
  // Computed properties for cache
  const cacheTimestamp = computed(() => cacheMetadata.value?.timestamp || null)
  const cachedSize = computed(() => cacheMetadata.value?.size || 0)

  /**
   * Get the URL for the parquet file
   * @returns {string} - The URL to the file
   */
  function getFileUrl() {
    return config.public.R2_PARQUET_URL
  }

  /**
   * Check if the cache is available
   * @returns {Promise<boolean>} - Whether the cache is available
   */
  async function checkCache() {
    try {
      if (typeof localStorage === 'undefined' || typeof indexedDB === 'undefined') {
        console.log('Storage APIs not available')
        isCacheAvailable.value = false
        isCacheChecked.value = true
        return false
      }
      
      // First check the metadata which is smaller
      const metadataJson = localStorage.getItem(CACHE_KEY_METADATA)
      if (!metadataJson) {
        console.log('No cached metadata found')
        isCacheAvailable.value = false
        isCacheChecked.value = true
        return false
      }
      
      // Parse metadata
      const metadata = JSON.parse(metadataJson)
      cacheMetadata.value = metadata
      
      // Open IndexedDB to check if actual data exists
      return new Promise((resolve) => {
        const request = indexedDB.open('ParamilitaryLeaksCache', 1)
        
        request.onupgradeneeded = (event) => {
          const db = event.target.result
          // Create object store if it doesn't exist
          if (!db.objectStoreNames.contains('parquetFiles')) {
            db.createObjectStore('parquetFiles')
          }
        }
        
        request.onsuccess = (event) => {
          const db = event.target.result
          const transaction = db.transaction(['parquetFiles'], 'readonly')
          const store = transaction.objectStore('parquetFiles')
          const getRequest = store.get(CACHE_KEY_DATA)
          
          getRequest.onsuccess = () => {
            const cacheExists = !!getRequest.result
            console.log(`Cache check: ${cacheExists ? 'Found' : 'Not found'}`)
            isCacheAvailable.value = cacheExists
            isCacheChecked.value = true
            resolve(cacheExists)
          }
          
          getRequest.onerror = () => {
            console.error('Error checking cache:', getRequest.error)
            isCacheAvailable.value = false
            isCacheChecked.value = true
            resolve(false)
          }
        }
        
        request.onerror = () => {
          console.error('Error opening IndexedDB:', request.error)
          isCacheAvailable.value = false
          isCacheChecked.value = true
          resolve(false)
        }
      })
    } catch (error) {
      console.error('Error checking cache:', error)
      isCacheAvailable.value = false
      isCacheChecked.value = true
      return false
    }
  }

  /**
   * Fetch data from cache
   * @returns {Promise<ArrayBuffer>} - The cached data
   */
  async function fetchFromCache() {
    if (!isCacheAvailable.value) {
      throw new Error('Cache not available')
    }
    
    console.log('Fetching data from cache...')
    downloadStatus.value = 'Loading from cache...'
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('ParamilitaryLeaksCache', 1)
      
      request.onsuccess = (event) => {
        const db = event.target.result
        const transaction = db.transaction(['parquetFiles'], 'readonly')
        const store = transaction.objectStore('parquetFiles')
        const getRequest = store.get(CACHE_KEY_DATA)
        
        getRequest.onsuccess = () => {
          if (!getRequest.result) {
            reject(new Error('Data not found in cache'))
            return
          }
          
          console.log('Successfully retrieved data from cache')
          const arrayBuffer = getRequest.result.data
          
          // Create a response-like object
          const response = new Response(arrayBuffer, {
            status: 200,
            statusText: 'OK from cache',
            headers: new Headers({
              'Content-Type': 'application/octet-stream',
              'Content-Length': arrayBuffer.byteLength.toString()
            })
          })
          
          resolve(response)
        }
        
        getRequest.onerror = () => {
          console.error('Error reading from cache:', getRequest.error)
          reject(new Error('Failed to read from cache'))
        }
      }
      
      request.onerror = () => {
        console.error('Error opening IndexedDB:', request.error)
        reject(new Error('Failed to open cache database'))
      }
    })
  }

  /**
   * Save data to cache
   * @param {ArrayBuffer} data - The data to cache
   * @param {Object} metadata - Metadata about the file
   * @returns {Promise<void>}
   */
  async function saveToCache(data, metadata = {}) {
    if (typeof indexedDB === 'undefined' || typeof localStorage === 'undefined') {
      console.log('Storage APIs not available, skipping cache')
      return
    }
    
    try {
      console.log('Saving data to cache...')
      downloadStatus.value = 'Saving to cache...'
      
      // Save metadata to localStorage (small and quick access)
      const metadataToSave = {
        url: getFileUrl(),
        timestamp: Date.now(),
        size: data.byteLength,
        ...metadata
      }
      
      localStorage.setItem(CACHE_KEY_METADATA, JSON.stringify(metadataToSave))
      cacheMetadata.value = metadataToSave
      
      // Save actual data to IndexedDB (supports large binary data)
      return new Promise((resolve, reject) => {
        const request = indexedDB.open('ParamilitaryLeaksCache', 1)
        
        request.onupgradeneeded = (event) => {
          const db = event.target.result
          if (!db.objectStoreNames.contains('parquetFiles')) {
            db.createObjectStore('parquetFiles')
          }
        }
        
        request.onsuccess = (event) => {
          const db = event.target.result
          const transaction = db.transaction(['parquetFiles'], 'readwrite')
          const store = transaction.objectStore('parquetFiles')
          
          // Store with wrapper object to include additional metadata if needed
          const putRequest = store.put({ data, timestamp: Date.now() }, CACHE_KEY_DATA)
          
          putRequest.onsuccess = () => {
            console.log('Successfully saved data to cache')
            isCacheAvailable.value = true
            resolve()
          }
          
          putRequest.onerror = () => {
            console.error('Error saving to cache:', putRequest.error)
            reject(new Error('Failed to save to cache'))
          }
        }
        
        request.onerror = () => {
          console.error('Error opening IndexedDB:', request.error)
          reject(new Error('Failed to open cache database'))
        }
      })
    } catch (error) {
      console.error('Error saving to cache:', error)
    }
  }

  /**
   * Clear the cache
   * @returns {Promise<void>}
   */
  async function clearCache() {
    try {
      console.log('Clearing cache...')
      
      // Clear metadata from localStorage
      localStorage.removeItem(CACHE_KEY_METADATA)
      cacheMetadata.value = null
      
      // Clear data from IndexedDB
      return new Promise((resolve, reject) => {
        const request = indexedDB.open('ParamilitaryLeaksCache', 1)
        
        request.onsuccess = (event) => {
          const db = event.target.result
          const transaction = db.transaction(['parquetFiles'], 'readwrite')
          const store = transaction.objectStore('parquetFiles')
          const clearRequest = store.delete(CACHE_KEY_DATA)
          
          clearRequest.onsuccess = () => {
            console.log('Successfully cleared cache')
            isCacheAvailable.value = false
            resolve()
          }
          
          clearRequest.onerror = () => {
            console.error('Error clearing cache:', clearRequest.error)
            reject(new Error('Failed to clear cache'))
          }
        }
        
        request.onerror = () => {
          console.error('Error opening IndexedDB:', request.error)
          reject(new Error('Failed to open cache database'))
        }
      })
    } catch (error) {
      console.error('Error clearing cache:', error)
    }
  }

  /**
   * Fetch the parquet file with retry logic, streaming for large files, and caching
   * @param {Object} options - Options for fetching
   * @param {number} options.maxRetries - Maximum number of retry attempts
   * @param {boolean} options.useCache - Whether to use the cache
   * @param {boolean} options.forceFresh - Whether to force a fresh download
   * @returns {Promise<Response>} - The fetch response
   */
  async function fetchFile({
    maxRetries = 3,
    useCache = true,
    forceFresh = false
  } = {}) {
    // Check cache first if we're allowed to use it
    if (useCache && !forceFresh) {
      await checkCache()
      
      if (isCacheAvailable.value) {
        try {
          return await fetchFromCache()
        } catch (error) {
          console.warn('Failed to fetch from cache, falling back to network:', error)
          // Fall through to network fetch
        }
      }
    }
    
    const url = getFileUrl()
    console.log(`Fetching parquet file from: ${url}`)
    
    // Reset download tracking
    isDownloading.value = true
    downloadProgress.value = 0
    downloadedBytes.value = 0
    totalBytes.value = 0
    downloadStartTime.value = Date.now()
    downloadStatus.value = 'Connecting...'
    
    let retryCount = 0
    let fetchError = null
    
    while (retryCount < maxRetries) {
      try {
        // Use fetch with a timeout for better error handling
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 second timeout
        
        downloadStatus.value = 'Connecting to server...'
        const response = await fetch(url, {
          method: 'GET',
          mode: 'cors',
          credentials: 'omit',
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        
        if (!response.ok) {
          console.error(`Failed to fetch file: ${response.status} ${response.statusText}`)
          throw new Error(`HTTP error ${response.status}`)
        }
        
        console.log('Successfully connected to server')
        console.log(`Content-Type: ${response.headers.get('content-type')}`)
        
        const contentLength = response.headers.get('content-length')
        console.log(`Content-Length: ${contentLength} bytes`)
        
        if (contentLength) {
          totalBytes.value = parseInt(contentLength)
        }
        
        // For small files or if content length is unknown, don't bother with streaming
        if (!contentLength || parseInt(contentLength) < 1 * 1024 * 1024) {
          downloadStatus.value = 'Downloading small file...'
          const buffer = await response.arrayBuffer()
          
          // Save to cache
          if (useCache) {
            await saveToCache(buffer)
          }
          
          isDownloading.value = false
          downloadProgress.value = 100
          downloadStatus.value = 'Complete'
          
          return new Response(buffer, {
            status: 200,
            statusText: 'OK',
            headers: response.headers
          })
        }
        
        // For large files, use streaming to track progress
        downloadStatus.value = 'Downloading data...'
        const reader = response.body.getReader()
        let receivedSize = 0
        const chunks = []
        
        // Process the data stream
        let lastProgressUpdate = 0
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          
          chunks.push(value)
          receivedSize += value.length
          downloadedBytes.value = receivedSize
          
          // Only update progress every 100ms to avoid too many updates
          const now = Date.now()
          if (now - lastProgressUpdate > 100) {
            downloadProgress.value = Math.round((receivedSize / totalBytes.value) * 100)
            lastProgressUpdate = now
            
            // Calculate speed
            const elapsedSeconds = (now - downloadStartTime.value) / 1000
            const bytesPerSecond = receivedSize / elapsedSeconds
            const speedMbps = (bytesPerSecond * 8 / 1024 / 1024).toFixed(2)
            downloadStatus.value = `Downloading at ${speedMbps} Mbps`
            
            // Log progress at regular intervals
            if (downloadProgress.value % 10 === 0) {
              console.log(`Download progress: ${downloadProgress.value}%`)
            }
          }
        }
        
        // Combine chunks into a single ArrayBuffer
        const arrayBuffer = new ArrayBuffer(receivedSize)
        const uint8Array = new Uint8Array(arrayBuffer)
        let position = 0
        for (const chunk of chunks) {
          uint8Array.set(chunk, position)
          position += chunk.length
        }
        
        downloadStatus.value = 'Download complete, processing...'
        isDownloading.value = false
        downloadProgress.value = 100
        
        // Save to cache after successful download
        if (useCache) {
          await saveToCache(arrayBuffer)
        }
        
        downloadStatus.value = 'Complete'
        
        // Create a new response with the data
        return new Response(arrayBuffer, {
          status: 200,
          statusText: 'OK',
          headers: response.headers
        })
        
      } catch (error) {
        console.error(`Attempt ${retryCount + 1} failed:`, error)
        fetchError = error
        retryCount++
        
        if (retryCount < maxRetries) {
          const delay = Math.pow(2, retryCount) * 1000 // Exponential backoff
          console.log(`Retrying in ${delay/1000} seconds...`)
          downloadStatus.value = `Connection failed. Retrying in ${delay/1000} seconds...`
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }
    
    // If we get here, all retries have failed
    isDownloading.value = false
    downloadStatus.value = 'Failed to download'
    console.error('All retry attempts failed to fetch file')
    
    // More detailed error logging
    if (fetchError) {
      if (fetchError.name === 'AbortError') {
        console.error('Request timed out. The server might be slow or unresponsive.')
        downloadStatus.value = 'Connection timed out'
      } else if (fetchError.name === 'TypeError' && fetchError.message.includes('Failed to fetch')) {
        console.error('This might be a CORS issue or the server is unreachable.')
        downloadStatus.value = 'Network error'
      }
    }
    
    throw new Error(`Failed to fetch file after ${maxRetries} attempts: ${fetchError?.message || 'Unknown error'}`)
  }

  return {
    getFileUrl,
    fetchFile,
    checkCache,
    clearCache,
    downloadProgress,
    downloadedBytes,
    totalBytes,
    isDownloading,
    downloadStartTime,
    downloadStatus,
    isCacheAvailable,
    cacheTimestamp,
    cachedSize
  }
}
