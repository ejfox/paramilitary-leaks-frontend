<template>
  <div class="w-full">
    <div v-if="loading" class="flex items-center justify-center py-6">
      <div class="flex items-center">
        <div class="animate-spin mr-3">
          <svg class="w-5 h-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
            </path>
          </svg>
        </div>
        <div class="text-white text-sm">Loading data...</div>
      </div>
    </div>

    <div v-else-if="error" class="text-red-400 py-4">
      <p class="text-red-300 font-medium mb-1">Error Loading Comparison Data</p>
      <p>{{ error }}</p>
    </div>

    <div v-else class="w-full">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <!-- Donut Chart Section -->
        <div class="space-y-4">
          <h3 class="text-lg text-white font-light">File Formats</h3>
          
          <div class="relative flex justify-center">
            <div ref="donutChartContainer" class="w-full max-w-xs h-64"></div>
            
            <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
              <div class="text-2xl font-light text-white">{{ formatNumber(totalFiles) }}</div>
              <div class="text-xs text-gray-400">Total Files</div>
            </div>
          </div>
          
          <!-- Legend for Donut Chart -->
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div v-for="(count, format) in fileFormats" :key="format"
              class="flex items-center gap-2 p-2 rounded transition-colors"
              :class="{ 'bg-gray-800': hoveredFormat === format }"
              @mouseover="hoveredFormat = format"
              @mouseout="hoveredFormat = null">
              <div class="w-3 h-3 rounded-full" :style="{ backgroundColor: getFormatColor(format) }"></div>
              <div class="flex-1">
                <div class="text-white text-sm capitalize">{{ format }}</div>
                <div class="text-xs text-gray-400">{{ formatNumber(count) }} files</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Bar Chart Section -->
        <div class="space-y-4">
          <h3 class="text-lg text-white font-light">Size Distribution</h3>
          
          <div ref="barChartContainer" class="w-full h-64"></div>
          
          <!-- Legend for Bar Chart -->
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div v-for="category in sizeCategories" :key="category.label"
              class="flex items-center gap-2 p-2 rounded transition-colors"
              :class="{ 'bg-gray-800': hoveredSize === category.label }"
              @mouseover="hoveredSize = category.label"
              @mouseout="hoveredSize = null">
              <div class="w-3 h-3 rounded-full" :style="{ backgroundColor: getSizeColor(category.label) }"></div>
              <div class="flex-1">
                <div class="text-white text-sm">{{ category.label }}</div>
                <div class="text-xs text-gray-400">{{ formatNumber(category.count) }} files</div>
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

// Format colors (replace with your actual color functions)
const getFormatColor = (format) => {
  // This is a placeholder - implement your actual color logic
  const colors = {
    pdf: '#FF6B6B',
    xlsx: '#4ECDC4',
    docx: '#45B7D1',
    pptx: '#F9A828',
    txt: '#9FD356',
    jpg: '#7C77B9',
    png: '#EE7674',
    csv: '#69D2E7',
    // Add more formats as needed
  }
  return colors[format.toLowerCase()] || '#999999'
}

const getSizeColor = (sizeCategory) => {
  // This is a placeholder - implement your actual color logic
  const colors = {
    'Small (<100KB)': '#4ECDC4',
    'Medium (100KB-1MB)': '#F9A828',
    'Large (1MB-10MB)': '#FF6B6B',
    'Very Large (>10MB)': '#7C77B9',
    // Add more categories as needed
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

// Load data function would go here
// Example: 
// const loadData = async () => {
//   loading.value = true
//   try {
//     // Your data fetching logic
//     // Set fileFormats.value, totalFiles.value, etc.
//   } catch (err) {
//     error.value = err.message
//   } finally {
//     loading.value = false
//   }
// }

// Initialization
onMounted(() => {
  // Initialize charts
  // loadData()
})

// Watch for changes to redraw charts
watch([fileFormats, hoveredFormat], () => {
  // Redraw donut chart
})

watch([sizeCategories, hoveredSize], () => {
  // Redraw bar chart
})
</script> 