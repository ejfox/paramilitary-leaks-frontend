<template>
  <div>
    <div v-if="loading" class="text-lg">Loading DuckDB and Parquet file...</div>
    <div v-else>
      <div class="text-lg font-semibold mb-4">
        Rows Loaded: {{ rowsLoaded }}
        <span v-if="rowsLoaded > maxPoints" class="text-sm text-gray-500 ml-2">
          (Visualizing first {{ maxPoints.toLocaleString() }} points)
        </span>
        <span v-if="data && data.length < rowsLoaded" class="text-sm text-gray-500 ml-2">
          (Filtered out {{ rowsLoaded - (data ? data.length : 0) }} rows
          <template v-if="filterPreModern">with invalid timestamps or before 2020</template>
          <template v-else>with invalid timestamps</template>)
        </span>
      </div>
      <div v-if="error" class="text-red-500 mt-2 mb-4">{{ error }}</div>

      <!-- Slot for visualization content -->
      <slot :data="data" :loading="loading" :error="error"></slot>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import * as duckdb from '@duckdb/duckdb-wasm'
import duckdb_wasm from '@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url'
import mvp_worker from '@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url'
import duckdb_wasm_eh from '@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url'
import eh_worker from '@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url'
import { useTimestampParser } from '~/composables/useTimestampParser'
import { useR2Storage } from '~/composables/useR2Storage'

