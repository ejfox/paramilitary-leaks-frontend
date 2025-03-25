<template>
  <div class="download-progress-component">
    <!-- Main Download Progress Display -->
    <div v-if="isDownloading" class="bg-gray-800 rounded-lg p-4 border border-gray-700 shadow-lg">
      <div class="flex items-center justify-between mb-2">
        <h3 class="text-white font-medium">Downloading Data File</h3>
        <div class="text-sm text-blue-300">{{ formatSize(downloadedBytes) }} / {{ formatSize(totalBytes) }}</div>
      </div>
      
      <!-- Progress Bar -->
      <div class="w-full bg-gray-700 rounded-full h-4 mb-2 overflow-hidden">
        <div 
          class="h-4 rounded-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-300 flex items-center justify-center"
          :style="{ width: `${progress}%` }">
          <span v-if="progress > 15" class="text-xs text-white font-bold drop-shadow-sm px-2">{{ progress }}%</span>
        </div>
      </div>
      
      <!-- Status Message -->
      <div class="flex justify-between items-center mt-1">
        <div class="text-gray-300 text-sm">{{ statusMessage }}</div>
        <div v-if="estimatedTimeRemaining" class="text-sm text-gray-400">
          {{ estimatedTimeRemaining }} remaining
        </div>
      </div>
      
      <!-- Optional Cancel Button -->
      <div v-if="showCancel" class="mt-3 text-right">
        <button 
          @click="$emit('cancel')" 
          class="text-xs text-gray-400 hover:text-red-400 transition-colors"
        >
          Cancel Download
        </button>
      </div>
    </div>
    
    <!-- Cache Status (when not downloading) -->
    <div v-else-if="showCacheInfo" class="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
      <div class="flex items-center justify-between">
        <div>
          <div class="text-sm text-gray-300 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            Data file cached ({{ formatSize(cachedSize) }})
          </div>
          <div class="text-xs text-gray-500 mt-0.5">Last updated: {{ cacheDate }}</div>
        </div>
        <div class="flex space-x-2">
          <button 
            @click="$emit('refresh-cache')" 
            class="text-xs text-blue-400 hover:text-blue-300 transition-colors px-2 py-1"
          >
            Refresh
          </button>
          <button 
            @click="$emit('clear-cache')" 
            class="text-xs text-gray-400 hover:text-red-400 transition-colors px-2 py-1"
          >
            Clear Cache
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { format } from 'date-fns'

const props = defineProps({
  isDownloading: Boolean,
  progress: {
    type: Number,
    default: 0
  },
  downloadedBytes: {
    type: Number,
    default: 0
  },
  totalBytes: {
    type: Number,
    default: 0
  },
  statusMessage: {
    type: String,
    default: 'Downloading data...'
  },
  downloadStartTime: Number,
  showCancel: {
    type: Boolean,
    default: true
  },
  showCacheInfo: {
    type: Boolean,
    default: false
  },
  cacheTimestamp: Number,
  cachedSize: Number
})

const emit = defineEmits(['cancel', 'refresh-cache', 'clear-cache'])

// Format the cache date in a human-readable format
const cacheDate = computed(() => {
  if (!props.cacheTimestamp) return 'Unknown'
  return format(new Date(props.cacheTimestamp), 'MMM d, yyyy h:mm a')
})

// Calculate estimated time remaining
const estimatedTimeRemaining = computed(() => {
  if (!props.downloadStartTime || !props.downloadedBytes || !props.totalBytes || props.progress >= 100) {
    return null
  }
  
  const elapsedSeconds = (Date.now() - props.downloadStartTime) / 1000
  const bytesPerSecond = props.downloadedBytes / elapsedSeconds
  const bytesRemaining = props.totalBytes - props.downloadedBytes
  
  if (bytesPerSecond <= 0) return 'Calculating...'
  
  const secondsRemaining = bytesRemaining / bytesPerSecond
  
  if (secondsRemaining < 60) {
    return `${Math.ceil(secondsRemaining)} seconds`
  } else if (secondsRemaining < 3600) {
    return `${Math.ceil(secondsRemaining / 60)} minutes`
  } else {
    const hours = Math.floor(secondsRemaining / 3600)
    const minutes = Math.ceil((secondsRemaining % 3600) / 60)
    return `${hours}h ${minutes}m`
  }
})

// Format bytes to human-readable sizes
function formatSize(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + sizes[i]
}
</script>

<style scoped>
.download-progress-component {
  transition: all 0.3s ease;
}
</style>