<template>
  <div class="feltron-card p-6 rounded-lg">
    <div class="feltron-title mb-2">Files Overview</div>

    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="flex items-center">
        <div class="animate-spin mr-3">
          <svg class="w-5 h-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
            </path>
          </svg>
        </div>
        <div class="text-white text-sm">Loading files data...</div>
      </div>
    </div>

    <div v-else-if="error" class="text-red-500 p-4 text-center">
      <div class="text-lg font-bold mb-2">Error Loading Files</div>
      <div>{{ error }}</div>
    </div>

    <div v-else>
      <div class="flex items-center justify-between mb-4">
        <div class="text-white text-sm">
          <span class="text-gray-400">Total Files:</span>
          <span class="ml-2 font-bold">{{ formatNumber(totalFiles) }}</span>
        </div>
        <div class="flex items-center space-x-4">
          <div class="flex space-x-2">
            <button @click="sizeMetric = 'count'" :class="sizeMetric === 'count' ? 'text-blue-400' : 'text-gray-400'"
              class="text-xs uppercase tracking-wider hover:text-blue-300 transition-colors">
              By Count
            </button>
            <button @click="sizeMetric = 'size'" :class="sizeMetric === 'size' ? 'text-blue-400' : 'text-gray-400'"
              class="text-xs uppercase tracking-wider hover:text-blue-300 transition-colors">
              By Size
            </button>
          </div>
          <NuxtLink to="/files"
            class="text-blue-400 text-xs uppercase tracking-wider hover:text-blue-300 transition-colors flex items-center">
            <span>Full View</span>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </NuxtLink>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4">
        <!-- File Type Blocks -->
        <div class="bg-gray-800 rounded-lg overflow-hidden p-4">
          <div ref="fileBlocksContainer" class="w-full h-48"></div>
        </div>

        <!-- Total Size -->
        <div class="bg-gray-800 rounded-lg p-4 flex justify-between items-center">
          <div>
            <div class="text-xs text-gray-400 uppercase tracking-wider">Total Size</div>
            <div class="text-white text-lg font-light">{{ formatFileSize(totalSize) }}</div>
          </div>
          <div class="grid grid-cols-3 gap-2">
            <div v-for="(info, type) in fileTypeInfo" :key="type"
              class="flex flex-col items-center justify-center text-center p-1 rounded"
              :class="{ 'ring-2 ring-white': hoveredType === type }"
              :style="{ backgroundColor: getTypeColor(type) + '33' }" @mouseover="hoveredType = type"
              @mouseout="hoveredType = null">
              <div class="w-3 h-3 rounded-full mb-1" :style="{ backgroundColor: getTypeColor(type) }"></div>
              <div class="text-white text-xs capitalize">{{ type }}</div>
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
import { useTelegramFilesLoader } from '~/composables/useTelegramFilesLoader'

const props = defineProps({
  showInCard: {
    type: Boolean,
    default: true
  }
})

const loading = ref(true)
const error = ref(null)
const filesData = ref([])
const totalFiles = ref(0)
const totalSize = ref(0)
const fileTypeCounts = ref({})
const fileTypeSizes = ref({})
const fileBlocksContainer = ref(null)
const sizeMetric = ref('count') // 'count' or 'size'
const hoveredType = ref(null)
const { width, height } = useElementSize(fileBlocksContainer)

const { loadTelegramFiles } = useTelegramFilesLoader()

// Computed property for file type info combining counts and sizes
const fileTypeInfo = computed(() => {
  const result = {}

  Object.keys(fileTypeCounts.value).forEach(type => {
    result[type] = {
      count: fileTypeCounts.value[type] || 0,
      size: fileTypeSizes.value[type] || 0,
      percentage: sizeMetric.value === 'count'
        ? (fileTypeCounts.value[type] / totalFiles.value) * 100
        : (fileTypeSizes.value[type] / totalSize.value) * 100
    }
  })

  return result
})

// Format numbers in a nice way (1k, 15k, etc.)
function formatNumber(value) {
  return d3.format(',')(value)
}

// Format file size in a human-readable way
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Get file type from filename or mime_type
function getFileType(file) {
  // Simple file type detection
  if (file.mime_type) {
    if (file.mime_type.includes('image')) return 'image'
    if (file.mime_type.includes('video')) return 'video'
    if (file.mime_type.includes('audio')) return 'audio'
    if (file.mime_type.includes('text') || file.mime_type.includes('pdf')) return 'document'
    if (file.mime_type.includes('7z') || file.mime_type.includes('zip')) return 'archive'
  }

  // Check extension
  const ext = (file.extension || '').toLowerCase()
  if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return 'image'
  if (['mp4', 'avi', 'mov'].includes(ext)) return 'video'
  if (['mp3', 'wav'].includes(ext)) return 'audio'
  if (['pdf', 'doc', 'txt'].includes(ext)) return 'document'
  if (['zip', 'rar', '7z'].includes(ext)) return 'archive'

  return 'other'
}

// Color scales for file types
const typeColorScale = d3.scaleOrdinal()
  .domain(['archive', 'document', 'image', 'video', 'audio', 'other'])
  .range(['#9f7aea', '#ed8936', '#4299e1', '#f56565', '#48bb78', '#718096'])

function getTypeColor(type) {
  return typeColorScale(type)
}

