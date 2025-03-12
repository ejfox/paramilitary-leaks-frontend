<template>
  <div class="min-h-screen w-screen bg-gray-900 flex flex-col">
    <!-- Navigation Bar -->
    <TopBar current-page="Metadata Analysis" />

    <div class="p-6">
      <h1 class="text-white text-2xl font-bold mb-6">Paramilitary Leaks - Metadata</h1>

      <div v-if="loading" class="flex items-center justify-center py-12">
        <div class="flex items-center">
          <div class="animate-spin mr-3">
            <svg class="w-6 h-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
              </path>
            </svg>
          </div>
          <div class="text-white">Loading data...</div>
        </div>
      </div>

      <div v-else-if="error" class="text-red-500 p-4">{{ error }}</div>

      <div v-else class="flex flex-col space-y-6">
        <!-- Daily Message Count Chart -->
        <DailyMessageChart :messages-per-day="messagesPerDay" :total-messages="totalMessages"
          :top-message-days="topMessageDays" @search-date="handleSearchDate" />

        <!-- Top Message Days -->
        <TopMessageDays :raw-data="rawData" @update:top-days="handleTopDaysUpdate" />

        <!-- Date Search Results -->
        <div v-if="searchResults.length > 0" class="feltron-card p-6 rounded-lg">
          <div class="flex justify-between items-center mb-4">
            <div class="feltron-title">Search Results: {{ searchDate }}</div>
            <button @click="clearSearchResults" class="text-xs text-gray-400 hover:text-white">Clear</button>
          </div>
          <div class="text-white mb-2">Found {{ searchResults.length }} messages</div>
          <div class="bg-gray-800 p-4 rounded max-h-60 overflow-y-auto">
            <div v-for="(msg, index) in searchResults.slice(0, 10)" :key="index"
              class="mb-3 pb-3 border-b border-gray-700">
              <div class="text-gray-400 text-xs mb-1">{{ formatMessageDate(getMessageTimestamp(msg)) }}</div>
              <div class="text-white text-sm">{{ getMessageContent(msg) || 'No content' }}</div>
              <div class="text-blue-400 text-xs mt-1">From: {{ getMessageSender(msg) }}</div>
            </div>
            <div v-if="searchResults.length > 10" class="text-gray-400 text-xs mt-2">
              Showing 10 of {{ searchResults.length }} messages
            </div>
          </div>
        </div>

        <!-- Files Overview -->
        <FilesOverview />

        <!-- Streamgraph by Sender -->
        <StreamGraph :messages-by-sender="messagesBySender" :top-senders="allSenders"
          @highlight-sender="handleStreamGraphHighlight" />

        <!-- Monthly Message Counts -->
        <MonthlyBreakdown :messages-per-month="messagesPerMonth" :messages-by-sender="messagesBySender"
          :highlighted-sender="monthlyHighlightedSender" @highlight-sender="handleMonthlyHighlight"
          @clear-highlight="handleMonthlyHighlightClear" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useParquetLoader } from '~/composables/useParquetLoader'
import { useColorMap } from '~/composables/useColorMap'
import * as d3 from 'd3'
import { format } from 'date-fns'
import TopBar from '~/components/TopBar.vue'
import DailyMessageChart from '~/components/metadata/DailyMessageChart.vue'
import StreamGraph from '~/components/metadata/StreamGraph.vue'
import MonthlyBreakdown from '~/components/metadata/MonthlyBreakdown.vue'
import FilesOverview from '~/components/metadata/FilesOverview.vue'
import TopMessageDays from '~/components/metadata/TopMessageDays.vue'

const loading = ref(true)
const error = ref(null)
const rawData = ref([])
const messagesPerMonth = ref([])
const messagesPerDay = ref([])
const messagesBySender = ref([])
const totalMessages = ref(0)
const monthlyHighlightedSender = ref(null)
const streamGraphHighlightedSender = ref(null)
const searchResults = ref([])
const searchDate = ref('')
const topMessageDays = ref([])

const { loadParquetFile } = useParquetLoader()
const colorMap = useColorMap()

// Handle top days update from TopMessageDays component
function handleTopDaysUpdate(days) {
  topMessageDays.value = days
  console.log('Updated top message days:', days)
}

