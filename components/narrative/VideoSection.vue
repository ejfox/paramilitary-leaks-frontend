<template>
  <section ref="videoSection" class="narrative-video-section">
    <!-- Video container -->
    <div ref="videoContainer" class="narrative-video-container" :class="{ 'video-fixed': shouldBeFixed }">
      <video ref="videoPlayer" class="narrative-video" :src="videoUrl" muted playsinline @ended="videoEnded"></video>

      <!-- Floating narrative overlays -->
      <div
        class="absolute left-8 top-1/3 w-96 p-5 rounded-lg backdrop-blur-md bg-black/50 border border-gray-700/50 transform -translate-y-1/2 transition-opacity duration-500 font-mono"
        :class="{ 'opacity-0': !shouldBeFixed || videoProgress > 0.4 }">
        <div class="flex justify-between items-center mb-3">
          <h3 class="text-xl font-bold text-blue-400 tracking-tight">Paramilitary Leaks - Metadata</h3>
          <div class="text-xs text-gray-500">v0.0.3</div>
        </div>
        <div class="text-white mb-4">
          <div class="text-3xl font-light text-blue-300 mb-1">141,157</div>
          <div class="text-xs uppercase tracking-wider text-gray-400">total messages</div>
        </div>
        <div class="border-t border-gray-700/50 pt-2 text-sm">
          <div class="grid grid-cols-4 gap-2 mb-1">
            <div class="text-gray-400 text-xs">11/19</div>
            <div class="text-gray-400 text-xs">9/25</div>
            <div class="text-gray-400 text-xs">7/19</div>
            <div class="text-gray-400 text-xs">5/12</div>
          </div>
          <div class="flex h-16 mt-1 space-x-1">
            <div class="bg-blue-400/60 w-1/4 rounded-sm relative overflow-hidden">
              <div class="absolute bottom-0 left-0 right-0 h-3/4 bg-blue-400/30"></div>
              <div class="absolute top-1 text-center w-full text-xs text-white/80">812</div>
            </div>
            <div class="bg-blue-400/60 w-1/4 rounded-sm relative overflow-hidden">
              <div class="absolute bottom-0 left-0 right-0 h-2/3 bg-blue-400/30"></div>
              <div class="absolute top-1 text-center w-full text-xs text-white/80">756</div>
            </div>
            <div class="bg-blue-400/60 w-1/4 rounded-sm relative overflow-hidden">
              <div class="absolute bottom-0 left-0 right-0 h-1/2 bg-blue-400/30"></div>
              <div class="absolute top-1 text-center w-full text-xs text-white/80">642</div>
            </div>
            <div class="bg-blue-400/60 w-1/4 rounded-sm relative overflow-hidden">
              <div class="absolute bottom-0 left-0 right-0 h-2/5 bg-blue-400/30"></div>
              <div class="absolute top-1 text-center w-full text-xs text-white/80">590</div>
            </div>
          </div>
          <div class="text-xs uppercase tracking-wider text-gray-400 mt-1">Top Message Days</div>
        </div>
      </div>

      <div
        class="absolute right-8 top-1/2 w-96 p-5 rounded-lg backdrop-blur-md bg-black/50 border border-gray-700/50 transform -translate-y-1/2 transition-opacity duration-500 font-mono"
        :class="{ 'opacity-0': !shouldBeFixed || videoProgress < 0.25 || videoProgress > 0.6 }">
        <div class="flex justify-between items-center mb-3">
          <h3 class="text-xl font-bold text-green-400 tracking-tight">Network Analysis</h3>
          <div class="text-xs text-gray-500">1108 entities</div>
        </div>

        <div class="space-y-1.5 mb-4">
          <div class="flex justify-between">
            <span class="text-gray-300 text-sm truncate">Unknown <span class="text-gray-600">(Deleted
                Accounts)</span></span>
            <span class="text-green-300 text-sm">28.4K</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-300 text-sm truncate">Deleted Account</span>
            <span class="text-green-300 text-sm">12.2K</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-300 text-sm truncate">Ed</span>
            <span class="text-green-300 text-sm">8.7K</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-300 text-sm truncate">Coop</span>
            <span class="text-green-300 text-sm">7.3K</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-300 text-sm truncate">Scot AP founder Pa Z5</span>
            <span class="text-green-300 text-sm">6.1K</span>
          </div>
        </div>
      </div>

      <div
        class="absolute left-1/4 bottom-1/4 w-96 p-5 rounded-lg backdrop-blur-md bg-black/50 border border-gray-700/50 transition-opacity duration-500 font-mono"
        :class="{ 'opacity-0': !shouldBeFixed || videoProgress < 0.45 || videoProgress > 0.8 }">
        <div class="flex justify-between items-center mb-3">
          <h3 class="text-xl font-bold text-purple-400 tracking-tight">Activity Timeline</h3>
          <div class="text-xs text-gray-500">{{ formatNumber(dateRange) }} days</div>
        </div>

        <div class="space-y-1 text-xs mb-4">
          <div class="flex justify-between">
            <span class="text-gray-400">NOV 2020</span>
            <div class="w-16 h-3 bg-gray-800 rounded-sm overflow-hidden">
              <div class="h-full bg-purple-500/60 w-1/6"></div>
            </div>
            <span class="text-purple-300">450</span>
          </div>

          <div class="flex justify-between">
            <span class="text-gray-400">JAN 2021</span>
            <div class="w-16 h-3 bg-gray-800 rounded-sm overflow-hidden">
              <div class="h-full bg-purple-500/60 w-1/4"></div>
            </div>
            <span class="text-purple-300">1.8K</span>
          </div>

          <div class="flex justify-between">
            <span class="text-gray-400">AUG 2021</span>
            <div class="w-16 h-3 bg-gray-800 rounded-sm overflow-hidden">
              <div class="h-full bg-purple-500/60 w-4/5"></div>
            </div>
            <span class="text-purple-300">12K</span>
          </div>

          <div class="flex justify-between">
            <span class="text-gray-400">JAN 2022</span>
            <div class="w-16 h-3 bg-gray-800 rounded-sm overflow-hidden">
              <div class="h-full bg-purple-500/60 w-2/3"></div>
            </div>
            <span class="text-purple-300">8.5K</span>
          </div>

          <div class="flex justify-between">
            <span class="text-gray-400">JAN 2023</span>
            <div class="w-16 h-3 bg-gray-800 rounded-sm overflow-hidden">
              <div class="h-full bg-purple-500/60 w-1/2"></div>
            </div>
            <span class="text-purple-300">6.2K</span>
          </div>

          <div class="flex justify-between">
            <span class="text-gray-400">OCT 2024</span>
            <div class="w-16 h-3 bg-gray-800 rounded-sm overflow-hidden">
              <div class="h-full bg-purple-500/60 w-1/4"></div>
            </div>
            <span class="text-purple-300">1.5K</span>
          </div>
        </div>

        <div class="text-center text-xs text-gray-400 border-t border-gray-700/50 pt-2">
          <span>Analyzing communications over {{ formatNumber(dateRange) }} days of operations</span>
        </div>
      </div>

      <!-- Visualization overlays -->
      <div class="relative w-full h-full">
        <canvas ref="scatterplotCanvas" class="absolute inset-0 w-full h-full"></canvas>

        <!-- Visualization Loading Progress -->
        <div v-show="!loading && visualizationStreaming"
          class="absolute inset-0 flex items-center justify-center z-20 bg-gray-900/50">
          <div class="max-w-md w-full mx-4">
            <VisualizationLoading :processed-points="streamingProgress.processed"
              :total-points="streamingProgress.total" :start-time="streamingProgress.startTime"
              :status-message="streamingProgress.message || 'Processing visualization data...'"
              @cancel="cancelStreamingPoints" />
          </div>
        </div>
      </div>

      <!-- Transition overlay that appears as you scroll through the video section -->
      <div
        class="absolute bottom-0 left-0 right-0 h-screen pointer-events-none bg-gradient-to-b from-transparent to-gray-950 transition-opacity duration-1000"
        :style="{ opacity: Math.max(0, (videoProgress - 0.6) * 2.5) }">
        <!-- Preview of what's coming next to provide visual content during transition -->
        <div class="container mx-auto px-6 h-full flex flex-col justify-end pb-24 transition-all duration-1000"
          :style="{ opacity: Math.max(0, (videoProgress - 0.7) * 3.33), transform: `translateY(${Math.max(0, (1 - videoProgress * 1.1)) * 100}px)` }">
          <h2 class="text-3xl md:text-4xl font-bold text-white mb-8 text-shadow-lg">The Archive: John Williams' American
            Paramilitary Leaks
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div class="bg-gray-800/30 backdrop-blur-sm rounded-lg p-5 transform opacity-0 transition-all duration-700"
              :style="{
                transform: `translateY(${Math.max(0, (1 - videoProgress * 1.2)) * 80}px)`,
                opacity: videoProgress > 0.65 ? 1 : 0,
                transitionDelay: '0ms'
              }">
              <div class="text-center">
                <span class="text-3xl font-light text-blue-400">{{ formatNumber(141157) }}</span>
                <div class="text-sm text-gray-300 mt-1">Private Messages</div>
              </div>
            </div>

            <div class="bg-gray-800/30 backdrop-blur-sm rounded-lg p-5 transform opacity-0 transition-all duration-700"
              :style="{
                transform: `translateY(${Math.max(0, (1 - videoProgress * 1.15)) * 80}px)`,
                opacity: videoProgress > 0.7 ? 1 : 0,
                transitionDelay: '400ms'
              }">
              <div class="text-center">
                <span class="text-3xl font-light text-purple-400">{{ formatNumber(1108) }}</span>
                <div class="text-sm text-gray-300 mt-1">Network Members</div>
              </div>
            </div>

            <div class="bg-gray-800/30 backdrop-blur-sm rounded-lg p-5 transform opacity-0 transition-all duration-700"
              :style="{
                transform: `translateY(${Math.max(0, (1 - videoProgress * 1.1)) * 80}px)`,
                opacity: videoProgress > 0.75 ? 1 : 0,
                transitionDelay: '800ms'
              }">
              <div class="text-center">
                <span class="text-3xl font-light text-green-400">{{ formatNumber(dateRange) }}</span>
                <div class="text-sm text-gray-300 mt-1">Days of Operation</div>
              </div>
            </div>
          </div>
          <div class="text-center mt-4 text-gray-300 animate-pulse">
            <span>Continue Scrolling</span>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mx-auto mt-2" fill="none" stroke-linecap="round"
              stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
            </svg>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useVisualization } from '~/composables/useVisualization'
