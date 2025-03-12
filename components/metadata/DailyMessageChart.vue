<template>
  <div class="feltron-card p-6 rounded-lg">
    <div class="flex justify-between items-center mb-4">
      <div class="text-white text-2xl">{{ formatNumber(totalMessages) }} total messages</div>
      <div class="flex items-center text-xs text-gray-400">
        <div class="w-3 h-3 rounded-full bg-red-500 mr-1.5"></div>
        <span>Top message days</span>
      </div>
    </div>
    <div ref="chartContainer" class="w-full h-64"></div>
    <div v-if="selectedDay" class="mt-4 p-3 bg-gray-800 rounded text-white">
      <div class="font-bold">{{ formatDate(selectedDay.date) }}</div>
      <div>{{ formatNumber(selectedDay.count) }} messages</div>
      <button @click="emitSearchDate" class="mt-2 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700">
        Search for messages on this date
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as d3 from 'd3'

const props = defineProps({
  messagesPerDay: {
    type: Array,
    required: true
  },
  totalMessages: {
    type: Number,
    required: true
  },
  topMessageDays: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['search-date'])

const chartContainer = ref(null)
const selectedDay = ref(null)
let chart = null

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
  return dateStr // Keep as YYYY-MM-DD
}

// Format date for display (M/D)
function formatShortDate(dateStr) {
  const [year, month, day] = dateStr.split('-')
  return `${parseInt(month)}/${parseInt(day)}`
}

// Create the daily message count chart
function createDailyChart() {
  if (!chartContainer.value || !props.messagesPerDay.length) return

  // Debug date parsing
  console.log('=== Chart Date Debug ===')
  console.log('Sample dates:', props.messagesPerDay.slice(0, 2))
  console.log('Top message days:', props.topMessageDays)

  // Clear any existing chart
  d3.select(chartContainer.value).selectAll('*').remove()

  const data = props.messagesPerDay
  const container = chartContainer.value
  const width = container.clientWidth
  const height = container.clientHeight
  const margin = { top: 20, right: 20, bottom: 30, left: 60 }
  const innerWidth = width - margin.left - margin.right
  const innerHeight = height - margin.top - margin.bottom

  const svg = d3.select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  // Use scaleBand for x-axis since we're dealing with discrete dates
  const x = d3.scaleBand()
    .domain(data.map(d => d.date))
    .range([0, innerWidth])
    .padding(0.1)

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.count) * 1.1])
    .range([innerHeight, 0])

  // Add X axis
  svg.append('g')
    .attr('transform', `translate(0,${innerHeight})`)
    .call(d3.axisBottom(x)
      .tickValues(x.domain().filter((d, i) => i % Math.ceil(data.length / 5) === 0))
      .tickFormat(d => formatShortDate(d)))
    .attr('color', 'rgba(156, 163, 175, 0.6)')
    .selectAll('text')
    .attr('fill', 'rgba(156, 163, 175, 0.8)')
    .attr('transform', 'rotate(-45)')
    .attr('text-anchor', 'end')

  // Add Y axis
  svg.append('g')
    .call(d3.axisLeft(y).ticks(5).tickFormat(d => formatNumber(d)))
    .attr('color', 'rgba(156, 163, 175, 0.6)')
    .selectAll('text')
    .attr('fill', 'rgba(156, 163, 175, 0.8)')

  // Add the bars
  svg.selectAll('rect')
    .data(data)
    .join('rect')
    .attr('x', d => x(d.date))
    .attr('width', x.bandwidth())
    .attr('y', d => y(d.count))
    .attr('height', d => innerHeight - y(d.count))
    .attr('fill', d => {
      const isTopDay = props.topMessageDays.some(topDay => topDay.date === d.date)
      return isTopDay ? 'rgba(239, 68, 68, 0.9)' : 'rgba(255, 255, 255, 0.5)'
    })
    .style('cursor', 'pointer')
    .on('click', (event, d) => {
      selectedDay.value = d
    })

  // Add labels for top message days
  svg.selectAll('.top-day-label')
    .data(props.topMessageDays)
    .join('text')
    .attr('class', 'top-day-label')
    .attr('x', d => x(d.date) + x.bandwidth() / 2)
    .attr('y', d => y(d.count) - 5)
    .attr('text-anchor', 'middle')
    .attr('fill', 'rgba(239, 68, 68, 0.9)')
    .attr('font-size', '10px')
    .text(d => formatShortDate(d.date))

  chart = svg
}

// Handle window resize
function handleResize() {
  if (chartContainer.value) {
    createDailyChart()
  }
}

watch(() => props.messagesPerDay, () => {
  createDailyChart()
}, { deep: true })

watch(() => props.topMessageDays, () => {
  createDailyChart()
}, { deep: true })

onMounted(() => {
  createDailyChart()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

// Emit search event with the selected date
function emitSearchDate() {
  if (selectedDay.value) {
    const dateString = formatDate(selectedDay.value.date)
    emit('search-date', {
      date: selectedDay.value.date,
      dateString: dateString,
      count: selectedDay.value.count
    })
    console.log('Emitting search for:', dateString)
  }
}
</script>

<style scoped>
/* Pulse animation for top message days */
@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 0.6;
  }

  50% {
    transform: scale(1.2);
    opacity: 0.3;
  }

  100% {
    transform: scale(1);
    opacity: 0.6;
  }
}

:deep(.pulse-circle) {
  animation: pulse 2s infinite ease-in-out;
}

/* Different animation timing for each circle to create a wave effect */
:deep(.pulse-circle:nth-child(3n+1)) {
  animation-delay: 0s;
}

:deep(.pulse-circle:nth-child(3n+2)) {
  animation-delay: 0.6s;
}

:deep(.pulse-circle:nth-child(3n+3)) {
  animation-delay: 1.2s;
}
</style>