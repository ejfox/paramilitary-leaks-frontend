<template>
  <div class="min-h-screen w-screen bg-gray-900 flex flex-col overflow-hidden">
    <!-- Header with navigation -->
    <div class="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
      <h1 class="text-white text-lg font-bold">Paramilitary Leaks</h1>
      <div class="flex space-x-4">
        <NuxtLink to="/" class="text-gray-300 hover:text-white transition-colors text-sm">
          Dashboard
        </NuxtLink>
        <span class="text-blue-400 font-medium text-sm">Message Feed</span>
      </div>
    </div>

    <!-- Main content -->
    <div class="flex-1 overflow-hidden flex flex-col">
      <!-- Loading state -->
      <div v-if="loading" class="flex-1 flex items-center justify-center">
        <div class="bg-gray-800 p-4 rounded-lg flex items-center space-x-3">
          <div class="animate-spin">
            <svg class="w-5 h-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
              </path>
            </svg>
          </div>
          <div class="text-white text-sm">Loading messages...</div>
        </div>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="flex-1 flex items-center justify-center">
        <div class="bg-red-900/50 p-4 rounded-lg text-white max-w-lg">
          <h3 class="text-base font-bold mb-1">Error</h3>
          <p class="text-sm">{{ error }}</p>
        </div>
      </div>

      <!-- Content loaded -->
      <template v-else>
        <!-- Filter controls -->
        <div class="bg-gray-800 px-3 py-2 border-b border-gray-700">
          <div class="flex flex-wrap gap-2 items-center text-xs">
            <!-- Sender filter -->
            <div class="flex items-center space-x-1">
              <label class="text-gray-400">Sender:</label>
              <select v-model="filters.sender" @change="applyFilters"
                class="bg-gray-900 text-white border border-gray-700 rounded py-0.5 px-1 focus:outline-none focus:ring-1 focus:ring-blue-500">
                <option value="">All</option>
                <option v-for="sender in stats.topSenders" :key="sender.name" :value="sender.name">
                  {{ sender.name }}
                </option>
              </select>
            </div>

            <!-- Chat filter -->
            <div class="flex items-center space-x-1">
              <label class="text-gray-400">Chat:</label>
              <select v-model="filters.chat" @change="applyFilters"
                class="bg-gray-900 text-white border border-gray-700 rounded py-0.5 px-1 focus:outline-none focus:ring-1 focus:ring-blue-500">
                <option value="">All</option>
                <option v-for="chat in stats.topChats" :key="chat.name" :value="chat.name">
                  {{ chat.name }}
                </option>
              </select>
            </div>

            <!-- Date range filter -->
            <div class="flex items-center space-x-1">
              <label class="text-gray-400">Date:</label>
              <input v-model="filters.startDate" type="date" @change="applyFilters"
                class="bg-gray-900 text-white border border-gray-700 rounded py-0.5 px-1 w-32 focus:outline-none focus:ring-1 focus:ring-blue-500">
              <span class="text-gray-400">-</span>
              <input v-model="filters.endDate" type="date" @change="applyFilters"
                class="bg-gray-900 text-white border border-gray-700 rounded py-0.5 px-1 w-32 focus:outline-none focus:ring-1 focus:ring-blue-500">
            </div>

            <!-- Sort order -->
            <div class="flex items-center space-x-1">
              <label class="text-gray-400">Sort:</label>
              <select v-model="sortOrder" @change="applySortOrder"
                class="bg-gray-900 text-white border border-gray-700 rounded py-0.5 px-1 focus:outline-none focus:ring-1 focus:ring-blue-500">
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
              </select>
            </div>

            <!-- Reset filters -->
            <button @click="resetFilters"
              class="ml-auto bg-blue-600 hover:bg-blue-700 text-white py-0.5 px-2 rounded text-xs transition-colors">
              Reset
            </button>

            <!-- Keyboard shortcuts info -->
            <button @click="showShortcuts = !showShortcuts"
              class="bg-gray-700 hover:bg-gray-600 text-white py-0.5 px-2 rounded text-xs transition-colors flex items-center">
              <span class="mr-1">⌨</span> Shortcuts
            </button>
          </div>

          <!-- Keyboard shortcuts panel -->
          <div v-if="showShortcuts" class="mt-2 bg-gray-900 p-2 rounded text-xs grid grid-cols-3 gap-x-4 gap-y-1">
            <div class="text-gray-400"><span class="text-white font-mono">←/→</span> Previous/Next page</div>
            <div class="text-gray-400"><span class="text-white font-mono">Home</span> First page</div>
            <div class="text-gray-400"><span class="text-white font-mono">End</span> Last page</div>
            <div class="text-gray-400"><span class="text-white font-mono">r</span> Reset filters</div>
            <div class="text-gray-400"><span class="text-white font-mono">s</span> Toggle sort order</div>
            <div class="text-gray-400"><span class="text-white font-mono">?</span> Toggle shortcuts</div>
          </div>
        </div>

        <!-- Message count and pagination info -->
        <div class="bg-gray-800 px-3 py-1 border-b border-gray-700 flex items-center justify-between text-xs">
          <div class="text-gray-300">
            {{ paginatedMessages.length > 0 ? (currentPage - 1) * pageSize + 1 : 0 }}-{{ Math.min(currentPage *
              pageSize, filteredMessages.length) }}
            of {{ filteredMessages.length.toLocaleString() }} messages
          </div>
          <div class="flex items-center space-x-2">
            <button @click="prevPage" :disabled="currentPage === 1"
              class="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-0.5 px-2 rounded text-xs transition-colors">
              ← Prev
            </button>
            <span class="text-gray-300">Page {{ currentPage }}/{{ totalPages }}</span>
            <button @click="nextPage" :disabled="currentPage >= totalPages"
              class="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-0.5 px-2 rounded text-xs transition-colors">
              Next →
            </button>
          </div>
        </div>

        <!-- Message feed -->
        <div class="flex-1 overflow-y-auto custom-scrollbar">
          <div v-if="paginatedMessages.length === 0" class="text-center py-8">
            <div class="text-gray-400 text-sm">No messages match your filters</div>
            <button @click="resetFilters" class="mt-2 text-blue-400 hover:text-blue-300 text-xs">
              Reset Filters
            </button>
          </div>
          <div v-else>
            <table class="w-full border-collapse text-xs">
              <thead class="bg-gray-800 sticky top-0 z-10">
                <tr>
                  <th class="text-left py-1 px-2 text-gray-400 font-medium w-[18%]">Sender</th>
                  <th class="text-left py-1 px-2 text-gray-400 font-medium w-[18%]">Chat</th>
                  <th class="text-left py-1 px-2 text-gray-400 font-medium w-[15%]">Timestamp</th>
                  <th class="text-left py-1 px-2 text-gray-400 font-medium w-[49%]">Message</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(message, index) in paginatedMessages" :key="index"
                  class="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                  <!-- Sender -->
                  <td class="py-1.5 px-2 align-top">
                    <div class="flex items-start">
                      <div class="w-2 h-2 rounded-full mr-1.5 mt-1"
                        :style="{ backgroundColor: getSenderColor(getPointSender(message)) }">
                      </div>
                      <div class="text-white font-medium break-words">{{ getPointSender(message) }}</div>
                    </div>
                  </td>

                  <!-- Chat -->
                  <td class="py-1.5 px-2 align-top">
                    <div v-if="getPointChatName(message)" class="text-gray-300 break-words">
                      {{ getPointChatName(message) }}
                    </div>
                    <div v-else class="text-gray-500 italic">-</div>
                  </td>

                  <!-- Timestamp -->
                  <td class="py-1.5 px-2 align-top whitespace-nowrap">
                    <div class="text-gray-400">
                      {{ formatMessageDate(getPointTimestamp(message)) }}
                    </div>
                  </td>

                  <!-- Message content -->
                  <td class="py-1.5 px-2 align-top">
                    <div v-if="getPointContent(message)" class="text-white break-words">
                      <template v-if="isUrl(getPointContent(message))">
                        <a :href="getPointContent(message)" target="_blank" rel="noopener noreferrer"
                          class="text-blue-400 hover:text-blue-300 underline break-all">
                          {{ getPointContent(message) }}
                        </a>
                      </template>
                      <template v-else>
                        {{ getPointContent(message) }}
                      </template>
                    </div>
                    <div v-else class="text-gray-500 italic">No content</div>

                    <!-- Media info (if available) -->
                    <div v-if="getPointMediaNote(message) || getPointMediaFilename(message)"
                      class="mt-1 text-gray-400 border-l-2 border-gray-700 pl-2">
                      <div v-if="getPointMediaFilename(message)" class="truncate">
                        File: {{ getPointMediaFilename(message) }}
                      </div>
                      <div v-if="getPointMediaNote(message)" class="truncate">
                        Note: {{ getPointMediaNote(message) }}
                      </div>
                    </div>

                    <!-- Message metadata tags -->
                    <div v-if="getPointMessageType(message) || getPointPlatform(message)" class="mt-1 flex gap-1.5">
                      <span v-if="getPointMessageType(message)"
                        class="px-1.5 py-0.5 bg-gray-800 rounded-sm text-gray-400 text-[10px]">
                        {{ getPointMessageType(message) }}
                      </span>
                      <span v-if="getPointPlatform(message)"
                        class="px-1.5 py-0.5 bg-gray-800 rounded-sm text-gray-400 text-[10px]">
                        {{ getPointPlatform(message) }}
                      </span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Pagination controls (bottom) -->
        <div class="bg-gray-800 px-3 py-1 border-t border-gray-700 flex items-center justify-between text-xs">
          <div class="text-gray-300">
            {{ paginatedMessages.length > 0 ? (currentPage - 1) * pageSize + 1 : 0 }}-{{ Math.min(currentPage *
              pageSize,
              filteredMessages.length) }}
            of {{ filteredMessages.length.toLocaleString() }} messages
          </div>
          <div class="flex items-center space-x-2">
            <button @click="prevPage" :disabled="currentPage === 1"
              class="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-0.5 px-2 rounded text-xs transition-colors">
              ← Prev
            </button>
            <span class="text-gray-300">Page {{ currentPage }}/{{ totalPages }}</span>
            <button @click="nextPage" :disabled="currentPage >= totalPages"
              class="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-0.5 px-2 rounded text-xs transition-colors">
              Next →
            </button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useParquetLoader } from '~/composables/useParquetLoader'