import VisualizationLoading from '~/components/VisualizationLoading.vue'

const props = defineProps({
  scrollY: {
    type: Number,
    default: 0
  },
  dateRange: {
    type: Number,
    default: 0
  },
  loading: {
    type: Boolean,
    default: false
  },
  visualizationStreaming: {
    type: Boolean,
    default: false
  },
  streamingProgress: {
    type: Object,
    default: () => ({
      processed: 0,
      total: 0,
      startTime: 0,
      message: ''
    })
  }
})

// Emitted events
const emit = defineEmits(['video-ended', 'cancel-streaming-points', 'update-video-progress'])

// Local state
const videoSection = ref(null)
const videoContainer = ref(null)
const videoPlayer = ref(null)
const scatterplotCanvas = ref(null)
const shouldBeFixed = ref(false)
const videoProgress = ref(0)
const videoUrl = 'https://res.cloudinary.com/ejf/video/upload/q_auto:good,f_auto,w_1920,c_fill,g_center,vc_auto/v1742858893/PARALEAKS_COMP_SHORTER_jm8fjw.mov'

// Get visualization methods
const {
  initScatterplot,
  transformData,
  cancelStreamingPoints
} = useVisualization()

// Handle scroll to update video position and progress
const handleScroll = () => {
  if (!videoSection.value || !videoPlayer.value) return

  try {
    const sectionRect = videoSection.value.getBoundingClientRect()
    const sectionTop = sectionRect.top + window.scrollY
    const sectionHeight = videoSection.value.offsetHeight
    const scrollPosition = window.scrollY
    const viewportHeight = window.innerHeight

    // Calculate how much of the section we've scrolled through (as a percentage)
    const totalScrollableAmount = sectionHeight - viewportHeight
    const scrolledAmount = Math.max(0, scrollPosition - sectionTop)
    const scrollPercentage = scrolledAmount / totalScrollableAmount

    // Adjust the release point to be near the end of the scroll to keep video visible longer
    const releasePoint = sectionTop + sectionHeight * 0.97 - viewportHeight // Changed from 0.95 to 0.97
    const transitionZone = viewportHeight * 1.5 // Reduced from 2.5 to 1.5 for faster transition out

    if (scrollPosition >= sectionTop && scrollPosition < releasePoint) {
      // Fully fixed mode
      shouldBeFixed.value = true

      // Calculate progress for video playback
      const scrollableDistance = releasePoint - sectionTop
      const scrolled = scrollPosition - sectionTop

      // OPTIMIZED PLAYBACK: Use 70% of the section height for video playback
      // This makes sure video playback completes before the end of the section
      let progress = Math.min(Math.max(scrolled / (scrollableDistance * 0.7), 0), 0.99)

      // Only hold on last frame for final 5% of the scroll
      const progressPercentage = scrolled / scrollableDistance
      if (progressPercentage > 0.95) {
        progress = 0.99 // Lock to last frame when nearing release point
      }

      videoProgress.value = progress
      emit('update-video-progress', progress)

      // Update video time if video is ready
      if (videoPlayer.value?.readyState >= 2 && !isNaN(videoPlayer.value.duration)) {
        videoPlayer.value.currentTime = videoPlayer.value.duration * progress
      }

      // Reset any transform we may have applied during transition
      if (videoContainer.value) {
        videoContainer.value.style.transform = ''
      }
    }
    else if (scrollPosition >= releasePoint && scrollPosition < (releasePoint + transitionZone)) {
      // Transition zone - start with fixed, then gradually push up
      shouldBeFixed.value = true

      // Calculate how far into transition zone we are (0 to 1)
      const transitionProgress = (scrollPosition - releasePoint) / transitionZone

      // Apply increasingly stronger upward transform as we scroll
      // Use a more gradual transition than before - reduce transform strength
      if (videoContainer.value) {
        // Start transform only after 20% into the transition zone
        if (transitionProgress > 0.2) {
          const adjustedProgress = (transitionProgress - 0.2) / 0.8 // Rescale 0.2-1.0 to 0-1.0
          const yOffset = adjustedProgress * -viewportHeight * 0.7 // Reduced from 0.8 to 0.7
          videoContainer.value.style.transform = `translateY(${yOffset}px)`
        } else {
          videoContainer.value.style.transform = '' // No transform for first 20%
        }
      }

      // Always keep video at last frame
      if (videoPlayer.value?.readyState >= 2 && !isNaN(videoPlayer.value.duration)) {
        videoPlayer.value.currentTime = videoPlayer.value.duration * 0.99 // Last frame
      }

      // Update progress value for other animations
      videoProgress.value = 1
      emit('update-video-progress', 1)
    }
    else {
      // Outside fixed zones
      shouldBeFixed.value = false
    }
  } catch (error) {
    console.error('Error in scroll handler:', error)
  }
}

