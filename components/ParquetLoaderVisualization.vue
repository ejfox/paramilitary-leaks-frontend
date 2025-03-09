<template>
  <div class="relative w-full h-[80vh] parquet-loader-viz">
    <!-- Canvas for WebGL rendering -->
    <canvas ref="canvas" class="w-full h-full border border-gray-300 rounded-md emergency-canvas"
      @mousemove="$emit('mousemove', $event)" @mouseleave="$emit('mouseleave')"></canvas>

    <!-- Tooltip -->
    <div v-if="showTooltip"
      class="absolute z-10 bg-black bg-opacity-80 text-white p-3 rounded text-xs max-w-md shadow-lg border border-gray-700"
      :style="{ left: tooltipX + 'px', top: tooltipY + 'px' }">
      <template v-if="tooltipData">
        <!-- Chat name and timestamp -->
        <div class="flex justify-between items-start mb-2">
          <div class="font-bold text-sm truncate mr-2">
            <span class="inline-block w-3 h-3 rounded-full mr-1" :style="{ backgroundColor: pointColor }"></span>
            <template v-if="colorMode === 'user'">
              {{ tooltipData.sender || tooltipData.sender_name || tooltipData.sender_id || 'Unknown User' }}
              <span class="text-xs text-gray-400 ml-1">in {{ tooltipData.chat_name || 'Unknown Chat' }}</span>
            </template>
            <template v-else>
              {{ tooltipData.chat_name || 'Unknown Chat' }}
            </template>
          </div>
          <div class="text-gray-400 text-xs whitespace-nowrap">
            {{ tooltipData.timestamp ? formattedTimestamp : 'Unknown time' }}
          </div>
        </div>

        <!-- Sender info (only show if not in user color mode) -->
        <div v-if="colorMode !== 'user'" class="mb-2 text-gray-300">

          <span v-if="tooltipData.sender_id && tooltipData.sender_name" class="text-gray-500 text-xs ml-1">
            ({{ tooltipData.sender_id }})
          </span>
        </div>

        <!-- Message content -->
        <div class="border-t border-gray-700 pt-2 mt-1 max-h-[200px] overflow-y-auto">
          <div v-if="tooltipData.content" class="whitespace-pre-wrap break-words">{{ tooltipData.content }}</div>
          <div v-else class="italic text-gray-500">No content</div>

          <!-- Additional metadata if available -->
          <div v-if="tooltipData.message_type || tooltipData.platform" class="mt-2 text-gray-400 text-xs">
            <div v-if="tooltipData.message_type">Type: {{ tooltipData.message_type }}</div>
            <div v-if="tooltipData.platform">Platform: {{ tooltipData.platform }}</div>
          </div>
        </div>
      </template>
    </div>

    <!-- Time annotations (positioned along the top) -->
    <div v-if="!forceIndexMode && !userYAxisMode && timeAnnotations.length > 0"
      class="absolute top-2 left-0 w-full pointer-events-none">
      <div v-for="annotation in timeAnnotations" :key="annotation.date"
        class="absolute text-white text-xs bg-black bg-opacity-50 px-1 py-0.5 rounded transform -translate-x-1/2"
        :style="{ left: annotation.position * 100 + '%' }">
        {{ annotation.label }}
      </div>
    </div>

    <!-- Y-axis labels (positioned absolutely over the canvas) -->
    <div class="absolute left-2 top-0 h-full flex flex-col justify-between pointer-events-none text-white text-xs">
      <template v-if="timeOfDayMode">
        <div class="py-2 font-bold">Time of Day</div>
        <div class="py-2">00:00</div>
        <div class="py-2">06:00</div>
        <div class="py-2">12:00</div>
        <div class="py-2">18:00</div>
        <div class="py-2">23:59</div>
      </template>
      <template v-else-if="userYAxisMode">
        <div class="py-2 font-bold">Users</div>
      </template>
      <template v-else>
        <div class="py-2 font-bold">Message Density</div>
        <div class="py-2">↑</div>
      </template>
    </div>

    <!-- User labels when in user Y-axis mode -->
    <div v-if="userYAxisMode && timeAnnotations.length > 0"
      class="absolute left-2 top-0 h-full w-[150px] pointer-events-none">
      <div v-for="annotation in timeAnnotations.slice(0, 20)" :key="annotation.id"
        class="absolute text-white text-xs bg-black bg-opacity-50 px-1 py-0.5 rounded transform -translate-y-1/2"
        :style="{ top: annotation.position + '%', left: '0' }">
        {{ annotation.label }}
      </div>
      <div v-if="timeAnnotations.length > 20"
        class="absolute bottom-4 left-0 text-white text-xs bg-black bg-opacity-50 px-1 py-0.5 rounded">
        +{{ timeAnnotations.length - 20 }} more users
      </div>
    </div>

    <!-- X-axis label -->
    <div class="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-white text-xs pointer-events-none">
      {{ forceIndexMode ? 'Message Index' : 'Time' }} →
    </div>

    <!-- Legend (positioned in bottom right) -->
    <div v-if="(colorMode === 'chat' || colorMode === 'user') && legendItems.length > 0"
      class="absolute bottom-4 right-4 bg-black bg-opacity-70 p-2 rounded text-xs max-h-[30vh] overflow-y-auto">
      <div class="text-white font-bold mb-1">
        {{ legendTitle }} ({{ legendItems.length }})
      </div>
      <div v-for="item in legendItems.slice(0, 20)" :key="item.id" class="flex items-center mb-1">
        <div class="w-3 h-3 mr-2" :style="{ backgroundColor: item.color }"></div>
        <div class="text-white truncate max-w-[250px]">{{ item.label }}</div>
      </div>
      <div v-if="legendItems.length > 20" class="text-white text-opacity-70 italic">
        +{{ legendItems.length - 20 }} more...
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import * as d3 from 'd3';