import { format } from 'date-fns'
import * as d3 from 'd3'

// State
const loading = ref(true)
const error = ref(null)
const rawData = ref([])
const filteredMessages = ref([])
const currentPage = ref(1)
const pageSize = 250 // Show 250 messages per page
const sortOrder = ref('newest')
const showShortcuts = ref(false)

// Filters
const filters = reactive({
  sender: '',
  chat: '',
  startDate: '',
  endDate: ''
})

// Stats for filters
const stats = reactive({
  totalMessages: 0,
  dateRange: '',
  uniqueUsers: 0,
  topSenders: [],
  topChats: [],
  mediaTypes: []
})

// Computed properties
const totalPages = computed(() => {
  return Math.ceil(filteredMessages.value.length / pageSize)
})

const paginatedMessages = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  return filteredMessages.value.slice(start, end)
})

// Load data
const { loadParquetFile } = useParquetLoader()

// Pagination methods
function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    // Scroll to top when changing pages
    window.scrollTo(0, 0)
  }
}

function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--
    // Scroll to top when changing pages
    window.scrollTo(0, 0)
  }
}

// Filter methods
function applyFilters() {
  let filtered = [...rawData.value]

  // Apply sender filter
  if (filters.sender) {
    filtered = filtered.filter(msg => getPointSender(msg) === filters.sender)
  }

  // Apply chat filter
  if (filters.chat) {
    filtered = filtered.filter(msg => getPointChatName(msg) === filters.chat)
  }

  // Apply date range filter
  if (filters.startDate) {
    const startDate = new Date(filters.startDate)
    filtered = filtered.filter(msg => {
      const msgDate = new Date(getPointTimestamp(msg))
      return msgDate >= startDate
    })
  }

  if (filters.endDate) {
    const endDate = new Date(filters.endDate)
    // Set time to end of day
    endDate.setHours(23, 59, 59, 999)
    filtered = filtered.filter(msg => {
      const msgDate = new Date(getPointTimestamp(msg))
      return msgDate <= endDate
    })
  }

  // Sort by timestamp (newest first)
  filtered.sort((a, b) => {
    return new Date(getPointTimestamp(b)) - new Date(getPointTimestamp(a))
  })

  filteredMessages.value = filtered
  currentPage.value = 1 // Reset to first page when filters change
}

