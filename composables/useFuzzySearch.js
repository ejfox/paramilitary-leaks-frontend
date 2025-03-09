import { ref } from 'vue'
import * as duckdb from '@duckdb/duckdb-wasm'

export function useFuzzySearch() {
  const isInitialized = ref(false)
  const db = ref(null)
  const isSearching = ref(false)
  const searchError = ref(null)

  // Initialize DuckDB
  async function initDuckDB(data) {
    try {
      if (isInitialized.value) return true

      // Load DuckDB WASM
      const JSDELIVR_BUNDLES = {
        mvp: {
          mainModule:
            'https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.27.0/dist/duckdb-mvp.wasm',
          mainWorker:
            'https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.27.0/dist/duckdb-browser-mvp.worker.js'
        },
        eh: {
          mainModule:
            'https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.27.0/dist/duckdb-eh.wasm',
          mainWorker:
            'https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.27.0/dist/duckdb-browser-eh.worker.js'
        }
      }

      // Select the bundle based on browser capabilities
      const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES)
      const worker = new Worker(bundle.mainWorker)
      const logger = new duckdb.ConsoleLogger()

      // Create a new database
      db.value = new duckdb.AsyncDuckDB(logger, worker)
      await db.value.instantiate(bundle.mainModule)

      // Create a connection
      const conn = await db.value.connect()

      // Create a temporary table with the data
      await conn.query(`
        CREATE TABLE messages AS 
        SELECT * FROM read_json_auto('${JSON.stringify(data)}')
      `)

      // Create a full-text search index
      await conn.query(`
        CREATE INDEX IF NOT EXISTS message_content_idx ON messages USING FULLTEXT(message, text, content)
      `)

      // Close the connection
      await conn.close()

      isInitialized.value = true
      return true
    } catch (err) {
      console.error('Error initializing DuckDB:', err)
      searchError.value = 'Failed to initialize search engine'
      return false
    }
  }

  // Perform a fuzzy search
  async function search(data, searchTerm, filters = {}) {
    if (!searchTerm) return data

    try {
      isSearching.value = true
      searchError.value = null

      // Initialize DuckDB if not already done
      if (!isInitialized.value) {
        const initialized = await initDuckDB(data)
        if (!initialized) {
          isSearching.value = false
          return data
        }
      }

      // Create a connection
      const conn = await db.value.connect()

      // Build the query with filters
      let query = `
        SELECT * FROM messages 
        WHERE (
          message ILIKE '%${searchTerm}%' OR 
          text ILIKE '%${searchTerm}%' OR 
          content ILIKE '%${searchTerm}%'
        )
      `

      // Add date filters if provided
      if (filters.startDate) {
        query += ` AND date >= '${filters.startDate}' OR timestamp >= '${filters.startDate}'`
      }

      if (filters.endDate) {
        query += ` AND date <= '${filters.endDate}' OR timestamp <= '${filters.endDate}'`
      }

      // Add sender filter if provided
      if (filters.sender) {
        query += ` AND (from = '${filters.sender}' OR sender = '${filters.sender}' OR sender_name = '${filters.sender}')`
      }

      // Add chat filter if provided
      if (filters.chat) {
        query += ` AND (chat_title = '${filters.chat}' OR group_chat_id = '${filters.chat}' OR chat_name = '${filters.chat}')`
      }

      // Execute the query
      const result = await conn.query(query)

      // Close the connection
      await conn.close()

      // Convert the result to a JavaScript array
      const searchResults = result.toArray().map((row) => {
        const obj = {}
        for (let i = 0; i < result.schema.fields.length; i++) {
          obj[result.schema.fields[i].name] = row[i]
        }
        return obj
      })

      isSearching.value = false
      return searchResults
    } catch (err) {
      console.error('Error performing search:', err)
      searchError.value = 'Search failed: ' + err.message
      isSearching.value = false
      return data
    }
  }

  // Clean up resources
  function cleanup() {
    if (db.value) {
      db.value.terminate()
      db.value = null
      isInitialized.value = false
    }
  }

  return {
    search,
    isSearching,
    searchError,
    cleanup
  }
}
