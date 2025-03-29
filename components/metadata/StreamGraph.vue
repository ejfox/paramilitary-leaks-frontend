<template>
  <div class="w-full">
    <!-- No Data Placeholder -->
    <div v-if="!hasData" class="text-center py-12 text-gray-400 border border-gray-700/30 rounded">
      <div>No message data available for stream graph visualization</div>
      <div class="text-sm mt-2">Try adjusting your filters or loading a different dataset</div>
    </div>

    <div v-else>
      <!-- Controls and Info Bar -->
      <div class="flex flex-wrap items-center justify-between mb-4 gap-2">
        <div class="text-white">
          <div v-if="topSenders.length > 0" class="text-sm">
            <span class="text-gray-400">Top contributor:</span>
            <span class="font-medium ml-1">{{ topSenders[0].name }}</span>
          </div>
        </div>

        <div class="flex space-x-3">
          <button @click="streamLayout = 'wiggle'" class="px-2 py-1 rounded text-sm transition-colors"
            :class="streamLayout === 'wiggle' ? 'bg-blue-800/50 text-blue-300' : 'text-gray-400 hover:text-white'">
            Stream
          </button>
          <button @click="streamLayout = 'stack'" class="px-2 py-1 rounded text-sm transition-colors"
            :class="streamLayout === 'stack' ? 'bg-blue-800/50 text-blue-300' : 'text-gray-400 hover:text-white'">
            Stacked
          </button>
          <button @click="streamLayout = 'fill'" class="px-2 py-1 rounded text-sm transition-colors"
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

        <!-- Legend -->
        <div class="mt-4">
          <div class="text-sm text-gray-200 mb-2 flex justify-between items-center">
            <div>Top Contributors</div>
            <div class="text-xs text-gray-400">{{ totalSenders }} senders total</div>
          </div>

          <!-- Grid Layout for Top Legend Items -->
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            <div v-for="item in visibleLegendItems" :key="item.name" :class="['flex items-center justify-between p-2 rounded cursor-pointer transition-colors',
              streamGraphHighlightedSender === item.name ? 'bg-gray-800' : 'hover:bg-gray-800/50']"
              @mouseover="onHighlightSender(item.name)" @mouseout="onClearHighlight" :data-sender="item.name">
              <div class="flex items-center overflow-hidden mr-2">
                <div class="w-3 h-3 rounded-full mr-2 flex-shrink-0"
                  :style="{ backgroundColor: getSenderColor(item.name) }"></div>
                <div class="text-white text-sm truncate max-w-[160px]">{{ item.name }}</div>
              </div>
              <div class="text-gray-400 text-xs whitespace-nowrap">{{ formatNumber(item.volume) }}</div>
            </div>
          </div>

          <!-- Show More Toggle -->
          <div v-if="props.topSenders.length > showCount" class="text-center mt-3">
            <button class="text-blue-400 hover:text-blue-300 text-sm flex items-center justify-center mx-auto"
              @click="showAllLegend = !showAllLegend">
              {{ showAllLegend ? 'Show Less' : `Show All Contributors (${props.topSenders.length})` }}
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor"
                :class="{ 'transform rotate-180': showAllLegend }">
                <path fill-rule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clip-rule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Time Scrubber (Desktop Only) -->
      <div class="hidden md:block mt-6">
        <div class="bg-gray-800/50 rounded p-2 border border-gray-700/50">
          <div class="text-gray-300 text-xs mb-2">Time Range</div>
          <div ref="brushContainer" class="w-full h-[40px]"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed, shallowRef, onBeforeUnmount } from 'vue'
import { useElementSize } from '@vueuse/core'
import * as d3 from 'd3'
import { useColorMap } from '~/composables/useColorMap'
import { format } from 'date-fns'

