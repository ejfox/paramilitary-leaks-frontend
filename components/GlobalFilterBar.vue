<template>
  <div class="relative w-full">
    <!-- Toggle Button -->
    <button @click="isFilterVisible = !isFilterVisible"
      class="absolute right-4 z-20 text-gray-400 hover:text-white transition-colors bg-gray-800 py-1 px-2 rounded"
      :class="isFilterVisible ? 'top-2' : 'top-0'">
      <div class="flex items-center text-xs">
        <span class="mr-1">{{ isFilterVisible ? 'Hide' : 'Show' }} Filters</span>
        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd"
            :d="isFilterVisible
              ? 'M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z'
              : 'M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z'"
            clip-rule="evenodd" />
        </svg>
      </div>
    </button>

    <!-- Filter Bar -->
    <transition name="slide">
      <div v-if="isFilterVisible" class="w-full bg-gray-800 border-b border-gray-700 pt-2 pb-3 px-3 overflow-hidden">
        <div class="flex flex-wrap items-center gap-2 text-sm mt-4">
          <!-- Search Input -->
          <div class="flex items-center flex-grow max-w-xl">
            <div class="relative flex-grow">
              <input v-model="searchInput" type="text" placeholder="Search..."
                class="bg-gray-900 text-white border border-gray-700 rounded py-2 px-3 pl-8 text-sm w-full focus:outline-none focus:border-blue-500 transition-colors" />
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div v-if="isSearching" class="absolute inset-y-0 right-0 pr-3 flex items-center">
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

          <!-- Reset Button -->
          <button @click="resetFilters"
            class="bg-gray-700 hover:bg-gray-600 text-white py-2 px-3 text-sm rounded transition-colors">
            Reset
          </button>

          <!-- Active Filters Indicator -->
          <div v-if="hasActiveFilters" class="flex items-center gap-1 text-sm text-blue-400 ml-1">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd"
                d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z"
                clip-rule="evenodd" />
            </svg>
            <span>Filters active</span>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { reactive, computed, watch, ref, onMounted } from 'vue'
import { useAppStore } from '~/composables/appStore'
import { useDebounceFn } from '@vueuse/core'

const emit = defineEmits(['filters-changed'])

const appStore = useAppStore()
const isSearching = ref(false)
const isFilterVisible = ref(true)

// Create local reactive copy of filters
const localFilters = reactive({
  startDate: appStore.filters.startDate,
  endDate: appStore.filters.endDate
})

// Search input with debouncing
const searchInput = ref(appStore.filters.searchTerm)

// Watch for store changes and update local filters
watch(() => appStore.filters, (newFilters) => {
  localFilters.startDate = newFilters.startDate
  localFilters.endDate = newFilters.endDate
  searchInput.value = newFilters.searchTerm

  // If the store has been completely reset, ensure our local state matches
  if (!newFilters.startDate && !newFilters.endDate && !newFilters.searchTerm &&
    !newFilters.sender && !newFilters.chat) {
    searchInput.value = ''
    localFilters.startDate = ''
    localFilters.endDate = ''
  }
}, { deep: true })

// Initialize with default values if available
onMounted(() => {
  if (appStore.filters.startDate || appStore.filters.endDate) {
    applyFilters()
  }
})

// Debounced search function
const debouncedSearch = useDebounceFn(() => {
  appStore.setSearchTerm(searchInput.value)
  isSearching.value = false
  emit('filters-changed')
}, 150)

// Watch search input and apply debounced search
watch(searchInput, (newValue) => {
  if (newValue !== appStore.filters.searchTerm) {
    isSearching.value = true
    debouncedSearch()
  }
})

// Check if any filters are active
const hasActiveFilters = computed(() => {
  return localFilters.startDate || localFilters.endDate || searchInput.value
})

// Apply filters to the store
function applyFilters() {
  appStore.setDateRange(localFilters.startDate, localFilters.endDate)
  emit('filters-changed')
}

// Reset all filters
function resetFilters() {
  searchInput.value = ''
  localFilters.startDate = ''
  localFilters.endDate = ''
  appStore.resetFilters()
  emit('filters-changed')
}
</script>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: max-height 0.3s ease, opacity 0.3s ease;
  max-height: 100px;
  opacity: 1;
}

.slide-enter-from,
.slide-leave-to {
  max-height: 0;
  opacity: 0;
}

/* Hide calendar icon in date inputs for a cleaner look */
input[type="date"]::-webkit-calendar-picker-indicator {
  filter: invert(0.8);
  scale: 0.8;
}
</style>