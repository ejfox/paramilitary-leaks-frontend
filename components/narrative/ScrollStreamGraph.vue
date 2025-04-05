<template>
  <!-- Super simple: a tall container for scrolling with fixed positioning -->
  <div ref="scrollContainer" class="w-full" style="height: 920vh;">
    <!-- The fixed container that stays in place during scroll -->
    <div ref="fixedContainer" class="fixed top-0 left-0 w-full h-screen flex items-center justify-center bg-black"
      :style="{ opacity: isVisible ? 1 : 0 }" style="transition: opacity 0.3s ease;">
      <!-- The SVG for the StreamGraph -->
      <div ref="streamContainer" class="w-full h-full"></div>

      <!-- Simple progress indicator -->
      <div class="absolute bottom-0 left-0 right-0 h-2 bg-gray-800">
        <div class="h-full bg-blue-500" :style="{ width: `${scrollProgress * 100}%` }"></div>
      </div>

      <!-- Very simple title -->
      <div class="absolute top-6 left-0 right-0 text-center">
        <h3 class="text-2xl text-white font-bold">Communication Patterns Over Time</h3>
        <p class="text-gray-400 mt-2">Scroll to reveal more data</p>
      </div>

      <!-- Legend for top 5 senders -->
      <div ref="legendContainer" class="absolute bottom-10 right-10 bg-black/70 p-4 rounded-lg border border-gray-700">
        <h4 class="text-white text-sm font-bold mb-2">Top 5 Senders</h4>
        <div class="space-y-2">
          <div v-for="(sender, index) in top5Senders" :key="index" class="flex items-center">
            <div class="w-4 h-4 mr-2" :style="{ backgroundColor: sender.color }"></div>
            <div class="text-white text-sm flex-1">{{ truncateName(sender.name, 20) }}</div>
            <div class="text-gray-300 text-sm font-mono">
              {{ getDisplayCount(sender.displayCount, sender.count) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed, onBeforeUnmount, reactive } from 'vue'
import * as d3 from 'd3'
import { format } from 'date-fns'
import { useColorMap } from '~/composables/useColorMap'

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
  scrollProgress: {
    type: Number,
    default: 0
  }
})

const scrollContainer = ref(null)
const fixedContainer = ref(null)
const streamContainer = ref(null)
const legendContainer = ref(null)
const isVisible = ref(false)
let scrollTimeout = null
const colorMap = useColorMap()

// Store the top 5 senders with animated counts
const top5Senders = ref([])
// Animation interval
let countAnimationInterval = null

const visibleMonths = computed(() => {
  // Start with just 1 month, then add more as you scroll
  const max = props.messagesBySender.length || 0
  // Start with minimal data and reveal even more gradually
  // Using a steeper power curve for an even slower start
  const progress = Math.pow(props.scrollProgress, 2) // Steeper curve for even slower initial reveal
  return Math.max(1, Math.min(max, Math.ceil((0.1 + progress * 0.9) * max)))
})

