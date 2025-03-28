<template>
  <div class="min-h-screen h-screen w-screen bg-gray-900 text-white flex flex-col">
    <TopBar current-page="Senders" />

    <!-- Toast notification for copy success -->
    <div v-if="showCopyToast"
      class="fixed bottom-6 right-6 bg-green-600 text-white px-5 py-3 rounded shadow-xl z-50 flex items-center space-x-3 text-sm border border-green-500 animate-fade-in">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clip-rule="evenodd" />
      </svg>
      <div>
        <div class="font-medium">Link copied!</div>
        <div class="text-xs text-green-200 mt-0.5">{{ copyToastMessage }}</div>
      </div>
    </div>

    <div class="flex-1 overflow-auto px-4 py-6">
      <div class="mb-6 flex items-center justify-between">
        <h1 class="text-xl font-bold">Message Senders</h1>

        <!-- Search -->
        <div class="flex">
          <input v-model="searchQuery" type="text" placeholder="Search senders..."
            class="w-full md:w-48 px-2 py-1 bg-gray-800 border border-gray-700 rounded-l text-white text-sm focus:outline-none" />
          <button @click="searchQuery = ''"
            class="bg-gray-700 px-2 py-1 rounded-r border-y border-r border-gray-700 hover:bg-gray-600 transition-colors">
            <span v-if="searchQuery">×</span>
            <span v-else class="text-xs">🔍</span>
          </button>
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <div class="animate-spin mr-3">
          <svg class="w-5 h-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
            </path>
          </svg>
        </div>
        <div>Loading senders...</div>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="bg-red-900/50 p-3 rounded border-l-2 border-red-500">
        <p class="text-red-200 font-bold">Error</p>
        <p>{{ error }}</p>
      </div>

      <!-- Content -->
      <div v-else>
        <!-- Quick stats -->
        <div class="border-t border-gray-700 pt-2 pb-4 mb-4">
          <div class="text-gray-400 text-xs uppercase tracking-wider mb-1">Summary</div>
          <div class="text-sm">
            Found <span class="text-white font-bold">{{ senders.length }}</span> unique senders
            with <span class="text-white font-bold">{{ totalMessages.toLocaleString() }}</span> messages
            <span v-if="searchQuery" class="text-blue-400">
              (showing {{ filteredSenders.length }} matching "{{ searchQuery }}")
              <button @click="searchQuery = ''" class="text-gray-400 hover:text-white ml-1">×</button>
            </span>
          </div>
        </div>

        <!-- Simple Senders List -->
        <div class="border-t border-gray-700 pt-2">
          <div class="text-gray-400 text-xs uppercase tracking-wider mb-1">All Senders</div>

          <!-- No results state -->
          <div v-if="filteredSenders.length === 0" class="py-4 text-center text-gray-400 text-sm">
            No senders match your search query
          </div>

          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            <div v-for="(sender, index) in filteredSenders" :key="index"
              class="flex items-center justify-between py-1 px-2 border-b border-gray-800 hover:bg-gray-800">
              <div class="flex items-center">
                <div class="w-2 h-2 rounded-full mr-2" :style="{ backgroundColor: getSenderColor(sender.name) }"></div>
                <div class="text-sm truncate mr-2 max-w-[150px]">{{ sender.name }}</div>
                <div class="text-gray-400 text-xs">{{ sender.count.toLocaleString() }}</div>
              </div>
              <div class="flex items-center space-x-2">
                <!-- Shareable link to this sender search -->
                <button @click="setSenderSearch(sender.name)"
                  class="text-gray-400 hover:text-blue-400 transition-colors text-xs" title="Copy link to this sender">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </button>
                <!-- View messages -->
                <NuxtLink :to="`/feed?sender=${encodeURIComponent(sender.name)}`"
                  class="text-blue-400 hover:text-blue-300 transition-colors text-xs flex items-center">
                  View Messages
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import * as d3 from 'd3'
import TopBar from '~/components/TopBar.vue'
import { useParquetLoader } from '~/composables/useParquetLoader'
import { useUrlSearchParams } from '@vueuse/core'

// State
const loading = ref(true)
const error = ref(null)
const senders = ref([])
const totalMessages = ref(0)
const searchQuery = ref('')
const rawData = ref([])
const showCopyToast = ref(false)
const copyToastMessage = ref('')

