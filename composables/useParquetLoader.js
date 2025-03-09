import * as duckdb from '@duckdb/duckdb-wasm'
import { useTimestampParser } from './useTimestampParser'

export function useParquetLoader() {
  const { parseTimestamp } = useTimestampParser()

  // Load file from the provided URL
  async function loadParquetFile(
    url = '/telegram_chats.v3.parquet',
    options = {}
  ) {
    try {
      // Initialize DuckDB
      const bundle = {
        mainModule: '/duckdb/duckdb-mvp.wasm',
        mainWorker: '/duckdb/duckdb-browser-mvp.worker.js'
      }

      const worker = new Worker(bundle.mainWorker)
      const db = new duckdb.AsyncDuckDB(new duckdb.ConsoleLogger(), worker)
      await db.instantiate(bundle.mainModule)
      const conn = await db.connect()

      // Load and process file
      const response = await fetch(url)
      if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`)

      const buffer = await response.arrayBuffer()
      await db.registerFileBuffer('data.parquet', new Uint8Array(buffer))

      // First, let's inspect the schema to understand the structure
      await conn.query(`CREATE TABLE messages AS SELECT * FROM 'data.parquet'`)

      // Get column names to understand the schema
      const schemaResult = await conn.query(`DESCRIBE messages`)
      console.log(
        'Schema of the new parquet file:',
        schemaResult.toArray().map((row) => row.toJSON())
      )

      // Get all data (no limit)
      const result = await conn.query(`SELECT * FROM messages`)
      const rows = result.toArray().map((row) => row.toJSON())

      // Log a sample row to understand the structure
      if (rows.length > 0) {
        console.log('Sample row from new parquet file:', rows[0])
      }

      // Clean up
      await conn.close()
      await db.terminate()
      worker.terminate()

      return { success: true, data: rows }
    } catch (err) {
      console.error('Error loading data:', err)
      return { success: false, error: err.message }
    }
  }

  return {
    loadParquetFile
  }
}