// Create the file type blocks visualization
function createFileBlocks() {
  if (!fileBlocksContainer.value || !Object.keys(fileTypeInfo.value).length) return

  // Clear any existing visualization
  d3.select(fileBlocksContainer.value).selectAll('*').remove()

  const container = fileBlocksContainer.value
  const containerWidth = width.value
  const containerHeight = height.value

  // Prepare the data for the treemap
  const data = {
    name: 'root',
    children: Object.entries(fileTypeInfo.value).map(([type, info]) => ({
      name: type,
      value: sizeMetric.value === 'count' ? info.count : info.size,
      type: type,
      count: info.count,
      size: info.size
    }))
  }

  // Create the treemap layout
  const treemap = d3.treemap()
    .size([containerWidth, containerHeight])
    .paddingOuter(4)
    .paddingInner(2)
    .round(true)

  // Create the hierarchy
  const root = d3.hierarchy(data)
    .sum(d => d.value)
    .sort((a, b) => b.value - a.value)

  // Apply the treemap layout
  treemap(root)

  // Create the SVG
  const svg = d3.select(container)
    .append('svg')
    .attr('width', containerWidth)
    .attr('height', containerHeight)
    .style('font-family', 'Inter, sans-serif')

  // Add the leaf nodes
  const leaf = svg.selectAll('g')
    .data(root.leaves())
    .join('g')
    .attr('transform', d => `translate(${d.x0},${d.y0})`)
    .attr('class', 'file-type-block')
    .style('cursor', 'pointer')
    .on('mouseover', function (event, d) {
      hoveredType.value = d.data.type
      d3.select(this).select('rect')
        .transition()
        .duration(150)
        .attr('opacity', 1)
    })
    .on('mouseout', function () {
      hoveredType.value = null
      d3.select(this).select('rect')
        .transition()
        .duration(150)
        .attr('opacity', 0.8)
    })

  // Add rectangles for each file type
  leaf.append('rect')
    .attr('width', d => d.x1 - d.x0)
    .attr('height', d => d.y1 - d.y0)
    .attr('fill', d => typeColorScale(d.data.type))
    .attr('rx', 3) // Rounded corners
    .attr('stroke-width', 0) // Remove strokes
    .attr('opacity', 0.8)

  // Add text labels for file types
  leaf.append('text')
    .attr('x', d => (d.x1 - d.x0) / 2)
    .attr('y', d => (d.y1 - d.y0) / 2)
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'middle')
    .attr('fill', 'white')
    .attr('font-size', '12px')
    .attr('font-weight', 'bold')
    .text(d => d.data.type.charAt(0).toUpperCase() + d.data.type.slice(1))
    .each(function (d) {
      // Only show text if there's enough space
      const textWidth = this.getComputedTextLength()
      const boxWidth = d.x1 - d.x0
      if (textWidth > boxWidth - 10) {
        d3.select(this).remove()
      }
    })

  // Add count/size labels
  leaf.filter(d => (d.x1 - d.x0) > 60 && (d.y1 - d.y0) > 40)
    .append('text')
    .attr('x', d => (d.x1 - d.x0) / 2)
    .attr('y', d => (d.y1 - d.y0) / 2 + 16)
    .attr('text-anchor', 'middle')
    .attr('fill', 'rgba(255, 255, 255, 0.8)')
    .attr('font-size', '10px')
    .text(d => sizeMetric.value === 'count'
      ? formatNumber(d.data.count)
      : formatFileSize(d.data.size))
}

// Calculate statistics from the files data
function calculateStats() {
  if (!filesData.value.length) return

  // Filter out .7z files for stats calculation
  const filteredFiles = filesData.value.filter(file => {
    return !(file.extension === '7z' || file.mime_type === 'application/x-7z-compressed')
  })

  totalFiles.value = filteredFiles.length
  totalSize.value = filteredFiles.reduce((sum, file) => sum + (file.size || 0), 0)

  // Count files by type
  const typeCounts = {}
  const typeSizes = {}

  filteredFiles.forEach(file => {
    const type = file.type
    typeCounts[type] = (typeCounts[type] || 0) + 1
    typeSizes[type] = (typeSizes[type] || 0) + (file.size || 0)
  })

  fileTypeCounts.value = typeCounts
  fileTypeSizes.value = typeSizes
}

// Watch for size changes using VueUse's useElementSize
watch([width, height], () => {
  createFileBlocks()
})

// Watch for size metric changes
watch(sizeMetric, () => {
  createFileBlocks()
})

onMounted(async () => {
  try {
    console.log('Loading telegram files data for mini visualization...')

    const result = await loadTelegramFiles()

    if (!result.success) {
      throw new Error(result.error || 'Failed to load files data')
    }

    console.log(`Successfully loaded ${result.data.length} files for mini visualization`)

    // Simple processing of the data
    filesData.value = result.data.map(file => {
      // Extract extension from filename if not provided
      let extension = file.extension || '';
      if (!extension && file.filename) {
        const parts = file.filename.split('.');
        if (parts.length > 1) {
          extension = parts[parts.length - 1].toLowerCase();
        }
      }

      const type = getFileType({
        mime_type: file.mime_type || '',
        extension: extension
      })

      return {
        filename: file.filename || '',
        size: parseInt(file.size) || 10240, // Default to 10KB if no size
        mime_type: file.mime_type || '',
        extension: extension,
        date: file.date || file.timestamp || null,
        type: type
      }
    })

    loading.value = false
    calculateStats()

    // Create visualization after data is loaded and DOM is updated
    setTimeout(() => {
      createFileBlocks()
    }, 0)
  } catch (err) {
    console.error('Error loading files data for mini visualization:', err)
    error.value = err.message
    loading.value = false
  }
})
</script>

<style scoped>
.file-type-block:hover text {
  font-weight: bold;
}
</style>