// Get all senders for the streamgraph
const allSenders = computed(() => {
  if (!rawData.value.length) return []

  const senderCounts = {}
  rawData.value.forEach(msg => {
    const sender = getMessageSender(msg)
    senderCounts[sender] = (senderCounts[sender] || 0) + 1
  })

  return Object.entries(senderCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
})

// Handle highlighting separately for each component
function handleStreamGraphHighlight(sender) {
  streamGraphHighlightedSender.value = sender
}

function handleMonthlyHighlight(sender) {
  monthlyHighlightedSender.value = sender
}

function handleMonthlyHighlightClear() {
  monthlyHighlightedSender.value = null
}

// Helper function to get timestamp from a message
function getMessageTimestamp(message) {
  // Handle different data formats
  const timestamp = message.date || message.timestamp;

  if (!timestamp) {
    console.warn('Message missing timestamp:', message);
    return null;
  }

  // If it's already a Date object, return it
  if (timestamp instanceof Date) {
    return timestamp;
  }

  // If it's a string, handle various formats
  if (typeof timestamp === 'string') {
    // If it looks like an ISO date string (YYYY-MM-DD...)
    if (timestamp.length >= 10 && timestamp.includes('-')) {
      // Take just the date part if it has time
      const dateStr = timestamp.substring(0, 10);
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        // Set to start of day to ensure consistent comparison
        date.setHours(0, 0, 0, 0);
        return date;
      }
    }

    // Try parsing as regular date
    const date = new Date(timestamp);
    if (!isNaN(date.getTime())) {
      // Set to start of day to ensure consistent comparison
      date.setHours(0, 0, 0, 0);
      return date;
    }
  }

  // If it's a number (unix timestamp), convert to milliseconds if needed
  if (typeof timestamp === 'number') {
    const msTimestamp = timestamp < 10000000000 ? timestamp * 1000 : timestamp;
    const date = new Date(msTimestamp);
    // Set to start of day to ensure consistent comparison
    date.setHours(0, 0, 0, 0);
    return date;
  }

  console.warn('Could not parse timestamp:', timestamp);
  return null;
}

// Helper function to get sender from a message
function getMessageSender(message) {
  // Handle different data formats
  return message.from || message.sender || message.sender_name || 'Unknown'
}

// Process data to get messages per month
function processDataByMonth(data) {
  if (!data || !data.length) return []

  // Group messages by month using string manipulation
  const monthlyGroups = d3.group(data, d => {
    const timestamp = d.date || d.timestamp
    if (!timestamp) return null
    // If it's a string that looks like an ISO date
    if (typeof timestamp === 'string' && timestamp.length >= 10) {
      return timestamp.substring(0, 7) // YYYY-MM
    }
    // If it's a number (unix timestamp)
    if (typeof timestamp === 'number') {
      const date = new Date(timestamp < 10000000000 ? timestamp * 1000 : timestamp)
      return date.toISOString().substring(0, 7)
    }
    return null
  })

  // Remove any null groups
  monthlyGroups.delete(null)

  // Convert to array and sort chronologically
  const monthlyData = Array.from(monthlyGroups, ([date, messages]) => ({
    date,
    count: messages.length
  })).sort((a, b) => a.date.localeCompare(b.date))

  return monthlyData
}

// Process data to get messages per day
function processDataByDay(data) {
  if (!data || !data.length) return []

  console.log(`Processing ${data.length} messages for daily chart`)

  // Group messages by day using simple string substring like DuckDB
  const dailyGroups = d3.group(data, d => {
    const timestamp = d.date || d.timestamp
    if (!timestamp) return null

    // If it's a string that looks like an ISO date
    if (typeof timestamp === 'string' && timestamp.length >= 10) {
      return timestamp.substring(0, 10) // YYYY-MM-DD
    }

    // If it's a number (unix timestamp)
    if (typeof timestamp === 'number') {
      const date = new Date(timestamp < 10000000000 ? timestamp * 1000 : timestamp)
      return date.toISOString().substring(0, 10)
    }

    return null
  })

  // Remove any null groups (invalid dates)
  dailyGroups.delete(null)

  // Convert to array and sort chronologically
  const dailyData = Array.from(dailyGroups, ([date, messages]) => ({
    date: date, // Keep as YYYY-MM-DD string
    count: messages.length
  })).sort((a, b) => a.date.localeCompare(b.date))

  // Log the days with the most messages
  const top10Days = [...dailyData].sort((a, b) => b.count - a.count).slice(0, 10)
  console.log('Top 10 days with most messages:')
  top10Days.forEach(day => {
    console.log(`${day.date}: ${day.count} messages`)
  })

  return dailyData
}

