<template>
  <div class="visualization-loading-component">
    <!-- Progress Bar Container -->
    <div class="bg-gray-800/80 rounded-lg p-4 border border-gray-700 shadow-lg">
      <div class="flex items-center justify-between mb-2">
        <h3 class="text-white font-medium">Processing Data</h3>
        <div class="text-sm text-blue-300" v-if="totalPoints">
          {{ processedPoints }} / {{ totalPoints }} points
        </div>
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
          Cancel Processing
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  processedPoints: {
    type: Number,
    default: 0
  },
  totalPoints: {
    type: Number,
    default: 0
  },
  startTime: {
    type: Number,
    default: 0
  },
  statusMessage: {
    type: String,
    default: 'Processing data points...'
  },
  showCancel: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['cancel'])

// Calculate progress percentage
const progress = computed(() => {
  if (!props.totalPoints || props.totalPoints === 0) return 0
  return Math.round((props.processedPoints / props.totalPoints) * 100)
})

// Calculate estimated time remaining
const estimatedTimeRemaining = computed(() => {
  if (!props.startTime || !props.processedPoints || !props.totalPoints || progress.value >= 100) {
    return null
  }
  
  const elapsedSeconds = (Date.now() - props.startTime) / 1000
  const pointsPerSecond = props.processedPoints / elapsedSeconds
  const pointsRemaining = props.totalPoints - props.processedPoints
  
  if (pointsPerSecond <= 0) return 'Calculating...'
  
  const secondsRemaining = pointsRemaining / pointsPerSecond
  
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
</script>

<style scoped>
.visualization-loading-component {
  transition: all 0.3s ease;
}
</style>