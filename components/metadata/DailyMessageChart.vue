<template>
  <div class="feltron-card p-6 rounded-lg">
    <div class="flex justify-between items-center mb-4">
      <div class="text-white text-2xl">{{ formatNumber(totalMessages || 0) }} total messages</div>
    </div>
    <div v-if="!messagesPerDay || messagesPerDay.length === 0"
      class="w-full h-64 flex items-center justify-center text-gray-400">
      No message data available
    </div>
    <div v-else ref="chartContainer" class="w-full h-64"></div>
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
    required: true,
    default: () => []
  },
  totalMessages: {
    type: Number,
    required: true,
    default: 0
  }
})

const emit = defineEmits(['search-date'])

const chartContainer = ref(null)
const selectedDay = ref(null)
let chart = null

// Format numbers in a nice way (1k, 15k, etc.)
function formatNumber(value) {
  if (!value) return '0'
  return d3.format('.2~s')(value)
    .replace('k', 'K')
    .replace('M', 'M')
    .replace('G', 'B')
    .replace('.0', '')
}

// Format date in a readable way
function formatDate(dateStr) {
  if (!dateStr) return ''
  return dateStr // Keep as YYYY-MM-DD
}

// Format date for display (M/D)
function formatShortDate(dateStr) {
  if (!dateStr) return ''
  const [year, month, day] = dateStr.split('-')
  return `${parseInt(month)}/${parseInt(day)}`
}

// Create the daily message count chart
function createDailyChart() {
  if (!chartContainer.value) return
  if (!props.messagesPerDay || !Array.isArray(props.messagesPerDay) || props.messagesPerDay.length === 0) {
    return
  }

  try {
    // Debug date parsing
    console.log('=== Chart Date Debug ===')
    console.log('Sample dates:', props.messagesPerDay.slice(0, 2))

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
      .domain([0, d3.max(data, d => d.count) * 1.1 || 10])
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
      .attr('fill', 'rgba(255, 255, 255, 0.5)')
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        selectedDay.value = d
      })

    chart = svg
  } catch (err) {
    console.error('Error creating daily chart:', err)
    d3.select(chartContainer.value).selectAll('*').remove()
    d3.select(chartContainer.value)
      .append('div')
      .attr('class', 'w-full h-full flex items-center justify-center text-gray-400')
      .text('Error rendering chart')
  }
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