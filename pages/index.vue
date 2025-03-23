<template>
  <div class="min-h-screen w-screen bg-gray-900 flex flex-col overflow-hidden">
    <!-- Global Filter Bar -->
    <GlobalFilterBar @filters-changed="applyGlobalFilters" class="flex-shrink-0" />

    <!-- Navigation Bar -->
    <TopBar current-page="Timeline">
      <template #additional-links>
        <!-- Additional page-specific links can be added here if needed -->
      </template>
    </TopBar>

    <div class="flex flex-1 overflow-hidden">
      <!-- Metadata Sidebar (1/3 width) -->
      <div class="w-1/3 p-4 border-r border-gray-700 flex flex-col overflow-y-auto h-full custom-scrollbar">
        <div class="flex items-center justify-between mb-4">
          <h1 class="text-white text-xl font-bold">Paramilitary Leaks</h1>
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

        <!-- Selected Point Card - Fixed Height Container -->
        <div class="feltron-card p-4 mb-4 min-h-[200px] relative">
          <!-- No selection state -->
          <div v-if="(!selectedPoint && !hoveredPoint) || loading"
            class="flex flex-col items-center justify-center h-full text-center">
            <div class="text-gray-400 text-sm">
              <div class="mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 mx-auto text-gray-500" fill="none"
                  viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                    d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
              </div>
              <p>Click on a point to view details</p>
              <p class="text-xs mt-1">Hold Shift to select multiple points</p>
            </div>
          </div>

          <!-- Point details content -->
          <transition name="fade" mode="out-in">
            <div v-if="(selectedPoint || hoveredPoint) && !loading" class="animate-fadeIn">
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center">
                  <div class="w-3 h-3 rounded-full mr-2"
                    :style="{ backgroundColor: getSenderColor(getPointSender(hoveredPoint || selectedPoint)) }">
                  </div>
                  <div class="text-white text-base font-bold truncate">{{ getPointSender(hoveredPoint || selectedPoint)
                  }}
                  </div>
                </div>
                <div class="flex items-center">
                  <div v-if="selectedPoints.length > 1" class="text-blue-400 text-xs mr-2">
                    {{ selectedPoints.length }} points selected
                  </div>
                  <button @click="clearSelectedPoint" class="text-gray-400 hover:text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clip-rule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>

              <!-- Message timestamp -->
              <div class="mb-3">
                <div class="feltron-title">Timestamp</div>
                <div class="feltron-value text-white text-base">
                  {{ formatSelectedPointDate(getPointTimestamp(hoveredPoint || selectedPoint)) }}
                </div>
              </div>

              <!-- Message content -->
              <div class="mb-3">
                <div class="feltron-title">Message</div>
                <div class="bg-gray-900 p-3 rounded message-container">
                  <div v-if="getPointContent(hoveredPoint || selectedPoint)"
                    class="text-white text-sm whitespace-pre-wrap break-words leading-relaxed message-content">
                    {{ getPointContent(hoveredPoint || selectedPoint) }}
                  </div>
                  <div v-else class="text-gray-500 text-sm italic">No content</div>
                </div>
              </div>
            </div>
          </transition>
        </div>

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
          <div v-if="!selectedPoint || selectedPoints.length !== 1" class="feltron-card p-3 rounded-lg">
            <div class="feltron-title mb-2">Top Senders</div>
            <div class="space-y-1 max-h-60 overflow-y-auto custom-scrollbar pr-1">
              <div v-for="sender in stats.topSenders" :key="sender.name" @click="highlightSender(sender.name)"
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

            <!-- See in feed button (only shown when multiple points are selected) -->
            <div v-if="selectedPoints.length > 1" class="mb-2">
              <NuxtLink :to="{ path: '/feed', query: getFeedQueryParams() }"
                class="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded transition-colors flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                See {{ selectedPoints.length }} Points in Feed
              </NuxtLink>
            </div>

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
      <div class="w-2/3 flex flex-col overflow-hidden relative">
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
            <div class="text-white">Loading data...</div>
          </div>
        </div>
        <div v-if="error" class="text-red-500 p-4">{{ error }}</div>

        <!-- Search status bar -->
        <div v-if="!loading && hasActiveFilters() && filteredData.length < rawData.length"
          class="bg-blue-900 text-white px-4 py-2 flex justify-between items-center">
          <div class="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd"
                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                clip-rule="evenodd" />
            </svg>
            <span>
              Showing {{ filteredData.length.toLocaleString() }} of {{ rawData.length.toLocaleString() }} messages
              {{ appStore.filters.searchTerm ? `matching "${appStore.filters.searchTerm}"` : '' }}
            </span>
          </div>
          <button @click="resetFilters" class="text-sm hover:underline flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clip-rule="evenodd" />
            </svg>
            Clear Filters
          </button>
        </div>

        <!-- Search loading overlay -->
        <div v-if="searchLoading" class="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center z-20">
          <div class="bg-gray-800 rounded-lg p-4 shadow-lg flex items-center">
            <div class="animate-spin mr-3">
              <svg class="w-6 h-6 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                </path>
              </svg>
            </div>
            <div class="text-white">Searching...</div>
          </div>
        </div>

        <!-- Scatterplot visualization - always present -->
        <div class="flex-1 relative">
          <canvas ref="canvas" class="absolute inset-0 w-full h-full"></canvas>
        </div>

        <!-- Metadata Modal Overlay -->
        <transition name="fade">
          <div v-show="activeView === 'metadata'" class="absolute inset-0 z-10">
            <!-- Blurred backdrop -->
            <div class="absolute inset-0 backdrop-blur-sm bg-gray-900/70"></div>

            <!-- Modal content -->
            <div
              class="absolute inset-4 overflow-y-auto bg-gray-800/90 rounded-lg border border-gray-700 shadow-2xl p-6">
              <div class="flex justify-between items-center mb-4">
                <h2 class="text-white text-xl font-bold">Metadata Analysis</h2>
                <button @click="activeView = 'time'" class="text-gray-400 hover:text-white transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clip-rule="evenodd" />
                  </svg>
                </button>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <!-- Total Messages -->
                <div class="feltron-card p-4">
                  <div class="feltron-title">Total Messages</div>
                  <div class="feltron-value text-white text-4xl font-light">{{ stats.totalMessages.toLocaleString() }}
                  </div>
                  <div v-if="selectedPoints.length > 0" class="text-blue-400 text-sm mt-1">
                    {{ selectedPoints.length }} selected
                  </div>
                </div>

                <!-- Date Range -->
                <div class="feltron-card p-4">
                  <div class="feltron-title">Date Range</div>
                  <div class="feltron-value text-white text-xl font-light">{{ stats.dateRange }}</div>
                </div>

                <!-- Top Senders Visualization -->
                <div class="feltron-card p-4 col-span-2">
                  <div class="feltron-title">Top Senders</div>
                  <div class="space-y-2 mt-3 max-h-80 overflow-y-auto custom-scrollbar pr-1">
                    <div v-for="(sender, index) in stats.topSenders" :key="sender.name"
                      class="relative h-8 bg-gray-900 rounded overflow-hidden">
                      <div class="absolute top-0 left-0 h-full bg-blue-900"
                        :style="{ width: (sender.count / stats.topSenders[0].count * 100) + '%' }"></div>
                      <div class="absolute top-0 left-0 h-full w-full px-3 flex items-center justify-between">
                        <div class="flex items-center">
                          <div class="w-2 h-2 rounded-full mr-2"
                            :style="{ backgroundColor: getSenderColor(sender.name) }">
                          </div>
                          <span class="text-white text-sm">{{ sender.name }}</span>
                        </div>
                        <span class="text-white text-sm font-medium">{{ sender.count.toLocaleString() }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Selected Messages (only shown when points are selected) -->
                <div v-if="selectedPoints.length > 0" class="feltron-card p-4 col-span-2">
                  <div class="feltron-title">Selected Messages</div>
                  <div class="text-white text-sm mb-2">
                    Showing {{ Math.min(selectedPoints.length, 100) }} of {{ selectedPoints.length }} selected messages
                  </div>

                  <div class="space-y-3 mt-3 max-h-96 overflow-y-auto custom-scrollbar pr-1">
                    <div v-for="(point, index) in selectedPoints.slice(0, 100)" :key="index"
                      class="bg-gray-800 p-3 rounded border-l-2 border-blue-500">
                      <div class="flex items-center justify-between mb-1">
                        <div class="flex items-center">
                          <div class="w-2 h-2 rounded-full mr-2"
                            :style="{ backgroundColor: getSenderColor(getPointSender(point)) }">
                          </div>
                          <span class="text-white text-sm font-medium">{{ getPointSender(point) }}</span>
                        </div>
                        <span class="text-gray-400 text-xs">
                          {{ formatSelectedPointDate(getPointTimestamp(point)) }}
                        </span>
                      </div>
                      <div class="text-white text-sm mt-1 whitespace-pre-wrap break-words">
                        {{ getPointContent(point) || 'No content' }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch, nextTick, onUnmounted } from 'vue'
import { useVisualization } from '~/composables/useVisualization'
import { useParquetLoader } from '~/composables/useParquetLoader'
import { useFuzzySearch } from '~/composables/useFuzzySearch'
import { useAppStore } from '~/composables/appStore'
import { useColorMap } from '~/composables/useColorMap'
import * as d3 from 'd3'
import { format } from 'date-fns'
import TopBar from '~/components/TopBar.vue'
import GlobalFilterBar from '~/components/GlobalFilterBar.vue'
import debounce from 'lodash/debounce'

const loading = ref(true)
const error = ref(null)
const rawData = ref([])
const filteredData = ref([])
const parquetBuffer = ref(null)
const highlightedSender = ref(null)
const activeView = ref('time')
const searchLoading = ref(false)

const appStore = useAppStore()
const colorMap = useColorMap()
const { searchParquet, isSearching, searchError, cleanup: cleanupSearch } = useFuzzySearch()

const {
  canvas,
  initScatterplot,
  transformData,
  filterPointsWithoutMoving,
  resetView,
  selectedPoint,
  selectedPoints,
  hoveredPoint,
  clearSelectedPoint,
  resizeVisualization
} = useVisualization()

const { loadParquetFile } = useParquetLoader()

// Stats for the sidebar
const stats = reactive({
  totalMessages: 0,
  dateRange: '',
  topSenders: [],
  topChats: []
})

// Cache for sender names to avoid repeated format checks
const senderCache = new Map();

// Cache for chat names to avoid repeated format checks
const chatNameCache = new Map();

// Cache for timestamps to avoid repeated format checks
const timestampCache = new Map();

// Cache for message content to avoid repeated format checks
const contentCache = new Map();

// Cache for unique senders to avoid recalculating
let uniqueSendersCache = null;

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
  return colorMap.getSenderColor(senderName)
}

