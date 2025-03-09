<template>
  <div v-if="store.showTooltip"
    class="absolute z-10 bg-black bg-opacity-80 text-white p-3 rounded text-xs max-w-md shadow-lg border border-gray-700"
    :style="{ left: store.tooltipX + 'px', top: store.tooltipY + 'px' }">
    <template v-if="store.tooltipData">
      <!-- Chat name and timestamp -->
      <div class="flex justify-between items-start mb-2">
        <div class="font-bold text-sm truncate mr-2">
          <span class="inline-block w-3 h-3 rounded-full mr-1" :style="{ backgroundColor: pointColor }"></span>
          <template v-if="store.colorMode.value === 'user'">
            {{ store.tooltipData.sender_name || store.tooltipData.sender_id || 'Unknown User' }}
            <span class="text-xs text-gray-400 ml-1">in {{ store.tooltipData.chat_name || 'Unknown Chat' }}</span>
          </template>
          <template v-else>
            {{ store.tooltipData.chat_name || 'Unknown Chat' }}
          </template>
        </div>
        <div class="text-gray-400 text-xs whitespace-nowrap">
          {{ store.tooltipData.timestamp ? formattedTimestamp : 'Unknown time' }}
        </div>
      </div>

      <!-- Sender info (only show if not in user color mode) -->
      <div v-if="store.colorMode.value !== 'user'" class="mb-2 text-gray-300">
        <span class="font-medium">{{ store.tooltipData.sender_name || store.tooltipData.sender_id || 'Unknown sender' }}</span>
        <span v-if="store.tooltipData.sender_id && store.tooltipData.sender_name" class="text-gray-500 text-xs ml-1">
          ({{ store.tooltipData.sender_id }})
        </span>
      </div>

      <!-- Message content -->
      <div class="border-t border-gray-700 pt-2 mt-1 max-h-[200px] overflow-y-auto">
        <div v-if="store.tooltipData.content" class="whitespace-pre-wrap break-words">{{ store.tooltipData.content }}</div>
        <div v-else class="italic text-gray-500">No content</div>

        <!-- Additional metadata if available -->
        <div v-if="store.tooltipData.message_type || store.tooltipData.platform" class="mt-2 text-gray-400 text-xs">
          <div v-if="store.tooltipData.message_type">Type: {{ store.tooltipData.message_type }}</div>
          <div v-if="store.tooltipData.platform">Platform: {{ store.tooltipData.platform }}</div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAppStore } from '~/composables/appStore'
import { useTimestampParser } from '~/composables/useTimestampParser'

// Get the global store and timestamp parser
const store = useAppStore()
const { parseTimestamp } = useTimestampParser()

// Compute the point color based on the data
const pointColor = computed(() => {
  return store.tooltipData ? store.getPointColor(store.tooltipData) : '#ffffff'
})

// Format the timestamp for display
const formattedTimestamp = computed(() => {
  if (!store.tooltipData || !store.tooltipData.timestamp) return 'Unknown time'
  return store.formatTimestamp(store.tooltipData.timestamp)
})
</script>