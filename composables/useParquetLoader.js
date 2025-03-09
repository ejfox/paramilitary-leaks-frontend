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

      // Check for magic bytes at the end of the file (PAR1)
      const lastFourBytes = new Uint8Array(
        buffer.slice(buffer.byteLength - 4, buffer.byteLength)
      )
      const magicBytesString = String.fromCharCode(...lastFourBytes)
      console.log(
        `Last 4 bytes of file: ${magicBytesString} (${Array.from(
          lastFourBytes
        ).join(', ')})`
      )

      if (magicBytesString !== 'PAR1') {
        console.warn(
          'Warning: Parquet file may be corrupted - no PAR1 magic bytes found at end of file'
        )
      }

      console.log('Registering parquet file buffer...')
      try {
        await db.registerFileBuffer('data.parquet', new Uint8Array(buffer))
      } catch (err) {
        console.error('Error registering file buffer:', err)

        // Check for the specific "No magic bytes" error
        if (err.message && err.message.includes('magic bytes')) {
          throw new Error(
            `The parquet file appears to be corrupted or incomplete. Please check that the file was uploaded correctly to R2. Error: ${err.message}`
          )
        }

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
      return { success: true, data: rows }
    } catch (err) {
      console.error('Error loading data:', err)

      // Provide more helpful error messages for common issues
      if (err.message && err.message.includes('magic bytes')) {
        return {
          success: false,
          error:
            'The parquet file appears to be corrupted or incomplete. Please check that the file was uploaded correctly to R2 and has the correct format.'
        }
      }

      if (err.message && err.message.includes('Failed to fetch')) {
        return {
          success: false,
          error: `Failed to fetch the parquet file. Please check your R2 configuration and ensure the file exists: ${err.message}`
        }
      }

      return { success: false, error: err.message }
    }
  }

  return {
    loadParquetFile
  }
}