// Highlight a specific sender's messages
function highlightSender(senderName) {
  console.log('highlightSender called with', senderName);

  if (highlightedSender.value === senderName) {
    // Toggle off if already selected
    console.log('Toggling off highlight for', senderName);
    resetHighlight()
    return
  }

  highlightedSender.value = senderName

  console.time('highlight sender');

  // Find all points from this sender in the filtered data
  const senderPoints = filteredData.value.filter(msg => getPointSender(msg) === senderName);
  console.log('Found', senderPoints.length, 'points for sender', senderName);

  // Create a map for faster lookups
  const filteredDataMap = new Map();
  filteredData.value.forEach((item, index) => {
    const key = getPointTimestamp(item) + '|' + getPointSender(item);
    filteredDataMap.set(key, index);
  });

  // Get the indices for visualization using the map
  const senderIndices = senderPoints.map(msg => {
    const key = getPointTimestamp(msg) + '|' + getPointSender(msg);
    return filteredDataMap.get(key);
  }).filter(index => index !== undefined);

  console.log('Valid indices for visualization:', senderIndices.length);
  console.timeEnd('highlight sender');

  // Call the visualization to highlight these points
  filterPointsWithoutMoving(senderIndices)
}

// Reset all highlights
function resetHighlight() {
  highlightedSender.value = null;
  resetView();
}

