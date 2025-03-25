<template>
  <div class="feltron-card p-6 rounded-lg">
    <div class="feltron-title mb-4">Top Message Days</div>

    <div v-if="loading" class="flex items-center justify-center py-4">
      <div class="animate-spin mr-3">
        <svg class="w-5 h-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
          </path>
        </svg>
      </div>
      <div class="text-white">Calculating top message days...</div>
    </div>

    <div v-else-if="error" class="text-red-500 p-4">{{ error }}</div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="(day, index) in topDays" :key="index"
        class="bg-gray-800 p-4 rounded-lg border-l-2 hover:bg-gray-700 transition-colors"
        :style="{ borderColor: getDayColor(index) }">
        <div class="text-white text-lg font-light mb-1">{{ formatDate(day.date) }}</div>
        <div class="text-blue-400 text-2xl font-light mb-3">{{ formatNumber(day.count) }} messages</div>

        <!-- Top senders for this day -->
        <div class="space-y-2 mb-3">
          <div v-for="(sender, i) in day.topSenders" :key="i" class="flex items-center">
            <div class="w-2 h-2 rounded-full mr-2" :style="{ backgroundColor: getSenderColor(sender.name) }"></div>
            <div class="text-white text-sm">{{ sender.name }}</div>
            <div class="text-gray-400 text-xs ml-auto">{{ formatNumber(sender.count) }}</div>
          </div>
        </div>

        <!-- Link to feed view -->
        <NuxtLink :to="{ path: '/feed', query: { date: day.date } }"
          class="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white text-xs py-1.5 px-3 rounded mt-2 transition-colors">
          View Messages
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import * as duckdb from '@duckdb/duckdb-wasm'
import * as d3 from 'd3'
import { format, parseISO } from 'date-fns'
import { useColorMap } from '~/composables/useColorMap'
import { useR2Storage } from '~/composables/useR2Storage'