function resetFilters() {
  filters.sender = ''
  filters.chat = ''
  filters.startDate = ''
  filters.endDate = ''

  // Reset to original data (sorted by timestamp)
  const sorted = [...rawData.value].sort((a, b) => {
    return new Date(getPointTimestamp(b)) - new Date(getPointTimestamp(a))
  })

  filteredMessages.value = sorted
  currentPage.value = 1
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

  // Set date filter min/max based on data
  const minDate = new Date(extent[0])
  const maxDate = new Date(extent[1])

  // Format dates for input elements (YYYY-MM-DD)
  const formatInputDate = (date) => {
    return date.toISOString().split('T')[0]
  }

  // Don't set the filters directly, just make them available
  // This avoids automatically applying date filters

  // Unique users
  const uniqueUsers = new Set()
  const senderCounts = {}
  const chatCounts = {}

  data.forEach(msg => {
    const sender = getPointSender(msg)
    uniqueUsers.add(sender)
    senderCounts[sender] = (senderCounts[sender] || 0) + 1

    // Count chats
    const chatName = getPointChatName(msg)
    if (chatName) {
      chatCounts[chatName] = (chatCounts[chatName] || 0) + 1
    }
  })

  stats.uniqueUsers = uniqueUsers.size

  // Top senders
  stats.topSenders = Object.entries(senderCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20) // Show more senders in the feed view

  // Top chats
  stats.topChats = Object.entries(chatCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20) // Show more chats in the feed view
}

