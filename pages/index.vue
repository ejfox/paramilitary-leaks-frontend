<template>
  <div class="min-h-screen w-screen bg-gray-900 flex flex-col overflow-hidden">
    <!-- Global Filter Bar -->
    <GlobalFilterBar :top-senders="stats.topSenders" :top-chats="stats.topChats" @filters-changed="applyGlobalFilters"
      class="flex-shrink-0" />

    <div class="flex flex-1 overflow-hidden">
      <!-- Metadata Sidebar (1/3 width) -->
      <div class="w-1/3 p-4 border-r border-gray-700 flex flex-col overflow-y-auto h-full custom-scrollbar">
        <div class="flex items-center justify-between mb-4">
          <h1 class="text-white text-xl font-bold">Paramilitary Leaks</h1>
          <NuxtLink to="/feed" class="text-blue-400 hover:text-blue-300 text-sm flex items-center">
            <span>Message Feed</span>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd"
                d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                clip-rule="evenodd" />
            </svg>
          </NuxtLink>
        </div>

        <!-- View Tabs -->
        <div class="flex mb-4 border-b border-gray-700">
          <button @click="activeView = 'time'" class="px-4 py-2 text-sm font-medium transition-colors relative"
            :class="activeView === 'time' ? 'text-blue-400' : 'text-gray-400 hover:text-gray-300'">
            <span>Time View</span>
            <div v-if="activeView === 'time'" class="absolute bottom-0 left-0 w-full h-0.5 bg-blue-400"></div>
          </button>
          <button @click="activeView = 'metadata'" class="px-4 py-2 text-sm font-medium transition-colors relative"
            :class="activeView === 'metadata' ? 'text-blue-400' : 'text-gray-400 hover:text-gray-300'">
            <span>Metadata View</span>
            <div v-if="activeView === 'metadata'" class="absolute bottom-0 left-0 w-full h-0.5 bg-blue-400"></div>
          </button>
        </div>

        <!-- Selected Point Card -->
        <transition name="fade">
          <div v-if="selectedPoint && !loading" class="feltron-card p-4 mb-4 animate-fadeIn">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center">
                <div class="w-3 h-3 rounded-full mr-2"
                  :style="{ backgroundColor: getSenderColor(getPointSender(selectedPoint)) }">
                </div>
                <div class="text-white text-base font-bold truncate">{{ getPointSender(selectedPoint) }}</div>
              </div>
              <button @click="clearSelectedPoint" class="text-gray-400 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clip-rule="evenodd" />
                </svg>
              </button>
            </div>

            <!-- Message timestamp -->
            <div class="mb-3">
              <div class="feltron-title">Timestamp</div>
              <div class="feltron-value text-white text-base">
                {{ formatSelectedPointDate(getPointTimestamp(selectedPoint)) }}
              </div>
            </div>

            <!-- Message content -->
            <div class="mb-3">
              <div class="feltron-title">Message</div>
              <div class="bg-gray-900 p-3 rounded">
                <div v-if="getPointContent(selectedPoint)"
                  class="text-white text-sm whitespace-pre-wrap break-words leading-relaxed">
                  {{ getPointContent(selectedPoint) }}
                </div>
                <div v-else class="text-gray-500 text-sm italic">No content</div>
              </div>
            </div>
          </div>
        </transition>

        <!-- Selected Points Stats -->
        <div v-if="!loading" class="space-y-4 overflow-y-auto">
          <!-- Total Messages -->
          <div class="feltron-card p-3 rounded-lg">
            <div class="feltron-title">Total Messages</div>
            <div class="feltron-value text-white text-2xl font-bold">{{ stats.totalMessages.toLocaleString() }}</div>
            <div v-if="selectedPoints.length > 0" class="text-blue-400 text-xs mt-1">
              {{ selectedPoints.length }} selected
            </div>
          </div>

          <!-- Date Range -->
          <div class="feltron-card p-3 rounded-lg">
            <div class="feltron-title">Date Range</div>
            <div class="feltron-value text-white text-base font-bold">{{ stats.dateRange }}</div>
          </div>

          <!-- Top Senders -->
          <div class="feltron-card p-3 rounded-lg">
            <div class="feltron-title mb-2">Top Senders</div>
            <div class="space-y-1">
              <div v-for="sender in stats.topSenders.slice(0, 5)" :key="sender.name"
                @click="highlightSender(sender.name)"
                class="flex justify-between items-center p-1 rounded cursor-pointer transition-colors" :class="[
                  highlightedSender === sender.name ? 'bg-red-900' : 'hover:bg-gray-700'
                ]">
                <div class="flex items-center">
                  <div class="w-2 h-2 rounded-full mr-1" :style="{ backgroundColor: getSenderColor(sender.name) }">
                  </div>
                  <span class="text-white text-sm">{{ sender.name }}</span>
                </div>
                <span class="text-white text-sm font-bold">{{ sender.count }}</span>
              </div>
            </div>
          </div>

          <!-- Controls -->
          <div class="feltron-card p-3 rounded-lg">
            <div class="feltron-title">Controls</div>
            <button @click="resetHighlight"
              class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition-colors">
              Reset View
            </button>
            <div class="text-gray-400 text-xs mt-2">
              Hold Shift to select multiple points
            </div>
          </div>
        </div>
      </div>

      <!-- Main Visualization (2/3 width) -->
      <div class="w-2/3 flex flex-col overflow-hidden">
        <!-- Loading State -->
        <div v-if="loading" class="flex-1 flex items-center justify-center">
          <div class="flex flex-col items-center">
            <div class="animate-spin mb-3">
              <svg class="w-8 h-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                </path>
              </svg>
            </div>
            <div class="text-white text-lg">Loading data from R2 storage...</div>
            <div class="text-gray-400 text-sm mt-2">This may take a moment</div>
          </div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="flex-1 flex items-center justify-center">
          <div class="flex flex-col items-center max-w-lg text-center">
            <div class="text-red-500 mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div class="text-red-500 text-xl font-bold mb-2">Error Loading Data</div>
            <div class="text-white mb-4">{{ error }}</div>
            <button @click="retryLoading"
              class="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition-colors">
              Retry Loading
            </button>
          </div>
        </div>

        <!-- Time View -->
        <div v-else-if="activeView === 'time'" class="flex-1 relative">
          <canvas ref="canvas" class="absolute inset-0 w-full h-full"></canvas>
        </div>

        <!-- Metadata View -->
        <div v-else-if="activeView === 'metadata'" class="flex-1 overflow-y-auto p-4">
          <div class="grid grid-cols-2 gap-4">
            <!-- Total Messages -->
            <div class="feltron-card p-4">
              <div class="feltron-title">Total Messages</div>
              <div class="feltron-value text-white text-4xl font-light">{{ stats.totalMessages.toLocaleString() }}</div>
            </div>

            <!-- Date Range -->
            <div class="feltron-card p-4">
              <div class="feltron-title">Date Range</div>
              <div class="feltron-value text-white text-xl font-light">{{ stats.dateRange }}</div>
            </div>

            <!-- Top Senders Visualization -->
            <div class="feltron-card p-4 col-span-2">
              <div class="feltron-title">Top Senders</div>
              <div class="space-y-2 mt-3">
                <div v-for="(sender, index) in stats.topSenders.slice(0, 5)" :key="sender.name"
                  class="relative h-8 bg-gray-900 rounded overflow-hidden">
                  <div class="absolute top-0 left-0 h-full bg-blue-900"
                    :style="{ width: (sender.count / stats.topSenders[0].count * 100) + '%' }"></div>
                  <div class="absolute top-0 left-0 h-full w-full px-3 flex items-center justify-between">
                    <div class="flex items-center">
                      <div class="w-2 h-2 rounded-full mr-2" :style="{ backgroundColor: getSenderColor(sender.name) }">
                      </div>
                      <span class="text-white text-sm">{{ sender.name }}</span>
                    </div>
                    <span class="text-white text-sm font-medium">{{ sender.count.toLocaleString() }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch, nextTick, onUnmounted } from 'vue'
