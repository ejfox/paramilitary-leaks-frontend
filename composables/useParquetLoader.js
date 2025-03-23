import * as duckdb from '@duckdb/duckdb-wasm'
import { useTimestampParser } from './useTimestampParser'
import { useR2Storage } from './useR2Storage'

export function useParquetLoader() {
  const { parseTimestamp } = useTimestampParser()
  const { fetchFile, getFileUrl } = useR2Storage()
  const config = useRuntimeConfig()

  // Load parquet file from R2
  async function loadParquetFile() {
    try {
      console.log(`Loading parquet file from: ${getFileUrl()}`)

      // Initialize DuckDB
      const bundle = {
        mainModule: '/duckdb/duckdb-mvp.wasm',
        mainWorker: '/duckdb/duckdb-browser-mvp.worker.js'
      }

      console.log('Creating DuckDB worker...')
      const worker = new Worker(bundle.mainWorker)
      const db = new duckdb.AsyncDuckDB(new duckdb.ConsoleLogger(), worker)

      console.log('Instantiating DuckDB...')
      await db.instantiate(bundle.mainModule)

      console.log('Connecting to DuckDB...')
      const conn = await db.connect()

      // Load and process file from R2
      console.log('Fetching parquet file...')
      const response = await fetchFile()

      if (!response.ok) {
        throw new Error(
          `Failed to fetch: ${response.status} ${response.statusText}`
        )
      }

      console.log('Parquet file fetched, getting array buffer...')
      const buffer = await response.arrayBuffer()
      console.log(`Array buffer received, size: ${buffer.byteLength}`)

      if (buffer.byteLength === 0) {
        throw new Error('Received empty file buffer')
      }

      console.log('Registering parquet file buffer...')
      try {
        await db.registerFileBuffer('data.parquet', new Uint8Array(buffer))
      } catch (err) {
        console.error('Error registering file buffer:', err)
        throw new Error(`Failed to register file buffer: ${err.message}`)
      }

      // First, let's inspect the schema to understand the structure
      console.log('Creating table from parquet file...')
      try {
        await conn.query(
          `CREATE TABLE messages AS SELECT * FROM 'data.parquet'`
        )
      } catch (err) {
        console.error('Error creating table from parquet file:', err)
        throw new Error(
          `Failed to create table from parquet file: ${err.message}`
        )
      }

      // Get column names to understand the schema
      console.log('Getting schema...')
      let schemaResult
      try {
        schemaResult = await conn.query(`DESCRIBE messages`)
        console.log(
          'Schema of the parquet file:',
          schemaResult.toArray().map((row) => row.toJSON())
        )
      } catch (err) {
        console.error('Error getting schema:', err)
        throw new Error(`Failed to get schema: ${err.message}`)
      }

      // Get all data (no limit)
      console.log('Loading data from parquet file...')
      let result
      try {
        result = await conn.query(`SELECT * FROM messages`)
      } catch (err) {
        console.error('Error querying data:', err)
        throw new Error(`Failed to query data: ${err.message}`)
      }

      const rows = result.toArray().map((row) => row.toJSON())

      // Log a sample row to understand the structure
      if (rows.length > 0) {
        console.log('Sample row from parquet file:', rows[0])
      } else {
        console.warn('No rows found in parquet file')
      }

      // Clean up
      console.log('Cleaning up DuckDB resources...')
      await conn.close()
      await db.terminate()
      worker.terminate()

      console.log(`Successfully loaded ${rows.length} rows from parquet file`)
      return { success: true, data: rows, buffer: buffer }
    } catch (err) {
      console.error('Error loading data:', err)
      return { success: false, error: err.message }
    }
  }

  // Get senders list from parquet file - simplified to ensure it works!
  async function getSendersList() {
    try {
      console.log('Getting senders list')

      // Initialize DuckDB
      const bundle = {
        mainModule: '/duckdb/duckdb-mvp.wasm',
        mainWorker: '/duckdb/duckdb-browser-mvp.worker.js'
      }

      console.log('Creating DuckDB worker...')
      const worker = new Worker(bundle.mainWorker)
      const db = new duckdb.AsyncDuckDB(new duckdb.ConsoleLogger(), worker)

      console.log('Instantiating DuckDB...')
      await db.instantiate(bundle.mainModule)

      // Fetch the parquet file
      console.log('Fetching parquet file...')
      const response = await fetchFile()

      if (!response.ok) {
        throw new Error(
          `Failed to fetch: ${response.status} ${response.statusText}`
        )
      }

      console.log('Parquet file fetched, getting array buffer...')
      const buffer = await response.arrayBuffer()
      console.log(`Array buffer received, size: ${buffer.byteLength}`)

      if (buffer.byteLength === 0) {
        throw new Error('Received empty file buffer')
      }

      // Register the file buffer
      console.log('Registering parquet file buffer...')
      await db.registerFileBuffer('data.parquet', new Uint8Array(buffer))

      const conn = await db.connect()

      // Create a table from the parquet file
      await conn.query(`CREATE TABLE messages AS SELECT * FROM 'data.parquet'`)

      // Check the schema to see what columns we have available
      const schemaResult = await conn.query(`DESCRIBE messages`)
      const columns = schemaResult
        .toArray()
        .map((row) => row.toJSON().column_name)

      console.log('Available columns:', columns)

      let senderColumn

      // Determine which field to use for sender information
      if (columns.includes('from') && columns.includes('sender')) {
        // If we have both, use COALESCE to prefer "from" but fall back to "sender"
        senderColumn = 'COALESCE("from", sender)'
      } else if (columns.includes('from')) {
        // If we only have "from", use it with quotes since it's a reserved keyword
        senderColumn = '"from"'
      } else if (columns.includes('sender')) {
        // If we only have "sender", use it
        senderColumn = 'sender'
      } else {
        // If we have neither, throw an error
        throw new Error('Neither "from" nor "sender" columns found in the data')
      }

      console.log(`Using ${senderColumn} for sender information`)

      // Get a list of sender names and message counts
      const result = await conn.query(`
        SELECT 
          ${senderColumn} as name, 
          COUNT(*) as count 
        FROM messages 
        WHERE ${senderColumn} IS NOT NULL 
        GROUP BY ${senderColumn} 
        ORDER BY count DESC
      `)

      // Convert result to array of objects
      const senders = result.toArray().map((row) => ({
        name: row[0] || 'Unknown',
        count: row[1]
      }))

      // Get total message count
      const countResult = await conn.query(`SELECT COUNT(*) FROM messages`)
      const totalMessages = countResult.toArray()[0][0]

      // Clean up
      await conn.close()
      await db.terminate()
      worker.terminate()

      return {
        success: true,
        senders,
        totalMessages
      }
    } catch (err) {
      console.error('Error getting senders list:', err)
      return { success: false, error: err.message }
    }
  }

  return {
    loadParquetFile,
    getSendersList
  }
}
