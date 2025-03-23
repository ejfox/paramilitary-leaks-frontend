<template>
  <div class="min-h-screen w-full bg-gray-900 flex flex-col">
    <!-- Navigation Bar -->
    <TopBar current-page="Files Visualization">
      <template #additional-links>
        <button @click="showPathConfig = true"
          class="text-gray-300 hover:text-white transition-colors text-sm flex items-center mx-2">
          <span>Configure Path</span>
        </button>
      </template>
    </TopBar>

    <!-- Files Filter Bar -->
    <FilesFilterBar @filters-changed="applyFilters" @reset="handleFilterReset" />

    <!-- Path Configuration Modal -->
    <div v-if="showPathConfig" class="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div class="bg-gray-800 rounded-lg p-4 sm:p-6 w-full max-w-lg">
        <h2 class="text-white text-lg sm:text-xl font-bold mb-4">Configure Local File Path</h2>
        <p class="text-gray-300 text-sm mb-4">
          Set the base folder path where all the leaked files are stored on your computer.
          This will enable you to open files directly from the visualization.
        </p>

        <div class="mb-4">
          <label class="block text-gray-400 text-sm mb-2">Base Folder Path</label>
          <input v-model="localBasePath"
            class="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
            placeholder="e.g., /Users/username/Downloads/leaked_files" />
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

        <div class="flex flex-col sm:flex-row justify-between gap-2">
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

    <div v-else-if="error" class="flex-1 flex items-center justify-center p-4">
      <div class="text-red-500 p-4 max-w-lg text-center">
        <div class="text-xl font-bold mb-2">Error Loading Data</div>
        <div>{{ error }}</div>
      </div>
    </div>

    <div v-else class="flex-1 flex flex-col">
      <!-- Stats Bar with Mobile Optimization -->
      <div class="bg-gray-800 p-3 border-b border-gray-700">
        <div class="flex flex-col sm:flex-row sm:justify-between gap-2 sm:gap-0 sm:items-center">
          <div class="text-white">
            <div class="flex flex-wrap items-center">
              <span class="text-gray-400 text-sm mr-2">Files:</span>
              <span class="font-bold text-base">{{ formatNumber(filteredFilesCount) }}</span>

              <!-- Mobile-optimized filter badge -->
              <span v-if="activeFilter || filters?.fileType"
                class="ml-2 sm:ml-3 px-2.5 py-1 bg-blue-900/80 backdrop-blur-sm text-blue-300 text-xs rounded-full inline-flex items-center">
                <span>{{ (activeFilter || filters?.fileType).charAt(0).toUpperCase() + (activeFilter ||
                  filters?.fileType).slice(1) }}</span>
                <button @click="clearFilter"
                  class="ml-1.5 bg-blue-700/50 rounded-full h-5 w-5 flex items-center justify-center text-white hover:bg-blue-600/80 transition-colors"
                  style="min-height: 20px; min-width: 20px;">
                  ×
                </button>
              </span>
            </div>

            <div v-if="displayedFilesCount < filteredFilesCount"
              class="text-xs text-gray-400 mt-1 sm:mt-0 sm:ml-2 sm:inline-block">
              (showing {{ formatNumber(displayedFilesCount) }} largest)
            </div>
          </div>

          <div class="text-white mt-2 sm:mt-0 flex flex-wrap items-center">
            <span class="text-gray-400 text-sm mr-2">Total Size:</span>
            <span class="font-bold text-base">{{ formatFileSize(totalSize) }}</span>

            <!-- Path configured badge with better mobile visibility -->
            <span v-if="localBasePath"
              class="ml-2 sm:ml-4 text-xs bg-green-900/80 backdrop-blur-sm text-green-300 px-2.5 py-1 rounded-full inline-block">
              <span class="hidden sm:inline">Local Path Configured</span>
              <span class="sm:hidden">Path Set</span>
            </span>
          </div>
        </div>
      </div>

      <!-- Treemap Visualization -->
      <div ref="treemapContainer" class="flex-1 relative pb-16 sm:pb-0">
        <!-- Enhanced tooltip with mobile optimizations -->
        <div v-if="tooltipVisible"
          class="tooltip-box fixed z-20 text-white text-xs rounded shadow-lg pointer-events-none"
          :class="{ 'mobile-tooltip': isMobile }" :style="tooltipStyle">
          <div class="font-bold mb-1.5 text-[11px] sm:text-xs break-words border-b border-gray-700 pb-1.5">
            {{ tooltipData.filename || 'Unknown' }}
          </div>
          <div class="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[10px] sm:text-xs mt-2">
            <div class="text-gray-300">Size:</div>
            <div class="font-medium">{{ formatFileSize(tooltipData.size || 0) }}</div>
            <div class="text-gray-300">Type:</div>
            <div class="font-medium">
              {{ tooltipData.type.charAt(0).toUpperCase() + tooltipData.type.slice(1) }}
              {{ tooltipData.extension ? ` (.${tooltipData.extension})` : '' }}
            </div>
          </div>
          <div v-if="localBasePath" class="mt-2 pt-1.5 border-t border-gray-700 text-[10px] sm:text-xs text-center">
            <span v-if="isMobile">Tap twice to open file</span>
            <span v-else>Double-click to open file</span>
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
import FilesFilterBar from '~/components/FilesFilterBar.vue'

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

