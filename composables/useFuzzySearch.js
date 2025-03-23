import { ref } from 'vue'
import * as duckdb from '@duckdb/duckdb-wasm'

// Singleton DB instance for the entire application
let globalDB = null
let globalConnection = null
let globalWorker = null
let isDBInitialized = false
let dbInitializationPromise = null
let originalBuffer = null // Store original buffer copy

export function useFuzzySearch() {
  const isSearching = ref(false)
  const searchError = ref(null)

  // Initialize DuckDB once for the whole application
  async function initDuckDB(parquetBuffer) {
    // If already initialized, return immediately
    if (isDBInitialized) return true

    // If initialization is in progress, wait for it
    if (dbInitializationPromise) {
      return dbInitializationPromise
    }

    // Store original buffer if not already saved
    if (!originalBuffer && parquetBuffer) {
      originalBuffer = parquetBuffer.slice(0)
      console.log('Original buffer stored for future use')
    }

    // Start initialization
    dbInitializationPromise = initDuckDBInternal()
    return dbInitializationPromise
  }

  // Internal initialization function
  async function initDuckDBInternal() {
    try {
      console.log('Initializing DuckDB')

      // Load DuckDB WASM from local files
      const bundle = {
        mainModule: '/duckdb/duckdb-mvp.wasm',
        mainWorker: '/duckdb/duckdb-browser-mvp.worker.js'
      }

      // Create worker
      globalWorker = new Worker(bundle.mainWorker)
      const logger = new duckdb.ConsoleLogger()

      // Create a new database
      globalDB = new duckdb.AsyncDuckDB(logger, globalWorker)
      await globalDB.instantiate(bundle.mainModule)

      // Make a fresh copy from our pristine original buffer
      if (!originalBuffer) {
        throw new Error('No original buffer available for initialization')
      }

      // Register parquet file buffer using a fresh copy
      console.log('Registering parquet file buffer')
      const bufferCopy = new Uint8Array(originalBuffer.slice(0))
      await globalDB.registerFileBuffer('data.parquet', bufferCopy)

      // Create a connection
      globalConnection = await globalDB.connect()

      // Create a table from the parquet file with indexes for faster searching
      await globalConnection.query(`
        CREATE TABLE messages AS SELECT * FROM 'data.parquet';
        CREATE INDEX IF NOT EXISTS idx_message ON messages(message);
        CREATE INDEX IF NOT EXISTS idx_text ON messages(text);
        CREATE INDEX IF NOT EXISTS idx_content ON messages(content);
      `)

      isDBInitialized = true
      console.log('DuckDB initialization complete')
      return true
    } catch (err) {
      console.error('Error initializing DuckDB:', err)

      // Clean up on error
      await cleanup()

      // Reset promise so we can try again
      dbInitializationPromise = null
      return false
    }
  }

  // Perform a search using a simple, fast query
  async function searchParquet(parquetBuffer, searchTerm, filters = {}) {
    if (!searchTerm) return []

    try {
      isSearching.value = true
      searchError.value = null

      // Store original buffer if it's not already set
      if (!originalBuffer && parquetBuffer) {
        originalBuffer = parquetBuffer.slice(0)
        console.log('Original buffer stored during search')
      }

      // Initialize if not already done
      if (!isDBInitialized) {
        console.log('DuckDB not initialized, initializing now')
        const initialized = await initDuckDB(parquetBuffer)
        if (!initialized) {
          throw new Error('Failed to initialize DuckDB')
        }
      }

      console.time('duckdb-search')

      // Build a simple query with minimal overhead
      let query = `SELECT * FROM messages WHERE 1=1`
      const params = []

      // Add text search if provided
      if (searchTerm) {
        const searchPattern = `%${searchTerm.toLowerCase()}%`
        query += ` AND (
          LOWER(COALESCE(message, '')) LIKE ?
          OR LOWER(COALESCE(text, '')) LIKE ?
          OR LOWER(COALESCE(content, '')) LIKE ?
        )`
        params.push(searchPattern, searchPattern, searchPattern)
      }

      // Add date filters if provided
      if (filters.startDate) {
        query += ` AND COALESCE(date, timestamp) >= ?`
        params.push(filters.startDate)
      }
      if (filters.endDate) {
        query += ` AND COALESCE(date, timestamp) <= ?`
        params.push(filters.endDate)
      }

      // Add sender filter if provided
      if (filters.sender) {
        query += ` AND COALESCE("from", sender, sender_name) = ?`
        params.push(filters.sender)
      }

      // Add chat filter if provided
      if (filters.chat) {
        query += ` AND COALESCE(chat_title, group_chat_id, chat_name) = ?`
        params.push(filters.chat)
      }

      // Add limit for safety
      query += ` LIMIT 10000`

      // Execute the query
      const result = await globalConnection.query(query, params)

      // Convert to array of objects
      const searchResults = result.toArray().map((row) => {
        const obj = {}
        for (let i = 0; i < result.schema.fields.length; i++) {
          obj[result.schema.fields[i].name] = row[i]
        }
        return obj
      })

      console.timeEnd('duckdb-search')
      console.log(`Search found ${searchResults.length} results`)

      isSearching.value = false
      return searchResults
    } catch (err) {
      console.error('Error searching parquet:', err)
      searchError.value = 'Search failed: ' + err.message
      isSearching.value = false

      // If the search failed because of DB issues, clean up and try again next time
      if (
        err.message.includes('Failed to initialize') ||
        err.message.includes('detached')
      ) {
        await cleanup()
      }

      return []
    }
  }

  // Clean up DuckDB resources - rarely needed, only on app shutdown
  async function cleanup() {
    try {
      if (globalConnection) {
        await globalConnection.close()
        globalConnection = null
      }
      if (globalDB) {
        await globalDB.terminate()
        globalDB = null
      }
      if (globalWorker) {
        globalWorker.terminate()
        globalWorker = null
      }

      isDBInitialized = false
      dbInitializationPromise = null
      // Keep originalBuffer intact for future initializations
      console.log('DuckDB resources cleaned up')
    } catch (err) {
      console.error('Error during cleanup:', err)
    }
  }

  return {
    searchParquet,
    initDuckDB,
    isSearching,
    searchError,
    cleanup
  }
}
