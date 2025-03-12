<template>
  <div class="feltron-card p-6 rounded-lg">
    <div class="feltron-title mb-2">Message Volume by Sender</div>
    <div class="flex items-center justify-between mb-4">
      <div class="text-white text-sm">
        <span class="text-gray-400">Top sender:</span>
        {{ topSenders.length > 0 ? topSenders[0].name : 'Unknown' }}
      </div>
      <div class="flex space-x-4">
        <button @click="streamLayout = 'wiggle'" :class="streamLayout === 'wiggle' ? 'text-blue-400' : 'text-gray-400'"
          class="text-xs uppercase tracking-wider hover:text-blue-300 transition-colors">
          Stream
        </button>
        <button @click="streamLayout = 'stack'" :class="streamLayout === 'stack' ? 'text-blue-400' : 'text-gray-400'"
          class="text-xs uppercase tracking-wider hover:text-blue-300 transition-colors">
          Stacked
        </button>
        <button @click="streamLayout = 'fill'" :class="streamLayout === 'fill' ? 'text-blue-400' : 'text-gray-400'"
          class="text-xs uppercase tracking-wider hover:text-blue-300 transition-colors">
          Fill
        </button>
      </div>
    </div>
    <div class="flex flex-col md:flex-row">
      <div ref="streamContainer" class="w-full md:w-3/4 h-120 relative"></div>
      <div ref="legendContainer"
        class="w-full md:w-1/4 h-60 md:h-120 overflow-y-auto custom-scrollbar md:pl-2 mt-4 md:mt-0 relative isolate">
        <div
          class="text-xs text-gray-400 mb-2 uppercase tracking-wider flex justify-between sticky top-0 bg-gray-900 p-1 z-10">
          <span>Senders</span>
          <span>Messages</span>
        </div>
        <div v-if="legendItems.length" class="space-y-1">
          <div v-for="item in legendItems" :key="item.name" :class="['flex items-center justify-between p-1 rounded cursor-pointer transition-colors hover:bg-gray-800',
            streamGraphHighlightedSender === item.name ? 'bg-gray-700' : '']" @mouseover="onHighlightSender(item.name)"
            @mouseout="onClearHighlight" :data-sender="item.name">
            <div class="flex items-center overflow-hidden">
              <div class="w-3 h-3 rounded-full mr-2 flex-shrink-0"
                :style="{ backgroundColor: getSenderColor(item.name) }"></div>
              <div class="text-white text-xs truncate max-w-[120px]">{{ item.name }}</div>
            </div>
            <div class="text-gray-400 text-xs">{{ formatNumber(item.volume) }}</div>
          </div>
        </div>
        <div v-if="legendItems.length" class="text-xs text-gray-400 mt-2 sticky bottom-0 bg-gray-900 p-1">
          {{ legendItems.length }} senders total
        </div>
      </div>
    </div>
    <div class="flex justify-end mt-2">
      <div class="text-xs text-gray-400">
        {{ layoutExplanation }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useElementSize } from '@vueuse/core'
import * as d3 from 'd3'
import { useColorMap } from '~/composables/useColorMap'