// Initialize video player
function initializeVideoPlayer() {
  if (videoPlayer.value) {
    try {
      videoPlayer.value.load()

      videoPlayer.value.addEventListener('loadedmetadata', () => {
        console.log('Video metadata loaded, duration:', videoPlayer.value.duration)
        updateVideoProgress()
      })

      videoPlayer.value.addEventListener('error', (e) => {
        console.error('Video error:', e)
      })
    } catch (e) {
      console.error('Error setting up video player:', e)
    }
  }
}

// Update video progress based on scroll position
const updateVideoProgress = () => {
  if (!videoPlayer.value || !videoSection.value) return

  try {
    // Get current scroll position relative to the video section
    const sectionRect = videoSection.value.getBoundingClientRect()
    const sectionTop = sectionRect.top + window.scrollY
    const sectionHeight = videoSection.value.offsetHeight
    const scrollPosition = window.scrollY
    const viewportHeight = window.innerHeight

    // Calculate progress percentage (0 to 1)
    // OPTIMIZED PLAYBACK: Use 70% of scrollable distance for full video playback
    const scrollableDistance = sectionHeight - viewportHeight
    const scrolled = Math.max(0, scrollPosition - sectionTop)

    // Match the 0.7 factor used in handleScroll for consistency
    const progress = Math.min(Math.max(scrolled / (scrollableDistance * 0.7), 0), 1)

    // Update our progress ref
    videoProgress.value = progress
    emit('update-video-progress', progress)

    // Check if video is properly loaded and has duration
    if (videoPlayer.value.readyState >= 2) {
      const videoDuration = videoPlayer.value.duration
      if (!isNaN(videoDuration) && videoDuration > 0) {
        const targetTime = progress * videoDuration
        if (Math.abs(videoPlayer.value.currentTime - targetTime) > 0.1) {
          videoPlayer.value.currentTime = targetTime
        }
      }
    }
  } catch (error) {
    console.error('Error updating video progress:', error)
  }
}

