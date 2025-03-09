<template>
  <div class="flex gap-4 mb-4 items-center flex-wrap">
    <button @click="$emit('toggle-color-mode')" class="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded">
      {{ colorModeText }}
    </button>

    <button @click="$emit('toggle-x-axis-mode')" class="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded">
      {{ xAxisModeText }}
    </button>

    <button @click="$emit('toggle-sort-mode')" class="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded">
      {{ sortModeText }}
    </button>

    <button @click="$emit('toggle-filter-mode')" class="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded">
      {{ filterModeText }}
    </button>

    <button @click="$emit('toggle-time-of-day-mode')" class="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded">
      {{ timeOfDayModeText }}
    </button>

    <button @click="$emit('toggle-user-y-axis-mode')" class="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded">
      {{ userYAxisModeText }}
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  colorMode: {
    type: String,
    required: true
  },
  forceIndexMode: {
    type: Boolean,
    required: true
  },
  sortByTimestamp: {
    type: Boolean,
    required: true
  },
  filterPreModern: {
    type: Boolean,
    required: true
  },
  timeOfDayMode: {
    type: Boolean,
    required: true
  },
  userYAxisMode: {
    type: Boolean,
    required: true
  }
})

const colorModeText = computed(() => {
  if (props.colorMode === 'chat') return 'Color by Chat';
  if (props.colorMode === 'user') return 'Color by User';
  return 'White Points';
})

const xAxisModeText = computed(() => props.forceIndexMode ? 'Using Message Index' : 'Using Timestamp')
const sortModeText = computed(() => props.sortByTimestamp ? 'Sorted by Time' : 'Original Order')
const filterModeText = computed(() => props.filterPreModern ? 'Hiding Pre-2020 Messages' : 'Show All Dates')
const timeOfDayModeText = computed(() => props.timeOfDayMode ? 'Time of Day Y-axis' : 'Density Y-axis')
const userYAxisModeText = computed(() => props.userYAxisMode ? 'User Y-axis' : 'Time of Day Y-axis')

defineEmits([
  'toggle-color-mode',
  'toggle-x-axis-mode',
  'toggle-sort-mode',
  'toggle-filter-mode',
  'toggle-time-of-day-mode',
  'toggle-user-y-axis-mode'
])
</script>