// Track if we're on mobile for UI adaptations
const isMobile = ref(false)

const { loadTelegramFiles } = useTelegramFilesLoader()

// All filter state
const filters = reactive({
  searchTerm: '',
  fileType: null, // Replaces activeFilter
  sizeRange: { min: 0, max: Infinity }
})

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

// Show tooltip with simpler positioning and mobile awareness
function showTooltip(event, d) {
  const file = d.data.originalData;

  // Update tooltip data
  tooltipData.filename = file.filename || 'Unknown';
  tooltipData.size = d.data.size;
  tooltipData.type = d.data.type;
  tooltipData.extension = file.extension;

  // Position tooltip relative to mouse, with awareness of screen boundaries
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  // Set differently for touch vs mouse events
  let left, top;

  if (isMobile.value) {
    // For mobile, position tooltip in a more thumb-friendly zone
    // Ensure it's in the lower half of the screen for thumb accessibility, but not at the very bottom
    left = Math.min(windowWidth - 230, Math.max(10, event.clientX - 100));

    // Keep tooltip away from the filter button at the bottom
    top = Math.min(windowHeight - 180, Math.max(windowHeight / 2, event.clientY - 70));

    // Add slight vibration feedback for touch devices
    if ('vibrate' in navigator) {
      navigator.vibrate(15); // very subtle
    }
  } else {
    // Default position for desktop
    left = event.clientX + 10;
    top = event.clientY + 10;

    // Check if tooltip would go off right edge
    if (left + 260 > windowWidth) {
      left = event.clientX - 270; // Place to the left of cursor
    }

    // Check if tooltip would go off bottom edge
    if (top + 130 > windowHeight) {
      top = event.clientY - 140; // Place above cursor
    }

    // Ensure tooltip doesn't go off left or top edge
    left = Math.max(10, left);
    top = Math.max(10, top);
  }

  tooltipStyle.value = {
    left: `${left}px`,
    top: `${top}px`,
    transform: 'none',
    width: isMobile.value ? '220px' : '260px',
    maxWidth: Math.min(isMobile.value ? 220 : 260, windowWidth - 20) + 'px',
    // Add a backdrop blur on mobile for better readability
    backdropFilter: isMobile.value ? 'blur(3px)' : 'none',
    background: isMobile.value ? 'rgba(17, 24, 39, 0.95)' : 'rgb(17, 24, 39)'
  };

  tooltipVisible.value = true;
}

// Simple hide tooltip function
function hideTooltip() {
  tooltipVisible.value = false;
}

// Function to apply filters
function applyFilters(newFilters) {
  console.log('Applying filters:', newFilters)

  // If new filters are passed in, update our filter state
  if (newFilters) {
    Object.assign(filters, newFilters)

    // Sync activeFilter with the new filter system
    activeFilter.value = filters.fileType
  }

  // Update URL to support permalinks
  updateFilterURL()

  // Recreate treemap with new filters
  createTreemap()
}

// Handle filter reset
function handleFilterReset() {
  console.log('Resetting all filters')

  filters.searchTerm = ''
  filters.fileType = null
  filters.sizeRange = { min: 0, max: Infinity }

  // Clear URL params
  updateFilterURL()

  // Sync with legacy filter system
  activeFilter.value = null

  // Add haptic feedback on mobile
  if (isMobile.value && 'vibrate' in navigator) {
    navigator.vibrate([40, 30, 40])
  }

  // Recreate visualization
  createTreemap()
}

