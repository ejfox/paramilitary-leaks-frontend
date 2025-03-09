<template>
  <div class="w-full bg-gray-800 border-b border-gray-700 px-4 py-3">
    <div class="flex flex-wrap items-center gap-4">
      <!-- Title -->
      <div class="text-white font-medium">Filters</div>

      <!-- Search Input -->
      <div class="flex items-center gap-2 flex-grow max-w-md">
        <label class="text-gray-400 text-sm">Search:</label>
        <div class="relative flex-grow">
          <input v-model="searchInput" type="text" placeholder="Search message content..."
            class="bg-gray-900 text-white border border-gray-700 rounded py-1 px-2 pl-8 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-500" />
          <div class="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div v-if="isSearching" class="absolute inset-y-0 right-0 pr-2 flex items-center">
            <div class="animate-spin h-4 w-4 text-blue-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                </path>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Date Range Filter -->
      <div class="flex items-center gap-2">
        <label class="text-gray-400 text-sm">Date:</label>
        <div class="flex items-center">
          <input v-model="localFilters.startDate" type="date" @change="applyFilters"
            class="bg-gray-900 text-white border border-gray-700 rounded py-1 px-2 text-sm w-36 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          <span class="text-gray-400 mx-2">to</span>
          <input v-model="localFilters.endDate" type="date" @change="applyFilters"
            class="bg-gray-900 text-white border border-gray-700 rounded py-1 px-2 text-sm w-36 focus:outline-none focus:ring-1 focus:ring-blue-500" />
        </div>
      </div>

      <!-- Sender Filter -->
      <div class="flex items-center gap-2">
        <label class="text-gray-400 text-sm">Sender:</label>
        <select v-model="localFilters.sender" @change="applyFilters"
          class="bg-gray-900 text-white border border-gray-700 rounded py-1 px-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
          <option value="">All Senders</option>
          <option v-for="sender in topSenders" :key="sender.name" :value="sender.name">
            {{ sender.name }}
          </option>
        </select>
      </div>

      <!-- Chat Filter -->
      <div class="flex items-center gap-2">
        <label class="text-gray-400 text-sm">Chat:</label>
        <select v-model="localFilters.chat" @change="applyFilters"
          class="bg-gray-900 text-white border border-gray-700 rounded py-1 px-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
          <option value="">All Chats</option>
          <option v-for="chat in topChats" :key="chat.name" :value="chat.name">
            {{ chat.name }}
          </option>
        </select>
      </div>

      <!-- Reset Button -->
      <button @click="resetFilters"
        class="ml-auto bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded text-sm transition-colors">
        Reset Filters
      </button>

      <!-- Active Filters Indicator -->
      <div v-if="hasActiveFilters" class="flex items-center gap-1 text-xs text-blue-400">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd"
            d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z"
            clip-rule="evenodd" />
        </svg>
        <span>Filters active</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed, watch, ref, onMounted } from 'vue'
import { useAppStore } from '~/composables/appStore'
import { useDebounceFn } from '@vueuse/core'

const props = defineProps({
  topSenders: {
    type: Array,
    default: () => []
  },
  topChats: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['filters-changed'])

const appStore = useAppStore()
const isSearching = ref(false)

// Create local reactive copy of filters
const localFilters = reactive({
  startDate: appStore.filters.startDate,
  endDate: appStore.filters.endDate,
  sender: appStore.filters.sender,
  chat: appStore.filters.chat
})

// Search input with debouncing
const searchInput = ref(appStore.filters.searchTerm)

// Watch for store changes and update local filters
watch(() => appStore.filters, (newFilters) => {
  localFilters.startDate = newFilters.startDate
  localFilters.endDate = newFilters.endDate
  localFilters.sender = newFilters.sender
  localFilters.chat = newFilters.chat
  searchInput.value = newFilters.searchTerm
}, { deep: true })

// Initialize with default values if available
if (appStore.filters.startDate) {
  localFilters.startDate = appStore.filters.startDate
}
if (appStore.filters.endDate) {
  localFilters.endDate = appStore.filters.endDate
}

// Ensure filters are applied when component is mounted
onMounted(() => {
  // If we have date values from the store, apply them
  if (appStore.filters.startDate || appStore.filters.endDate) {
    applyFilters()
  }
})

// Debounced search function
const debouncedSearch = useDebounceFn(() => {
  appStore.setSearchTerm(searchInput.value)
  isSearching.value = false
  emit('filters-changed')
}, 300)

// Watch search input and apply debounced search
watch(searchInput, (newValue) => {
  if (newValue !== appStore.filters.searchTerm) {
    isSearching.value = true
    debouncedSearch()
  }
})

// Check if any filters are active
const hasActiveFilters = computed(() => {
  return localFilters.startDate ||
    localFilters.endDate ||
    localFilters.sender ||
    localFilters.chat ||
    searchInput.value
})

// Apply filters to the store
function applyFilters() {
  appStore.setDateRange(localFilters.startDate, localFilters.endDate)
  appStore.setSender(localFilters.sender)
  appStore.setChat(localFilters.chat)
  emit('filters-changed')
}

// Reset all filters
function resetFilters() {
  appStore.resetFilters()
  localFilters.startDate = ''
  localFilters.endDate = ''
  localFilters.sender = ''
  localFilters.chat = ''
  searchInput.value = ''
  emit('filters-changed')
}
</script>

<style scoped>
/* Hide calendar icon in date inputs for a cleaner look */
input[type="date"]::-webkit-calendar-picker-indicator {
  filter: invert(0.8);
}
</style>