// Process data for streamgraph (messages by sender over time)
function processDataForStreamgraph(data) {
  if (!data || !data.length) return []

  // First, determine the time intervals (months)
  const timestamps = data.map(d => new Date(getMessageTimestamp(d)))
  const timeExtent = d3.extent(timestamps)

  // Create an array of month intervals
  const months = []
  let currentDate = new Date(timeExtent[0])
  currentDate.setDate(1) // Start at the beginning of the month

  while (currentDate <= timeExtent[1]) {
    months.push(new Date(currentDate))
    currentDate.setMonth(currentDate.getMonth() + 1)
  }

  // Get all senders (removing the 1000 limit to include all senders)
  // First count all senders
  const senderCounts = {}
  data.forEach(msg => {
    const sender = getMessageSender(msg)
    senderCounts[sender] = (senderCounts[sender] || 0) + 1
  })

  // Sort by count but don't limit to 1000
  const allSenderNames = Object.entries(senderCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name)

  console.log(`Including ${allSenderNames.length} senders in streamgraph data`)

  // Group messages by month and sender
  const nestedData = d3.groups(data,
    d => d3.timeFormat('%Y-%m')(new Date(getMessageTimestamp(d))),
    d => getMessageSender(d)
  )

  // Convert to the format needed for the streamgraph
  const streamData = []

  // For each month
  months.forEach(month => {
    const monthKey = d3.timeFormat('%Y-%m')(month)
    const monthData = { date: month }

    // Initialize all senders to 0
    allSenderNames.forEach(sender => {
      monthData[sender] = 0
    })

    // Fill in actual values
    const monthGroup = nestedData.find(([key]) => key === monthKey)
    if (monthGroup) {
      monthGroup[1].forEach(([sender, messages]) => {
        if (allSenderNames.includes(sender)) {
          monthData[sender] = messages.length
        }
      })
    }

    streamData.push(monthData)
  })

  return streamData
}

// Format a date for display
function formatMessageDate(timestamp) {
  if (!timestamp) return 'Unknown date'
  try {
    const date = new Date(timestamp)
    return format(date, 'MMM d, yyyy h:mm a')
  } catch (e) {
    return 'Invalid date'
  }
}

// Get message content
function getMessageContent(message) {
  return message.message || message.text || message.content || null
}

// Handle search for messages on a specific date
function handleSearchDate(dateInfo) {
  console.log('Searching for messages on date:', dateInfo.dateString)
  searchDate.value = dateInfo.dateString

  // Find messages for this date using string comparison
  searchResults.value = rawData.value.filter(msg => {
    const timestamp = msg.date || msg.timestamp
    if (!timestamp) return false

    // If it's a string that looks like an ISO date
    if (typeof timestamp === 'string' && timestamp.length >= 10) {
      return timestamp.substring(0, 10) === dateInfo.dateString
    }

    // If it's a number (unix timestamp)
    if (typeof timestamp === 'number') {
      const date = new Date(timestamp < 10000000000 ? timestamp * 1000 : timestamp)
      return date.toISOString().substring(0, 10) === dateInfo.dateString
    }

    return false
  })

  console.log(`Found ${searchResults.value.length} messages for ${dateInfo.dateString}`)
  console.log(`Chart showed ${dateInfo.count} messages for this date`)

  if (searchResults.value.length !== dateInfo.count) {
    console.warn('⚠️ DISCREPANCY DETECTED: Chart count and actual message count do not match!')
    console.log('This could indicate an issue with date processing or grouping')
  }
}

// Clear search results
function clearSearchResults() {
  searchResults.value = []
  searchDate.value = ''
}

onMounted(async () => {
  try {
    console.log('Loading parquet data...')

    const result = await loadParquetFile()

    if (!result.success) {
      throw new Error(result.error || 'Failed to load data')
    }

    console.log(`Successfully loaded ${result.data.length} rows`)
    rawData.value = result.data
    totalMessages.value = result.data.length

    // Initialize the color map with all data
    colorMap.initialize(result.data, getMessageSender)

    // Process data for different visualizations
    messagesPerMonth.value = processDataByMonth(result.data)
    messagesPerDay.value = processDataByDay(result.data)
    messagesBySender.value = processDataForStreamgraph(result.data)

    loading.value = false
  } catch (err) {
    console.error('Error loading data:', err)
    error.value = err.message
    loading.value = false
  }
})
</script>

<style scoped>
/* Custom scrollbar styles */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(31, 41, 55, 0.5);
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(75, 85, 99, 0.7);
  border-radius: 3px;
}

/* Feltron-inspired typography */
.feltron-title {
  font-family: 'Inter', sans-serif;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  font-size: 0.7rem;
  font-weight: 500;
  color: rgba(156, 163, 175, 0.8);
  margin-bottom: 0.5rem;
}

.feltron-value {
  font-family: 'Inter', sans-serif;
  font-weight: 300;
  letter-spacing: 0.02em;
}

.feltron-card {
  background-color: rgba(31, 41, 55, 1);
  border-left: 3px solid rgba(59, 130, 246, 0.8);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.feltron-list-item {
  transition: all 0.2s ease;
}

.feltron-list-item:hover {
  transform: translateX(2px);
}
</style>