// Update URL with current filter state
function updateFilterURL() {
  const params = new URLSearchParams()

  if (filters.searchTerm) params.set('search', filters.searchTerm)
  if (filters.fileType) params.set('type', filters.fileType)
  if (filters.sizeRange.min > 0) params.set('minSize', filters.sizeRange.min.toString())
  if (filters.sizeRange.max < Infinity) params.set('maxSize', filters.sizeRange.max.toString())

  const newURL = window.location.pathname + (params.toString() ? `?${params.toString()}` : '')
  window.history.replaceState({}, '', newURL)
}

// Function to clear the active filter
function clearFilter() {
  activeFilter.value = null;
  filters.fileType = null; // Sync with new filter system
  updateFilterURL();
  createTreemap();
}

// Create the treemap visualization with mobile awareness
function createTreemap() {
  if (!treemapContainer.value || !filesData.value.length) return

  // Clear any existing visualization
  d3.select(treemapContainer.value).selectAll('*').remove()

  const container = treemapContainer.value
  const width = container.clientWidth

  // Account for bottom padding on mobile
  const height = container.clientHeight - (isMobile.value ? 16 : 0)

  // Filter out .7z files
  let filteredFiles = filesData.value.filter(file => {
    return !(file.extension === '7z' || file.mime_type === 'application/x-7z-compressed')
  })

  // Apply type filter (support both activeFilter and new filter system)
  if (activeFilter.value || filters?.fileType) {
    const typeFilter = filters?.fileType || activeFilter.value
    filteredFiles = filteredFiles.filter(file => getFileType(file) === typeFilter)
  }

  // Apply search term filter if exists in new filter system
  if (filters?.searchTerm) {
    const term = filters.searchTerm.toLowerCase()
    filteredFiles = filteredFiles.filter(file => {
      const fileName = file.filename?.toLowerCase() || ''
      return fileName.includes(term)
    })
  }

  // Apply size filters if they exist in new filter system
  if (filters?.sizeRange?.min > 0 || filters?.sizeRange?.max < Infinity) {
    filteredFiles = filteredFiles.filter(file => {
      const size = file.size || 0
      return size >= filters.sizeRange.min && size <= filters.sizeRange.max
    })
  }

  // Update filtered count
  filteredFilesCount.value = filteredFiles.length

  // Performance optimization for large datasets
  let filesToDisplay = filteredFiles;
  // Reduce max display on mobile for better performance
  const MAX_DISPLAY_FILES = isMobile ? 400 : 1000;

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

  // Create the treemap layout with better mobile spacing
  const treemap = d3.treemap()
    .size([width, height])
    .paddingOuter(isMobile ? 2 : 3) // Slightly larger padding on mobile for better touch targets
    .paddingTop(isMobile ? 10 : 20)
    .paddingInner(isMobile ? 2 : 2) // Increase inner padding on mobile for better touch targets
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

  // Add rectangles for each file with better touch handling
  leaf.append('rect')
    .attr('width', d => d.x1 - d.x0)
    .attr('height', d => d.y1 - d.y0)
    .attr('fill', d => typeColorScale(d.data.type))
    .attr('rx', isMobile ? 2 : 1) // Larger corner radius on mobile
    .attr('stroke-width', 0) // Remove strokes
    .on('mouseover', function (event, d) {
      // Highlight rectangle on hover
      d3.select(this)
        .transition()
        .duration(100)
        .attr('fill', d3.color(d3.select(this).attr('fill')).brighter(0.5))
        .attr('filter', 'drop-shadow(0 0 3px rgba(255,255,255,0.6))');

      showTooltip(event, d);
    })
    .on('mouseout', function (event, d) {
      // Restore original color
      d3.select(this)
        .transition()
        .duration(100)
        .attr('fill', typeColorScale(d.data.type))
        .attr('filter', null);

      hideTooltip();
    })
    .on('mousemove', function (event, d) {
      if (tooltipVisible.value) {
        // Update tooltip position with the smart positioning
        showTooltip(event, d);
      }
    })
    .on('touchstart', function (event, d) {
      // Prevent default to avoid scrolling
      event.preventDefault();

      // Show tooltip on touch
      d3.select(this)
        .transition()
        .duration(100)
        .attr('fill', d3.color(d3.select(this).attr('fill')).brighter(0.5))
        .attr('filter', 'drop-shadow(0 0 3px rgba(255,255,255,0.6))');

      showTooltip(event.touches[0], d);

      // Add a temporary touch-class to identify this element
      d3.select(this).classed('touch-active', true);
    })
    .on('touchend', function () {
      // Hide tooltip and restore color when touch ends
      d3.select(this)
        .transition()
        .duration(100)
        .attr('fill', d => typeColorScale(d.data.type))
        .attr('filter', null)
        .classed('touch-active', false);

      // Only hide tooltip after a delay to allow for tap-to-open
      setTimeout(() => {
        // Only hide if no new touch has started
        if (!d3.select('.touch-active').empty()) return;
        hideTooltip();
      }, 500);
    })
    .on('touchmove', function (event) {
      // Update tooltip on touch move
      if (tooltipVisible.value && !d3.select('.touch-active').empty()) {
        showTooltip(event.touches[0], d3.select('.touch-active').datum());
      }
    })
    .style('cursor', localBasePath.value ? 'pointer' : 'default')
    .on('dblclick', function (event, d) {
      if (localBasePath.value) {
        openLocalFile(d.data.originalData.filename);
      }
    })
    .on('click', function (event, d) {
      // For mobile: single tap shows tooltip, double tap opens file
      if (isMobile.value && localBasePath.value) {
        // We'll use a timeout to detect single vs double tap
        if (!window.tapTimeout) {
          window.tapTimeout = setTimeout(() => {
            window.tapTimeout = null;
          }, 300);
        } else {
          // This is a double-tap
          clearTimeout(window.tapTimeout);
          window.tapTimeout = null;
          openLocalFile(d.data.originalData.filename);
        }
      }
    });

  // Add text labels for larger rectangles - optimize for performance and mobile
  leaf.filter(d => {
    // Only add text to rectangles that are large enough
    // Use smaller thresholds on mobile
    const width = d.x1 - d.x0;
    const height = d.y1 - d.y0;
    return isMobile.value ? (width > 40 && height > 20) : (width > 40 && height > 20);
  })
    .append('text')
    .attr('x', 4)
    .attr('y', 14)
    .attr('fill', 'white')
    .attr('font-size', isMobile.value ? '9px' : '10px') // Slightly larger font on mobile for readability
    .text(d => {
      // Keep names short but informative, even shorter on mobile
      const name = d.data.name;
      const width = d.x1 - d.x0;
      if (isMobile.value && width < 80) {
        return name.substring(0, 8) + (name.length > 8 ? '...' : '');
      } else if (width < 100) {
        return name.substring(0, 12) + (name.length > 12 ? '...' : '');
      }
      return name;
    })
    .filter(d => {
      // Only add size labels to even larger rectangles
      const width = d.x1 - d.x0;
      const height = d.y1 - d.y0;
      return isMobile.value ? (width > 60 && height > 30) : (width > 60 && height > 30);
    })
    .append('tspan')
    .attr('x', 4)
    .attr('y', 26)
    .attr('fill', 'rgba(255, 255, 255, 0.9)') // More visible
    .attr('font-size', isMobile.value ? '8px' : '9px') // Smaller font on mobile
    .text(d => formatFileSize(d.data.size));

  // Add a legend with filtering functionality - position differently on mobile
  const legend = svg.append('g')
    .attr('transform', isMobile.value
      ? `translate(10, ${height - 180})` // Bottom left on mobile - positioned for thumb reach and away from filter button
      : `translate(${width - 150}, 20)`) // Top right on desktop

  const types = ['archive', 'document', 'image', 'video', 'audio', 'other']

  // Count files by type for the legend
  const typeCounts = {};
  types.forEach(type => {
    typeCounts[type] = filteredFiles.filter(file => getFileType(file) === type).length;
  });

  // Make legend background semi-transparent on mobile with backdrop blur for better visibility
  if (isMobile.value) {
    legend.append('rect')
      .attr('x', -8)
      .attr('y', -15)
      .attr('width', 140)
      .attr('height', 160)
      .attr('fill', 'rgba(17, 24, 39, 0.85)')
      .attr('rx', 8)
      .style('backdrop-filter', 'blur(5px)')
      .style('filter', 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3))');
  }

  // Add a "Show All" option at the top - with larger touch target on mobile
  const allGroup = legend.append('g')
    .attr('transform', 'translate(0, 0)')
    .style('cursor', 'pointer')
    .on('click', () => {
      if (isMobile.value && 'vibrate' in navigator) {
        navigator.vibrate(40); // haptic feedback
      }
      activeFilter.value = null;
      if (filters) filters.fileType = null;
      createTreemap();
    });

  allGroup.append('rect')
    .attr('width', isMobile.value ? 16 : 12)
    .attr('height', isMobile.value ? 16 : 12)
    .attr('fill', '#ffffff')
    .attr('rx', isMobile.value ? 3 : 2);

  allGroup.append('text')
    .attr('x', isMobile.value ? 24 : 20)
    .attr('y', isMobile.value ? 12 : 10)
    .attr('fill', activeFilter.value === null ? '#3b82f6' : 'white')
    .attr('font-size', isMobile.value ? '11px' : '10px') // Larger on mobile for readability
    .attr('font-weight', activeFilter.value === null ? 'bold' : 'normal')
    .text(`Show All (${formatNumber(filteredFiles.length)})`);

  // Add type filters with larger touch targets on mobile
  types.forEach((type, i) => {
    // Skip types with no files
    if (typeCounts[type] === 0) return;

    const g = legend.append('g')
      .attr('transform', `translate(0, ${(i + 1) * (isMobile.value ? 24 : 20)})`) // Larger spacing on mobile
      .style('cursor', 'pointer')
      .on('click', () => {
        if (isMobile.value && 'vibrate' in navigator) {
          navigator.vibrate(40); // haptic feedback
        }
        activeFilter.value = activeFilter.value === type ? null : type;
        if (filters) filters.fileType = activeFilter.value;
        createTreemap();
      });

    g.append('rect')
      .attr('width', isMobile.value ? 16 : 12)
      .attr('height', isMobile.value ? 16 : 12)
      .attr('fill', typeColorScale(type))
      .attr('rx', isMobile.value ? 3 : 2);

    g.append('text')
      .attr('x', isMobile.value ? 24 : 20)
      .attr('y', isMobile.value ? 12 : 10)
      .attr('fill', activeFilter.value === type ? '#3b82f6' : 'white')
      .attr('font-size', isMobile.value ? '11px' : '10px') // Larger on mobile
      .attr('font-weight', activeFilter.value === type ? 'bold' : 'normal')
      .text(`${type.charAt(0).toUpperCase() + type.slice(1)} (${formatNumber(typeCounts[type])})`);

    // For mobile: add invisible touch target rectangle to increase tap area
    if (isMobile.value) {
      g.append('rect')
        .attr('width', 140)
        .attr('height', 22)
        .attr('fill', 'transparent')
        .attr('transform', 'translate(-8, -10)');
    }
  });
}