const props = defineProps({
  filterPreModern: {
    type: Boolean,
    default: true
  },
  maxPoints: {
    type: Number,
    default: 100000
  },
  parquetFilePath: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['update:data'])

// State
const rowsLoaded = ref(0)
const loading = ref(true)
const error = ref(null)
const data = ref([])

// Get timestamp parser
const { parseTimestamp } = useTimestampParser()

// Store raw data for re-filtering
let rawData = []

// Function to filter data based on current settings
function filterData() {
  // Counters for debugging
  let totalRows = rawData.length
  let emptyTimestampCount = 0
  let invalidTimestampCount = 0
  let premodern2020Count = 0
  let validRowCount = 0

  // Check if we have time-of-day format timestamps
  const sampleTimestamps = rawData.slice(0, 20).map(row => row.timestamp)
  const timeRegex = /^(\d{1,2}):(\d{2})$/
  const hasTimeOfDayFormat = sampleTimestamps.some(ts =>
    typeof ts === 'string' && timeRegex.test(ts)
  )

  console.log(`Detected time-of-day format timestamps: ${hasTimeOfDayFormat}`)

  // If we have time-of-day format, we should disable the pre-2020 filtering
  const shouldFilterByYear = props.filterPreModern && !hasTimeOfDayFormat

  if (hasTimeOfDayFormat && props.filterPreModern) {
    console.log('Time-of-day format detected - disabling year-based filtering')
  }

  data.value = rawData.filter(row => {
    // Skip rows with empty, null, or zero timestamps
    if (!row.timestamp || row.timestamp === '' || row.timestamp === '0') {
      emptyTimestampCount++
      return false
    }

    // Parse the timestamp
    let timestamp = parseTimestamp(row.timestamp)

    // For time-of-day format, we don't filter by year
    if (hasTimeOfDayFormat) {
      if (!timestamp || isNaN(timestamp)) {
        invalidTimestampCount++
        return false
      }
      // Keep all valid time-of-day timestamps
      validRowCount++
      return true
    }

    // Normal timestamp filtering
    if (shouldFilterByYear) {
      const jan2020 = new Date('2020-01-01').getTime()
      if (!timestamp || isNaN(timestamp) || timestamp < jan2020) {
        if (!timestamp || isNaN(timestamp)) {
          invalidTimestampCount++
        } else if (timestamp < jan2020) {
          premodern2020Count++
        }
        return false
      }
    } else {
      // Always filter out invalid timestamps
      if (!timestamp || isNaN(timestamp) || timestamp <= 0) {
        invalidTimestampCount++
        return false
      }
    }

    // Keep this row
    validRowCount++
    return true
  })

  // Log filtering statistics
  console.log('Filtering statistics:')
  console.log(`Total rows: ${totalRows}`)
  console.log(`Empty timestamps: ${emptyTimestampCount} (${(emptyTimestampCount / totalRows * 100).toFixed(2)}%)`)
  console.log(`Invalid timestamps: ${invalidTimestampCount} (${(invalidTimestampCount / totalRows * 100).toFixed(2)}%)`)
  if (!hasTimeOfDayFormat) {
    console.log(`Pre-2020 timestamps: ${premodern2020Count} (${(premodern2020Count / totalRows * 100).toFixed(2)}%)`)
  }
  console.log(`Valid rows: ${validRowCount} (${(validRowCount / totalRows * 100).toFixed(2)}%)`)

  // Emit the filtered data
  emit('update:data', data.value)
}

// Watch for changes to filterPreModern
watch(() => props.filterPreModern, () => {
  if (rawData.length > 0) {
    filterData()
  }
})

onMounted(async () => {
  try {
    console.log('🔍 Starting initialization...')
    const config = useRuntimeConfig()
    const { fetchFile } = useR2Storage()

    // Get the file path from props or config
    const filePath = props.parquetFilePath || config.public.PARQUET_FILE_PATH || 'messages.parquet'
    console.log(`🔍 Using parquet file: ${filePath}`)

    // Define manual bundles with Vite URL imports
    const MANUAL_BUNDLES = {
      mvp: {
        mainModule: duckdb_wasm,
        mainWorker: mvp_worker,
      },
      eh: {
        mainModule: duckdb_wasm_eh,
        mainWorker: eh_worker,
      },
    }

    console.log('🔍 Selecting DuckDB bundle...')
    // Select a bundle based on browser checks
    const bundle = await duckdb.selectBundle(MANUAL_BUNDLES)
    console.log('🔍 Selected bundle:', bundle)

    console.log('🔍 Creating DuckDB worker...')
    // Instantiate the asynchronous version of DuckDB-wasm
    const worker = new Worker(bundle.mainWorker)
    const logger = new duckdb.ConsoleLogger()
    const db = new duckdb.AsyncDuckDB(logger, worker)

    console.log('🔍 Instantiating DuckDB...')
    await db.instantiate(bundle.mainModule, bundle.pthreadWorker)

    console.log('🔍 DuckDB initialized, connecting...')
    const conn = await db.connect()

    console.log('🔍 Fetching Parquet file...')
    const response = await fetchFile(filePath)
    if (!response.ok) {
      throw new Error(`Failed to fetch Parquet file: ${response.status} ${response.statusText}`)
    }

    console.log('🔍 Parquet file fetched, getting array buffer...')
    const arrayBuffer = await response.arrayBuffer()
    console.log('🔍 Array buffer received, size:', arrayBuffer.byteLength)

    console.log('🔍 Registering Parquet file buffer...')
    await db.registerFileBuffer(
      'data.parquet',
      new Uint8Array(arrayBuffer)
    )

    console.log('🔍 Creating table from Parquet file...')
    await conn.query(`
        CREATE TABLE messages AS 
        SELECT * FROM 'data.parquet'
      `)

    console.log('🔍 Counting rows...')
    const result = await conn.query(`SELECT COUNT(*) as count FROM messages`)
    rowsLoaded.value = result.toArray()[0].count

    console.log(`🔍 Successfully loaded ${rowsLoaded.value} rows from Parquet file`)

    // Get data for visualization (limit to maxPoints if needed)
    console.log('🔍 Loading data for visualization...')
    const dataResult = await conn.query(`
        SELECT * FROM messages 
        LIMIT ${props.maxPoints + 1000}
      `) // Add some buffer for safety

    console.log('🔍 Converting query result to JSON...')
    rawData = dataResult.toArray().map(row => row.toJSON())
    console.log(`🔍 Loaded ${rawData.length} rows for visualization`)

    // Log a few raw data samples to understand the structure
    console.log('🔍 Raw data samples:')
    console.log('🔍 First 3 items:', rawData.slice(0, 3))

    // Check timestamp formats specifically
    console.log('🔍 Timestamp examples:')
    const timestampSamples = rawData.slice(0, 10).map(row => ({
      original: row.timestamp,
      type: typeof row.timestamp,
      parsed: parseTimestamp(row.timestamp)
    }))
    console.log(timestampSamples)

    // Filter the data based on current settings
    console.log('🔍 Filtering data...')
    filterData()
    console.log(`🔍 After filtering: ${data.value.length} rows remain`)

    // If no rows passed the filter, temporarily disable filtering to allow visualization
    if (data.value.length === 0) {
      console.log('🔍 No rows passed the filter! Temporarily disabling filtering to allow visualization...')

      // Use more lenient filtering
      data.value = rawData.slice(0, props.maxPoints).map(row => {
        // If timestamp is missing or invalid, add a placeholder timestamp
        if (!row.timestamp || row.timestamp === '' || row.timestamp === '0') {
          return { ...row, timestamp: Date.now() }
        }
        return row
      })

      console.log(`🔍 Using ${data.value.length} rows with lenient filtering for visualization`)
    }

    // Analyze timestamp distribution to debug visualization issues
    if (data.value.length > 0) {
      console.log('🔍 Analyzing timestamp distribution...')
      const timestamps = data.value.map(row => {
        let ts = null
        if (typeof row.timestamp === 'string') {
          ts = new Date(row.timestamp).getTime()
          if (isNaN(ts)) {
            const unixSeconds = parseInt(row.timestamp, 10)
            if (!isNaN(unixSeconds)) {
              ts = unixSeconds * 1000
            }
          }
        } else if (typeof row.timestamp === 'number') {
          ts = row.timestamp < 10000000000 ? row.timestamp * 1000 : row.timestamp
        }
        return ts
      }).filter(ts => ts !== null && !isNaN(ts))

      // Sort timestamps for analysis
      timestamps.sort((a, b) => a - b)

      // Get min, max, and some percentiles
      const min = timestamps[0]
      const max = timestamps[timestamps.length - 1]
      const p10 = timestamps[Math.floor(timestamps.length * 0.1)]
      const p25 = timestamps[Math.floor(timestamps.length * 0.25)]
      const median = timestamps[Math.floor(timestamps.length * 0.5)]
      const p75 = timestamps[Math.floor(timestamps.length * 0.75)]
      const p90 = timestamps[Math.floor(timestamps.length * 0.9)]

      console.log('🔍 Timestamp distribution analysis:')
      console.log(`🔍 Min: ${new Date(min).toISOString()} (${min})`)
      console.log(`🔍 10th percentile: ${new Date(p10).toISOString()} (${p10})`)
      console.log(`🔍 25th percentile: ${new Date(p25).toISOString()} (${p25})`)
      console.log(`🔍 Median: ${new Date(median).toISOString()} (${median})`)
      console.log(`🔍 75th percentile: ${new Date(p75).toISOString()} (${p75})`)
      console.log(`🔍 90th percentile: ${new Date(p90).toISOString()} (${p90})`)
      console.log(`🔍 Max: ${new Date(max).toISOString()} (${max})`)
      console.log(`🔍 Range: ${(max - min) / (1000 * 60 * 60 * 24)} days`)

      // Check for outliers - points that are far from the median
      const iqr = p75 - p25
      const lowerBound = p25 - (iqr * 1.5)
      const upperBound = p75 + (iqr * 1.5)
      const outliers = timestamps.filter(ts => ts < lowerBound || ts > upperBound)
      console.log(`🔍 Found ${outliers.length} outlier timestamps (${(outliers.length / timestamps.length * 100).toFixed(2)}%)`)

      if (outliers.length > 0) {
        console.log(`🔍 First few outliers:`)
        outliers.slice(0, 5).forEach(ts => {
          console.log(`🔍 - ${new Date(ts).toISOString()} (${ts})`)
        })
      }
    }

    // Sample data for debugging
    console.log('🔍 Sample data:', data.value.slice(0, 5))

    console.log('🔍 Setting loading to false...')
    loading.value = false

    // Emit the loaded data
    emit('update:data', data.value)
  } catch (err) {
    console.error('🔍 Error loading or parsing Parquet file:', err)
    error.value = err.message || 'Failed to load Parquet file'
    loading.value = false
  }
})
</script>