const props = defineProps({
  rawData: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['update:top-days'])

const colorMap = useColorMap()
const loading = ref(true)
const error = ref(null)
const topDays = ref([])

// Get top message days using direct data processing
async function getTopMessageDays() {
  try {
    loading.value = true
    error.value = null

    // For large datasets, use a more efficient approach
    if (props.rawData.length > 10000) {
      console.log(`Large dataset (${props.rawData.length} messages) - using optimized approach`)

      // Take a sample of messages to speed up processing
      const sampleSize = Math.min(10000, props.rawData.length)
      const sampleInterval = Math.floor(props.rawData.length / sampleSize)
      const sampledData = []

      for (let i = 0; i < props.rawData.length; i += sampleInterval) {
        sampledData.push(props.rawData[i])
      }

      console.log(`Processing ${sampledData.length} sampled messages (${Math.round(sampledData.length / props.rawData.length * 100)}% of total)`)

      // Use Map for faster lookups
      const messagesByDay = new Map()

      sampledData.forEach(msg => {
        // Extract date part (YYYY-MM-DD) from timestamp
        const timestamp = msg.date || msg.timestamp
        if (!timestamp) return

        let dateStr
        if (typeof timestamp === 'string') {
          dateStr = timestamp.substring(0, 10)
        } else if (typeof timestamp === 'number') {
          dateStr = new Date(timestamp < 10000000000 ? timestamp * 1000 : timestamp)
            .toISOString().substring(0, 10)
        } else {
          return
        }

        if (!dateStr) return

        // Update counters
        if (!messagesByDay.has(dateStr)) {
          messagesByDay.set(dateStr, {
            date: dateStr,
            count: 0,
            messages: []
          })
        }

        const day = messagesByDay.get(dateStr)
        day.count++
        // Only store up to 100 messages per day to save memory
        if (day.messages.length < 100) {
          day.messages.push(msg)
        }
      })

      // Process the top days
      const sortedDays = Array.from(messagesByDay.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 6)

      // Scale counts to account for sampling
      if (sampleInterval > 1) {
        const scaleFactor = props.rawData.length / sampledData.length
        sortedDays.forEach(day => {
          day.count = Math.round(day.count * scaleFactor)
        })
      }

      // For each top day, find top senders
      topDays.value = sortedDays.map(day => {
        // Count messages by sender
        const senderCounts = {}

        day.messages.forEach(msg => {
          const sender = msg.from || msg.sender || msg.sender_name || 'Unknown'
          senderCounts[sender] = (senderCounts[sender] || 0) + 1
        })

        // Get top 3 senders
        const topSenders = Object.entries(senderCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 3)

        return {
          date: day.date,
          count: day.count,
          topSenders
        }
      })
    } else {
      // For smaller datasets, use the original approach
      console.log(`Processing ${props.rawData.length} messages to find top days...`)

      // Group messages by day
      const messagesByDay = {}

      props.rawData.forEach(msg => {
        // Extract date part (YYYY-MM-DD) from timestamp
        const timestamp = msg.date || msg.timestamp
        if (!timestamp) return

        let dateStr
        if (typeof timestamp === 'string') {
          // If it's a string, take first 10 chars if it looks like ISO format
          if (timestamp.length >= 10 && timestamp.includes('-')) {
            dateStr = timestamp.substring(0, 10)
          } else {
            // Try to parse as date
            const date = new Date(timestamp)
            if (!isNaN(date.getTime())) {
              dateStr = date.toISOString().substring(0, 10)
            }
          }
        } else if (typeof timestamp === 'number') {
          // If it's a number, convert to date
          const date = new Date(timestamp < 10000000000 ? timestamp * 1000 : timestamp)
          dateStr = date.toISOString().substring(0, 10)
        }

        if (!dateStr) return

        // Count messages per day
        if (!messagesByDay[dateStr]) {
          messagesByDay[dateStr] = {
            date: dateStr,
            count: 0,
            messages: []
          }
        }

        messagesByDay[dateStr].count++
        messagesByDay[dateStr].messages.push(msg)
      })

      // Sort days by message count and take top 6
      const sortedDays = Object.values(messagesByDay)
        .sort((a, b) => b.count - a.count)
        .slice(0, 6)

      console.log(`Found ${sortedDays.length} top message days`)

      // For each top day, find top senders
      topDays.value = sortedDays.map(day => {
        // Count messages by sender
        const senderCounts = {}

        day.messages.forEach(msg => {
          const sender = msg.from || msg.sender || msg.sender_name || 'Unknown'
          senderCounts[sender] = (senderCounts[sender] || 0) + 1
        })

        // Get top 3 senders
        const topSenders = Object.entries(senderCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 3)

        return {
          date: day.date,
          count: day.count,
          topSenders
        }
      })
    }

    console.log('Processed top message days with sender info:', topDays.value)

    // Emit the top days to the parent component
    emit('update:top-days', topDays.value)
  } catch (err) {
    console.error('Error getting top message days:', err)
    error.value = err.message || 'Failed to get top message days'
  } finally {
    loading.value = false
  }
}

// Format numbers in a nice way (1k, 15k, etc.)
function formatNumber(value) {
  return d3.format('.2~s')(value)
    .replace('k', 'K')
    .replace('M', 'M')
    .replace('G', 'B')
    .replace('.0', '')
}

// Format date in a readable way
function formatDate(dateStr) {
  // Parse YYYY-MM-DD into parts
  const [year, month, day] = dateStr.split('-')
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December']
  return `${months[parseInt(month) - 1]} ${parseInt(day)}, ${year}`
}

// Get color for a sender
function getSenderColor(senderName) {
  return colorMap.getSenderColor(senderName)
}

// Get color for day card (gradient from blue to red)
function getDayColor(index) {
  const colors = [
    '#3b82f6', // blue-500
    '#6366f1', // indigo-500
    '#8b5cf6', // violet-500
    '#a855f7', // purple-500
    '#ec4899', // pink-500
    '#ef4444'  // red-500
  ]
  return colors[index % colors.length]
}

onMounted(async () => {
  console.log(`TopMessageDays component mounted with ${props.rawData.length} messages`)
  await getTopMessageDays()
})
</script>