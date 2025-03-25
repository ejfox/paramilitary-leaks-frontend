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
        CREATE INDEX IF NOT EXISTS idx_body ON messages(body);
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
        if (!parquetBuffer && !originalBuffer) {
          throw new Error('No data buffer available for search')
        }

        const initialized = await initDuckDB(parquetBuffer || originalBuffer)
        if (!initialized) {
          throw new Error('Failed to initialize DuckDB')
        }
      }

      console.time('duckdb-search')

      // Build a simple query with minimal overhead
      let query = `SELECT * FROM messages WHERE 1=1`
      const params = []

      // Add text search if provided
      if (searchTerm && searchTerm.trim() !== '') {
        const searchPattern = `%${searchTerm.toLowerCase()}%`

        // First, get all available columns to search through
        try {
          const columnsResult = await globalConnection.query(`
            PRAGMA table_info('messages')
          `)

          const rows = columnsResult.toArray()
          let allColumns = []

          // Extract column names
          try {
            allColumns = rows
              .map(
                (row) =>
                  typeof row.get === 'function'
                    ? row.get('name')
                    : row.name
                    ? row.name
                    : row[1] // Fallback to index 1 which usually contains name in PRAGMA results
              )
              .filter(Boolean)
          } catch (e) {
            console.warn('Error extracting column names:', e)
            // Use default columns
            allColumns = ['message', 'text', 'content', 'body', 'msg', 'data']
          }

          console.log('Available columns for search:', allColumns)

          // Build OR conditions for text search in all relevant columns
          const textColumns = allColumns.filter(
            (col) =>
              typeof col === 'string' &&
              ['message', 'text', 'content', 'body', 'msg', 'data'].includes(
                col.toLowerCase()
              )
          )

          // If we found text columns, use them specifically
          if (textColumns.length > 0) {
            const conditions = textColumns
              .map((col) => `LOWER(COALESCE(${col}, '')) LIKE ?`)
              .join(' OR ')

            query += ` AND (${conditions})`

            // Add search parameter for each condition
            textColumns.forEach(() => params.push(searchPattern))

            console.log(
              `Searching in specific columns: ${textColumns.join(', ')}`
            )
          } else {
            // Fallback to checking ALL string columns
            console.log('No specific text columns found, searching all columns')

            // Get a sample row to check data types
            const sampleRow = await globalConnection.query(
              `SELECT * FROM messages LIMIT 1`
            )

            if (sampleRow && sampleRow.toArray().length > 0) {
              // Just use our default fields plus a LIKE ANY search as a safety net
              query += ` AND (
                LOWER(COALESCE(message, '')) LIKE ?
                OR LOWER(COALESCE(text, '')) LIKE ?
                OR LOWER(COALESCE(content, '')) LIKE ?
                OR LOWER(COALESCE(body, '')) LIKE ?
                OR LOWER(COALESCE(msg, '')) LIKE ?
                OR LOWER(COALESCE(data, '')) LIKE ?
                OR (SELECT COUNT(*) FROM (SELECT unnest(array_extract(struct_extract(messages, 'values'), 'values')) WHERE LOWER(COALESCE(unnest::VARCHAR, '')) LIKE ?) > 0)
              )`

              // Add parameters for each condition
              params.push(
                searchPattern,
                searchPattern,
                searchPattern,
                searchPattern,
                searchPattern,
                searchPattern,
                searchPattern
              )
            } else {
              // Ultra fallback - just use our standard fields
              query += ` AND (
                LOWER(COALESCE(message, '')) LIKE ?
                OR LOWER(COALESCE(text, '')) LIKE ?
                OR LOWER(COALESCE(content, '')) LIKE ?
                OR LOWER(COALESCE(body, '')) LIKE ?
                OR LOWER(COALESCE(msg, '')) LIKE ?
                OR LOWER(COALESCE(data, '')) LIKE ?
              )`

              // Add parameters for each condition
              params.push(
                searchPattern,
                searchPattern,
                searchPattern,
                searchPattern,
                searchPattern,
                searchPattern
              )
            }
          }
        } catch (err) {
          console.warn(
            'Error analyzing columns for search, using fallbacks:',
            err
          )

          // Fallback if column analysis fails - use standard fields
          query += ` AND (
            LOWER(COALESCE(message, '')) LIKE ?
            OR LOWER(COALESCE(text, '')) LIKE ?
            OR LOWER(COALESCE(content, '')) LIKE ?
            OR LOWER(COALESCE(body, '')) LIKE ?
            OR LOWER(COALESCE(msg, '')) LIKE ?
            OR LOWER(COALESCE(data, '')) LIKE ?
          )`

          // Add parameters for each condition
          params.push(
            searchPattern,
            searchPattern,
            searchPattern,
            searchPattern,
            searchPattern,
            searchPattern
          )
        }
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
