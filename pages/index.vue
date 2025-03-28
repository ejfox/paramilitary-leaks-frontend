<template>
  <div class="min-h-screen w-screen bg-gray-900 flex flex-col overflow-hidden">
    <!-- Navigation Bar -->
    <TopBar current-page="Timeline">
      <template #additional-links>
        <!-- Mobile View Switcher -->
        <button v-if="isMobile && !showSidebar" @click="showSidebar = true"
          class="md:hidden text-gray-300 hover:text-white flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd"
              d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
              clip-rule="evenodd" />
          </svg>
          <span class="ml-1">Details</span>
        </button>
      </template>
    </TopBar>

    <!-- Global Filter Bar -->
    <GlobalFilterBar @filters-changed="applyGlobalFilters" class="flex-shrink-0" />

    <div class="flex flex-1 overflow-hidden flex-col md:flex-row relative">
      <!-- Mobile overlay for sidebar - only visible when sidebar is shown on mobile -->
      <div v-if="isMobile && showSidebar" class="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
        @click="showSidebar = false"></div>

      <!-- Metadata Sidebar - Full width on mobile when shown, 1/3 width on desktop -->
      <div :class="[
        'bg-gray-900 border-gray-700 flex flex-col overflow-y-auto custom-scrollbar transition-all duration-300',
        isMobile ? 'fixed inset-0 z-40 p-4' : 'w-full md:w-1/3 p-4 border-r'
      ]" :style="isMobile ? { transform: showSidebar ? 'translateX(0)' : 'translateX(-100%)' } : {}">

        <!-- Close button for mobile sidebar -->
        <div v-if="isMobile" class="flex items-center justify-between mb-4">
          <h1 class="text-white text-xl font-bold">Paramilitary Leaks</h1>
          <button @click="showSidebar = false" class="text-gray-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clip-rule="evenodd" />
            </svg>
          </button>
        </div>

        <!-- Desktop header - only shown on desktop -->
        <div v-else class="flex items-center justify-between mb-4">
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

          <!-- Mobile-only close button at the bottom of sidebar -->
          <div v-if="isMobile" class="mt-4">
            <button @click="showSidebar = false"
              class="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center">
              <span>Return to Visualization</span>
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-2" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd"
                  d="M10.293 15.707a1 1 0 010-1.414L14.586 10l-4.293-4.293a1 1 0 111.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z"
                  clip-rule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Main Visualization - Full width on mobile, 2/3 width on desktop -->
      <div class="flex-1 flex flex-col overflow-hidden relative">
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

        <!-- Visualization Loading Progress -->
        <div v-if="!loading && visualizationStreaming"
          class="absolute inset-0 flex items-center justify-center z-20 bg-gray-900/50">
          <div class="max-w-md w-full mx-4">
            <VisualizationLoading :processed-points="streamingProgress.processed"
              :total-points="streamingProgress.total" :start-time="streamingProgress.startTime"
              :status-message="streamingProgress.message || 'Processing visualization data...'"
              @cancel="cancelStreamingPoints" />
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

        <!-- Error display -->
        <div v-if="error && !loading" class="absolute top-4 right-4 left-4 z-30">
          <div class="bg-red-900 text-white px-4 py-3 rounded-lg shadow-lg flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div class="flex-1">{{ error }}</div>
            <button @click="error = null" class="ml-3 text-white hover:text-gray-300">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clip-rule="evenodd" />
              </svg>
            </button>
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

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div class="feltron-card p-4 col-span-1 md:col-span-2">
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
                <div v-if="selectedPoints.length > 0" class="feltron-card p-4 col-span-1 md:col-span-2">
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

      <!-- Mobile Action Button - only on mobile and when sidebar is hidden -->
      <div v-if="isMobile && !showSidebar" class="fixed right-4 bottom-4 z-30">
        <button @click="showSidebar = true"
          class="bg-blue-600 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd"
              d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
              clip-rule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch, nextTick, onUnmounted } from 'vue'
import VisualizationLoading from '~/components/VisualizationLoading.vue'
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
const visualizationStreaming = ref(false)
const streamingProgress = reactive({
  processed: 0,
  total: 0,
  startTime: 0,
  message: ''
})