// Initialize the visualizations
async function initializeVisualizations(data) {
  try {
    console.log('Initializing video section visualizations...')

    if (!scatterplotCanvas.value) {
      console.warn('Scatterplot canvas not found in the DOM')
      return
    }

    // Force a brief delay to ensure DOM updates are complete
    await new Promise(resolve => setTimeout(resolve, 100))

    // Make sure canvas is visible and properly styled
    const canvasElement = scatterplotCanvas.value
    if (!canvasElement) {
      console.error('Canvas element still not available')
      return
    }

    canvasElement.style.opacity = "1"
    canvasElement.style.zIndex = "1"
    canvasElement.style.display = "block"

    // Initialize the scatterplot with try/catch
    try {
      initScatterplot(canvasElement)
    } catch (err) {
      console.error('Error initializing scatterplot:', err)
      return
    }

    // Only transform data if we have it
    if (data && data.length > 0) {
      try {
        transformData(data)
      } catch (err) {
        console.error('Error transforming data:', err)
      }
    }
  } catch (err) {
    console.error('Error initializing visualizations:', err)
  }
}

// Video ended event
const videoEnded = () => {
  emit('video-ended')
}

// Format helper
const formatNumber = (num) => {
  return new Intl.NumberFormat().format(num || 0)
}

// Setup event listeners on mount
onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
  window.addEventListener('resize', handleScroll, { passive: true })

  // Initial call to set correct state
  nextTick(() => {
    initializeVideoPlayer()
    handleScroll()
  })
})

// Clean up on unmount
onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('resize', handleScroll)
})

// Expose refs
defineExpose({
  videoSection,
  initializeVisualizations
})
</script>

<style scoped>
/* Video section styles */
.narrative-video-section {
  position: relative;
  height: 800vh;
  /* Reduced from 1200vh to 800vh for more efficient scrolling */
  background: black;
  z-index: 1;
  background: linear-gradient(to bottom, black 0%, black 75%, rgba(17, 24, 39, 0.98) 95%, rgba(17, 24, 39, 0.95) 100%);
}

.narrative-video-container {
  height: 100vh;
  width: 100%;
  overflow: hidden;
  perspective: 1000px;
}

.video-fixed {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  height: 100vh;
  z-index: 10;
}

.narrative-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Smooth transitions for the overlays */
.narrative-video-container>div {
  transition: all 0.5s ease-out;
}

.narrative-video-container>div:hover {
  transform: translateY(-52%) scale(1.02);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

/* Text shadow for better readability */
.text-shadow-lg {
  text-shadow: 0 0 8px rgba(0, 0, 0, 0.8), 0 0 30px rgba(0, 0, 0, 0.6);
}
</style>