// Calculate top 5 senders from currently visible data
function calculateTop5Senders() {
  if (!props.messagesBySender?.length) return []

  // Get the visible data slice
  const visibleData = props.messagesBySender.slice(0, visibleMonths.value)

  // Get all sender keys except 'date'
  const senderKeys = Object.keys(visibleData[0] || {}).filter(key => key !== 'date')

  // Calculate total counts for each sender within visible data
  const senderCounts = {}
  senderKeys.forEach(sender => {
    senderCounts[sender] = visibleData.reduce((total, month) => total + (month[sender] || 0), 0)
  })

  // Convert to array, sort, and get top 5
  const sortedSenders = Object.entries(senderCounts)
    .map(([name, count]) => ({
      name,
      count,
      displayCount: 0, // Start at 0 for animation
      color: colorMap.getSenderColor(name)
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  return sortedSenders
}

// Helper to get formatted count for display with animation
function getDisplayCount(displayCount, targetCount) {
  return displayCount.toLocaleString()
}

// Helper to truncate sender names
function truncateName(name, maxLength) {
  if (!name) return '';
  return name.length > maxLength ? name.substring(0, maxLength) + '...' : name;
}

// Animate the count values
function animateCounters() {
  // Clear any existing animation
  if (countAnimationInterval) {
    clearInterval(countAnimationInterval)
  }

  // Get the latest top 5 senders
  const newTop5 = calculateTop5Senders()

  // Prepare the animation by setting initial values
  // If we already have values, keep them as starting points
  if (top5Senders.value.length) {
    newTop5.forEach(sender => {
      const existing = top5Senders.value.find(s => s.name === sender.name)
      if (existing) {
        sender.displayCount = existing.displayCount
      }
    })
  }

  // Update the ref with new data
  top5Senders.value = newTop5

  // Set up animation interval
  countAnimationInterval = setInterval(() => {
    let allDone = true

    // Update each counter
    top5Senders.value.forEach(sender => {
      if (sender.displayCount < sender.count) {
        // Calculate increment - faster for larger numbers
        const increment = Math.max(1, Math.floor((sender.count - sender.displayCount) / 10))
        sender.displayCount = Math.min(sender.count, sender.displayCount + increment)
        allDone = false
      }
    })

    // If all counters have reached their targets, stop the animation
    if (allDone) {
      clearInterval(countAnimationInterval)
      countAnimationInterval = null
    }
  }, 50) // Update every 50ms
}

// Watch for changes in the visibleMonths or dataset to update the graph and legend
watch([() => visibleMonths.value, () => props.messagesBySender], () => {
  if (props.messagesBySender.length > 0) {
    renderStreamGraph()
    animateCounters() // Update and animate the counters
  }
}, { immediate: true })

// Watch scroll progress to ensure visibility at the right times
watch(() => props.scrollProgress, (newProgress) => {
  // Keep the graph visible until we've almost reached the end of the scroll
  isVisible.value = newProgress < 0.95
}, { immediate: true })

// Manual approach to handle fixed positioning visibility with debouncing for performance
function handleScroll() {
  // Clear the timeout if it exists
  if (scrollTimeout) {
    clearTimeout(scrollTimeout)
  }

  // Set a new timeout to debounce the actual checking
  scrollTimeout = setTimeout(() => {
    if (!scrollContainer.value) return

    const rect = scrollContainer.value.getBoundingClientRect()
    const containerTop = rect.top
    const containerBottom = rect.bottom
    const viewportHeight = window.innerHeight

    // Show the fixed element when the container is in view
    // and hide it when scrolled past - but with a more generous criteria
    if (containerBottom > 0 && containerTop < viewportHeight * 1.5) {
      isVisible.value = true
    } else {
      isVisible.value = false
    }
  }, 10) // small delay for better performance
}

// Create and update the streamgraph
function renderStreamGraph() {
  if (!streamContainer.value || !props.messagesBySender?.length) return

  try {
    // Clear any existing SVG
    d3.select(streamContainer.value).selectAll('*').remove()

    const container = streamContainer.value
    const width = container.clientWidth || 800
    const height = container.clientHeight || 600
    const margin = { top: 70, right: 20, bottom: 50, left: 20 }
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

    // Only use the number of months that should be visible
    const visibleData = props.messagesBySender.slice(0, visibleMonths.value)

    // Create SVG
    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Get all sender names except 'date'
    const keys = Object.keys(props.messagesBySender[0] || {})
      .filter(key => key !== 'date')

    // Create scales
    const x = d3.scaleTime()
      .domain(d3.extent(visibleData, d => new Date(d.date)))
      .range([0, innerWidth])

    // Stack the data
    const stack = d3.stack()
      .offset(d3.stackOffsetWiggle) // Creates the streamgraph effect
      .keys(keys)

    const stackedData = stack(visibleData)

    // Create y scale
    const y = d3.scaleLinear()
      .domain([
        d3.min(stackedData, layer => d3.min(layer, d => d[0])),
        d3.max(stackedData, layer => d3.max(layer, d => d[1]))
      ])
      .range([innerHeight, 0])

    // Create the area generator
    const area = d3.area()
      .x(d => x(new Date(d.data.date)))
      .y0(d => y(d[0]))
      .y1(d => y(d[1]))
      .curve(d3.curveBasis) // Smooth curves

    // Add the streamgraph paths
    svg.selectAll("path")
      .data(stackedData)
      .enter()
      .append("path")
      .attr("d", area)
      .style("fill", (d) => colorMap.getSenderColor(d.key))
      .style("opacity", 0.8)

    // Add simple X axis
    svg.append("g")
      .attr("transform", `translate(0,${innerHeight + 10})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(d => format(d, 'MMM yyyy')))
      .selectAll("text")
      .style("fill", "white")

    // Add current visible count
    svg.append("text")
      .attr("class", "months-count")
      .attr("x", innerWidth - 30)
      .attr("y", -30)
      .attr("text-anchor", "end")
      .style("fill", "rgba(255,255,255,0.7)")
      .style("font-size", "14px")
      .text(`${visibleMonths.value} of ${props.messagesBySender.length} months visible`)

    // Define key events to annotate - only show if they're within visible data
    const annotations = [
      {
        date: new Date('2021-07-15'), // Summer 2021
        label: 'Summer 2021 Spike',
        description: 'Increased militia activity around Independence Day events and border operations',
        yOffset: -80
      },
      {
        date: new Date('2022-01-15'), // Winter 2022
        label: 'Winter 2022 Surge',
        description: 'Communication intensified during COVID mandate protests and convoy planning',
        yOffset: -60
      },
      {
        date: new Date('2022-09-15'), // Fall 2022 instead of 2023
        label: 'Fall 2022 Activity',
        description: 'Coordination around midterm elections and regional training exercises',
        yOffset: -100
      }
    ]

    // Filter annotations to only show ones within the visible time range
    const visibleAnnotations = annotations.filter(ann => {
      const timeExtent = d3.extent(visibleData, d => new Date(d.date))
      return ann.date >= timeExtent[0] && ann.date <= timeExtent[1]
    })

    // Add annotation markers and labels if they should be visible
    visibleAnnotations.forEach(annotation => {
      const xPos = x(annotation.date)

      // Don't show if outside our visible range
      if (xPos < 0 || xPos > innerWidth) return

      // Add vertical line
      svg.append("line")
        .attr("x1", xPos)
        .attr("x2", xPos)
        .attr("y1", 0)
        .attr("y2", innerHeight)
        .style("stroke", "rgba(255, 255, 255, 0.4)")
        .style("stroke-width", 1)
        .style("stroke-dasharray", "3,3")

      // Add annotation circle - use consistent blue color
      svg.append("circle")
        .attr("cx", xPos)
        .attr("cy", innerHeight / 3)
        .attr("r", 6)
        .style("fill", "#3b82f6") // Consistent blue color
        .style("stroke", "white")
        .style("stroke-width", 2)

      // Create annotation group
      const annotationGroup = svg.append("g")
        .attr("transform", `translate(${xPos}, ${innerHeight / 3 + annotation.yOffset})`)

      // Add a shadow background for better readability
      const boxWidth = 220
      const boxHeight = 100
      annotationGroup.append("rect")
        .attr("x", -boxWidth / 2)
        .attr("y", -boxHeight / 2)
        .attr("width", boxWidth)
        .attr("height", boxHeight)
        .attr("rx", 5)
        .style("fill", "rgba(0, 0, 0, 0.75)")
        .style("stroke", "#3b82f6") // Consistent blue color
        .style("stroke-width", 1)

      // Use foreignObject for proper text wrapping
      annotationGroup.append("foreignObject")
        .attr("x", -boxWidth / 2)
        .attr("y", -boxHeight / 2)
        .attr("width", boxWidth)
        .attr("height", boxHeight)
        .append("xhtml:div")
        .style("width", "100%")
        .style("height", "100%")
        .style("display", "flex")
        .style("flex-direction", "column")
        .style("justify-content", "center")
        .style("align-items", "center")
        .style("padding", "10px")
        .style("box-sizing", "border-box")
        .style("color", "white")
        .style("text-align", "center")
        .html(`          <div style="font-weight: bold; font-size: 14px; margin-bottom: 8px; color: white;">
            ${annotation.label}
          </div>
          <div style="font-size: 12px; line-height: 1.4; color: rgba(255, 255, 255, 0.9);">
            ${annotation.description}
          </div>
        `)
    })

  } catch (err) {
    console.error('Error rendering stream graph:', err)
  }
}

// Set up event listeners on component mount and clean up later
onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
  window.addEventListener('resize', renderStreamGraph, { passive: true })
  handleScroll() // Initial check

  // Initialize the top 5 senders
  if (props.messagesBySender.length > 0) {
    animateCounters()
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('resize', renderStreamGraph)
  if (scrollTimeout) {
    clearTimeout(scrollTimeout)
  }
  if (countAnimationInterval) {
    clearInterval(countAnimationInterval)
  }
})
</script>

<style scoped>
.scrolly-container {
  position: relative;
}
</style>
