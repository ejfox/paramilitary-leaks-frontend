<template>
  <div class="min-h-screen w-screen bg-gray-900 flex flex-col">
    <!-- Navigation Bar -->
    <TopBar current-page="Files Visualization">
      <template #additional-links>
        <button @click="showPathConfig = true"
          class="text-gray-300 hover:text-white transition-colors text-sm flex items-center">
          <span>Configure Path</span>
        </button>
      </template>
    </TopBar>

    <!-- Path Configuration Modal -->
    <div v-if="showPathConfig" class="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center">
      <div class="bg-gray-800 rounded-lg p-6 max-w-lg w-full">
        <h2 class="text-white text-xl font-bold mb-4">Configure Local File Path</h2>
        <p class="text-gray-300 text-sm mb-4">
          Set the base folder path where all the leaked files are stored on your computer.
          This will enable you to open files directly from the visualization.
        </p>

        <div class="mb-4">
          <label class="block text-gray-400 text-sm mb-2">Base Folder Path</label>
          <input v-model="localBasePath"
            class="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
            placeholder="e.g., /Users/username/Downloads/leaked_files or C:\\Users\\username\\Downloads\\leaked_files" />
          <div class="mt-2 text-xs text-gray-400">
            <div class="flex items-start mb-1">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 text-blue-400 flex-shrink-0 mt-0.5"
                viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clip-rule="evenodd" />
              </svg>
              <span>This should be the folder that contains all the files shown in this visualization.</span>
            </div>
            <div class="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 text-blue-400 flex-shrink-0 mt-0.5"
                viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clip-rule="evenodd" />
              </svg>
              <span>Make sure the filenames in the visualization match the actual filenames in this folder.</span>
            </div>
          </div>
        </div>

        <div class="flex justify-between">
          <button @click="showPathConfig = false"
            class="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors">
            Cancel
          </button>
          <button @click="savePathConfig"
            class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors">
            Save Configuration
          </button>
        </div>
      </div>
    </div>

    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <div class="flex items-center">
        <div class="animate-spin mr-3">
          <svg class="w-6 h-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
            </path>
          </svg>
        </div>
        <div class="text-white">Loading files data...</div>
      </div>
    </div>

    <div v-else-if="error" class="flex-1 flex items-center justify-center">
      <div class="text-red-500 p-4 max-w-lg text-center">
        <div class="text-xl font-bold mb-2">Error Loading Data</div>
        <div>{{ error }}</div>
      </div>
    </div>

    <div v-else class="flex-1 flex flex-col">
      <!-- Stats Bar -->
      <div class="bg-gray-800 p-4 flex justify-between items-center">
        <div class="text-white">
          <span class="text-gray-400 text-sm">Files (excluding archives):</span>
          <span class="ml-2 font-bold">{{ formatNumber(filteredFilesCount) }}</span>
          <span v-if="displayedFilesCount < filteredFilesCount" class="text-xs text-gray-400 ml-2">
            (showing {{ formatNumber(displayedFilesCount) }} largest)
          </span>
          <span v-if="activeFilter" class="ml-3 px-2 py-1 bg-blue-900 text-blue-300 text-xs rounded-full">
            Filtered: {{ activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1) }}
            <button @click="clearFilter" class="ml-1 text-blue-300 hover:text-white">×</button>
          </span>
        </div>
        <div class="text-white">
          <span class="text-gray-400 text-sm">Total Size:</span>
          <span class="ml-2 font-bold">{{ formatFileSize(totalSize) }}</span>
          <span v-if="localBasePath" class="ml-4 text-xs bg-green-900 text-green-300 px-2 py-1 rounded-full">
            Local Path Configured
          </span>
        </div>
      </div>

      <!-- Treemap Visualization -->
      <div ref="treemapContainer" class="flex-1 relative">
        <!-- Smart tooltip that stays on screen -->
        <div v-if="tooltipVisible"
          class="tooltip-box fixed z-20 bg-gray-900 text-white text-xs p-2 rounded border-l-2 border-blue-500 shadow-lg pointer-events-none"
          :style="tooltipStyle">
          <div class="font-bold mb-1 text-[11px] break-words">{{ tooltipData.filename || 'Unknown' }}</div>
          <div class="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] mt-2">
            <div>Size:</div>
            <div>{{ formatFileSize(tooltipData.size || 0) }}</div>
            <div>Type:</div>
            <div>{{ tooltipData.type }}{{ tooltipData.extension ? ` (.${tooltipData.extension})` : '' }}</div>
          </div>
          <div v-if="localBasePath" class="mt-1 pt-1 border-t border-gray-700 text-[10px] text-gray-400 text-center">
            Double-click to open file
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, reactive } from 'vue'
import { useTelegramFilesLoader } from '~/composables/useTelegramFilesLoader'
import { useLocalStorage } from '@vueuse/core'
import * as d3 from 'd3'
import TopBar from '~/components/TopBar.vue'