const props = defineProps({
  data: {
    type: Array,
    required: true
  },
  colorMode: {
    type: String,
    required: true
  },
  forceIndexMode: {
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
  },
  legendItems: {
    type: Array,
    default: () => []
  },
  timeAnnotations: {
    type: Array,
    default: () => []
  },
  showTooltip: {
    type: Boolean,
    required: true
  },
  tooltipX: {
    type: Number,
    required: true
  },
  tooltipY: {
    type: Number,
    required: true
  },
  tooltipData: {
    type: Object,
    default: null
  },
  getPointColor: { // Expecting a function to get point color
    type: Function,
    required: true
  },
  formatTimestamp: { // Expecting a function to format timestamp
    type: Function,
    required: true
  }
})

const emit = defineEmits(['mousemove', 'mouseleave', 'canvas-ready'])

const canvas = ref(null)

// Add onMounted hook to ensure canvas is ready and notify parent
onMounted(async () => {
  console.log('🔍 ParquetLoaderVisualization mounted, canvas ref:', !!canvas.value)

  // Wait for next tick to ensure DOM is fully updated
  await nextTick()

  if (canvas.value) {
    console.log('🔍 Canvas element dimensions:', {
      width: canvas.value.width,
      height: canvas.value.height,
      offsetWidth: canvas.value.offsetWidth,
      offsetHeight: canvas.value.offsetHeight,
      clientWidth: canvas.value.clientWidth,
      clientHeight: canvas.value.clientHeight
    })

    // Set a direct width/height just in case
    canvas.value.style.display = 'block';
    canvas.value.width = canvas.value.offsetWidth || 800;
    canvas.value.height = canvas.value.offsetHeight || 600;

    // Emit event to notify parent that canvas is ready
    emit('canvas-ready', canvas.value)
  } else {
    console.error('🔍 Canvas reference is null after mounting')
  }
})

const legendTitle = computed(() => props.colorMode === 'chat' ? 'Chat Groups' : 'Users')
const pointColor = computed(() => props.tooltipData ? props.getPointColor(props.tooltipData) : 'white')
const formattedTimestamp = computed(() => props.tooltipData?.timestamp ? props.formatTimestamp(props.tooltipData.timestamp) : 'Unknown time')

defineExpose({ // Expose canvas ref for parent component to access
  canvas
})
</script>