const props = defineProps({
  messagesBySender: {
    type: Array,
    required: true,
    default: () => []
  },
  topSenders: {
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

const streamContainer = ref(null)
const brushContainer = ref(null)
const { width, height } = useElementSize(streamContainer)
const streamLayout = ref('wiggle') // 'wiggle' for streamgraph, 'stack' for stacked, 'fill' for normalized
const streamChart = shallowRef(null)
const colorMap = useColorMap()
const streamGraphHighlightedSender = ref(null)
const totalSenders = computed(() => props.topSenders.length)
const showAllLegend = ref(false)
const showCount = 12  // Number of senders to show when collapsed

// Check if we have valid data to display
const hasData = computed(() => {
  return props.messagesBySender?.length > 0 && props.topSenders?.length > 0
})

// Visible legend items (expanded or collapsed based on showAllLegend)
const visibleLegendItems = computed(() => {
  if (!props.topSenders?.length) return []

  // Use pre-sorted topSenders array
  const count = showAllLegend.value ? props.topSenders.length : showCount
  return props.topSenders.slice(0, count).map(sender => ({
    name: sender.name || 'Unknown',
    color: colorMap.getSenderColor(sender.name),
    volume: sender.count || 0 // Default to 0 if count is undefined
  }))
})

// Filtered data (may be filtered by time brush in the future)
const filteredData = computed(() => {
  return props.messagesBySender || []
})

// Watch for external highlighting changes
watch(() => props.highlightedSender, (newValue) => {
  if (newValue) {
    applyHighlight(newValue)
  } else {
    clearHighlight()
  }
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
}

// Apply highlight to the chart
function applyHighlight(senderName) {
  if (streamChart.value) {
    streamChart.value.selectAll('path')
      .attr('opacity', d => {
        // Safely check if d exists and has a key property
        return d && typeof d === 'object' && d.key === senderName ? 1 : 0.2;
      })
      .attr('stroke', d => {
        return d && typeof d === 'object' && d.key === senderName ? '#fff' : 'none';
      })
      .attr('stroke-width', d => {
        return d && typeof d === 'object' && d.key === senderName ? 0.5 : 0;
      })
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
  if (streamChart.value) {
    streamChart.value.selectAll('path')
      .attr('opacity', 0.8)
      .attr('stroke', 'none')
  }
}

// Format numbers in a nice way (1k, 15k, etc.)
function formatNumber(value) {
  if (value === undefined || value === null || isNaN(value)) {
    return '0';
  }
  return d3.format('.2~s')(value)
    .replace('k', 'K')
    .replace('M', 'M')
    .replace('G', 'B')
    .replace('.0', '')
}

// Create the streamgraph visualization
function createStreamgraph() {
  if (!streamContainer.value || !filteredData.value?.length || !hasData.value) {
    console.log('Cannot create streamgraph: missing container or data')
    return
  }

  try {
    // Clear any existing chart
    d3.select(streamContainer.value).selectAll('*').remove()

    const data = filteredData.value
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

    // Validate we have proper object data with dates
    if (!data[0]?.date) {
      console.error('Invalid data format for streamgraph')
      return
    }

    // Get the list of senders (keys)
    // Use top 50 senders for more detailed visualization while maintaining performance
    const topSenderNames = props.topSenders.slice(0, Math.min(50, props.topSenders.length)).map(s => s.name)
    const keys = Object.keys(data[0])
      .filter(key => key !== 'date' && topSenderNames.includes(key))

    // If we don't have any keys, don't attempt to create the visualization
    if (keys.length === 0) {
      console.log('No valid keys for streamgraph')
      return
    }

    // Use color mapping
    const color = d => colorMap.getSenderColor(d)

    // X scale
    const x = d3.scaleTime()
      .domain(d3.extent(data, d => d.date))
      .range([0, innerWidth])

    // Stack the data with appropriate offset based on layout
    const stack = d3.stack()
      .keys(keys)
      .offset(
        streamLayout.value === 'wiggle' ? d3.stackOffsetSilhouette :
          streamLayout.value === 'fill' ? d3.stackOffsetExpand :
            d3.stackOffsetNone
      )
      .order(d3.stackOrderNone)

    // Create the stacked data
    const series = stack(data)

    // Y scale - dynamic based on layout
    const y = streamLayout.value === 'fill'
      ? d3.scaleLinear()
        .domain([0, 1])
        .range([innerHeight, 0])
      : d3.scaleLinear()
        .domain([
          d3.min(series, layer => d3.min(layer, d => d[0])),
          d3.max(series, layer => d3.max(layer, d => d[1]))
        ])
        .range([innerHeight, 0])
        .nice()

    // Create the area generator
    const area = d3.area()
      .x(d => x(d.data.date))
      .y0(d => y(d[0]))
      .y1(d => y(d[1]))
      .curve(d3.curveBasis)

    // Add the areas
    streamChart.value = svg.selectAll('path')
      .data(series)
      .join('path')
      .attr('d', area)
      .attr('fill', ({ key }) => color(key))
      .attr('opacity', 0.8)
      .attr('stroke', 'none')
      .attr('stroke-width', 0)

    // Add x-axis
    const xAxis = d3.axisBottom(x)
      .ticks(d3.timeMonth.every(4))
      .tickFormat(d => format(d, 'MMM-yy'))

    svg.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .attr('class', 'x-axis')
      .call(xAxis)
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick line').attr('stroke', '#374151'))
      .call(g => g.selectAll('.tick text').attr('fill', '#9CA3AF'))

    // Add y-axis for stacked layout only
    if (streamLayout.value === 'stack') {
      const yAxis = d3.axisLeft(y)
        .ticks(5)
        .tickFormat(d3.format('~s'))

      svg.append('g')
        .attr('class', 'y-axis')
        .call(yAxis)
        .call(g => g.select('.domain').remove())
        .call(g => g.selectAll('.tick line')
          .attr('x2', innerWidth)
          .attr('stroke', '#374151')
          .attr('stroke-dasharray', '2,2'))
        .call(g => g.selectAll('.tick text').attr('fill', '#9CA3AF'))
    }

    // Create tooltip
    const tooltip = d3.select('body').append('div')
      .attr('class', 'tooltip')
      .style('position', 'absolute')
      .style('padding', '8px')
      .style('background', 'rgba(15, 23, 42, 0.9)')
      .style('color', 'white')
      .style('border-radius', '4px')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('opacity', 0)
      .style('z-index', 1000)
      .style('max-width', '300px')
      .style('box-shadow', '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)')

    // Add interaction overlay for date display
    const overlay = svg.append('rect')
      .attr('class', 'overlay')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('opacity', 0)
      .attr('cursor', 'crosshair')

    // Add vertical date indicator line
    const focusLine = svg.append('line')
      .attr('class', 'focus-line')
      .attr('stroke', 'rgba(255, 255, 255, 0.2)')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,3')
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .style('opacity', 0)

    // Add date label at bottom
    const dateLabel = svg.append('text')
      .attr('class', 'date-label')
      .attr('text-anchor', 'middle')
      .attr('fill', 'rgba(255, 255, 255, 0.7)')
      .attr('font-size', '10px')
      .attr('y', innerHeight + 16)
      .style('opacity', 0)

    // Add the areas with better interaction
    svg.selectAll('path.stream-area')
      .attr('data-sender', ({ key }) => key)
      .style('cursor', 'pointer')
      .on('mouseover', function (event, d) {
        // Set highlighted sender and apply visual changes
        streamGraphHighlightedSender.value = d.key
        emit('highlight-sender', d.key)
        applyHighlight(d.key)

        // Show tooltip
        tooltip.transition()
          .duration(200)
          .style('opacity', 0.9)

        // Get date from the closest point to mouse
        const mouseX = d3.pointer(event)[0]
        const dateAtX = x.invert(mouseX)

        // Find the data point closest to this date
        const bisectDate = d3.bisector(d => d.date).left
        const index = bisectDate(data, dateAtX)
        const dataPoint = data[index]

        if (dataPoint) {
          const value = dataPoint[d.key] || 0
          const date = format(dataPoint.date, 'MMM d, yyyy')
          let context = '';

          // If sender has more than average messages, add a note
          const avgMessages = d3.mean(data, dp => dp[d.key] || 0)
          if (value > avgMessages * 1.5) {
            context = `<div class="text-xs mt-1 text-green-300">Above average activity</div>`
          }

          // Create informative tooltip
          tooltip.html(`
            <div class="font-medium">${d.key}</div>
            <div>${date}</div>
            <div>${formatNumber(value)} messages</div>
            ${context}
          `)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 28) + 'px')
        }
      })
      .on('mousemove', function (event) {
        // Move tooltip with mouse
        tooltip.style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 28) + 'px')
      })
      .on('mouseout', function () {
        onClearHighlight()
        // Hide tooltip
        tooltip.transition()
          .duration(500)
          .style('opacity', 0)
      })

    // Add hover interaction for date display
    overlay
      .on('mouseover', function () {
        focusLine.style('opacity', 1)
        dateLabel.style('opacity', 1)
      })
      .on('mouseout', function () {
        focusLine.style('opacity', 0)
        dateLabel.style('opacity', 0)
      })
      .on('mousemove', function (event) {
        const mouseX = d3.pointer(event)[0]
        const date = x.invert(mouseX)

        // Position the focus line
        focusLine.attr('x1', mouseX).attr('x2', mouseX)

        // Update the date label
        dateLabel
          .attr('x', mouseX)
          .text(format(date, 'MMM d, yyyy'))
      })

    // Save reference to chart for cleanup
    streamChart.value = svg

    // Apply highlight if there's an active one
    if (props.highlightedSender) {
      applyHighlight(props.highlightedSender)
    }

    // Clean up on unmount
    onBeforeUnmount(() => {
      if (tooltip) tooltip.remove()
    })

    // When setting rectangle dimensions, ensure they're never negative
    svg.selectAll('rect')
      .attr('x', d => Math.max(0, x(d.startDate)))
      .attr('width', d => Math.max(0, x(d.endDate) - x(d.startDate)))
      .attr('y', d => Math.max(0, y(d.value)))
      .attr('height', d => Math.max(0, y(0) - y(d.value)))
      .attr('fill', d => d.color);
  } catch (error) {
    console.error('Error creating streamgraph:', error)
  }
}

// Create the brush for time scrubbing
function createBrush() {
  if (!brushContainer.value || !props.messagesBySender.length) return

  // Clear any existing chart
  d3.select(brushContainer.value).selectAll('*').remove()

  const data = props.messagesBySender
  const container = brushContainer.value
  const containerWidth = brushContainer.value.clientWidth
  const containerHeight = brushContainer.value.clientHeight
  const margin = { top: 0, right: 10, bottom: 0, left: 10 }
  const innerWidth = containerWidth - margin.left - margin.right
  const innerHeight = containerHeight - margin.top - margin.bottom

  // Simple time series visualization for brush
  const svg = d3.select(container)
    .append('svg')
    .attr('width', containerWidth)
    .attr('height', containerHeight)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  // X scale for the time dimension
  const x = d3.scaleTime()
    .domain(d3.extent(data, d => d.date))
    .range([0, innerWidth])

  // Aggregate data by date for the overview
  const aggregated = d3.rollups(
    data,
    v => d3.sum(v, d => {
      // Sum all message counts across all senders
      return Object.keys(d)
        .filter(key => key !== 'date')
        .reduce((acc, key) => acc + (d[key] || 0), 0)
    }),
    d => d.date
  ).map(([date, count]) => ({ date, count }))

  // Y scale for aggregate counts
  const y = d3.scaleLinear()
    .domain([0, d3.max(aggregated, d => d.count)])
    .range([innerHeight, 0])

  // Create area chart for the brush display
  const area = d3.area()
    .x(d => x(d.date))
    .y0(innerHeight)
    .y1(d => y(d.count))
    .curve(d3.curveBasis)

  // Add the area path
  svg.append('path')
    .datum(aggregated)
    .attr('fill', 'rgba(59, 130, 246, 0.2)')
    .attr('stroke', 'rgba(59, 130, 246, 0.5)')
    .attr('stroke-width', 1)
    .attr('d', area)

  // Add X axis
  svg.append('g')
    .attr('transform', `translate(0,${innerHeight})`)
    .call(d3.axisBottom(x)
      .ticks(3)
      .tickSize(0)
      .tickPadding(4)
      .tickFormat(d3.timeFormat('%b %Y')))
    .attr('color', 'rgba(156, 163, 175, 0.6)')
    .selectAll('text')
    .attr('fill', 'rgba(156, 163, 175, 0.8)')
    .attr('font-size', '8px')

  // Remove domain line
  svg.selectAll('.domain').attr('display', 'none')

  // Add brush handles for style
  svg.append('g')
    .attr('class', 'brush-handles')
    .selectAll('rect')
    .data([0, 1])
    .join('rect')
    .attr('x', d => d * innerWidth - 3)
    .attr('y', 0)
    .attr('width', 6)
    .attr('height', innerHeight)
    .attr('fill', 'rgba(59, 130, 246, 0.3)')
    .attr('rx', 2)
    .attr('stroke', 'rgba(59, 130, 246, 0.6)')
    .attr('stroke-width', 1)
}

// Watch for layout changes
watch(streamLayout, () => {
  createStreamgraph()
})

// Watch for size changes using VueUse's useElementSize
watch([width, height], () => {
  createStreamgraph()
  createBrush()
})

// Watch for data changes
watch(() => props.messagesBySender, () => {
  createStreamgraph()
  createBrush()
}, { deep: true })

onMounted(() => {
  createStreamgraph()
  createBrush()
})

// Update the explanation text at the bottom based on layout
const layoutExplanation = computed(() => {
  switch (streamLayout.value) {
    case 'wiggle':
      return 'Stream view emphasizes patterns and trends over time'
    case 'stack':
      return 'Stacked view shows absolute message volumes'
    case 'fill':
      return 'Percentage view shows relative contributions'
    default:
      return ''
  }
})
</script>

<style scoped>
.tooltip {
  background-color: rgba(15, 23, 42, 0.9);
  transition: opacity 0.2s;
}
</style>