const loading = ref(true)
const error = ref(null)
const filesData = ref([])
const filteredFilesCount = ref(0)
const displayedFilesCount = ref(0)
const treemapContainer = ref(null)
const activeFilter = ref(null) // For legend filtering
const showPathConfig = ref(false)

// Use VueUse's useLocalStorage to persist the base path
const localBasePath = useLocalStorage('paramilitary-leaks-local-path', '')

// Tooltip state
const tooltipVisible = ref(false)
const tooltipData = reactive({
  filename: '',
  size: 0,
  type: '',
  extension: ''
})
const tooltipStyle = ref({
  left: '0px',
  top: '0px',
  transform: 'translate(10px, 10px)',
  width: '260px',
  maxWidth: '260px'
})

const { loadTelegramFiles } = useTelegramFilesLoader()

// Save path configuration
function savePathConfig() {
  // Normalize path separators based on OS
  if (localBasePath.value) {
    // Ensure path ends with a separator
    if (!localBasePath.value.endsWith('/') && !localBasePath.value.endsWith('\\')) {
      localBasePath.value += '/'
    }

    // Show a success notification
    alert('Path configured successfully! You can now open files directly from the visualization.');
  }

  showPathConfig.value = false
}

// Open a local file using the configured base path
function openLocalFile(filename) {
  if (!localBasePath.value || !filename) return

  // Construct the full path
  let fullPath = `${localBasePath.value}${filename}`

  // Use the simplest approach - just open the file URL
  window.location.href = `file://${fullPath}`
}