import { useVisualization } from '~/composables/useVisualization'
import { useParquetLoader } from '~/composables/useParquetLoader'
import { useAppStore } from '~/composables/appStore'
import * as d3 from 'd3'
import { format } from 'date-fns'

const loading = ref(true)
const error = ref(null)
const rawData = ref([])
const filteredData = ref([])
const highlightedSender = ref(null)
const activeView = ref('time')

const appStore = useAppStore()

const { loadParquetFile } = useParquetLoader()
const {
  canvas,
  initScatterplot,
  transformData,
  highlightPoints,
  resetView,
  selectedPoint,
  selectedPoints,
  clearSelectedPoint,
  resizeAndCenterVisualization,
  updateDataWithoutReset
} = useVisualization()

// Stats for the sidebar
const stats = reactive({
  totalMessages: 0,
  dateRange: '',
  topSenders: [],
  topChats: []
})

// Format the timestamp for the selected point
function formatSelectedPointDate(timestamp) {
  if (!timestamp) return 'Unknown time';
  try {
    return format(new Date(timestamp), 'MMM d, yyyy h:mm a');
  } catch (err) {
    console.error('Error formatting date:', err);
    return 'Invalid date';
  }
}

// Get color for a sender (for the UI dots)
function getSenderColor(senderName) {
  const index = stats.topSenders.findIndex(s => s.name === senderName)
  if (index === -1) return '#ffffff'

  const normalizedIndex = index / Math.max(stats.topSenders.length - 1, 1)
  return d3.interpolateTurbo(normalizedIndex)
}