// Use VueUse's useUrlSearchParams for better URL handling
const params = useUrlSearchParams('history', {
  initialValue: {
    search: ''
  },
  removeFalsyValues: true,
})

// Get our loader
const { loadParquetFile } = useParquetLoader()

// Sync URL params with search query
watch(params, (newParams) => {
  if (newParams.search !== searchQuery.value) {
    searchQuery.value = newParams.search || ''
  }
}, { deep: true })

// Sync search query back to URL params
watch(searchQuery, (newValue) => {
  params.search = newValue || undefined
})

// Computed: filtered senders
const filteredSenders = computed(() => {
  if (!searchQuery.value) return senders.value

  const query = searchQuery.value.toLowerCase().trim()

  // If the search query is empty after trimming, return all senders
  if (!query) return senders.value

  return senders.value.filter(sender => {
    if (!sender.name) return false

    const name = sender.name.toLowerCase()

    // Check for exact match
    if (name.includes(query)) return true

    // Check for match with space before
    if (name.includes(` ${query}`)) return true

    // Check for match with space after
    if (name.includes(`${query} `)) return true

    // Check for match with spaces before and after
    if (name.includes(` ${query} `)) return true

    return false
  })
})

// Get sender name from message - using the exact same function from metadata.vue
function getMessageSender(message) {
  return message.from || message.sender || message.sender_name || 'Unknown'
}

// Get a color for a sender
function getSenderColor(name) {
  if (!name) return '#4299e1'

  // Simple hash function to get consistent colors
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }

  // Use d3 color scale to get a nice color
  return d3.interpolateViridis(Math.abs(hash) % 1000 / 1000)
}

// Set search to a sender name and copy the shareable link
function setSenderSearch(senderName) {
  // Set the search query which will update the URL via the watcher
  searchQuery.value = senderName

  // Generate the shareable URL with VueUse automatically handling encoding
  const url = window.location.href

  // Copy to clipboard
  navigator.clipboard.writeText(url)
    .then(() => {
      // Show a toast notification that the link was copied
      showCopyToast.value = true
      copyToastMessage.value = `Link to "${senderName}" copied to clipboard`

      // Automatically hide toast after 3 seconds
      setTimeout(() => {
        showCopyToast.value = false
      }, 3000)
    })
    .catch(err => {
      console.error('Failed to copy link:', err)
      showCopyToast.value = true
      copyToastMessage.value = 'Could not copy link automatically. Use the URL in your browser address bar.'

      // Automatically hide toast after 4 seconds (longer for error messages)
      setTimeout(() => {
        showCopyToast.value = false
      }, 4000)
    })
}

// Use the same approach as metadata.vue to process the data
function processSenders() {
  if (!rawData.value.length) return

  console.log('Processing senders from raw data...')

  // Count messages by sender
  const senderCounts = {}

  // Process each message
  rawData.value.forEach(message => {
    const sender = getMessageSender(message)
    senderCounts[sender] = (senderCounts[sender] || 0) + 1
  })

  // Convert to array and sort by count
  senders.value = Object.entries(senderCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)

  console.log(`Found ${senders.value.length} unique senders`)
}

// Load data on component mount - using the same approach as metadata.vue
onMounted(async () => {
  try {
    console.log('Loading parquet data...')

    // Apply URL parameter from the VueUse params
    if (params.search) {
      console.log('Found search parameter:', params.search)
      searchQuery.value = params.search
    }

    // Use the loader that works in metadata.vue
    const result = await loadParquetFile()

    if (!result.success) {
      throw new Error(result.error || 'Failed to load data')
    }

    console.log(`Successfully loaded ${result.data.length} rows`)

    // Store raw data
    rawData.value = result.data
    totalMessages.value = result.data.length

    // Process the data
    processSenders()

    loading.value = false
  } catch (err) {
    console.error('Error loading data:', err)
    error.value = err.message
    loading.value = false
  }
})
</script>

<style scoped>
/* Custom scrollbar styles to match index page */
:deep(.custom-scrollbar::-webkit-scrollbar) {
  width: 4px;
}

:deep(.custom-scrollbar::-webkit-scrollbar-track) {
  background: rgba(31, 41, 55, 0.5);
}

:deep(.custom-scrollbar::-webkit-scrollbar-thumb) {
  background: rgba(75, 85, 99, 0.7);
  border-radius: 3px;
}

/* Animation for copy toast */
.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}

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
</style>