// Handle window resize
function handleResize() {
  if (treemapContainer.value) {
    createTreemap()
  }
}

function checkMobile() {
  isMobile.value = window.innerWidth < 640
}

onMounted(async () => {
  try {
    // Check if we're on mobile
    checkMobile()
    window.addEventListener('resize', checkMobile)

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

    // Parse URL parameters for filter permalinks
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.has('type')) {
      activeFilter.value = urlParams.get('type')
      filters.fileType = urlParams.get('type')
    }
    if (urlParams.has('search')) {
      filters.searchTerm = urlParams.get('search')
    }
    if (urlParams.has('minSize')) {
      filters.sizeRange.min = parseInt(urlParams.get('minSize')) || 0
    }
    if (urlParams.has('maxSize')) {
      filters.sizeRange.max = parseInt(urlParams.get('maxSize')) || Infinity
    }

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
  window.removeEventListener('resize', checkMobile)
})
</script>

<style scoped>
.tooltip-box {
  max-width: 260px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  word-break: break-word;
  overflow-wrap: break-word;
  transition: all 0.1s ease;
  padding: 0.5rem;
  background-color: rgba(17, 24, 39, 0.95);
  border-left: 2px solid #3b82f6;
}

/* Enhanced mobile tooltip */
.mobile-tooltip {
  backdrop-filter: blur(4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  padding: 0.75rem;
  border-radius: 0.5rem;
  border-left: none;
  border: 1px solid rgba(59, 130, 246, 0.3);
  background-color: rgba(17, 24, 39, 0.9);
}

@media (max-width: 640px) {
  .tooltip-box {
    max-width: 220px;
    font-size: 0.65rem;
  }
}
</style>