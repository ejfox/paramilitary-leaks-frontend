<template>
  <div class="min-h-screen w-screen bg-gray-900 flex flex-col overflow-hidden">
    <!-- Header with navigation -->
    <TopBar current-page="Message Feed" />

    <!-- Toast notification for copy success -->
    <div v-if="showCopyToast"
      class="fixed bottom-6 right-6 bg-green-600 text-white px-5 py-3 rounded-lg shadow-xl z-50 flex items-center space-x-3 text-sm border border-green-500"
      :class="{ 'animate-fade-in': showCopyToast }">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clip-rule="evenodd" />
      </svg>
      <div>
        <div class="font-medium">{{ copyToastTitle }}</div>
        <div class="text-xs text-green-200 mt-0.5">You can now paste it into any markdown editor</div>
      </div>
    </div>

    <!-- Main content -->
    <div class="flex-1 flex flex-col overflow-hidden">
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
        <!-- Filter controls - Use scrolling container for small screens -->
        <div class="bg-gray-800 p-2 border-b border-gray-700 overflow-x-auto">
          <div class="flex flex-wrap gap-1 md:gap-2 items-center text-xs min-w-max">
            <!-- Sender filter -->
            <div class="flex items-center space-x-1">
              <label class="text-gray-400">Sender:</label>
              <select v-model="filters.sender" @change="applyFilters"
                class="bg-gray-900 text-white border border-gray-700 rounded py-0.5 px-1 focus:outline-none focus:ring-1 focus:ring-blue-500 w-24 md:w-auto">
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
                class="bg-gray-900 text-white border border-gray-700 rounded py-0.5 px-1 focus:outline-none focus:ring-1 focus:ring-blue-500 w-24 md:w-auto">
                <option value="">All</option>
                <option v-for="chat in stats.topChats" :key="chat.name" :value="chat.name">
                  {{ chat.name }}
                </option>
              </select>
            </div>

            <!-- Date range filter - Stack on small screens, flex on larger -->
            <div class="flex items-center flex-wrap md:flex-nowrap space-x-1">
              <label class="text-gray-400">Date:</label>
              <input v-model="filters.startDate" type="date" @change="applyFilters"
                class="bg-gray-900 text-white border border-gray-700 rounded py-0.5 px-1 w-28 focus:outline-none focus:ring-1 focus:ring-blue-500">
              <span class="text-gray-400">-</span>
              <input v-model="filters.endDate" type="date" @change="applyFilters"
                class="bg-gray-900 text-white border border-gray-700 rounded py-0.5 px-1 w-28 focus:outline-none focus:ring-1 focus:ring-blue-500">
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

            <!-- Action buttons - Fixed width on right -->
            <div class="ml-auto flex items-center space-x-1">
              <!-- Reset filters -->
              <button @click="resetFilters"
                class="bg-blue-600 hover:bg-blue-700 text-white py-0.5 px-2 rounded text-xs transition-colors">
                Reset
              </button>

              <!-- Keyboard shortcuts info -->
              <button @click="showShortcuts = !showShortcuts"
                class="bg-gray-700 hover:bg-gray-600 text-white py-0.5 px-2 rounded text-xs transition-colors flex items-center">
                <span class="mr-1">⌨</span> Shortcuts
              </button>
            </div>
          </div>

          <!-- Keyboard shortcuts panel -->
          <div v-if="showShortcuts"
            class="mt-2 bg-gray-900 p-2 rounded text-xs grid grid-cols-2 md:grid-cols-3 gap-x-2 gap-y-1">
            <div class="text-gray-400"><span class="text-white font-mono">←/→</span> Previous/Next page</div>
            <div class="text-gray-400"><span class="text-white font-mono">Home</span> First page</div>
            <div class="text-gray-400"><span class="text-white font-mono">End</span> Last page</div>
            <div class="text-gray-400"><span class="text-white font-mono">r</span> Reset filters</div>
            <div class="text-gray-400"><span class="text-white font-mono">s</span> Toggle sort order</div>
            <div class="text-gray-400"><span class="text-white font-mono">?</span> Toggle shortcuts</div>
          </div>
        </div>

        <!-- Message count and pagination info (top) -->
        <div class="bg-gray-800 px-2 py-1 border-b border-gray-700 flex items-center justify-between text-xs">
          <div class="flex items-center space-x-1 md:space-x-2">
            <div class="text-gray-300 truncate max-w-[150px] md:max-w-full">
              {{ paginationInfoText }}
            </div>

            <!-- Copy All Messages button -->
            <button v-if="paginatedMessages.length > 0" @click="copyAllMessagesAsMarkdown"
              class="bg-blue-600 hover:bg-blue-700 text-white py-0.5 px-2 rounded text-xs transition-colors flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" />
                <path d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h8a2 2 0 00-2-2H5z" />
              </svg>
              <span>Copy</span>
            </button>
          </div>
          <div class="flex items-center space-x-1 md:space-x-2">
            <button @click="prevPage" :disabled="currentPage === 1"
              class="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-0.5 px-2 rounded text-xs transition-colors">
              ←
            </button>
            <span class="text-gray-300 hidden md:inline">Page</span>
            <span class="text-gray-300">{{ currentPage }}/{{ totalPages }}</span>
            <button @click="nextPage" :disabled="currentPage >= totalPages"
              class="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-0.5 px-2 rounded text-xs transition-colors">
              →
            </button>
          </div>
        </div>

        <!-- Message feed - flex-1 to ensure it takes remaining space -->
        <div class="flex-1 overflow-auto custom-scrollbar">
          <div v-if="paginatedMessages.length === 0" class="text-center py-8">
            <div class="text-gray-400 text-sm">No messages match your filters</div>
            <button @click="resetFilters" class="mt-2 text-blue-400 hover:text-blue-300 text-xs">
              Reset Filters
            </button>
          </div>

          <!-- Table with auto layout to fit content -->
          <div v-else class="overflow-x-auto">
            <table class="w-full border-collapse text-xs table-fixed min-w-max">
              <thead class="bg-gray-800 sticky top-0 z-10">
                <tr>
                  <th class="text-left py-1 px-2 text-gray-400 font-medium w-[15%] xl:w-[15%]">Sender</th>
                  <th class="text-left py-1 px-2 text-gray-400 font-medium w-[15%] xl:w-[18%]">Chat</th>
                  <th class="text-left py-1 px-2 text-gray-400 font-medium w-[15%] xl:w-[15%]">Timestamp</th>
                  <th class="text-left py-1 px-2 text-gray-400 font-medium w-[55%] xl:w-[52%]">Message</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(message, index) in paginatedMessages" :key="index"
                  class="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                  <!-- Sender -->
                  <td class="py-1 px-2 align-top overflow-hidden">
                    <div class="flex items-start">
                      <div class="w-2 h-2 rounded-full mr-1 mt-1 flex-shrink-0"
                        :style="{ backgroundColor: getSenderColor(getPointSender(message)) }">
                      </div>
                      <div class="text-white font-medium truncate">
                        {{ getPointSender(message) }}
                      </div>
                    </div>
                  </td>

                  <!-- Chat -->
                  <td class="py-1 px-2 align-top overflow-hidden">
                    <div v-if="getPointChatName(message)" class="text-gray-300 truncate">
                      {{ getPointChatName(message) }}
                    </div>
                    <div v-else class="text-gray-500 italic">-</div>
                  </td>

                  <!-- Timestamp -->
                  <td class="py-1 px-2 align-top whitespace-nowrap truncate overflow-hidden">
                    <div class="text-gray-400">
                      {{ formatMessageDate(getPointTimestamp(message)) }}
                    </div>
                  </td>

                  <!-- Message content -->
                  <td class="py-1 px-2 align-top relative overflow-hidden">
                    <div class="flex justify-between items-start">
                      <div class="flex-grow pr-8 overflow-hidden">
                        <div v-if="getPointContent(message)" class="text-white break-words line-clamp-3">
                          <template v-if="isUrl(getPointContent(message))">
                            <a :href="getPointContent(message)" target="_blank" rel="noopener noreferrer"
                              class="text-blue-400 hover:text-blue-300 underline break-all truncate inline-block max-w-full">
                              {{ getPointContent(message) }}
                            </a>
                          </template>
                          <template v-else>
                            <span class="truncate inline-block max-w-full">{{ getPointContent(message) }}</span>
                          </template>

                          <!-- Add link to message detail page if it has an ID -->
                          <NuxtLink v-if="message.id" :to="`/messages/${message.id}`"
                            class="ml-1 inline-flex items-center text-xs text-blue-400 hover:text-blue-300">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-0.5" viewBox="0 0 20 20"
                              fill="currentColor">
                              <path
                                d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                              <path
                                d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                            </svg>
                            <span class="hidden sm:inline">View</span>
                          </NuxtLink>
                        </div>
                        <div v-else class="text-gray-500 italic">No content</div>

                        <!-- Media info (if available) - with truncation -->
                        <div v-if="getPointMediaNote(message) || getPointMediaFilename(message)"
                          class="mt-1 text-gray-400 border-l-2 border-gray-700 pl-2 overflow-hidden">
                          <div v-if="getPointMediaFilename(message)" class="truncate">
                            File: {{ getPointMediaFilename(message) }}
                          </div>
                          <div v-if="getPointMediaNote(message)" class="truncate">
                            Note: {{ getPointMediaNote(message) }}
                          </div>
                        </div>

                        <!-- Message metadata tags - wrapped for smaller screens -->
                        <div v-if="getPointMessageType(message) || getPointPlatform(message) || message.id"
                          class="mt-1 flex flex-wrap gap-1">
                          <span v-if="getPointMessageType(message)"
                            class="px-1 py-0.5 bg-gray-800 rounded-sm text-gray-400 text-[10px]">
                            {{ getPointMessageType(message) }}
                          </span>
                          <span v-if="getPointPlatform(message)"
                            class="px-1 py-0.5 bg-gray-800 rounded-sm text-gray-400 text-[10px]">
                            {{ getPointPlatform(message) }}
                          </span>
                          <!-- Add message ID as a tag if it exists -->
                          <span v-if="message.id" class="px-1 py-0.5 bg-gray-800 rounded-sm text-gray-400 text-[10px]">
                            ID: {{ message.id }}
                          </span>
                        </div>
                      </div>

                      <!-- Copy and View buttons side by side - made smaller -->
                      <div class="absolute top-1 right-1 flex items-center space-x-1">
                        <!-- View message button -->
                        <NuxtLink v-if="message.id" :to="`/messages/${message.id}`"
                          class="p-1 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center"
                          title="View detailed message">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20"
                            fill="currentColor">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path fill-rule="evenodd"
                              d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                              clip-rule="evenodd" />
                          </svg>
                        </NuxtLink>

                        <!-- Copy as Markdown button -->
                        <button @click="(event) => copyAsMarkdown(message, event)"
                          class="p-1 rounded bg-gray-700 text-gray-300 hover:text-white hover:bg-blue-600 transition-colors flex items-center"
                          title="Copy as Markdown">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20"
                            fill="currentColor">
                            <path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" />
                            <path d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h8a2 2 0 00-2-2H5z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Pagination controls (bottom) - more compact -->
        <div class="bg-gray-800 px-2 py-1 border-t border-gray-700 flex items-center justify-between text-xs">
          <div class="flex items-center space-x-1 md:space-x-2">
            <div class="text-gray-300 truncate max-w-[150px] md:max-w-full">
              {{ paginationInfoText }}
            </div>

            <!-- Copy All Messages button -->
            <button v-if="paginatedMessages.length > 0" @click="copyAllMessagesAsMarkdown"
              class="bg-blue-600 hover:bg-blue-700 text-white py-0.5 px-2 rounded text-xs transition-colors flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" />
                <path d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h8a2 2 0 00-2-2H5z" />
              </svg>
              <span>Copy</span>
            </button>
          </div>
          <div class="flex items-center space-x-1 md:space-x-2">
            <button @click="prevPage" :disabled="currentPage === 1"
              class="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-0.5 px-2 rounded text-xs transition-colors">
              ←
            </button>
            <span class="text-gray-300 hidden md:inline">Page</span>
            <span class="text-gray-300">{{ currentPage }}/{{ totalPages }}</span>
            <button @click="nextPage" :disabled="currentPage >= totalPages"
              class="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-0.5 px-2 rounded text-xs transition-colors">
              →
            </button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { useParquetLoader } from '~/composables/useParquetLoader'
