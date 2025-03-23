<template>
  <div class="w-full">
    <!-- Controls and Info Bar -->
    <div class="flex flex-wrap items-center justify-between mb-4 gap-2">
      <div class="text-white">
        <div v-if="topSenders.length > 0" class="text-sm">
          <span class="text-gray-400">Top contributor:</span>
          <span class="font-medium ml-1">{{ topSenders[0].name }}</span>
        </div>
      </div>
      
      <div class="flex space-x-3">
        <button @click="streamLayout = 'wiggle'" 
          class="px-2 py-1 rounded text-sm transition-colors"
          :class="streamLayout === 'wiggle' ? 'bg-blue-800/50 text-blue-300' : 'text-gray-400 hover:text-white'">
          Stream
        </button>
        <button @click="streamLayout = 'stack'" 
          class="px-2 py-1 rounded text-sm transition-colors"
          :class="streamLayout === 'stack' ? 'bg-blue-800/50 text-blue-300' : 'text-gray-400 hover:text-white'">
          Stacked
        </button>
        <button @click="streamLayout = 'fill'" 
          class="px-2 py-1 rounded text-sm transition-colors"
          :class="streamLayout === 'fill' ? 'bg-blue-800/50 text-blue-300' : 'text-gray-400 hover:text-white'">
          Percentage
        </button>
      </div>
    </div>

    <!-- Chart Area -->
    <div class="w-full space-y-4">
      <!-- The Stream Graph -->
      <div ref="streamContainer" class="w-full h-[280px] sm:h-[380px] lg:h-[450px]"></div>
      
      <!-- Layout Explanation Text -->
      <div class="text-xs text-gray-400 text-center">
        {{ layoutExplanation }}
      </div>
      
      <!-- Legend (Below on Mobile, Side on Desktop) -->
      <div class="mt-4">
        <div class="text-sm text-gray-200 mb-2 flex justify-between items-center">
          <div>Top Contributors</div>
          <div class="text-xs text-gray-400">{{ legendItems.length }} senders total</div>
        </div>
        
        <!-- Grid Layout for Legend Items -->
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          <div v-for="item in legendItems.slice(0, 24)" :key="item.name" 
            :class="['flex items-center justify-between p-2 rounded cursor-pointer transition-colors',
            streamGraphHighlightedSender === item.name ? 'bg-gray-800' : 'hover:bg-gray-800/50']" 
            @mouseover="onHighlightSender(item.name)"
            @mouseout="onClearHighlight" 
            :data-sender="item.name">
            <div class="flex items-center overflow-hidden mr-2">
              <div class="w-3 h-3 rounded-full mr-2 flex-shrink-0"
                :style="{ backgroundColor: getSenderColor(item.name) }"></div>
              <div class="text-white text-sm truncate max-w-[160px]">{{ item.name }}</div>
            </div>
            <div class="text-gray-400 text-xs whitespace-nowrap">{{ formatNumber(item.volume) }}</div>
          </div>
        </div>
        
        <!-- Show More Toggle -->
        <div v-if="legendItems.length > 24" class="text-center mt-3">
          <button class="text-blue-400 hover:text-blue-300 text-sm flex items-center justify-center mx-auto"
            @click="showAllLegend = !showAllLegend">
            {{ showAllLegend ? 'Show Less' : 'Show All Contributors' }}
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor"
              :class="{ 'transform rotate-180': showAllLegend }">
              <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
          
          <!-- Expanded Legend -->
          <div v-if="showAllLegend" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mt-3">
            <div v-for="item in legendItems.slice(24)" :key="item.name" 
              :class="['flex items-center justify-between p-2 rounded cursor-pointer transition-colors',
              streamGraphHighlightedSender === item.name ? 'bg-gray-800' : 'hover:bg-gray-800/50']" 
              @mouseover="onHighlightSender(item.name)"
              @mouseout="onClearHighlight" 
              :data-sender="item.name">
              <div class="flex items-center overflow-hidden mr-2">
                <div class="w-3 h-3 rounded-full mr-2 flex-shrink-0"
                  :style="{ backgroundColor: getSenderColor(item.name) }"></div>
                <div class="text-white text-sm truncate max-w-[160px]">{{ item.name }}</div>
              </div>
              <div class="text-gray-400 text-xs whitespace-nowrap">{{ formatNumber(item.volume) }}</div>
            </div>
          </div>
        </div>
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
const { width, height } = useElementSize(streamContainer)
const streamLayout = ref('wiggle') // 'wiggle' for streamgraph, 'stack' for stacked, 'fill' for normalized
let streamChart = null
const colorMap = useColorMap()
const streamGraphHighlightedSender = ref(null)
const showAllLegend = ref(false)

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
  if (!streamContainer.value) return

  // Find the element by data-sender attribute
  const streamElement = streamContainer.value.querySelector(`[data-sender="${senderName}"]`)
  if (!streamElement) return

  // Get positions for calculation
  const containerRect = streamContainer.value.getBoundingClientRect()
  const itemRect = streamElement.getBoundingClientRect()

  // Calculate the scroll position manually instead of using scrollIntoView
  const scrollTop = streamContainer.value.scrollTop + (itemRect.top - containerRect.top) - containerRect.height / 2 + itemRect.height / 2

  // Apply scroll within the container only
  streamContainer.value.scrollTop = Math.max(0, scrollTop)
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
    return 'Stream view highlights changes in messaging patterns over time'
  } else if (streamLayout.value === 'stack') {
    return 'Stacked view shows the total message volume by sender over time'
  } else {
    return 'Percentage view shows relative contribution of each sender'
  }
})
</script>

<style scoped>
/* Remove unnecessary height classes */
</style>