// Calculate stats from the data
function calculateStats(data) {
  console.log('calculateStats called with', data.length, 'points');

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

  // Log the sender counts for debugging
  console.log('Sender counts:', senderCounts);

  // Top senders - don't limit to 10 when we have selected points
  stats.topSenders = Object.entries(senderCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)

  // Log the top senders for debugging
  console.log('Top senders:', stats.topSenders);

  // Top chats - don't limit to 6 when we have selected points
  stats.topChats = Object.entries(chatCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
}

// Apply global filters from the store
async function applyGlobalFilters() {
  if (!rawData.value.length) return

  console.time('filtering');
  searchLoading.value = true;

  try {
    // Get filters from the store
    const filters = appStore.filters

    // If we have a search term, use DuckDB for efficient searching directly on parquet
    if (filters.searchTerm && filters.searchTerm.trim() !== '' && parquetBuffer.value) {
      console.log('Searching parquet with term:', filters.searchTerm);

      try {
        // Use the improved DuckDB searchParquet function which handles all filtering
        const searchResults = await searchParquet(parquetBuffer.value, filters.searchTerm, {
          startDate: filters.startDate,
          endDate: filters.endDate,
          sender: filters.sender,
          chat: filters.chat
        });

        console.log(`DuckDB search returned ${searchResults.length} results out of ${rawData.value.length} total messages`);

        if (searchResults.length > 0 || searchError.value === null) {
          filteredData.value = searchResults;
        } else {
          console.log('DuckDB search failed, falling back to in-memory search');
          performInMemoryFiltering(filters);
        }
      } catch (err) {
        console.error('DuckDB search failed:', err);
        console.log('Falling back to in-memory search');
        performInMemoryFiltering(filters);
      }
    } else {
      // No search term or no parquet buffer, just apply basic filters in memory
      performInMemoryFiltering(filters);
    }

    // Update stats
    calculateStats(filteredData.value);

    // Create a better mapping between filtered data and visualization points
    if (activeView.value === 'time') {
      if (filteredData.value.length < rawData.value.length) {
        console.log('Updating visualization with filtered points');

        // Better way to find matching indices - using a set of unique identifiers
        const filteredKeys = new Set();
        filteredData.value.forEach(item => {
          // Create a unique key for each message combining timestamp and sender
          const timestamp = getPointTimestamp(item);
          const sender = getPointSender(item);
          if (timestamp && sender) {
            filteredKeys.add(`${timestamp}|${sender}`);
          }
        });

        // Find matching indices in raw data
        const filteredIndices = [];
        rawData.value.forEach((item, index) => {
          const timestamp = getPointTimestamp(item);
          const sender = getPointSender(item);
          if (timestamp && sender) {
            const key = `${timestamp}|${sender}`;
            if (filteredKeys.has(key)) {
              filteredIndices.push(index);
            }
          }
        });

        console.log(`Found ${filteredIndices.length} matching points in visualization`);

        if (filteredIndices.length > 0) {
          // Pass isTextSearch: true when we're filtering by text search term
          filterPointsWithoutMoving(filteredIndices, !!filters.searchTerm);
        } else {
          // If no points match the filter, just clear selection
          clearSelectedPoint();
        }
      } else {
        // If no filters are active, reset to show all points
        console.log('Resetting visualization to show all points');
        resetView();
      }
    }
  } catch (err) {
    console.error('Error applying filters:', err);
    error.value = err.message;
  } finally {
    searchLoading.value = false;
    console.timeEnd('filtering');
  }
}

// Helper function to perform in-memory filtering
function performInMemoryFiltering(filters) {
  console.log('Performing in-memory filtering');
  let filtered = [...rawData.value];

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

  // Apply text search if needed
  if (filters.searchTerm && filters.searchTerm.trim() !== '') {
    const searchTerm = filters.searchTerm.toLowerCase();
    filtered = filtered.filter(msg => {
      const content = getPointContent(msg);
      return content && content.toLowerCase().includes(searchTerm);
    });
  }

  filteredData.value = filtered;
  console.log(`In-memory filtering returned ${filtered.length} results`);
}

// Helper to check if any filters are active
function hasActiveFilters() {
  const filters = appStore.filters;
  return filters.startDate || filters.endDate || filters.sender || filters.chat || filters.searchTerm;
}

// Generate query parameters for the feed page based on selected points
function getFeedQueryParams() {
  if (!selectedPoints.value || selectedPoints.value.length <= 1) return {};

  // Check if all points have the same sender
  const uniqueSenders = new Set(selectedPoints.value.map(p => getPointSender(p)));
  if (uniqueSenders.size === 1) {
    return { sender: Array.from(uniqueSenders)[0] };
  }

  // Check if all points have the same date
  const getDateString = (point) => {
    const timestamp = getPointTimestamp(point);
    if (!timestamp) return null;
    return new Date(timestamp).toISOString().split('T')[0]; // Get YYYY-MM-DD
  };

  const uniqueDates = new Set(selectedPoints.value.map(p => getDateString(p)).filter(Boolean));
  if (uniqueDates.size === 1) {
    return { date: Array.from(uniqueDates)[0] };
  }

  // Check if all points have the same chat
  const uniqueChats = new Set(selectedPoints.value.map(p => getPointChatName(p)).filter(Boolean));
  if (uniqueChats.size === 1) {
    return { chat: Array.from(uniqueChats)[0] };
  }

  // If points don't share common attributes, just use the date range as fallback
  const dates = selectedPoints.value
    .map(p => getPointTimestamp(p))
    .filter(Boolean)
    .map(d => new Date(d));

  if (dates.length > 0) {
    const [minDate, maxDate] = d3.extent(dates);
    const formatDate = d3.timeFormat('%Y-%m-%d');

    // If date range spans multiple days
    if (formatDate(minDate) !== formatDate(maxDate)) {
      return {
        startDate: formatDate(minDate),
        endDate: formatDate(maxDate)
      };
    } else {
      // Just one day
      return { date: formatDate(minDate) };
    }
  }

  // Fallback - just return empty params
  return {};
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

  // Check cache first
  if (senderCache.has(point)) {
    return senderCache.get(point);
  }

  // Calculate sender name
  const sender = isNewFormat(point)
    ? (point.from || point.sender || 'Unknown')
    : (point.sender_name || point.sender || 'Unknown');

  // Cache the result
  senderCache.set(point, sender);

  return sender;
}

function getPointTimestamp(point) {
  if (!point) return null;

  // Check cache first
  if (timestampCache.has(point)) {
    return timestampCache.get(point);
  }

  // Calculate timestamp
  const timestamp = isNewFormat(point) ? (point.date || point.timestamp) : point.timestamp;

  // Cache the result
  timestampCache.set(point, timestamp);

  return timestamp;
}

function getPointContent(point) {
  if (!point) return null;

  // Check cache first
  if (contentCache.has(point)) {
    return contentCache.get(point);
  }

  // Calculate content
  let content = null;
  if (isNewFormat(point)) {
    content = point.message || point.text || null;
  } else {
    content = point.content || point.text || null;
  }

  // Cache the result
  contentCache.set(point, content);

  return content;
}

function getPointChatName(point) {
  if (!point) return null;

  // Check cache first
  if (chatNameCache.has(point)) {
    return chatNameCache.get(point);
  }

  // Calculate chat name
  const chatName = isNewFormat(point)
    ? (point.chat_title || point.group_chat_id || null)
    : (point.chat_name || point.group_chat_id || null);

  // Make sure we're returning a string or null
  const result = chatName === undefined ? null : chatName;

  // Cache the result
  chatNameCache.set(point, result);

  return result;
}

// Update stats when selected points change
watch(selectedPoints, (newSelectedPoints) => {
  console.log('selectedPoints changed:', newSelectedPoints.length);

  if (newSelectedPoints && newSelectedPoints.length > 0) {
    // Calculate stats based on selected points
    console.log('Calculating stats for', newSelectedPoints.length, 'selected points');

    // Make sure we have valid points
    const validPoints = newSelectedPoints.filter(point => point && (getPointSender(point) || getPointTimestamp(point)));
    console.log('Valid points for stats:', validPoints.length);

    if (validPoints.length > 0) {
      calculateStats(validPoints);
    } else {
      console.log('No valid points for stats, using filtered data');
      calculateStats(filteredData.value);
    }
  } else {
    // If no points are selected, use all filtered data
    console.log('No points selected, calculating stats for all filtered data');
    calculateStats(filteredData.value);
  }
}, { deep: true })

// Handle window resize
function handleResize() {
  if (activeView.value === 'time') {
    nextTick(() => {
      resizeVisualization();
    });
  }
}

onMounted(async () => {
  try {
    console.log('Loading parquet data from R2...')

    const result = await loadParquetFile()

    if (!result.success) {
      throw new Error(result.error || 'Failed to load data from R2')
    }

    // Store the raw data
    console.log(`Successfully loaded ${result.data.length} rows from R2`)
    rawData.value = result.data
    filteredData.value = result.data

    // Get the parquet buffer for direct DuckDB queries if available
    if (result.buffer) {
      parquetBuffer.value = result.buffer
      console.log('Parquet buffer stored for direct DuckDB queries')
    }

    // Initialize the color map with all data
    colorMap.initialize(result.data, getPointSender)

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

  // Clean up DuckDB resources
  cleanupSearch();
})

// Watch for view changes
watch(activeView, (newView, oldView) => {
  console.log(`View changed from ${oldView} to ${newView}`);

  // Just trigger a resize when switching to time view
  if (newView === 'time') {
    nextTick(() => {
      if (canvas.value) {
        resizeVisualization();
      }
    });
  }
})

// Reset all filters and reload the visualization
function resetFilters() {
  appStore.resetFilters();
  filteredData.value = rawData.value;
  calculateStats(rawData.value);
  resetView();
}
</script>

<style>
.tooltip {
  pointer-events: none;
}

/* Fixed height message container */
.message-container {
  height: 150px;
  overflow-y: auto;
}

.message-content {
  word-break: break-word;
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

/* Apply same scrollbar style to message container */
.message-container::-webkit-scrollbar {
  width: 6px;
}

.message-container::-webkit-scrollbar-track {
  background: rgba(31, 41, 55, 0.5);
}

.message-container::-webkit-scrollbar-thumb {
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