import { format } from 'date-fns'
import * as d3 from 'd3'
import TopBar from '~/components/TopBar.vue'
import { useRoute } from 'vue-router'

// State
const loading = ref(true)
const error = ref(null)
const rawData = ref([])
const filteredMessages = ref([])
const currentPage = ref(1)
const pageSize = 250 // Show 250 messages per page
const sortOrder = ref('newest')
const showShortcuts = ref(false)
const showCopyToast = ref(false) // For copy to clipboard notification
const copyToastTitle = ref('Message copied as Markdown!') // Dynamic toast title
const route = useRoute()

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

const paginationInfoText = computed(() => {
  const start = paginatedMessages.value.length > 0 ? (currentPage.value - 1) * pageSize + 1 : 0
  const end = Math.min(currentPage.value * pageSize, filteredMessages.value.length)
  return `${start}-${end} of ${filteredMessages.value.length.toLocaleString()} messages`
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

  // Apply date range filter using string comparison
  if (filters.startDate) {
    filtered = filtered.filter(msg => {
      const timestamp = msg.date || msg.timestamp
      if (!timestamp) return false

      if (typeof timestamp === 'string' && timestamp.length >= 10) {
        return timestamp.substring(0, 10) >= filters.startDate
      }

      if (typeof timestamp === 'number') {
        const date = new Date(timestamp < 10000000000 ? timestamp * 1000 : timestamp)
        return date.toISOString().substring(0, 10) >= filters.startDate
      }

      return false
    })
    console.log(`Applied start date filter: ${filters.startDate}, filtered to ${filtered.length} messages`)
  }

  if (filters.endDate) {
    filtered = filtered.filter(msg => {
      const timestamp = msg.date || msg.timestamp
      if (!timestamp) return false

      if (typeof timestamp === 'string' && timestamp.length >= 10) {
        return timestamp.substring(0, 10) <= filters.endDate
      }

      if (typeof timestamp === 'number') {
        const date = new Date(timestamp < 10000000000 ? timestamp * 1000 : timestamp)
        return date.toISOString().substring(0, 10) <= filters.endDate
      }

      return false
    })
    console.log(`Applied end date filter: ${filters.endDate}, filtered to ${filtered.length} messages`)
  }

  // Sort by timestamp (newest first) - FIX: use Date objects instead of localeCompare
  filtered.sort((a, b) => {
    const aTimestamp = a.date || a.timestamp
    const bTimestamp = b.date || b.timestamp

    // Convert to Date objects for consistent comparison
    const aDate = new Date(aTimestamp)
    const bDate = new Date(bTimestamp)

    // For newest first, we want b - a (descending order)
    return bDate - aDate
  })

  filteredMessages.value = filtered
  currentPage.value = 1 // Reset to first page when filters change

  // Log the filter results
  if (filters.startDate && filters.startDate === filters.endDate) {
    console.log(`Showing messages for date: ${filters.startDate}`)
    console.log(`Found ${filtered.length} messages for this date`)
  }
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

  // Date range using string comparison
  const dates = data.map(m => {
    const timestamp = m.date || m.timestamp
    if (typeof timestamp === 'string' && timestamp.length >= 10) {
      return timestamp.substring(0, 10)
    }
    if (typeof timestamp === 'number') {
      const date = new Date(timestamp < 10000000000 ? timestamp * 1000 : timestamp)
      return date.toISOString().substring(0, 10)
    }
    return null
  }).filter(Boolean)

  const [startDate, endDate] = dates.sort()
  stats.dateRange = `${formatReadableDate(startDate)} - ${formatReadableDate(endDate)}`

  // Set date filter min/max based on data
  const minDate = new Date(startDate)
  const maxDate = new Date(endDate)

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

// Format a date string (YYYY-MM-DD) into a readable format
function formatReadableDate(dateStr) {
  const [year, month, day] = dateStr.split('-')
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[parseInt(month) - 1]} ${parseInt(day)}, ${year}`
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
  );
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

// Copy message as markdown
function copyAsMarkdown(message, event) {
  const sender = getPointSender(message)
  const timestamp = formatMessageDate(getPointTimestamp(message))
  const content = getPointContent(message)
  const chatName = getPointChatName(message)
  const messageType = getPointMessageType(message)
  const mediaFilename = getPointMediaFilename(message)
  const mediaNotes = getPointMediaNote(message)

  // Create a well-formatted markdown version
  let markdown = `## Message from ${sender}\n\n`
  markdown += `**Date:** ${timestamp}\n`

  if (chatName) {
    markdown += `**Chat:** ${chatName}\n`
  }

  if (messageType) {
    markdown += `**Type:** ${messageType}\n`
  }

  markdown += "\n"

  // Add content
  if (content) {
    markdown += `${content}\n\n`
  }

  // Add media info if available
  if (mediaFilename || mediaNotes) {
    markdown += "### Media Information\n"

    if (mediaFilename) {
      markdown += `- **File:** ${mediaFilename}\n`
    }

    if (mediaNotes) {
      markdown += `- **Notes:** ${mediaNotes}\n`
    }
  }

  // Add a source citation
  markdown += "\n---\n"
  markdown += `*Source: Paramilitary Leaks Database v${useRuntimeConfig().public.version}*\n`

  console.log("Attempting to copy markdown:", markdown);

  // Try using the modern clipboard API
  try {
    // Copy to clipboard
    navigator.clipboard.writeText(markdown)
      .then(() => {
        console.log("Successfully copied to clipboard");

        // Show a brief success message on the button
        if (event && event.currentTarget) {
          const button = event.currentTarget
          const originalHTML = button.innerHTML
          const originalTitle = button.title

          // Change appearance to indicate success
          button.classList.add('bg-green-600')
          button.classList.remove('bg-gray-700')
          button.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
            <span class="text-xs">Copied!</span>
          `
          button.title = "Copied!"

          // Reset button after a delay
          setTimeout(() => {
            button.classList.remove('bg-green-600')
            button.classList.add('bg-gray-700')
            button.innerHTML = originalHTML
            button.title = originalTitle
          }, 2000)
        }

        // Show toast notification for single message
        copyToastTitle.value = 'Message copied as Markdown!'
        showCopyToast.value = true

        // Hide toast after a delay
        setTimeout(() => {
          showCopyToast.value = false
        }, 2000)
      })
      .catch(err => {
        console.error('Failed to copy markdown with navigator.clipboard:', err)
        fallbackCopyToClipboard(markdown)
      })
  } catch (err) {
    console.error('Error trying to use clipboard API:', err)
    fallbackCopyToClipboard(markdown)
  }

  // Fallback method for browsers that don't support clipboard API
  function fallbackCopyToClipboard(text) {
    console.log("Trying fallback clipboard method");
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    textArea.style.top = '-999999px'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()

    try {
      const successful = document.execCommand('copy')
      if (successful) {
        console.log('Fallback: Copying text was successful')
        showCopyToast.value = true
        setTimeout(() => {
          showCopyToast.value = false
        }, 2000)
      } else {
        console.error('Fallback: Could not copy text')
      }
    } catch (err) {
      console.error('Fallback: Could not copy text', err)
    }

    document.body.removeChild(textArea)
  }
}

// Function to copy all messages on the current page
function copyAllMessagesAsMarkdown() {
  if (!paginatedMessages.value || paginatedMessages.value.length === 0) {
    return;
  }

  // Create a header with date and filter information
  let markdown = `# Paramilitary Leaks Messages\n\n`;
  markdown += `*Copied on ${new Date().toLocaleString()}*\n\n`;

  // Add filter information
  markdown += "## Filter Information\n\n";
  if (filters.sender) markdown += `- **Sender:** ${filters.sender}\n`;
  if (filters.chat) markdown += `- **Chat:** ${filters.chat}\n`;
  if (filters.startDate) markdown += `- **From:** ${filters.startDate}\n`;
  if (filters.endDate) markdown += `- **To:** ${filters.endDate}\n`;
  markdown += `- **Sort:** ${sortOrder.value === 'newest' ? 'Newest first' : 'Oldest first'}\n`;
  markdown += `- **Page:** ${currentPage.value} of ${totalPages.value}\n\n`;

  // Add all messages
  markdown += `## Messages (${paginatedMessages.value.length})\n\n`;

  paginatedMessages.value.forEach((message, index) => {
    const sender = getPointSender(message);
    const timestamp = formatMessageDate(getPointTimestamp(message));
    const content = getPointContent(message);
    const chatName = getPointChatName(message);
    const messageType = getPointMessageType(message);
    const mediaFilename = getPointMediaFilename(message);
    const mediaNotes = getPointMediaNote(message);

    markdown += `### ${index + 1}. Message from ${sender}\n\n`;
    markdown += `**Date:** ${timestamp}\n`;

    if (chatName) {
      markdown += `**Chat:** ${chatName}\n`;
    }

    if (messageType) {
      markdown += `**Type:** ${messageType}\n`;
    }

    markdown += "\n";

    // Add content
    if (content) {
      markdown += `${content}\n\n`;
    }

    // Add media info if available
    if (mediaFilename || mediaNotes) {
      markdown += "#### Media Information\n";

      if (mediaFilename) {
        markdown += `- **File:** ${mediaFilename}\n`;
      }

      if (mediaNotes) {
        markdown += `- **Notes:** ${mediaNotes}\n`;
      }

      markdown += "\n";
    }

    // Add a separator between messages
    markdown += "---\n\n";
  });

  // Add a source citation
  markdown += `*Source: Paramilitary Leaks Database v${useRuntimeConfig().public.version}*\n`;

  // Copy to clipboard and show notification
  navigator.clipboard.writeText(markdown)
    .then(() => {
      console.log(`Copied ${paginatedMessages.value.length} messages as markdown`);
      copyToastTitle.value = `${paginatedMessages.value.length} messages copied as Markdown!`;
      showCopyToast.value = true;
      setTimeout(() => {
        showCopyToast.value = false;
      }, 2000);
    })
    .catch(err => {
      console.error('Failed to copy all messages as markdown:', err);
    });
}

// Apply URL query parameters when the component mounts
onMounted(async () => {
  try {
    console.log('Loading parquet data from R2...')

    const result = await loadParquetFile()

    if (!result.success) {
      throw new Error(result.error || 'Failed to load data from R2')
    }

    console.log(`Loaded ${result.data.length} rows from R2`)

    rawData.value = result.data

    // Check for URL query parameters
    if (route.query.date) {
      console.log('Found date query parameter:', route.query.date)
      // Set both start and end date to the same day to filter for a specific day
      filters.startDate = route.query.date
      filters.endDate = route.query.date
    }

    if (route.query.sender) {
      console.log('Found sender query parameter:', route.query.sender)
      filters.sender = route.query.sender
    }

    if (route.query.chat) {
      console.log('Found chat query parameter:', route.query.chat)
      filters.chat = route.query.chat
    }

    // Sort by timestamp (newest first)
    const sorted = [...result.data].sort((a, b) => {
      return new Date(getPointTimestamp(b)) - new Date(getPointTimestamp(a))
    })

    filteredMessages.value = sorted
    calculateStats(result.data)

    // Apply filters if any query parameters were found
    if (route.query.date || route.query.sender || route.query.chat) {
      applyFilters()
    }

    loading.value = false

    // Add keyboard event listener
    window.addEventListener('keydown', handleKeyDown)
  } catch (err) {
    console.error('Init error:', err)
    error.value = err.message
    loading.value = false
  }
})

// Watch for route query changes
watch(() => route.query, (newQuery) => {
  let shouldApplyFilters = false

  if (newQuery.date !== undefined) {
    filters.startDate = newQuery.date
    filters.endDate = newQuery.date
    shouldApplyFilters = true
  }

  if (newQuery.sender !== undefined) {
    filters.sender = newQuery.sender
    shouldApplyFilters = true
  }

  if (newQuery.chat !== undefined) {
    filters.chat = newQuery.chat
    shouldApplyFilters = true
  }

  if (shouldApplyFilters && !loading.value) {
    applyFilters()
  }
}, { deep: true })

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

/* Toast notification animation */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fadeIn 0.3s ease-out forwards;
}

/* Line clamp utility if not available in your Tailwind config */
.line-clamp-3 {
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}
</style>