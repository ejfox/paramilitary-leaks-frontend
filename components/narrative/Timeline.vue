<template>
  <div class="relative">
    <!-- Vertical line -->
    <div class="absolute left-0 w-0.5 bg-gray-700 h-full transform -translate-x-1/2 md:left-1/2"></div>

    <!-- Timeline events -->
    <div class="space-y-20">
      <div v-for="(event, index) in events" :key="index" class="relative" :class="{ 'mt-8': index === 0 }">
        <!-- Dot marker -->
        <div class="absolute left-0 w-4 h-4 rounded-full transform -translate-x-1/2 md:left-1/2"
          :class="event.highlight ? 'bg-blue-500' : 'bg-gray-500'"></div>

        <!-- Content Box -->
        <div class="relative ml-8 md:ml-0 md:w-5/12" :class="index % 2 === 0 ? 'md:mr-auto' : 'md:ml-auto'">
          <SectionTransition :active="active" :delay="200 + index * 200"
            :effect="index % 2 === 0 ? 'slide-right' : 'slide-left'">
            <div class="bg-gray-800 bg-opacity-50 backdrop-blur-sm p-4 rounded-lg border border-gray-700">
              <h3 class="text-md font-bold text-blue-400">{{ event.date }}</h3>
              <p class="text-white my-2">{{ event.title }}</p>
              <p class="text-gray-300 text-sm">{{ event.description }}</p>

              <!-- Message count indicator -->
              <div v-if="event.messageCount" class="mt-3 text-gray-400 text-xs flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                {{ formatNumber(event.messageCount) }} messages
              </div>
            </div>
          </SectionTransition>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import SectionTransition from './SectionTransition.vue'

const props = defineProps({
  events: {
    type: Array,
    required: true
  },
  active: {
    type: Boolean,
    default: false
  }
})

// Format number with commas
function formatNumber(num) {
  return new Intl.NumberFormat().format(num)
}
</script>