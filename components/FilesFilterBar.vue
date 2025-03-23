<template>
  <div class="w-full bg-gray-800 border-b border-gray-700 relative">
    <!-- Toggle Button - positioned for thumb reachability on mobile -->
    <button @click="isFilterVisible = !isFilterVisible"
      class="absolute z-10 text-gray-400 hover:text-white transition-colors"
      :class="isMobile ? 'right-3 bottom-3' : 'right-4 top-2'">
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
      <div v-show="isFilterVisible"
        class="w-full bg-gray-800 border-b border-gray-700 py-2 px-3 overflow-hidden transition-all duration-300">
        <div class="flex flex-wrap items-center gap-2 text-sm">
          <!-- Search Input with mobile-friendly size -->
          <div class="flex items-center flex-grow sm:max-w-xl">
            <div class="relative flex-grow">
              <input v-model="searchInput" type="text" placeholder="Search files..."
                class="bg-gray-900 text-white border border-gray-700 rounded py-2 px-3 pl-8 pr-8 text-sm w-full focus:outline-none focus:border-blue-500 transition-colors" />
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <!-- Clear search button -->
              <button 
                v-if="searchInput" 
                @click="searchInput = ''"
                class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
                style="min-height: 44px; min-width: 44px;">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                </svg>
              </button>
            </div>
          </div>

          <!-- File type filter - collapses on mobile -->
          <div class="hidden sm:flex space-x-1">
            <button v-for="type in fileTypes" :key="type"
              @click="toggleFileType(type)"
              class="px-2 py-1 text-xs rounded transition-colors flex items-center"
              :class="filters.fileType === type ? 'bg-blue-700 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'">
              <span>{{ type.charAt(0).toUpperCase() + type.slice(1) }}</span>
            </button>
          </div>

          <!-- Mobile type dropdown -->
          <div class="sm:hidden relative">
            <select v-model="filters.fileType" 
              class="bg-gray-900 text-white border border-gray-700 rounded py-2 px-3 text-sm appearance-none pr-8 focus:outline-none focus:border-blue-500"
              style="min-height: 44px; min-width: 100px;">
              <option :value="null">All Types</option>
              <option v-for="type in fileTypes" :key="type" :value="type">
                {{ type.charAt(0).toUpperCase() + type.slice(1) }}
              </option>
            </select>
            <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </div>
          </div>

          <!-- Reset Button - improved affordance and haptic feedback for mobile -->
          <button @click="resetFilters"
            class="bg-gray-700 hover:bg-gray-600 text-white py-2 px-3 text-sm rounded transition-colors flex items-center space-x-1"
            style="min-height: 44px;">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
            </svg>
            <span>Reset All</span>
          </button>

          <!-- Active Filters Indicator with improved visibility -->
          <div v-if="hasActiveFilters" 
            class="flex items-center gap-1 text-sm text-blue-400 ml-1 bg-blue-900/30 px-2 py-1 rounded-full">
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
import { useDebounceFn } from '@vueuse/core'

const emit = defineEmits(['filters-changed', 'reset'])

// Check if we're on a mobile device (for UI adaptation)
const isMobile = ref(false);

onMounted(() => {
  checkMobile();
  window.addEventListener('resize', checkMobile);
})

function checkMobile() {
  isMobile.value = window.innerWidth < 640; // sm breakpoint
}

const isFilterVisible = ref(true)

// Available file types
const fileTypes = ['image', 'document', 'video', 'audio', 'archive', 'other']

// Filter state
const filters = reactive({
  searchTerm: '',
  fileType: null,
  sizeRange: { min: 0, max: Infinity }
})

// Search input with debouncing
const searchInput = ref('')

// Debounced search function
const debouncedSearch = useDebounceFn(() => {
  filters.searchTerm = searchInput.value
  emit('filters-changed', { ...filters })
}, 150)

// Watch search input and apply debounced search
watch(searchInput, (newValue) => {
  if (newValue !== filters.searchTerm) {
    debouncedSearch()
  }
})

// Watch fileType changes
watch(() => filters.fileType, () => {
  emit('filters-changed', { ...filters })
})

// Toggle file type filter
function toggleFileType(type) {
  if (filters.fileType === type) {
    filters.fileType = null
  } else {
    filters.fileType = type
  }
}

// Check if any filters are active
const hasActiveFilters = computed(() => {
  return filters.searchTerm || 
    filters.fileType || 
    filters.sizeRange.min > 0 || 
    filters.sizeRange.max < Infinity
})

// Reset all filters
function resetFilters() {
  // Provide haptic feedback on mobile devices
  if ('vibrate' in navigator) {
    navigator.vibrate(50);
  }
  
  // Clear local values
  searchInput.value = ''
  filters.searchTerm = ''
  filters.fileType = null
  filters.sizeRange = { min: 0, max: Infinity }

  // Animation - simulate a "reset" effect
  const resetButton = event.currentTarget;
  resetButton.classList.add('bg-blue-600');
  setTimeout(() => {
    resetButton.classList.remove('bg-blue-600');
  }, 150);

  // Emit reset event
  emit('reset')
  emit('filters-changed', { ...filters })
}

// Initialize from URL if needed
onMounted(() => {
  const urlParams = new URLSearchParams(window.location.search)
  
  if (urlParams.has('search')) {
    searchInput.value = urlParams.get('search')
    filters.searchTerm = urlParams.get('search')
  }
  
  if (urlParams.has('type')) {
    filters.fileType = urlParams.get('type')
  }
  
  if (urlParams.has('minSize')) {
    filters.sizeRange.min = parseInt(urlParams.get('minSize')) || 0
  }
  
  if (urlParams.has('maxSize')) {
    filters.sizeRange.max = parseInt(urlParams.get('maxSize')) || Infinity
  }
})
</script>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: max-height 0.3s ease;
  max-height: 200px;
  overflow: hidden;
}

.slide-enter-from,
.slide-leave-to {
  max-height: 0;
}
</style> 