// Highlight a specific sender's messages
function highlightSender(senderName) {
  if (highlightedSender.value === senderName) {
    // Toggle off if already selected
    resetHighlight()
    return
  }

  highlightedSender.value = senderName

  // Find all points from this sender in the filtered data
  const senderPoints = filteredData.value
    .map((msg, index) => ({
      index,
      sender: getPointSender(msg)
    }))
    .filter(item => item.sender === senderName)
    .map(item => item.index)

  // Call the visualization to highlight these points
  highlightPoints(senderPoints)
}

// Reset all highlights
function resetHighlight() {
  highlightedSender.value = null
  resetView()
}

// Calculate stats from the data
function calculateStats(data) {
  if (!data || !data.length) return

  // Total messages
  stats.totalMessages = data.length

  // Date range
  const timestamps = data.map(m => new Date(getPointTimestamp(m)))
  const extent = d3.extent(timestamps)
  const formatDate = d3.timeFormat('%b %d, %Y')
  stats.dateRange = `${formatDate(extent[0])} - ${formatDate(extent[1])}`

  // Count senders and chats
  const senderCounts = {}
  const chatCounts = {}

  data.forEach(msg => {
    const sender = getPointSender(msg)
    senderCounts[sender] = (senderCounts[sender] || 0) + 1

    // Count chats
    const chatName = getPointChatName(msg)
    if (chatName) {
      chatCounts[chatName] = (chatCounts[chatName] || 0) + 1
    }
  })

  // Top senders
  stats.topSenders = Object.entries(senderCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  // Top chats
  stats.topChats = Object.entries(chatCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)
}

// Apply global filters from the store
function applyGlobalFilters() {
  if (!rawData.value.length) return

  let filtered = [...rawData.value]
  const filters = appStore.filters

  // Apply date filters
  if (filters.startDate) {
    const startDate = new Date(filters.startDate)
    filtered = filtered.filter(msg => {
      const timestamp = new Date(getPointTimestamp(msg))
      return timestamp >= startDate
    })
  }

  if (filters.endDate) {
    const endDate = new Date(filters.endDate)
    filtered = filtered.filter(msg => {
      const timestamp = new Date(getPointTimestamp(msg))
      return timestamp <= endDate
    })
  }

  // Apply sender filter
  if (filters.sender) {
    filtered = filtered.filter(msg => getPointSender(msg) === filters.sender)
  }

  // Apply chat filter
  if (filters.chat) {
    filtered = filtered.filter(msg => getPointChatName(msg) === filters.chat)
  }

  // Apply search term filter
  if (filters.searchTerm) {
    const term = filters.searchTerm.toLowerCase()
    filtered = filtered.filter(msg => {
      const content = getPointContent(msg)
      return content && content.toLowerCase().includes(term)
    })
  }

  filteredData.value = filtered
  calculateStats(filtered)

  // Update visualization without resetting camera position
  if (activeView.value === 'time') {
    updateDataWithoutReset(filtered)
  }

  // Reset any highlights
  resetHighlight()
}

// Helper functions to handle different data formats
function isNewFormat(point) {
  return point && (
    point.hasOwnProperty('date') ||
    point.hasOwnProperty('message') ||
    point.hasOwnProperty('from')
  );
}

function getPointSender(point) {
  if (!point) return 'Unknown';
  return isNewFormat(point)
    ? (point.from || point.sender || 'Unknown')
    : (point.sender_name || point.sender || 'Unknown');
}

function getPointTimestamp(point) {
  if (!point) return null;
  return isNewFormat(point) ? (point.date || point.timestamp) : point.timestamp;
}

function getPointContent(point) {
  if (!point) return null;
  // Check for different possible field names for the message content
  if (isNewFormat(point)) {
    return point.message || point.text || null;
  } else {
    return point.content || point.text || null;
  }
}

function getPointChatName(point) {
  if (!point) return null;
  return isNewFormat(point) ? (point.chat_title || point.group_chat_id || null) : (point.chat_name || point.group_chat_id || null);
}

// Update stats when selected points change
watch(selectedPoints, (newSelectedPoints) => {
  if (newSelectedPoints.length > 0) {
    // Calculate stats based on selected points
    calculateStats(newSelectedPoints)
  } else {
    // If no points are selected, use all filtered data
    calculateStats(filteredData.value)
  }
}, { deep: true })

// Handle window resize
function handleResize() {
  if (activeView.value === 'time') {
    nextTick(() => {
      // Just resize the canvas without changing the camera position
      if (canvas.value && canvas.value.__regl) {
        const container = canvas.value.parentElement;
        const rect = container.getBoundingClientRect();

        // Update canvas dimensions
        canvas.value.width = rect.width;
        canvas.value.height = rect.height;

        // Update scatterplot dimensions without changing camera
        if (canvas.value.__regl.scatter) {
          canvas.value.__regl.scatter.set({
            width: rect.width,
            height: rect.height
          });

          // Update data without resetting camera
          if (filteredData.value.length > 0) {
            updateDataWithoutReset(filteredData.value);
          }
        }
      }
    });
  }
}

// Function to retry loading data if it fails
async function retryLoading() {
  error.value = null;
  loading.value = true;

  try {
    const r2Url = 'https://r2.ejfox.com/para-leaks/telegram_chats.r3.parquet'
    console.log(`Retrying loading parquet from R2: ${r2Url}`)

    const result = await loadParquetFile(r2Url)
    if (!result.success) {
      throw new Error(result.error || 'Failed to load data')
    }

    rawData.value = result.data
    filteredData.value = result.data
    calculateStats(result.data)

    // Set default date range based on the data
    if (result.data.length > 0) {
      const timestamps = result.data.map(m => new Date(getPointTimestamp(m)))
      const [minDate, maxDate] = d3.extent(timestamps)

      // Format dates as YYYY-MM-DD for the date inputs
      const formatDateForInput = d3.timeFormat('%Y-%m-%d')
      appStore.setDateRange(formatDateForInput(minDate), formatDateForInput(maxDate))
    }

    initScatterplot()

    // Wait for the next tick to ensure the canvas is rendered
    nextTick(() => {
      transformData(result.data)

      // Ensure all points are visible
      setTimeout(() => {
        resizeAndCenterVisualization();
      }, 100);
    });

    loading.value = false
  } catch (err) {
    console.error('Retry error:', err)
    error.value = err.message
    loading.value = false
  }
}

onMounted(async () => {
  try {
    const r2Url = 'https://r2.ejfox.com/para-leaks/telegram_chats.r3.parquet'
    console.log(`Loading parquet from R2: ${r2Url}`)

    loading.value = true
    const result = await loadParquetFile(r2Url)
    if (!result.success) {
      throw new Error(result.error || 'Failed to load data')
    }

    rawData.value = result.data
    filteredData.value = result.data
    calculateStats(result.data)

    // Set default date range based on the data
    if (result.data.length > 0) {
      const timestamps = result.data.map(m => new Date(getPointTimestamp(m)))
      const [minDate, maxDate] = d3.extent(timestamps)

      // Format dates as YYYY-MM-DD for the date inputs
      const formatDateForInput = d3.timeFormat('%Y-%m-%d')
      appStore.setDateRange(formatDateForInput(minDate), formatDateForInput(maxDate))
    }

    initScatterplot()

    // Wait for the next tick to ensure the canvas is rendered
    nextTick(() => {
      transformData(result.data)

      // Ensure all points are visible
      setTimeout(() => {
        resizeAndCenterVisualization();
      }, 100);
    });

    loading.value = false

    // Add window resize listener
    window.addEventListener('resize', handleResize);
  } catch (err) {
    console.error('Init error:', err)
    error.value = err.message
    loading.value = false
  }
})

onUnmounted(() => {
  // Remove window resize listener
  window.removeEventListener('resize', handleResize);
})

// Watch for view changes
watch(activeView, (newView) => {
  if (newView === 'time') {
    nextTick(() => {
      if (!canvas.value) return;

      // If scatterplot needs to be initialized, do that first
      if (!canvas.value.__regl) {
        initScatterplot();

        if (filteredData.value.length > 0) {
          // Use transformData for initial view to properly center
          transformData(filteredData.value);
        }
      } else {
        // For subsequent view changes, use updateDataWithoutReset
        if (filteredData.value.length > 0) {
          updateDataWithoutReset(filteredData.value);
        }
      }
    })
  }
})
</script>

<style>
.tooltip {
  pointer-events: none;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.3s ease-out;
}

/* Custom scrollbar styles */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(31, 41, 55, 0.5);
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(75, 85, 99, 0.7);
  border-radius: 3px;
}

/* Feltron-inspired typography */
.feltron-title {
  font-family: 'Inter', sans-serif;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  font-size: 0.7rem;
  font-weight: 500;
  color: rgba(156, 163, 175, 0.8);
  margin-bottom: 0.5rem;
}

.feltron-value {
  font-family: 'Inter', sans-serif;
  font-weight: 300;
  letter-spacing: 0.02em;
}

.feltron-card {
  border-radius: 0.5rem;
  background-color: rgba(31, 41, 55, 1);
  border-left: 3px solid rgba(59, 130, 246, 0.8);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}
</style>
