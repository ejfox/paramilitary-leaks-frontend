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

    <div v-else-if="error" class="text-red-500 p-4 bg-red-900/30 rounded">
      <div class="font-medium">Error Processing Data</div>
      <div class="text-sm mt-1">{{ error }}</div>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="(day, index) in topDays" :key="index"
        class="bg-gray-800/80 p-4 rounded-lg border-l-2 hover:bg-gray-700/80 transition-colors relative group"
        :style="{ borderColor: getDayColor(index) }">
        <!-- Date and count -->
        <div class="text-white text-lg font-light mb-1">{{ formatDate(day.date) }}</div>
        <div class="text-blue-400 text-2xl font-light mb-3 flex items-baseline">
          <span>{{ formatNumber(day.count) }}</span>
          <span class="text-sm ml-2 text-blue-300">messages</span>
        </div>

        <!-- Top senders with percentage -->
        <div class="space-y-2 mb-3">
          <div v-for="(sender, i) in day.topSenders" :key="i"
            class="flex items-center p-1 rounded hover:bg-gray-700 transition-colors">
            <div class="w-2 h-2 rounded-full mr-2" :style="{ backgroundColor: getSenderColor(sender.name) }"></div>
            <div class="text-white text-sm flex-grow truncate" :title="sender.name">{{ sender.name }}</div>
            <div class="text-gray-400 text-xs ml-2">
              {{ formatNumber(sender.count) }}
              <span class="text-gray-500 ml-1">({{ Math.round(sender.count / day.count * 100) }}%)</span>
            </div>
          </div>
        </div>

        <!-- Sample messages preview -->
        <div v-if="day.messages.length > 0" class="mt-4 pt-3 border-t border-gray-700/50">
          <div class="text-xs text-gray-400 mb-2">Sample Messages:</div>
          <div class="space-y-2">
            <div v-for="(msg, i) in day.messages.slice(0, 2)" :key="i" class="text-sm text-gray-300 truncate"
              :title="msg.message || msg.text || msg.content">
              {{ msg.message || msg.text || msg.content || 'No content' }}
            </div>
          </div>
        </div>

        <!-- Link to feed view -->
        <NuxtLink :to="{ path: '/feed', query: { date: day.date } }"
          class="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white text-xs py-1.5 px-3 rounded mt-3 transition-colors">
          View All Messages
        </NuxtLink>

        <!-- Rank indicator -->
        <div class="absolute top-2 right-2 text-xs text-gray-500">
          #{{ index + 1 }}
        </div>
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
const loading = ref(false)
const error = ref(null)
const topDays = ref([])

// Get top message days using direct data processing
function getTopMessageDays() {
  try {
    // Process all messages to get accurate daily counts
    const messagesByDay = new Map()
    const today = new Date().toISOString().substring(0, 10)

    // Process all messages to get accurate daily counts
    for (let i = 0; i < props.rawData.length; i++) {
      const msg = props.rawData[i]
      const timestamp = msg.date || msg.timestamp
      if (!timestamp) continue

      let dateStr
      if (typeof timestamp === 'string' && timestamp.length >= 10) {
        dateStr = timestamp.substring(0, 10)
      } else if (typeof timestamp === 'number') {
        dateStr = new Date(timestamp < 10000000000 ? timestamp * 1000 : timestamp)
          .toISOString().substring(0, 10)
      } else {
        continue
      }

      if (!dateStr || dateStr > today) continue

      let day = messagesByDay.get(dateStr)
      if (!day) {
        day = {
          date: dateStr,
          count: 0,
          messages: [],
          senderCounts: new Map()
        }
        messagesByDay.set(dateStr, day)
      }

      day.count++

      // Track sender counts efficiently
      const sender = msg.from || msg.sender || msg.sender_name || 'Unknown'
      day.senderCounts.set(
        sender,
        (day.senderCounts.get(sender) || 0) + 1
      )

      // Only store first 3 messages per day since that's all we display
      if (day.messages.length < 3) {
        day.messages.push(msg)
      }
    }

    // Convert to array and sort by count - only get top 6 immediately
    const sortedDays = Array.from(messagesByDay.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
      .map(day => {
        // Convert sender counts Map to sorted array - only get top 3
        const topSenders = Array.from(day.senderCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([name, count]) => ({ name, count }))

        return {
          date: day.date,
          count: day.count,
          topSenders,
          messages: day.messages
        }
      })

    topDays.value = sortedDays
    emit('update:top-days', sortedDays)
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
  const date = parseISO(dateStr)
  return format(date, 'MMMM d, yyyy')
}

// Get color for a sender using the shared color map
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

onMounted(() => {
  console.log(`TopMessageDays component mounted with ${props.rawData.length} messages`)
  // Call synchronously since it's fast now
  getTopMessageDays()
})
</script>