<template>
  <div class="min-h-screen w-screen bg-gray-900 text-white">
    <TopBar current-page="Senders" />

    <div class="container mx-auto px-4 py-8">
      <h1 class="text-2xl font-bold mb-4">Message Senders</h1>

      <!-- Loading state -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <div class="animate-spin mr-3">
          <svg class="w-6 h-6 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
            </path>
          </svg>
        </div>
        <div>Loading senders...</div>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="bg-red-900/50 p-4 rounded-lg">
        <p class="text-red-200 font-bold">Error</p>
        <p>{{ error }}</p>
      </div>

      <!-- Content -->
      <div v-else>
        <!-- Quick stats -->
        <div class="bg-gray-800 p-4 rounded-lg mb-6">
          <p class="text-sm text-gray-400">Found <span class="text-white font-bold">{{ senders.length }}</span> unique
            senders with a total of <span class="text-white font-bold">{{ totalMessages }}</span> messages</p>
        </div>

        <!-- Search -->
        <div class="mb-4 flex">
          <input v-model="searchQuery" type="text" placeholder="Search senders..."
            class="w-full md:w-64 px-4 py-2 bg-gray-800 border border-gray-700 rounded-l text-white" />
          <button @click="searchQuery = ''"
            class="bg-gray-700 px-3 rounded-r border-y border-r border-gray-700 hover:bg-gray-600 transition-colors">
            <span v-if="searchQuery">×</span>
            <span v-else>🔍</span>
          </button>
        </div>

        <!-- Simple Senders List -->
        <div class="bg-gray-800 rounded-lg">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-700">
              <thead class="bg-gray-900">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-8">#</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Sender</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Messages
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-700">
                <tr v-for="(sender, index) in filteredSenders" :key="index" class="hover:bg-gray-700 transition-colors">
                  <td class="px-4 py-3 text-sm text-gray-400">{{ index + 1 }}</td>
                  <td class="px-4 py-3">
                    <div class="flex items-center space-x-2">
                      <div class="w-3 h-3 rounded-full" :style="{ backgroundColor: getSenderColor(sender.name) }"></div>
                      <div>{{ sender.name }}</div>
                    </div>
                  </td>
                  <td class="px-4 py-3 text-sm">{{ sender.count.toLocaleString() }}</td>
                  <td class="px-4 py-3">
                    <NuxtLink :to="`/feed?sender=${encodeURIComponent(sender.name)}`"
                      class="text-blue-400 hover:text-blue-300 transition-colors text-sm">
                      View Messages
                    </NuxtLink>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- No results state -->
          <div v-if="filteredSenders.length === 0" class="p-8 text-center text-gray-400">
            No senders match your search query
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import * as d3 from 'd3'
import TopBar from '~/components/TopBar.vue'
import { useParquetLoader } from '~/composables/useParquetLoader'

// State
const loading = ref(true)
const error = ref(null)
const senders = ref([])
const totalMessages = ref(0)
const searchQuery = ref('')
const rawData = ref([])

// Get our loader
const { loadParquetFile } = useParquetLoader()

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