const props = defineProps({
  messagesBySender: {
    type: Array,
    required: true
  },
  topSenders: {
    type: Array,
    required: true
  },
  highlightedSender: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['highlight-sender', 'clear-highlight'])

const streamContainer = ref(null)
const legendContainer = ref(null)
const { width, height } = useElementSize(streamContainer)
const streamLayout = ref('wiggle') // 'wiggle' for streamgraph, 'stack' for stacked, 'fill' for normalized
let streamChart = null
const colorMap = useColorMap()
const streamGraphHighlightedSender = ref(null)
let pathElements = [] // Store references to path elements

// Watch for external highlighting changes
watch(() => props.highlightedSender, (newValue) => {
  if (newValue) {
    applyHighlight(newValue)
  } else {
    clearHighlight()
  }
})

// Extract all sender names from the data
const allSenders = computed(() => {
  if (!props.messagesBySender.length) return []
  return Object.keys(props.messagesBySender[0])
    .filter(key => key !== 'date')
})

// Create legend items with sender names
const legendItems = computed(() => {
  if (!props.messagesBySender.length) return []

  // Calculate total volume for each sender
  const senderVolumes = {}

  // Get all senders
  const senders = Object.keys(props.messagesBySender[0]).filter(key => key !== 'date')

  // Calculate total volume for each sender across all time periods
  senders.forEach(sender => {
    senderVolumes[sender] = d3.sum(props.messagesBySender, d => d[sender] || 0)
  })

  // Sort senders by volume (largest to smallest)
  const sortedSenders = senders.sort((a, b) => senderVolumes[b] - senderVolumes[a])

  // Create legend items with sorted senders
  return sortedSenders.map(name => ({
    name,
    color: colorMap.getSenderColor(name),
    volume: senderVolumes[name]
  }))
})

// Get color for a sender
function getSenderColor(senderName) {
  return colorMap.getSenderColor(senderName)
}

// Highlight a specific sender
function onHighlightSender(senderName) {
  streamGraphHighlightedSender.value = senderName
  emit('highlight-sender', senderName)
  applyHighlight(senderName)
  scrollToSender(senderName)
}

// Apply highlight to the chart
function applyHighlight(senderName) {
  if (streamChart) {
    streamChart.selectAll('path')
      .attr('opacity', d => d.key === senderName ? 1 : 0.2)
      .attr('stroke', d => d.key === senderName ? '#fff' : 'none')
      .attr('stroke-width', d => d.key === senderName ? 0.5 : 0)
  }
}

// Clear highlight
function onClearHighlight() {
  streamGraphHighlightedSender.value = null
  emit('highlight-sender', null)
  clearHighlight()
}

// Clear highlight in the chart
function clearHighlight() {
  if (streamChart) {
    streamChart.selectAll('path')
      .attr('opacity', 0.8)
      .attr('stroke', 'none')
  }
}

// Scroll the legend to a specific sender - contained within the legend box
function scrollToSender(senderName) {
  if (!legendContainer.value) return

  // Find the element by data-sender attribute
  const legendItem = legendContainer.value.querySelector(`[data-sender="${senderName}"]`)
  if (!legendItem) return

  // Get positions for calculation
  const containerRect = legendContainer.value.getBoundingClientRect()
  const itemRect = legendItem.getBoundingClientRect()

  // Calculate the scroll position manually instead of using scrollIntoView
  const scrollTop = legendContainer.value.scrollTop + (itemRect.top - containerRect.top) - containerRect.height / 2 + itemRect.height / 2

  // Apply scroll within the container only
  legendContainer.value.scrollTop = Math.max(0, scrollTop)
}

// Format numbers in a nice way (1k, 15k, etc.)
function formatNumber(value) {
  return d3.format('.2~s')(value)
    .replace('k', 'K')
    .replace('M', 'M')
    .replace('G', 'B')
    .replace('.0', '')
}

// Create the streamgraph
function createStreamgraph() {
  if (!streamContainer.value || !props.messagesBySender.length) return

  // Clear any existing chart
  d3.select(streamContainer.value).selectAll('*').remove()

  const data = props.messagesBySender
  const container = streamContainer.value
  const containerWidth = width.value
  const containerHeight = height.value
  const margin = { top: 20, right: 10, bottom: 30, left: streamLayout.value === 'stack' ? 50 : 40 }
  const innerWidth = containerWidth - margin.left - margin.right
  const innerHeight = containerHeight - margin.top - margin.bottom

  // Create SVG
  const svg = d3.select(container)
    .append('svg')
    .attr('width', containerWidth)
    .attr('height', containerHeight)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  // Get the list of senders (keys)
  const keys = Object.keys(data[0]).filter(key => key !== 'date')

  // Use the same color mapping as in index.vue
  const color = d => colorMap.getSenderColor(d)

  // X scale
  const x = d3.scaleTime()
    .domain(d3.extent(data, d => d.date))
    .range([0, innerWidth])

  // Stack the data with appropriate offset based on layout
  const stack = d3.stack()
    .keys(keys)
    .offset(
      streamLayout.value === 'wiggle' ? d3.stackOffsetWiggle :
        streamLayout.value === 'fill' ? d3.stackOffsetExpand :
          d3.stackOffsetNone
    )
    .order(
      streamLayout.value === 'wiggle' ? d3.stackOrderNone :
        d3.stackOrderReverse
    )

  const series = stack(data)

  // Y scale
  const y = d3.scaleLinear()
    .domain(
      streamLayout.value === 'wiggle'
        ? [d3.min(series, d => d3.min(d, d => d[0])), d3.max(series, d => d3.max(d, d => d[1]))]
        : streamLayout.value === 'fill'
          ? [0, 1] // For fill mode, domain is always 0 to 1
          : [0, d3.max(series, d => d3.max(d, d => d[1]))]
    )
    .range([innerHeight, 0])
    .nice()

  // Add X axis
  svg.append('g')
    .attr('transform', `translate(0,${innerHeight})`)
    .call(d3.axisBottom(x).ticks(5).tickFormat(d3.timeFormat('%b %Y')))
    .attr('color', 'rgba(156, 163, 175, 0.6)')
    .selectAll('text')
    .style('text-anchor', 'middle')
    .attr('fill', 'rgba(156, 163, 175, 0.8)')
    .attr('font-size', '10px')

  // Add Y axis for stacked and fill layouts
  if (streamLayout.value === 'stack' || streamLayout.value === 'fill') {
    const yAxis = d3.axisLeft(y).ticks(5)

    // For fill mode, use percentage format
    if (streamLayout.value === 'fill') {
      yAxis.tickFormat(d => d3.format('.0%')(d))
    } else {
      yAxis.tickFormat(formatNumber)
    }

    svg.append('g')
      .call(yAxis)
      .attr('color', 'rgba(156, 163, 175, 0.6)')
      .selectAll('text')
      .attr('fill', 'rgba(156, 163, 175, 0.8)')
      .attr('font-size', '10px')
  }

  // Create the area generator
  const area = d3.area()
    .x(d => x(d.data.date))
    .y0(d => y(d[0]))
    .y1(d => y(d[1]))
    .curve(d3.curveBasis)

  // Add the areas
  const paths = svg.selectAll('path')
    .data(series)
    .join('path')
    .attr('d', area)
    .attr('fill', ({ key }) => color(key))
    .attr('opacity', 0.8)
    .attr('data-sender', ({ key }) => key)
    .style('cursor', 'pointer')
    .on('mouseover', function (event, d) {
      // Set highlighted sender and apply visual changes
      streamGraphHighlightedSender.value = d.key
      emit('highlight-sender', d.key)

      // First apply the highlight
      applyHighlight(d.key)

      // Then scroll to the sender with a slight delay to ensure rendering
      setTimeout(() => scrollToSender(d.key), 10)
    })
    .on('mouseout', function () {
      onClearHighlight()
    })

  // Save reference to chart for cleanup
  streamChart = svg

  // Apply highlight if there's an active one
  if (props.highlightedSender) {
    applyHighlight(props.highlightedSender)
  }
}

// Watch for layout changes
watch(streamLayout, () => {
  createStreamgraph()
})

// Watch for size changes using VueUse's useElementSize
watch([width, height], () => {
  createStreamgraph()
})

watch(() => props.messagesBySender, () => {
  createStreamgraph()
}, { deep: true })

onMounted(() => {
  createStreamgraph()
})

// Update the explanation text at the bottom
const layoutExplanation = computed(() => {
  if (streamLayout.value === 'wiggle') {
    return 'Stream view shows relative changes'
  } else if (streamLayout.value === 'stack') {
    return 'Stacked view shows absolute counts'
  } else {
    return 'Fill view shows proportional distribution'
  }
})
</script>

<style scoped>
.h-120 {
  height: 30rem;
  /* 480px */
}

.h-60 {
  height: 15rem;
  /* 240px */
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(31, 41, 55, 0.5);
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(75, 85, 99, 0.7);
  border-radius: 3px;
}
</style>