// Calculate total size of all files
const totalSize = computed(() => {
  if (!filesData.value.length) return 0

  // Filter out .7z files for size calculation
  const filteredFiles = filesData.value.filter(file => {
    return !(file.extension === '7z' || file.mime_type === 'application/x-7z-compressed')
  })

  return filteredFiles.reduce((sum, file) => sum + (file.size || 0), 0)
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

// Extract chat name from filename
function getChatName(filename) {
  if (!filename) return 'Unknown'

  // Simple name extraction
  let name = filename

  // Remove file extension
  name = name.replace(/\.\w+$/, '')

  // Truncate if too long
  if (name.length > 20) {
    name = name.substring(0, 17) + '...'
  }

  return name
}

// Show tooltip with simpler positioning
function showTooltip(event, d) {
  const file = d.data.originalData;

  // Update tooltip data
  tooltipData.filename = file.filename || 'Unknown';
  tooltipData.size = d.data.size;
  tooltipData.type = d.data.type;
  tooltipData.extension = file.extension;

  // Position tooltip relative to mouse
  tooltipStyle.value = {
    left: `${event.clientX}px`,
    top: `${event.clientY}px`,
    transform: 'translate(10px, 10px)',
    width: '260px',
    maxWidth: '260px'
  };

  tooltipVisible.value = true;
}

// Simple hide tooltip function
function hideTooltip() {
  tooltipVisible.value = false;
}

// Create the treemap visualization
function createTreemap() {
  if (!treemapContainer.value || !filesData.value.length) return

  // Clear any existing visualization
  d3.select(treemapContainer.value).selectAll('*').remove()

  const container = treemapContainer.value
  const width = container.clientWidth
  const height = container.clientHeight

  // Filter out .7z files
  let filteredFiles = filesData.value.filter(file => {
    return !(file.extension === '7z' || file.mime_type === 'application/x-7z-compressed')
  })

  // Apply type filter if active
  if (activeFilter.value) {
    filteredFiles = filteredFiles.filter(file => getFileType(file) === activeFilter.value)
  }

  // Update filtered count
  filteredFilesCount.value = filteredFiles.length

  // Performance optimization for large datasets
  let filesToDisplay = filteredFiles;
  const MAX_DISPLAY_FILES = 1000; // Limit for better performance

  if (filteredFiles.length > MAX_DISPLAY_FILES) {
    console.log(`Limiting display to ${MAX_DISPLAY_FILES} files for performance (out of ${filteredFiles.length})`);

    // Sort by size and take the largest files to ensure we show the most significant ones
    filesToDisplay = [...filteredFiles]
      .sort((a, b) => (b.size || 0) - (a.size || 0))
      .slice(0, MAX_DISPLAY_FILES);
  }

  // Update displayed count
  displayedFilesCount.value = filesToDisplay.length;

  // Prepare the data for the treemap
  const data = {
    name: 'root',
    children: filesToDisplay.map(file => ({
      name: getChatName(file.filename || 'Unnamed'),
      size: file.size || 10240, // Default to 10KB if no size
      type: getFileType(file),
      extension: file.extension || '',
      originalData: file
    }))
  }

  // Create the treemap layout
  const treemap = d3.treemap()
    .size([width, height])
    .paddingOuter(3)
    .paddingTop(20)
    .paddingInner(2)
    .round(true)

  // Create the hierarchy
  const root = d3.hierarchy(data)
    .sum(d => d.size)
    .sort((a, b) => b.value - a.value)

  // Apply the treemap layout
  treemap(root)

  // Create the SVG
  const svg = d3.select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .style('font-family', 'Inter, sans-serif')

  // Color scales - use a more distinct palette for this dataset
  const typeColorScale = d3.scaleOrdinal()
    .domain(['archive', 'document', 'image', 'video', 'audio', 'other'])
    .range(['#9f7aea', '#ed8936', '#4299e1', '#f56565', '#48bb78', '#718096'])

  // Add the leaf nodes
  const leaf = svg.selectAll('g')
    .data(root.leaves())
    .join('g')
    .attr('transform', d => `translate(${d.x0},${d.y0})`)

  // Add rectangles for each file
  leaf.append('rect')
    .attr('width', d => d.x1 - d.x0)
    .attr('height', d => d.y1 - d.y0)
    .attr('fill', d => typeColorScale(d.data.type))
    .attr('rx', 1) // Smaller corner radius
    .attr('stroke-width', 0) // Remove strokes
    .on('mouseover', function (event, d) {
      // Highlight this rectangle on hover with a brighter color
      const currentColor = d3.select(this).attr('fill');
      d3.select(this)
        .transition()
        .duration(100)
        .attr('fill', d3.color(currentColor).brighter(0.5))
        .attr('filter', 'drop-shadow(0 0 2px rgba(255,255,255,0.5))');

      showTooltip(event, d);
    })
    .on('mouseout', function (event, d) {
      // Restore original color
      const originalColor = typeColorScale(d.data.type);

      d3.select(this)
        .transition()
        .duration(100)
        .attr('fill', originalColor)
        .attr('filter', null);

      hideTooltip();
    })
    .on('mousemove', function (event, d) {
      if (tooltipVisible.value) {
        tooltipStyle.value = {
          left: `${event.clientX}px`,
          top: `${event.clientY}px`,
          transform: 'translate(10px, 10px)',
          width: '260px',
          maxWidth: '260px'
        };
      }
    })
    .style('cursor', localBasePath.value ? 'pointer' : 'default') // Show pointer cursor if local path is configured
    .on('dblclick', function (event, d) {
      // Open file on double-click if local path is configured
      if (localBasePath.value) {
        openLocalFile(d.data.originalData.filename);
      }
    });

  // Add text labels for larger rectangles - optimize for performance
  leaf.filter(d => {
    // Only add text to rectangles that are large enough
    const width = d.x1 - d.x0;
    const height = d.y1 - d.y0;
    return width > 40 && height > 20;
  })
    .append('text')
    .attr('x', 4)
    .attr('y', 14)
    .attr('fill', 'white')
    .attr('font-size', '10px')
    .text(d => {
      // Keep names short but informative
      const name = d.data.name;
      const width = d.x1 - d.x0;
      if (width < 100) {
        return name.substring(0, 12) + (name.length > 12 ? '...' : '');
      }
      return name;
    })
    .filter(d => {
      // Only add size labels to even larger rectangles
      const width = d.x1 - d.x0;
      const height = d.y1 - d.y0;
      return width > 60 && height > 30;
    })
    .append('tspan')
    .attr('x', 4)
    .attr('y', 26)
    .attr('fill', 'rgba(255, 255, 255, 0.9)') // More visible
    .attr('font-size', '9px') // Slightly larger
    .text(d => formatFileSize(d.data.size));

  // Add a legend with filtering functionality
  const legend = svg.append('g')
    .attr('transform', `translate(${width - 150}, 20)`)

  const types = ['archive', 'document', 'image', 'video', 'audio', 'other']

  // Count files by type for the legend
  const typeCounts = {};
  types.forEach(type => {
    typeCounts[type] = filteredFiles.filter(file => getFileType(file) === type).length;
  });

  // Add a "Show All" option at the top
  const allGroup = legend.append('g')
    .attr('transform', 'translate(0, 0)')
    .style('cursor', 'pointer')
    .on('click', () => {
      activeFilter.value = null;
      createTreemap();
    });

  allGroup.append('rect')
    .attr('width', 12)
    .attr('height', 12)
    .attr('fill', '#ffffff')
    .attr('rx', 2);

  allGroup.append('text')
    .attr('x', 20)
    .attr('y', 10)
    .attr('fill', activeFilter.value === null ? '#3b82f6' : 'white')
    .attr('font-size', '10px')
    .attr('font-weight', activeFilter.value === null ? 'bold' : 'normal')
    .text(`Show All (${formatNumber(filteredFiles.length)})`);

  // Add type filters
  types.forEach((type, i) => {
    // Skip types with no files
    if (typeCounts[type] === 0) return;

    const g = legend.append('g')
      .attr('transform', `translate(0, ${(i + 1) * 20})`)
      .style('cursor', 'pointer')
      .on('click', () => {
        activeFilter.value = activeFilter.value === type ? null : type;
        createTreemap();
      });

    g.append('rect')
      .attr('width', 12)
      .attr('height', 12)
      .attr('fill', typeColorScale(type))
      .attr('rx', 2);

    g.append('text')
      .attr('x', 20)
      .attr('y', 10)
      .attr('fill', activeFilter.value === type ? '#3b82f6' : 'white')
      .attr('font-size', '10px')
      .attr('font-weight', activeFilter.value === type ? 'bold' : 'normal')
      .text(`${type.charAt(0).toUpperCase() + type.slice(1)} (${formatNumber(typeCounts[type])})`);
  });
}

// Handle window resize
function handleResize() {
  if (treemapContainer.value) {
    createTreemap()
  }
}

// Function to clear the active filter
function clearFilter() {
  activeFilter.value = null;
  createTreemap();
}

// Watch for changes to the local base path and recreate the treemap
// to update cursor styles and click handlers
watch(localBasePath, () => {
  if (treemapContainer.value) {
    createTreemap();
  }
});

onMounted(async () => {
  try {
    console.log('Loading telegram files data...')

    const result = await loadTelegramFiles()

    if (!result.success) {
      throw new Error(result.error || 'Failed to load files data')
    }

    console.log(`Successfully loaded ${result.data.length} files`)

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

      return {
        filename: file.filename || '',
        size: parseInt(file.size) || 10240, // Default to 10KB if no size
        mime_type: file.mime_type || '',
        extension: extension,
        date: file.date || file.timestamp || null,
        type: getFileType({
          mime_type: file.mime_type || '',
          extension: extension
        }) // Pre-calculate the type
      }
    })

    loading.value = false

    // Create treemap after data is loaded and DOM is updated
    setTimeout(() => {
      createTreemap()
      window.addEventListener('resize', handleResize)
    }, 0)
  } catch (err) {
    console.error('Error loading files data:', err)
    error.value = err.message
    loading.value = false
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.tooltip-box {
  max-width: 260px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  word-break: break-word;
  overflow-wrap: break-word;
  transition: all 0.1s ease;
}
</style>