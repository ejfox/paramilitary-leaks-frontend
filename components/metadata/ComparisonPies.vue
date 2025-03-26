<template>
  <div class="w-full">
    <div v-if="loading" class="flex items-center justify-center py-6">
      <div class="flex items-center">
        <div class="animate-spin mr-3">
          <svg class="w-5 h-5 text-blue-500 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none"
            viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
            </path>
          </svg>
        </div>
        <div class="text-gray-900 dark:text-white text-sm">Loading data...</div>
      </div>
    </div>

    <div v-else-if="error" class="text-red-600 dark:text-red-400 py-4">
      <p class="text-red-700 dark:text-red-300 font-medium mb-1">Error Loading Comparison Data</p>
      <p>{{ error }}</p>
    </div>

    <div v-else class="w-full">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <!-- Donut Chart Section -->
        <div class="space-y-4">
          <h3 class="text-lg text-gray-900 dark:text-white font-light">File Formats</h3>

          <div class="relative flex justify-center">
            <div ref="donutChartContainer" class="w-full max-w-xs h-64"></div>

            <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
              <div class="text-2xl font-light text-gray-900 dark:text-white">{{ formatNumber(totalFiles) }}</div>
              <div class="text-xs text-gray-600 dark:text-gray-400">Total Files</div>
            </div>
          </div>

          <!-- Legend for Donut Chart -->
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div v-for="(count, format) in fileFormats" :key="format"
              class="flex items-center gap-2 p-2 rounded transition-colors"
              :class="{ 'bg-gray-100 dark:bg-gray-800': hoveredFormat === format }" @mouseover="hoveredFormat = format"
              @mouseout="hoveredFormat = null">
              <div class="w-3 h-3 rounded-full" :style="{ backgroundColor: getFormatColor(format) }"></div>
              <div class="flex-1">
                <div class="text-gray-900 dark:text-white text-sm capitalize">{{ format }}</div>
                <div class="text-xs text-gray-600 dark:text-gray-400">{{ formatNumber(count) }} files</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Bar Chart Section -->
        <div class="space-y-4">
          <h3 class="text-lg text-gray-900 dark:text-white font-light">Size Distribution</h3>

          <div ref="barChartContainer" class="w-full h-64"></div>

          <!-- Legend for Bar Chart -->
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div v-for="category in sizeCategories" :key="category.label"
              class="flex items-center gap-2 p-2 rounded transition-colors"
              :class="{ 'bg-gray-100 dark:bg-gray-800': hoveredSize === category.label }"
              @mouseover="hoveredSize = category.label" @mouseout="hoveredSize = null">
              <div class="w-3 h-3 rounded-full" :style="{ backgroundColor: getSizeColor(category.label) }"></div>
              <div class="flex-1">
                <div class="text-gray-900 dark:text-white text-sm">{{ category.label }}</div>
                <div class="text-xs text-gray-600 dark:text-gray-400">{{ formatNumber(category.count) }} files</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import * as d3 from 'd3'
import { useParquetLoader } from '~/composables/useParquetLoader'

// State
const loading = ref(false)
const error = ref(null)
const totalFiles = ref(0)
const fileFormats = ref({})
const hoveredFormat = ref(null)
const hoveredSize = ref(null)
const sizeCategories = ref([])

// Chart containers
const donutChartContainer = ref(null)
const barChartContainer = ref(null)

// Format colors
const getFormatColor = (format) => {
  const colors = {
    pdf: '#FF6B6B',
    xlsx: '#4ECDC4',
    docx: '#45B7D1',
    pptx: '#F9A828',
    txt: '#9FD356',
    jpg: '#7C77B9',
    png: '#EE7674',
    csv: '#69D2E7',
    other: '#999999'
  }
  return colors[format.toLowerCase()] || colors.other
}

const getSizeColor = (sizeCategory) => {
  const colors = {
    'Small (<100KB)': '#4ECDC4',
    'Medium (100KB-1MB)': '#F9A828',
    'Large (1MB-10MB)': '#FF6B6B',
    'Very Large (>10MB)': '#7C77B9'
  }
  return colors[sizeCategory] || '#999999'
}