// Format the message date
function formatMessageDate(timestamp) {
  if (!timestamp) return 'Unknown time'
  try {
    return format(new Date(timestamp), 'MMM d, yyyy h:mm a')
  } catch (err) {
    console.error('Error formatting date:', err)
    return 'Invalid date'
  }
}

// Get color for a sender (for the UI dots)
function getSenderColor(senderName) {
  const index = stats.topSenders.findIndex(s => s.name === senderName)
  if (index === -1) return '#ffffff'

  const normalizedIndex = index / Math.max(stats.topSenders.length - 1, 1)
  return d3.interpolateTurbo(normalizedIndex)
}

// Helper functions to handle different data formats
function isNewFormat(point) {
  return point && (
    point.hasOwnProperty('date') ||
    point.hasOwnProperty('message') ||
    point.hasOwnProperty('from') ||
    // Additional fields from the example data
    point.hasOwnProperty('id') ||
    (point.hasOwnProperty('text') && point.hasOwnProperty('group_chat_id'))
  )
}

function getPointSender(point) {
  if (!point) return 'Unknown'
  return isNewFormat(point)
    ? (point.from || point.sender || 'Unknown')
    : (point.sender_name || point.sender || 'Unknown')
}

function getPointTimestamp(point) {
  if (!point) return null
  return isNewFormat(point) ? (point.date || point.timestamp) : point.timestamp
}

function getPointContent(point) {
  if (!point) return null
  // Check for different possible field names for the message content
  if (isNewFormat(point)) {
    return point.message || point.text || null
  } else {
    return point.content || point.text || null
  }
}

function getPointChatName(point) {
  if (!point) return null
  return isNewFormat(point) ? (point.chat_title || point.group_chat_id || null) : (point.chat_name || point.group_chat_id || null)
}

function getPointMessageType(point) {
  if (!point) return null
  return isNewFormat(point) ? point.type : point.message_type
}

function getPointPlatform(point) {
  if (!point) return null
  return isNewFormat(point) ? 'Telegram' : point.platform
}

function getPointMediaNote(point) {
  if (!point) return null
  return isNewFormat(point) ? point.media_note : point.media_note
}

function getPointMediaFilename(point) {
  if (!point) return null
  return isNewFormat(point) ? point.media_filename : point.media_filename
}

// Check if a string is a URL
function isUrl(str) {
  if (!str) return false
  try {
    // Simple regex to detect URLs
    const urlRegex = /^(https?:\/\/[^\s]+)$/i
    return urlRegex.test(str.trim())
  } catch (err) {
    return false
  }
}

function applySortOrder() {
  let filtered = [...filteredMessages.value]

  if (sortOrder.value === 'newest') {
    filtered.sort((a, b) => {
      return new Date(getPointTimestamp(b)) - new Date(getPointTimestamp(a))
    })
  } else {
    filtered.sort((a, b) => {
      return new Date(getPointTimestamp(a)) - new Date(getPointTimestamp(b))
    })
  }

  filteredMessages.value = filtered
  currentPage.value = 1 // Reset to first page when sort order changes
}

// Handle keyboard shortcuts
function handleKeyDown(e) {
  // Don't trigger shortcuts when typing in input fields
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') {
    return
  }

  switch (e.key) {
    case 'ArrowLeft':
      prevPage()
      break
    case 'ArrowRight':
      nextPage()
      break
    case 'Home':
      currentPage.value = 1
      window.scrollTo(0, 0)
      break
    case 'End':
      currentPage.value = totalPages.value
      window.scrollTo(0, 0)
      break
    case 'r':
      resetFilters()
      break
    case 's':
      sortOrder.value = sortOrder.value === 'newest' ? 'oldest' : 'newest'
      applySortOrder()
      break
    case '?':
      showShortcuts.value = !showShortcuts.value
      break
  }
}

onMounted(async () => {
  try {
    console.log('Loading telegram_chats.v3.parquet...')
    const result = await loadParquetFile('/telegram_chats.v3.parquet')
    if (!result.success) {
      throw new Error(result.error || 'Failed to load data')
    }

    console.log(`Loaded ${result.data.length} rows from telegram_chats.v3.parquet`)

    rawData.value = result.data

    // Sort by timestamp (newest first)
    const sorted = [...result.data].sort((a, b) => {
      return new Date(getPointTimestamp(b)) - new Date(getPointTimestamp(a))
    })

    filteredMessages.value = sorted
    calculateStats(result.data)
    loading.value = false

    // Add keyboard event listener
    window.addEventListener('keydown', handleKeyDown)
  } catch (err) {
    console.error('Init error:', err)
    error.value = err.message
    loading.value = false
  }
})

onUnmounted(() => {
  // Remove keyboard event listener
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<style scoped>
/* Custom scrollbar styles */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(31, 41, 55, 0.5);
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(75, 85, 99, 0.7);
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(107, 114, 128, 0.8);
}
</style>