// Mobile specific state
const isMobile = ref(false)
const showSidebar = ref(false)

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
  resizeVisualization,
  cancelStreamingPoints,
  streamingStatus
} = useVisualization()

const { loadParquetFile, resetDuckDB } = useParquetLoader()

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

// Apply global filters from the store - with improved searching
async function applyGlobalFilters() {
  if (!rawData.value.length) return

  console.time('filtering');
  searchLoading.value = true;

  try {
    // Get filters from the store
    const filters = appStore.filters
    const searchTerm = filters.searchTerm?.trim().toLowerCase() // Normalize search term

    // Always try DuckDB first for all filtering operations
    if (parquetBuffer.value) {
      console.log('Using DuckDB for filtering with params:', {
        searchTerm,
        startDate: filters.startDate,
        endDate: filters.endDate,
        sender: filters.sender,
        chat: filters.chat
      });

      try {
        // Use the DuckDB search function - even if no search term
        const searchResults = await searchParquet(parquetBuffer.value, searchTerm, {
          startDate: filters.startDate,
          endDate: filters.endDate,
          sender: filters.sender,
          chat: filters.chat
        });

        console.log(`DuckDB query returned ${searchResults.length} results`);

        if (searchResults.length > 0) {
          filteredData.value = searchResults;
        } else {
          // Only if DuckDB returns empty results or has issues, try in-memory
          console.log('No DuckDB results, falling back to in-memory filtering');
          performInMemoryFiltering(filters);
        }
      } catch (err) {
        console.error('DuckDB query failed:', err);
        // Log the full error details for debugging
        error.value = `Search failed: ${err.message}`;
        // Fallback to in-memory filtering if DuckDB fails
        performInMemoryFiltering(filters);
      }
    } else {
      // No parquet buffer available, use in-memory filtering
      console.log('No parquet buffer available, using in-memory filtering');
      performInMemoryFiltering(filters);
    }

    // Update stats and visualization
    calculateStats(filteredData.value);
    updateVisualization();

  } catch (err) {
    console.error('Error applying filters:', err);
    error.value = err.message;
  } finally {
    searchLoading.value = false;
    console.timeEnd('filtering');
  }
}

// Improve the in-memory filtering function
function performInMemoryFiltering(filters) {
  console.log('Performing in-memory filtering');
  let filtered = [...rawData.value];

  // Apply text search if needed - search all content fields
  if (filters.searchTerm?.trim()) {
    const searchTerm = filters.searchTerm.trim().toLowerCase();
    filtered = filtered.filter(msg => {
      if (!msg) return false;

      // Exhaustive check of all possible content-related fields
      const checkField = (fieldName) => {
        if (!msg[fieldName]) return false;
        const fieldValue = String(msg[fieldName]).toLowerCase();
        return fieldValue.includes(searchTerm);
      };

      // Check standard content fields
      if (checkField('message')) return true;
      if (checkField('text')) return true;
      if (checkField('content')) return true;
      if (checkField('body')) return true;
      if (checkField('msg')) return true;
      if (checkField('data')) return true;

      // Also check using our helper function
      const content = getPointContent(msg)?.toLowerCase() || '';
      if (content.includes(searchTerm)) return true;

      // Check for any field with a value containing the search term
      // This is more expensive but ensures we find matches in any field
      for (const key in msg) {
        if (msg[key] && typeof msg[key] === 'string') {
          if (msg[key].toLowerCase().includes(searchTerm)) {
            return true;
          }
        }
      }

      return false;
    });
    console.log(`Found ${filtered.length} messages containing "${searchTerm}"`);
  }

  // Apply other filters...
  if (filters.startDate) {
    const startDate = new Date(filters.startDate);
    filtered = filtered.filter(msg => new Date(getPointTimestamp(msg)) >= startDate);
  }

  if (filters.endDate) {
    const endDate = new Date(filters.endDate);
    filtered = filtered.filter(msg => new Date(getPointTimestamp(msg)) <= endDate);
  }

  if (filters.sender) {
    filtered = filtered.filter(msg => getPointSender(msg) === filters.sender);
  }

  if (filters.chat) {
    filtered = filtered.filter(msg => getPointChatName(msg) === filters.chat);
  }

  filteredData.value = filtered;
  console.log(`Filtering returned ${filtered.length} results`);
}

