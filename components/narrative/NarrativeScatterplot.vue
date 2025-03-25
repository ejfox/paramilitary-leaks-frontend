<template>
  <div class="narrative-scatterplot relative" :style="{ height: height + 'px' }">
    <canvas ref="canvas" class="w-full h-full"></canvas>
    <div v-if="error" class="absolute inset-0 flex items-center justify-center bg-black/50">
      <div class="bg-red-900/80 text-white p-4 rounded-lg max-w-md">
        <p class="font-bold mb-2">Visualization Error</p>
        <p class="text-sm">{{ error }}</p>
      </div>
    </div>
    <div v-if="!isInitialized && !error" class="absolute inset-0 flex items-center justify-center">
      <div class="text-white text-opacity-80 flex items-center">
        <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none"
          viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
          </path>
        </svg>
        <span>Initializing visualization...</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useVisualization } from '~/composables/useVisualization'
import { useColorMap } from '~/composables/useColorMap'

const props = defineProps({
  data: {
    type: Array,
    required: true
  },
  getSenderFn: {
    type: Function,
    default: item => item.sender || item.from || 'Unknown'
  },
  zoomLevel: {
    type: Number,
    default: 1
  },
  height: {
    type: Number,
    default: 600
  }
})

const canvas = ref(null)
const isInitialized = ref(false)
const colorMap = useColorMap()
const mounted = ref(false)
const error = ref(null)
const initAttempts = ref(0)
const maxInitAttempts = 3

// Get visualization methods from the composable
const {
  initScatterplot,
  transformData,
  resizeVisualization,
  cancelStreamingPoints
} = useVisualization()

// Access to the scatterplot instance for direct manipulation
let scatterplot = null

// Initialize scatterplot with proper options
function safeInitialize() {
  if (initAttempts.value >= maxInitAttempts) {
    error.value = `Failed to initialize visualization after ${maxInitAttempts} attempts.`
    console.error(error.value)
    return
  }

  initAttempts.value++
  error.value = null

  try {
    if (!canvas.value || !mounted.value) {
      setTimeout(safeInitialize, 500)
      return
    }

    // Get container dimensions
    const container = canvas.value.parentElement
    if (!container || container.offsetWidth === 0 || container.offsetHeight === 0) {
      setTimeout(safeInitialize, 500)
      return
    }

    // Configure the scatterplot with appropriate options
    const options = {
      width: container.offsetWidth,
      height: container.offsetHeight,
      pointSize: 3,
      pointSizeSelected: 5,
      opacity: 0.8,
      colorBy: 'category',
      backgroundColor: [0.08, 0.08, 0.12, 1],
      // Disable zooming and panning with mouse/touch
      enableZooming: false,
      enablePanning: false,
      // Properly set aspect ratio based on container
      aspectRatio: container.offsetWidth / container.offsetHeight,
      // Better color blending
      pointColorMixMode: 'multiply',
      // Create visual interest with variation
      scatterPointSizeBoundaries: [2, 8],
      scatterPointSizeExponent: 0.5
    };

    // Initialize the scatterplot
    initScatterplot(canvas.value, options)
    isInitialized.value = true

    // Store reference to scatterplot from composable
    scatterplot = window._scatterplot

    // Transform data after initialization if available
    if (props.data && props.data.length) {
      const dataToRender = props.data.slice(0, 5000); // Limit points for performance
      transformData(dataToRender)

      // Apply zoom level based on prop
      if (scatterplot && props.zoomLevel !== 1) {
        scatterplot.set({
          camera: {
            distance: 2 / props.zoomLevel,
            target: [0, 0]
          }
        });
      }
    }
  } catch (err) {
    console.error('Error initializing NarrativeScatterplot:', err)
    error.value = err.message || 'Failed to initialize visualization'
    setTimeout(safeInitialize, 1000)
  }
}

// Apply jitter to data for better visual distribution
function addJitterToData(data) {
  return data.map((point, index) => {
    // Create a copy to avoid modifying original data
    const newPoint = { ...point };

    // Calculate position using a grid-like layout with jitter
    const pointsPerRow = Math.ceil(Math.sqrt(data.length));
    const row = Math.floor(index / pointsPerRow);
    const col = index % pointsPerRow;

    // Add slight randomness for visual interest
    const jitterX = (Math.random() - 0.5) * 0.5;
    const jitterY = (Math.random() - 0.5) * 0.5;

    // Calculate position
    newPoint.x = (col - pointsPerRow / 2) + jitterX;
    newPoint.y = (row - Math.floor(data.length / pointsPerRow) / 2) + jitterY;

    return newPoint;
  });
}

// Set up the component
onMounted(() => {
  mounted.value = true

  // Delay initialization to ensure DOM is ready
  nextTick(() => {
    setTimeout(safeInitialize, 100)
  })

  // Add resize listener
  window.addEventListener('resize', handleResize, { passive: true })
})

// Clean up resources
onBeforeUnmount(() => {
  mounted.value = false
  window.removeEventListener('resize', handleResize)
  cancelStreamingPoints()

  // Clear references
  isInitialized.value = false
  scatterplot = null
})

// Watch for changes in data
watch(() => props.data, (newData) => {
  if (!isInitialized.value || !mounted.value || !newData?.length) return

  try {
    // Apply jitter and transform data
    const jitteredData = addJitterToData(newData.slice(0, 5000));
    transformData(jitteredData);

    // Apply zoom level
    if (scatterplot && props.zoomLevel !== 1) {
      scatterplot.set({
        camera: {
          distance: 2 / props.zoomLevel,
          target: [0, 0]
        }
      });
    }
  } catch (err) {
    console.error('Error updating scatterplot data:', err)
    error.value = `Failed to update visualization: ${err.message}`
  }
}, { deep: false })

// Watch for zoom level changes
watch(() => props.zoomLevel, (newZoomLevel) => {
  if (!isInitialized.value || !mounted.value || !scatterplot) return

  try {
    scatterplot.set({
      camera: {
        distance: 2 / newZoomLevel,
        target: [0, 0]
      }
    });
  } catch (err) {
    console.error('Error updating zoom level:', err)
  }
})

// Handle window resize
function handleResize() {
  if (!mounted.value || !isInitialized.value || !scatterplot || !canvas.value) return

  try {
    const container = canvas.value.parentElement;
    if (!container) return;

    // Update scatterplot dimensions to match container
    scatterplot.set({
      width: container.offsetWidth,
      height: container.offsetHeight,
      aspectRatio: container.offsetWidth / container.offsetHeight
    });
  } catch (error) {
    console.error('Error resizing visualization:', error)
  }
}
</script>

<style>
.narrative-scatterplot {
  position: relative;
  min-height: 200px;
  width: 100%;
}

.narrative-scatterplot canvas {
  display: block;
  width: 100%;
  height: 100%;
}
</style>