import * as duckdb from '@duckdb/duckdb-wasm'
import { useR2Storage } from './useR2Storage'

// Create a singleton instance for DuckDB connection
let duckdbInstance = null
let duckdbConnection = null
let isInitializing = false
let initPromise = null

export function useParquetLoader() {
  const { fetchFile, getFileUrl } = useR2Storage()
  const config = useRuntimeConfig()

  // Initialize DuckDB with better error handling
  async function initDuckDB() {
    // Return existing promise if initialization is in progress
    if (isInitializing) {
      console.log(
        'DuckDB initialization already in progress, returning existing promise'
      )
      return initPromise
    }

    // Return existing instance if already initialized
    if (duckdbInstance && duckdbConnection) {
      console.log('Using existing DuckDB instance')
      return { instance: duckdbInstance, connection: duckdbConnection }
    }

    // Begin initialization
    console.log('Starting DuckDB initialization')
    isInitializing = true
    initPromise = new Promise(async (resolve, reject) => {
      try {
        // DuckDB bundle configuration
        const bundle = {
          mainModule: '/duckdb/duckdb-mvp.wasm',
          mainWorker: '/duckdb/duckdb-browser-mvp.worker.js'
        }

        console.log('Creating DuckDB worker...')
        // Create worker and database instance with more detailed logging
        const worker = new Worker(bundle.mainWorker)

        // Handle worker errors
        worker.onerror = (e) => {
          console.error('DuckDB worker error:', e)
          reject(new Error(`DuckDB worker error: ${e.message}`))
        }

        console.log('Creating DuckDB instance...')
        const logger = new duckdb.ConsoleLogger()
        const db = new duckdb.AsyncDuckDB(logger, worker)

        // Instantiate DuckDB with timeout
        console.log('Instantiating DuckDB...')
        const instantiatePromise = db.instantiate(bundle.mainModule)

        // Add a timeout to handle potential hanging
        const timeoutPromise = new Promise((_, timeoutReject) => {
          setTimeout(
            () =>
              timeoutReject(
                new Error('DuckDB instantiation timed out after 30 seconds')
              ),
            30000
          )
        })

        await Promise.race([instantiatePromise, timeoutPromise])
        console.log('DuckDB instantiated successfully')

        // Connect to database
        console.log('Connecting to DuckDB...')
        const conn = await db.connect()
        console.log('Connected to DuckDB successfully')

        // Test connection with simple query
        await conn.query('SELECT 1 AS test')
        console.log('DuckDB test query successful')

        // Save instances to our module-level variables
        duckdbInstance = db
        duckdbConnection = conn

        console.log('DuckDB initialization complete')
        resolve({ instance: db, connection: conn })
      } catch (err) {
        console.error('Error initializing DuckDB:', err)
        // Reset state so we can try again
        duckdbInstance = null
        duckdbConnection = null
        reject(err)
      } finally {
        isInitializing = false
      }
    })

    return initPromise
  }

  // Load parquet file from R2 using efficient DuckDB queries with caching
  async function loadParquetFile(options = {}) {
    try {
      // Step 1: Initialize DuckDB instance and connection
      const { instance: db, connection: conn } = await initDuckDB()

      // Step 2: Fetch parquet file with caching support
      const response = await fetchFile(options)
      if (!response.ok) {
        throw new Error(
          `Failed to fetch: ${response.status} ${response.statusText}`
        )
      }

      // Get array buffer
      const buffer = await response.arrayBuffer()
      if (buffer.byteLength === 0) {
        throw new Error('Received empty file buffer')
      }

      // Convert to Uint8Array which is what DuckDB expects
      const uint8Array = new Uint8Array(buffer)
      console.log(`Processing ${uint8Array.byteLength} bytes of parquet data`)

      // Step 3: Process the parquet file with more robust error handling
      try {
        console.log('Starting parquet file processing')

        // Generate a unique ID for this session
        const sessionId = Date.now().toString()
        const filename = `data_${sessionId}.parquet`

        // First try to directly read the parquet file using streaming importParquetFile
        try {
          console.log('Attempting to import parquet file directly...')
          // Create connection directly from the parquet buffer
          await db.dropFile(filename, true) // Ensure any previous file is removed

          // Register the buffer as a file
          console.log(
            `Registering ${uint8Array.byteLength} bytes as file ${filename}`
          )
          await db.registerFileBuffer(filename, uint8Array)
          console.log('File buffer registered successfully')

          // Get a list of all tables first
          try {
            console.log('Checking existing tables')
            // Try to query the system catalog for tables
            const tablesResult = await conn.query(`
              SELECT name FROM sqlite_master WHERE type='table'
            `)

            // Convert result to array of table names
            let tables = []
            try {
              const rows = tablesResult.toArray()
              rows.forEach((row) => {
                try {
                  const tableName = row.get(0) || row[0] || null
                  if (tableName) tables.push(tableName)
                } catch (e) {
                  // Ignore errors accessing row data
                }
              })
            } catch (e) {
              console.warn('Error extracting table names:', e)
            }

            console.log('Existing tables:', tables)
          } catch (listErr) {
            console.warn('Could not list tables:', listErr)
          }

          // First try to drop all known tables - regardless of whether they exist
          try {
            console.log('Forcefully dropping any existing tables with CASCADE')
            await conn.query(`DROP TABLE IF EXISTS messages_temp CASCADE`)
            await conn.query(`DROP TABLE IF EXISTS messages CASCADE`)
            // Wait a moment to ensure tables are fully dropped
            await new Promise((resolve) => setTimeout(resolve, 100))
            console.log('Tables dropped')
          } catch (dropErr) {
            console.warn('Error dropping existing tables:', dropErr)
            // Try a different approach if dropping fails
            try {
              // Try to force cleanup by resetting connection
              console.log('Attempting to reset connection to clean up tables')
              // Close the current connection
              await conn.close()
              // Create a new connection
              const newConn = await db.connect()
              // Replace the old connection
              duckdbConnection = newConn
              // Use the new connection
              conn = newConn
              console.log('Connection reset successfully')
            } catch (resetErr) {
              console.warn('Failed to reset connection:', resetErr)
              // Continue anyway - we'll try direct table creation
            }
          }

          // Try direct table creation from file
          try {
            console.log('Creating messages table directly from parquet file')
            await conn.query(
              `CREATE OR REPLACE TABLE messages AS SELECT * FROM '${filename}'`
            )
            console.log('Successfully created messages table directly')
          } catch (directErr) {
            console.error('Error creating table directly:', directErr)

            // If that fails, try the read_parquet function
            try {
              console.log('Attempting read_parquet approach')
              await conn.query(`
                CREATE OR REPLACE TABLE messages AS
                SELECT * 
                FROM read_parquet('${filename}')
              `)
              console.log('read_parquet approach successful')
            } catch (readParquetErr) {
              console.error('read_parquet approach failed:', readParquetErr)

              // Last resort - try with a completely unique table name
              try {
                const uniqueTableName = `messages_${Date.now()}`
                console.log(
                  `Last resort: creating unique table ${uniqueTableName}`
                )

                await conn.query(`
                  CREATE TABLE ${uniqueTableName} AS 
                  SELECT * FROM '${filename}'
                `)

                // If that worked, rename to final name
                await conn.query(`DROP TABLE IF EXISTS messages`)
                await conn.query(
                  `ALTER TABLE ${uniqueTableName} RENAME TO messages`
                )
                console.log('Last resort approach successful')
              } catch (lastResortErr) {
                console.error('All import approaches failed:', lastResortErr)
                throw new Error(
                  `All table creation methods failed - original error: ${directErr.message}`
                )
              }
            }
          }
        } catch (importErr) {
          console.error('Error during parquet import:', importErr)
          throw new Error(`Import failed: ${importErr.message}`)
        }

        // Verify the table exists and has data
        try {
          const countResult = await conn.query(`SELECT COUNT(*) FROM messages`)
          const countRows = countResult.toArray()
          let count = 0

          // Try different methods to extract count
          if (countRows.length > 0) {
            try {
              // Try standard method first
              count = countRows[0].get(0)
            } catch (getErr) {
              console.warn('Error using get(0), trying alternatives:', getErr)

              // Try accessing as array
              try {
                count = countRows[0][0]
              } catch (arrErr) {
                console.warn('Error accessing as array, trying toJSON:', arrErr)

                // Try converting to JSON
                try {
                  const json = countRows[0].toJSON()
                  count = Object.values(json)[0] // Get first value
                } catch (jsonErr) {
                  console.warn(
                    'Error accessing as JSON, using default:',
                    jsonErr
                  )
                  count = -1 // Unknown count
                }
              }
            }
          }
          console.log(`Successfully created messages table with ${count} rows`)

          if (count === 0) {
            console.warn(
              'Warning: messages table is empty, data may be corrupted'
            )
          }
        } catch (verifyErr) {
          console.error('Error verifying table creation:', verifyErr)
          throw new Error(`Table verification failed: ${verifyErr.message}`)
        }
      } catch (err) {
        console.error('Fatal error processing parquet data:', err)
        throw new Error(`Failed to process parquet data: ${err.message}`)
      }

      // Step 5: Execute optimized query that directly aggregates the data in DuckDB
      // This is much more efficient than loading all data and processing in JavaScript
      let result
      try {
        console.log('Getting column structure from messages table')
        // First get column structure to determine what query to run
        let tableInfoResult
        try {
          tableInfoResult = await conn.query(`
            PRAGMA table_info('messages')
          `)
        } catch (schemaErr) {
          // If PRAGMA fails, get sample data directly
          console.error('Error getting table info with PRAGMA:', schemaErr)
          console.log('Falling back to direct sample query')
          tableInfoResult = await conn.query(`
            SELECT * FROM messages LIMIT 1
          `)
        }

        // Extract column names from the PRAGMA result with error handling
        const rows = tableInfoResult.toArray()
        let columnNames = []

        try {
          // Try the standard DuckDB approach first
          columnNames = rows.map((row) => row.get('name'))
        } catch (err) {
          console.warn(
            'Error using row.get(), trying alternative approach:',
            err
          )

          // Fallback: try to access as a property
          try {
            if (rows.length > 0 && rows[0].name !== undefined) {
              columnNames = rows.map((row) => row.name)
            } else if (rows.length > 0) {
              // Last resort: try to convert row to JSON and extract
              columnNames = rows
                .map((row) => {
                  try {
                    const json = row.toJSON()
                    return json.name
                  } catch (e) {
                    console.error('Failed to extract column name:', e)
                    return null
                  }
                })
                .filter((name) => name !== null)
            }
          } catch (fallbackErr) {
            console.error(
              'Fallback column extraction also failed:',
              fallbackErr
            )
            // Default to a basic set of expected columns
            columnNames = [
              'timestamp',
              'date',
              'sender',
              'from',
              'message',
              'text',
              'content'
            ]
          }
        }

        // Remove any undefined or null values
        columnNames = columnNames.filter((name) => name)
        console.log('Detected columns:', columnNames)

        // Adapt query based on available columns
        let query = ''
        if (
          columnNames.includes('timestamp') &&
          columnNames.includes('sender')
        ) {
          console.log('Using timestamp + sender query')
          query = `
            SELECT 
              timestamp as date,
              COALESCE(sender, 'Unknown') as sender,
              COUNT(*) as count
            FROM messages
            WHERE timestamp IS NOT NULL
            GROUP BY timestamp, COALESCE(sender, 'Unknown')
            ORDER BY timestamp ASC
          `
        } else if (
          columnNames.includes('date') &&
          columnNames.includes('from')
        ) {
          console.log('Using date + from query')
          query = `
            SELECT 
              date,
              COALESCE("from", 'Unknown') as sender,
              COUNT(*) as count
            FROM messages
            WHERE date IS NOT NULL
            GROUP BY date, COALESCE("from", 'Unknown')
            ORDER BY date ASC
          `
        } else {
          console.log('Using generic query - data schema not recognized')
          // Generic query with error tolerance
          query = `
            SELECT *
            FROM messages
            LIMIT 5000
          `
        }

        console.log('Executing query on messages table...')
        // Execute the query with emergency fallback
        try {
          result = await conn.query(query)
          console.log('Query executed successfully')
        } catch (queryErr) {
          console.error('Error executing customized query:', queryErr)
          console.warn('Attempting emergency fallback query')

          // Try one last basic query that should work regardless of schema
          result = await conn.query(`
            SELECT * FROM messages LIMIT 5000
          `)
          console.log('Emergency fallback query succeeded')
        }
      } catch (err) {
        console.error('Query execution error:', err)
        throw new Error(`Failed to query data: ${err.message}`)
      }

      // Step 6: Convert results to JSON format with robust error handling
      try {
        console.log('Converting query results to JSON')
        const resultArray = result.toArray()
        let processedRows = []

        // Handle different versions of DuckDB API
        for (let i = 0; i < resultArray.length; i++) {
          const row = resultArray[i]
          try {
            // Method 1: Use toJSON if available
            processedRows.push(row.toJSON())
          } catch (jsonErr) {
            console.warn(
              `Failed to use toJSON on row ${i}, trying alternative:`,
              jsonErr
            )

            try {
              // Method A: Try to manually construct object from row properties
              const schema = result.schema
              if (schema) {
                const rowObj = {}
                schema.fields.forEach((field, idx) => {
                  try {
                    rowObj[field.name] = row.get(idx)
                  } catch (getErr) {
                    try {
                      rowObj[field.name] = row[idx]
                    } catch (arrErr) {
                      rowObj[field.name] = null
                    }
                  }
                })
                processedRows.push(rowObj)
              } else {
                // Method B: Attempt to access row elements directly
                const rowObj = {}
                try {
                  // Try different ways to get column names
                  let colNames = []
                  if (typeof row.getFields === 'function') {
                    colNames = row.getFields()
                  } else if (result.getColumnNames) {
                    colNames = result.getColumnNames()
                  } else {
                    // Get entries and assume they're ordered
                    for (let j = 0; j < 20; j++) {
                      // Assume max 20 columns
                      try {
                        const val = row.get(j)
                        if (val !== undefined) {
                          rowObj[`col${j}`] = val
                        }
                      } catch (e) {
                        break
                      }
                    }
                    processedRows.push(rowObj)
                    continue
                  }

                  // Populate using column names
                  colNames.forEach((name, idx) => {
                    try {
                      rowObj[name] = row.get(idx)
                    } catch (e) {
                      try {
                        rowObj[name] = row[idx]
                      } catch (e2) {
                        rowObj[name] = null
                      }
                    }
                  })
                  processedRows.push(rowObj)
                } catch (objErr) {
                  console.error('Row conversion failed:', objErr)
                  // Method C: Last resort - create minimal viable object
                  // Create a minimal object with date and sender
                  processedRows.push({
                    date: new Date().toISOString(),
                    sender: 'Unknown',
                    message: `Error processing row ${i}`
                  })
                }
              }
            } catch (schemaErr) {
              console.error('Schema-based conversion failed:', schemaErr)
              // As a last resort, create minimal object
              processedRows.push({
                date: new Date().toISOString(),
                sender: 'Error',
                message: `Failed to process row ${i}`
              })
            }
          }
        }

        console.log(`Query returned ${processedRows.length} rows of data`)

        return {
          success: true,
          data: processedRows
        }
      } catch (err) {
        console.error('Error converting results to JSON:', err)

        // Create a minimal set of data to prevent complete failure
        const fallbackData = [
          {
            date: new Date().toISOString(),
            sender: 'Error Handler',
            message: `Error processing results: ${err.message}`
          }
        ]

        return {
          success: true,
          data: fallbackData,
          error: err.message
        }
      }
    } catch (err) {
      console.error('Error loading data:', err)
      return { success: false, error: err.message }
    }
  }

  // Get senders list directly from DuckDB with optimized query
  async function getSendersList() {
    try {
      // Initialize DuckDB using our singleton logic
      const { connection: conn } = await initDuckDB()

      // If messages table doesn't exist yet, we need to create it
      let tableExists = false
      try {
        const checkResult = await conn.query(`
          SELECT name FROM sqlite_master WHERE type='table' AND name='messages'
        `)
        tableExists = checkResult.toArray().length > 0
      } catch (err) {
        // Ignore errors here, just assume table doesn't exist
      }

      // If table doesn't exist, we need to load the parquet file
      if (!tableExists) {
        const result = await loadParquetFile()
        if (!result.success) {
          throw new Error(result.error || 'Failed to load parquet file')
        }
      }

      // Get a list of sender names and message counts directly from DuckDB
      const result = await conn.query(`
        SELECT 
          COALESCE(sender, 'Unknown') as name, 
          COUNT(*) as count 
        FROM messages 
        GROUP BY COALESCE(sender, 'Unknown')
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

  // Close DuckDB connection and clean up resources with better error handling
  async function cleanup() {
    console.log('Starting DuckDB cleanup...')

    // Try to drop tables first to ensure clean slate for next initialization
    if (duckdbConnection) {
      try {
        console.log('Dropping tables during cleanup')
        // Try to drop all tables before closing connection
        await duckdbConnection.query(
          `DROP TABLE IF EXISTS messages_temp CASCADE`
        )
        await duckdbConnection.query(`DROP TABLE IF EXISTS messages CASCADE`)
        console.log('Tables dropped successfully during cleanup')
      } catch (dropErr) {
        console.warn('Error dropping tables during cleanup:', dropErr)
        // Continue anyway
      }
    }

    if (duckdbConnection) {
      try {
        console.log('Closing DuckDB connection')
        await duckdbConnection.close()
        console.log('DuckDB connection closed successfully')
      } catch (err) {
        console.error('Error closing DuckDB connection:', err)
        // Try force-close with timeout
        try {
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error('Connection close timeout')),
              1000
            )
          )
          await Promise.race([duckdbConnection.close(), timeoutPromise]).catch(
            (e) => {
              console.warn('Timeout reached while closing connection')
            }
          )
        } catch (forceErr) {
          console.warn('Forced connection close also failed:', forceErr)
        }
      }
    } else {
      console.log('No DuckDB connection to close')
    }

    if (duckdbInstance) {
      try {
        console.log('Terminating DuckDB instance')
        await duckdbInstance.terminate()
        console.log('DuckDB instance terminated successfully')
      } catch (err) {
        console.error('Error terminating DuckDB instance:', err)
        // Try with timeout
        try {
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Terminate timeout')), 1000)
          )
          await Promise.race([
            duckdbInstance.terminate(),
            timeoutPromise
          ]).catch((e) => {
            console.warn('Timeout reached while terminating instance')
          })
        } catch (forceErr) {
          console.warn('Forced termination also failed:', forceErr)
        }
      }
    } else {
      console.log('No DuckDB instance to terminate')
    }

    // Reset state variables
    duckdbConnection = null
    duckdbInstance = null
    isInitializing = false
    initPromise = null

    console.log('DuckDB cleanup completed')
  }

  // Force reset of DuckDB state - can be called before loading if previous state is corrupt
  async function resetDuckDB() {
    console.log('Performing emergency DuckDB reset')

    try {
      // First clean up any existing connection
      await cleanup()

      // Forcefully reset all state variables
      duckdbConnection = null
      duckdbInstance = null
      isInitializing = false
      initPromise = null

      // Wait a short time for resources to be released
      await new Promise((resolve) => setTimeout(resolve, 500))

      console.log('DuckDB state reset complete')
      return true
    } catch (err) {
      console.error('DuckDB reset failed:', err)
      // Last resort - force everything to null even if cleanup failed
      duckdbConnection = null
      duckdbInstance = null
      isInitializing = false
      initPromise = null
      return false
    }
  }

  // Add this helper function to handle variable DuckDB response formats
  function safeGetRowCount(result) {
    try {
      // First try the standard API
      if (result && result[0] && typeof result[0].get === 'function') {
        return result[0].get(0)
      }

      // Try accessing the first element directly (newer DuckDB versions)
      if (result && result[0] && result[0][0] !== undefined) {
        return result[0][0]
      }

      // Try accessing as an object with named fields
      if (result && result[0] && result[0].count !== undefined) {
        return result[0].count
      }

      // If we still don't have a valid count, estimate from the data length
      if (result && result.length > 0) {
        return result.length
      }

      // Fallback: no valid count found
      return 0
    } catch (err) {
      console.warn('Error extracting row count:', err)
      return 0
    }
  }

  return {
    loadParquetFile,
    getSendersList,
    cleanup,
    resetDuckDB, // Expose the reset function
    safeGetRowCount // Expose the new helper function
  }
}