// Add this helper function to update the visualization
function updateVisualization() {
  if (filteredData.value.length < rawData.value.length) {
    // Create a map of filtered messages for faster lookup
    const filteredMap = new Set(
      filteredData.value.map(msg =>
        `${getPointTimestamp(msg)}|${getPointSender(msg)}`
      )
    );

    // Find indices of filtered messages in raw data
    const indices = rawData.value.reduce((acc, msg, idx) => {
      const key = `${getPointTimestamp(msg)}|${getPointSender(msg)}`;
      if (filteredMap.has(key)) acc.push(idx);
      return acc;
    }, []);

    if (indices.length > 0) {
      filterPointsWithoutMoving(indices, true);
    } else {
      clearSelectedPoint();
    }
  } else {
    resetView();
  }
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

  // Calculate content - be explicit about which fields we check
  let content = null;

  // Try all possible content fields directly
  if (point.message) content = point.message;
  else if (point.text) content = point.text;
  else if (point.content) content = point.content;
  else if (point.body) content = point.body;
  else if (point.msg) content = point.msg;
  else if (point.data) content = point.data;

  // If we still don't have content, check for any string field that might contain content
  if (!content && point) {
    // Look for any property that looks like it might contain text content
    for (const key in point) {
      if (point[key] && typeof point[key] === 'string' &&
        point[key].length > 5 && // Skip very short values like IDs
        !['id', 'timestamp', 'date', 'from', 'sender', 'chat_title', 'group_chat_id', 'chat_name'].includes(key)) {
        content = point[key];
        break;
      }
    }

    // Only log a small sample of issues to avoid console spam
    if (!content && Math.random() < 0.0001) { // Only log 0.01% of issues
      console.debug('Sample of data with no content found:', JSON.stringify(point).slice(0, 200));
    }
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
  checkIfMobile()

  if (activeView.value === 'time') {
    nextTick(() => {
      resizeVisualization();
    });
  }

  // If we're on desktop, always show sidebar
  if (!isMobile.value) {
    showSidebar.value = false
  }
}

onMounted(async () => {
  try {
    // Check if mobile on initial load
    checkIfMobile()

    // Set up resize listener
    window.addEventListener('resize', handleResize)

    console.log('Loading parquet data from R2...')
    loading.value = true

    // Initialize the visualization first so it's ready when data arrives
    initScatterplot()

    // First try to reset DuckDB to clear any existing tables/connections
    try {
      console.log('Performing DuckDB reset before data load')
      await resetDuckDB()
    } catch (resetErr) {
      console.warn('DuckDB reset failed, continuing anyway:', resetErr)
      // Continue anyway, the load may still succeed
    }

    // Load data with proper error handling
    let result
    try {
      result = await loadParquetFile()
    } catch (loadErr) {
      console.error('Error loading parquet data:', loadErr)

      // If first attempt fails, try a reset and retry
      console.log('First attempt failed, trying reset + retry')
      try {
        await resetDuckDB()
        // Wait a bit longer after reset
        await new Promise(resolve => setTimeout(resolve, 1000))
        // Try loading again
        result = await loadParquetFile()
        console.log('Retry successful after reset')
      } catch (retryErr) {
        console.error('Retry also failed:', retryErr)
        error.value = retryErr.message || 'Failed to load data even after reset'
        loading.value = false
        return
      }
    }

    if (!result || !result.success) {
      const errorMsg = (result && result.error) || 'Failed to load data from R2'
      throw new Error(errorMsg)
    }

    if (!result.data || !Array.isArray(result.data) || result.data.length === 0) {
      throw new Error('Loaded data is empty or invalid')
    }

    // Log a sample of the data to help diagnose format issues
    console.log(`Successfully loaded ${result.data.length} rows from R2`)
    console.log('First data point sample:', result.data[0])

    // Additional logging for troubleshooting
    console.log('TIMESTAMP CHECK - First 5 points:',
      result.data.slice(0, 5).map(p => ({
        raw: p.date || p.timestamp,
        parsed: getPointTimestamp(p) ? 'valid' : 'invalid',
        type: typeof (p.date || p.timestamp)
      }))
    );

    // Validate the data has required fields
    const samplePoint = result.data[0]
    const hasTimestamp = samplePoint.timestamp || samplePoint.date
    if (!hasTimestamp) {
      console.warn('Data appears to be missing timestamp/date fields:', samplePoint)
    }

    // Store the raw data
    rawData.value = result.data
    filteredData.value = result.data

    // Get the parquet buffer for direct DuckDB queries if available
    if (result.buffer) {
      parquetBuffer.value = result.buffer
      console.log('Parquet buffer stored for direct DuckDB queries')
    }

    // Initialize the color map with all data
    try {
      colorMap.initialize(result.data, getPointSender)
    } catch (colorErr) {
      console.warn('Error initializing color map:', colorErr)
      // Continue anyway - visualization will use fallback colors
    }

    try {
      calculateStats(result.data)
    } catch (statsErr) {
      console.warn('Error calculating stats:', statsErr)
      // Continue anyway - stats will be incomplete but won't block visualization
    }

    // Set default date range based on the data
    try {
      if (result.data.length > 0) {
        // Filter out invalid timestamps first
        const validTimestamps = result.data
          .map(m => {
            try {
              return getPointTimestamp(m)
            } catch (e) {
              return null
            }
          })
          .filter(Boolean)

        console.log(`Found ${validTimestamps.length} valid timestamps out of ${result.data.length} records`);

        if (validTimestamps.length > 0) {
          const [minDate, maxDate] = d3.extent(validTimestamps)
          if (minDate && maxDate) {
            // Format dates as YYYY-MM-DD for the date inputs
            const formatDateForInput = d3.timeFormat('%Y-%m-%d')
            appStore.setDateRange(formatDateForInput(minDate), formatDateForInput(maxDate))
          }
        } else {
          console.error('No valid timestamps found! Check timestamp parsing');
        }
      }
    } catch (dateErr) {
      console.warn('Error setting date range:', dateErr)
      // Continue anyway - date range will use defaults
    }

    // Process data in chunks for better responsiveness with large datasets
    nextTick(() => {
      try {
        console.log('Starting data transformation...')

        // Set up watcher for streaming status
        const unwatchStreaming = watch(() => streamingStatus.active, (isActive) => {
          visualizationStreaming.value = isActive
          if (isActive) {
            streamingProgress.processed = streamingStatus.processed
            streamingProgress.total = streamingStatus.total
            streamingProgress.startTime = streamingStatus.startTime
            streamingProgress.message = streamingStatus.message
          }
        }, { immediate: true })

        // Set up watcher for progress updates
        const unwatchProgress = watch(() => streamingStatus.processed, (processed) => {
          streamingProgress.processed = processed
        })

        // For large datasets, defer rendering to avoid blocking the main thread
        if (result.data.length > 10000) {
          console.log('Large dataset detected, deferring render...')
          setTimeout(() => {
            try {
              transformData(result.data)
              loading.value = false
            } catch (transformErr) {
              console.error('Error during deferred transform:', transformErr)
              error.value = 'Error rendering visualization: ' + transformErr.message
              loading.value = false
            }

            // Clean up watchers when all processing is complete
            const checkComplete = watch(() => streamingStatus.active, (isActive) => {
              if (!isActive) {
                unwatchStreaming()
                unwatchProgress()
                checkComplete()
              }
            })
          }, 0)
        } else {
          try {
            transformData(result.data)
            loading.value = false
          } catch (transformErr) {
            console.error('Error during transform:', transformErr)
            error.value = 'Error rendering visualization: ' + transformErr.message
            loading.value = false
          }

          // Clean up watchers when all processing is complete
          const checkComplete = watch(() => streamingStatus.active, (isActive) => {
            if (!isActive) {
              unwatchStreaming()
              unwatchProgress()
              checkComplete()
            }
          })
        }
      } catch (transformErr) {
        console.error('Error transforming data:', transformErr)
        error.value = 'Error preparing visualization: ' + transformErr.message
        loading.value = false
      }
    });

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

// Check if the screen is mobile sized
function checkIfMobile() {
  isMobile.value = window.innerWidth < 768 // md breakpoint in Tailwind
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

/* Mobile specific styles */
@media (max-width: 768px) {
  .message-container {
    height: 120px;
    /* Smaller on mobile */
  }

  .feltron-card {
    border-radius: 0.4rem;
  }
}
</style>
