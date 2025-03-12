<template>
  <div class="feltron-card p-6 rounded-lg">
    <div class="feltron-title mb-4">Monthly Breakdown</div>
    <ul class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-6">
      <li v-for="month in messagesPerMonth" :key="month.date" class="feltron-list-item">
        <div class="flex flex-col">
          <span class="text-gray-400 text-xs uppercase tracking-wider">{{ formatMonthName(month.date) }}</span>
          <span class="text-white text-xl font-light">{{ formatNumber(month.count) }}</span>
          <div class="h-2 mt-1 bg-gray-800 relative overflow-hidden">
            <!-- Container for the stacked bar with total message scaling -->
            <div class="absolute top-0 left-0 h-full" :style="{ width: (month.count / maxMonthlyCount * 100) + '%' }">
              <!-- Stacked bar segments by sender -->
              <div v-for="(segment, index) in getMonthSegments(month.date)" :key="index" class="absolute top-0 h-full"
                :class="{ 'opacity-100': !highlightedSender || highlightedSender === segment.sender, 'opacity-30': highlightedSender && highlightedSender !== segment.sender }"
                :style="{
                  backgroundColor: getSenderColor(segment.sender),
                  left: segment.start + '%',
                  width: segment.width + '%',
                  transition: 'opacity 0.2s ease'
                }" @mouseover="onHighlightSender(segment.sender, month.date)" @mouseout="onClearHighlight">
                <div v-if="hoveredSender === segment.sender && hoveredMonth === month.date"
                  class="absolute bottom-full mb-1 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                  {{ segment.sender }}: {{ formatNumber(segment.count) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import * as d3 from 'd3'
import { useColorMap } from '~/composables/useColorMap'

const props = defineProps({
  messagesPerMonth: {
    type: Array,
    required: true
  },
  messagesBySender: {
    type: Array,
    required: true,
    default: () => []
  },
  highlightedSender: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['highlight-sender', 'clear-highlight'])

const colorMap = useColorMap()
const hoveredSender = ref(null)
const hoveredMonth = ref(null)

// Watch for external highlighting changes
watch(() => props.highlightedSender, (newValue) => {
  if (newValue) {
    hoveredSender.value = newValue
  } else {
    hoveredSender.value = null
    hoveredMonth.value = null
  }
})

// Format numbers in a nice way (1k, 15k, etc.)
function formatNumber(value) {
  return d3.format('.2~s')(value)
    .replace('k', 'K')
    .replace('M', 'M')
    .replace('G', 'B')
    .replace('.0', '')
}

// Format month name from YYYY-MM to a more readable format
function formatMonthName(dateStr) {
  const [year, month] = dateStr.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1, 1)
  return d3.timeFormat('%b %Y')(date)
}

// Get color for a sender using the shared color map
function getSenderColor(senderName) {
  return colorMap.getSenderColor(senderName)
}

// Highlight a specific sender
function onHighlightSender(senderName, monthDate) {
  hoveredSender.value = senderName
  hoveredMonth.value = monthDate
  emit('highlight-sender', senderName)
}

// Clear highlight
function onClearHighlight() {
  hoveredSender.value = null
  hoveredMonth.value = null
  emit('clear-highlight')
}

// Compute the maximum monthly count for the bar chart scaling
const maxMonthlyCount = computed(() => {
  if (!props.messagesPerMonth.length) return 0
  return Math.max(...props.messagesPerMonth.map(m => m.count))
})

// Get the top senders for each month to create the stacked bar segments
function getMonthSegments(monthDate) {
  // If we don't have messagesBySender data, return a single segment
  if (!props.messagesBySender || !props.messagesBySender.length) {
    return [{ sender: 'Unknown', start: 0, width: 100, count: 0 }]
  }

  // Find the data for this specific month
  const monthData = props.messagesBySender.find(m => {
    const monthStr = d3.timeFormat('%Y-%m')(m.date)
    return monthStr === monthDate
  })

  if (!monthData) {
    return [{ sender: 'Unknown', start: 0, width: 100, count: 0 }]
  }

  // Get all senders for this month (excluding the date field)
  const senders = Object.keys(monthData).filter(key => key !== 'date')

  // Sort senders by message count (descending)
  const sortedSenders = [...senders].sort((a, b) => monthData[b] - monthData[a])

  // Take top 10 senders for better visualization
  const topSenders = sortedSenders.slice(0, 10)

  // Calculate total messages for this month
  const totalMessages = topSenders.reduce((sum, sender) => sum + monthData[sender], 0)

  // Create segments for the stacked bar
  const segments = []
  let currentPosition = 0

  topSenders.forEach(sender => {
    const messageCount = monthData[sender]
    const percentage = (messageCount / totalMessages) * 100

    segments.push({
      sender,
      start: currentPosition,
      width: percentage,
      count: messageCount
    })

    currentPosition += percentage
  })

  return segments
}
</script>

<style scoped>
.feltron-list-item {
  position: relative;
}
</style>