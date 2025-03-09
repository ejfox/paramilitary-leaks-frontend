<template>
  <div class="mb-4">
    <div v-if="store.loading" class="text-white bg-gray-800 p-4 rounded-lg shadow-lg">
      <div class="flex items-center">
        <div class="animate-spin mr-3">
          <svg class="w-6 h-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <div>
          <div class="text-lg font-semibold">Loading DuckDB and Parquet File</div>
          <div class="text-sm text-gray-400">Initial display limited to 10,000 points for performance</div>
        </div>
      </div>
    </div>
    <div v-else class="text-white bg-gray-800 p-4 rounded-lg shadow-lg">
      <div class="text-lg font-semibold mb-2">
        Rows Loaded: {{ store.rowsLoaded.toLocaleString() }}
        <span v-if="store.messages.value.length > 0" class="text-sm text-gray-400 ml-2">
          (Visualizing {{ store.messages.value.length.toLocaleString() }} points)
        </span>
      </div>
      <div v-if="filteredOutCount > 0" class="text-sm text-gray-400">
        Filtered out {{ filteredOutCount.toLocaleString() }} rows
        <template v-if="store.filterPreModern.value">with invalid timestamps or before 2020</template>
        <template v-else>with invalid timestamps</template>
      </div>
      <div v-if="store.error" class="text-red-500 mt-2">{{ store.error }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAppStore } from '~/composables/appStore'

// Get the global store
const store = useAppStore()

// Calculate how many rows were filtered out
const filteredOutCount = computed(() => {
  if (!store.messages.value.length) return 0
  // rowsLoaded is now a plain number
  return store.rowsLoaded - store.messages.value.length
})
</script>