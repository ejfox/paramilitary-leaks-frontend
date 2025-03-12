import * as duckdb from '@duckdb/duckdb-wasm'

export function useTelegramFilesLoader() {
  // Load telegram_files.parquet from the public directory
  async function loadTelegramFiles() {
    try {
      console.log('Loading telegram_files.parquet from public directory...')

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

      // Load and process file from public directory
      console.log('Fetching telegram_files.parquet...')
      const response = await fetch('/telegram_files.parquet')

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
        await db.registerFileBuffer(
          'telegram_files.parquet',
          new Uint8Array(buffer)
        )
      } catch (err) {
        console.error('Error registering file buffer:', err)
        throw new Error(`Failed to register file buffer: ${err.message}`)
      }

      // Create table from parquet file
      console.log('Creating table from parquet file...')
      try {
        await conn.query(
          `CREATE TABLE files AS SELECT * FROM 'telegram_files.parquet'`
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
        schemaResult = await conn.query(`DESCRIBE files`)
        console.log(
          'Schema of the parquet file:',
          schemaResult.toArray().map((row) => row.toJSON())
        )
      } catch (err) {
        console.error('Error getting schema:', err)
        throw new Error(`Failed to get schema: ${err.message}`)
      }

      // Get all data
      console.log('Loading data from parquet file...')
      let result
      try {
        result = await conn.query(`SELECT * FROM files`)
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

      console.log(`Successfully loaded ${rows.length} files from parquet file`)
      return { success: true, data: rows }
    } catch (err) {
      console.error('Error loading telegram files data:', err)
      return { success: false, error: err.message }
    }
  }

  return {
    loadTelegramFiles
  }
}
