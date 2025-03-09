<template>
  <div class="flex gap-4 mb-4 items-center flex-wrap">
    <button @click="store.toggleColorMode()" class="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded">
      {{ colorModeText }}
    </button>

    <button @click="store.toggleXAxisMode()" class="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded">
      {{ xAxisModeText }}
    </button>

    <button @click="toggleTimeOfDayMode()" class="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded">
      {{ timeOfDayModeText }}
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAppStore } from '~/composables/appStore'

// Get the global store
const store = useAppStore()

// Computed properties for button text
const colorModeText = computed(() => {
  if (store.colorMode.value === 'chat') return 'Color by Chat'
  if (store.colorMode.value === 'user') return 'Color by User'
  return 'White Points'
})

const xAxisModeText = computed(() => 
  store.forceIndexMode.value ? 'Using Message Index' : 'Using Timestamp')
  
const timeOfDayModeText = computed(() => 
  store.timeOfDayMode.value ? 'Time of Day Y-axis' : 'Density Y-axis')

// Toggle function
function toggleTimeOfDayMode() {
  store.toggleTimeOfDayMode()
}
</script>