// Utility functions
const formatNumber = (num) => {
  if (num === undefined || num === null) return '0'

  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

// Get file format from filename
const getFileFormat = (filename) => {
  if (!filename) return 'unknown'
  const ext = filename.split('.').pop()?.toLowerCase()
  return ext || 'unknown'
}

// Get size category
const getSizeCategory = (size) => {
  if (size < 102400) return 'Small (<100KB)'
  if (size < 1048576) return 'Medium (100KB-1MB)'
  if (size < 10485760) return 'Large (1MB-10MB)'
  return 'Very Large (>10MB)'
}

// Create donut chart
const createDonutChart = () => {
  if (!donutChartContainer.value) return

  // Clear previous chart
  d3.select(donutChartContainer.value).selectAll('*').remove()

  const width = donutChartContainer.value.clientWidth
  const height = donutChartContainer.value.clientHeight
  const radius = Math.min(width, height) / 2

  const svg = d3.select(donutChartContainer.value)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .append('g')
    .attr('transform', `translate(${width / 2},${height / 2})`)

  const pie = d3.pie()
    .value(d => d[1])
    .sort(null)

  const arc = d3.arc()
    .innerRadius(radius * 0.6)
    .outerRadius(radius * 0.95)

  const data = Object.entries(fileFormats.value)

  const paths = svg.selectAll('path')
    .data(pie(data))
    .join('path')
    .attr('d', arc)
    .attr('fill', d => getFormatColor(d.data[0]))
    .attr('opacity', d => hoveredFormat.value && hoveredFormat.value !== d.data[0] ? 0.3 : 0.8)
    .attr('stroke', 'var(--chart-stroke-color, #1a1a1a)')
    .attr('stroke-width', 1)
}

// Create bar chart
const createBarChart = () => {
  if (!barChartContainer.value) return

  // Clear previous chart
  d3.select(barChartContainer.value).selectAll('*').remove()

  const width = barChartContainer.value.clientWidth
  const height = barChartContainer.value.clientHeight
  const margin = { top: 20, right: 20, bottom: 30, left: 40 }

  const svg = d3.select(barChartContainer.value)
    .append('svg')
    .attr('width', width)
    .attr('height', height)

  const x = d3.scaleBand()
    .domain(sizeCategories.value.map(d => d.label))
    .range([margin.left, width - margin.right])
    .padding(0.3)

  const y = d3.scaleLinear()
    .domain([0, d3.max(sizeCategories.value, d => d.count)])
    .nice()
    .range([height - margin.bottom, margin.top])

  // Add bars
  svg.append('g')
    .selectAll('rect')
    .data(sizeCategories.value)
    .join('rect')
    .attr('x', d => x(d.label))
    .attr('y', d => y(d.count))
    .attr('height', d => y(0) - y(d.count))
    .attr('width', x.bandwidth())
    .attr('fill', d => getSizeColor(d.label))
    .attr('opacity', d => hoveredSize.value && hoveredSize.value !== d.label ? 0.3 : 0.8)

  // Add x-axis with dark mode support
  svg.append('g')
    .attr('transform', `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x))
    .call(g => g.select('.domain').remove())
    .selectAll('text')
    .attr('fill', 'var(--chart-text-color, #374151)')
    .attr('font-size', '10px')
    .attr('transform', 'rotate(-45)')
    .attr('text-anchor', 'end')

  // Add y-axis with dark mode support
  svg.append('g')
    .attr('transform', `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).ticks(5).tickFormat(formatNumber))
    .call(g => g.select('.domain').remove())
    .selectAll('text')
    .attr('fill', 'var(--chart-text-color, #374151)')
    .attr('font-size', '10px')

  // Style grid lines with dark mode support
  svg.append('g')
    .attr('class', 'grid')
    .attr('transform', `translate(${margin.left},0)`)
    .call(d3.axisLeft(y)
      .ticks(5)
      .tickSize(-width + margin.left + margin.right)
      .tickFormat('')
    )
    .call(g => g.select('.domain').remove())
    .call(g => g.selectAll('.tick line')
      .attr('stroke', 'var(--chart-grid-color, #e5e7eb)')
      .attr('stroke-opacity', 0.5)
    )
}

// Load data
const loadData = async () => {
  try {
    loading.value = true
    const { loadParquetFile } = useParquetLoader()
    const result = await loadParquetFile()

    if (!result.success) {
      throw new Error(result.error || 'Failed to load data')
    }

    // Process file formats
    const formats = {}
    const sizes = {
      'Small (<100KB)': 0,
      'Medium (100KB-1MB)': 0,
      'Large (1MB-10MB)': 0,
      'Very Large (>10MB)': 0
    }

    result.data.forEach(file => {
      // Process format
      const format = getFileFormat(file.filename || file.name)
      formats[format] = (formats[format] || 0) + 1

      // Process size
      const category = getSizeCategory(file.size || 0)
      sizes[category]++
    })

    // Update state
    totalFiles.value = result.data.length
    fileFormats.value = formats
    sizeCategories.value = Object.entries(sizes)
      .map(([label, count]) => ({ label, count }))

    // Create charts
    createDonutChart()
    createBarChart()

    error.value = null
  } catch (err) {
    console.error('Error loading comparison data:', err)
    error.value = err.message
  } finally {
    loading.value = false
  }
}

// Initialize on mount
onMounted(() => {
  // Set up CSS variables based on color scheme
  const updateColorScheme = () => {
    const isDark = document.documentElement.classList.contains('dark')
    document.documentElement.style.setProperty('--chart-text-color', isDark ? '#9CA3AF' : '#374151')
    document.documentElement.style.setProperty('--chart-stroke-color', isDark ? '#1a1a1a' : '#ffffff')
    document.documentElement.style.setProperty('--chart-grid-color', isDark ? '#374151' : '#e5e7eb')
  }

  // Initial setup
  updateColorScheme()

  // Watch for color scheme changes
  const observer = new MutationObserver(updateColorScheme)
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class']
  })

  loadData()
})

// Watch for changes to redraw charts
watch([fileFormats, hoveredFormat], () => {
  createDonutChart()
})

watch([sizeCategories, hoveredSize], () => {
  createBarChart()
})

// Watch for window resize
let resizeTimeout
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout)
  resizeTimeout = setTimeout(() => {
    createDonutChart()
    createBarChart()
  }, 250)
})
</script>

<style>
:root {
  --chart-text-color: #374151;
  --chart-stroke-color: #ffffff;
  --chart-grid-color: #e5e7eb;
}

:root.dark {
  --chart-text-color: #9CA3AF;
  --chart-stroke-color: #1a1a1a;
  --chart-grid-color: #374151;
}
</style>