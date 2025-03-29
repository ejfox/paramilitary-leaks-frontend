<template>
  <section ref="videoSection" class="narrative-video-section">
    <!-- Video container -->
    <div ref="videoContainer" class="narrative-video-container" :class="{ 'video-fixed': shouldBeFixed }">
      <video ref="videoPlayer" class="narrative-video" muted playsinline preload="auto" @ended="videoEnded"
        @error="handleVideoError" crossorigin="anonymous">
        <source :src="videoUrl.value" type="video/quicktime">
        <source :src="fallbackVideoUrl.value" type="video/mp4">
      </video>

      <!-- Website-like interface overlay introducing the dataset -->
      <div
        class="absolute right-0 top-0 bottom-0 w-96 p-8 pointer-events-none flex items-center transition-all duration-500"
        :class="{ 'opacity-0 translate-x-8': !shouldBeFixed || videoProgress > 0.7, 'translate-x-0': shouldBeFixed && videoProgress <= 0.7 }"
        :style="{ transitionDelay: shouldBeFixed ? '300ms' : '0ms' }">
        <div class="w-full bg-black/70 backdrop-blur-md rounded-lg overflow-hidden border border-gray-700/50 shadow-xl">
          <div class="p-4 bg-black/60 border-b border-gray-800">
            <h3 class="text-xl font-medium text-white/90 flex items-center">
              <span class="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></span>
              Paramilitary Archive
            </h3>
          </div>
          <div class="p-5 space-y-4">
            <div class="flex items-center space-x-3 pb-3 border-b border-gray-800/50">
              <div class="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div>
                <div class="text-sm text-gray-400">Dataset</div>
                <div class="text-white">141,157 messages</div>
              </div>
            </div>
            <p class="text-gray-300 text-sm leading-relaxed">
              This footage from John Williams' infiltration includes paramilitary training exercises,
              weapons demonstrations, and self-recorded Telegram videos spanning 1,500+ days of activity
              across 1,108 militia members.
            </p>
            <div class="text-xs text-blue-400 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
              Scroll to explore visualization
            </div>
          </div>
        </div>
      </div>

      <!-- Add a second UI element that appears later in the scroll -->
      <div class="absolute left-0 bottom-20 w-96 p-8 pointer-events-none transition-all duration-500"
        :class="{ 'opacity-0 -translate-x-8': !shouldBeFixed || videoProgress < 0.3 || videoProgress > 0.8, 'translate-x-0': shouldBeFixed && videoProgress >= 0.3 && videoProgress <= 0.8 }"
        :style="{ transitionDelay: videoProgress >= 0.3 ? '300ms' : '0ms', opacity: shouldBeFixed && videoProgress >= 0.3 && videoProgress <= 0.8 ? (1 - Math.abs(videoProgress - 0.5) * 2) : 0 }">
        <div class="bg-black/70 backdrop-blur-md rounded-lg overflow-hidden border border-gray-700/50 shadow-xl">
          <div class="p-4 bg-black/60 border-b border-gray-800 flex justify-between items-center">
            <h3 class="text-base font-medium text-white/90">Network Activity</h3>
            <span class="text-xs text-gray-500">1,500+ days</span>
          </div>
          <div class="p-4">
            <p class="text-gray-300 text-sm">
              This collection documents paramilitary activity and training conducted largely in secret across multiple
              states.
            </p>
          </div>
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
        <div class="container mx-auto px-6 h-full flex flex-col justify-end pb-24 transition-opacity duration-1000"
          :style="{ opacity: Math.max(0, (videoProgress - 0.7) * 3.33) }">
          <h2 class="text-3xl md:text-4xl font-bold text-white mb-8 text-shadow-lg">The Archive: John Williams' American
            Paramilitary Leaks
          </h2>
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

// Updated Cloudinary URL with optimized parameters
// Primary video: optimized for performance with lower resolution for faster loading
const videoUrl = ref('https://res.cloudinary.com/ejf/video/upload/q_auto:good,f_auto,w_1280,c_fill,g_center,vc_auto/v1742858893/PARALEAKS_COMP_SHORTER_jm8fjw.mov')

// Fallback video with progressive loading and different format options
const fallbackVideoUrl = ref('https://res.cloudinary.com/ejf/video/upload/q_auto:eco,f_mp4,w_960,c_fill,g_center,vc_auto/v1742858893/PARALEAKS_COMP_SHORTER_jm8fjw.mp4')

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
    const releasePoint = sectionTop + sectionHeight * 0.97 - viewportHeight
    const transitionZone = viewportHeight * 1.5

    if (scrollPosition >= sectionTop && scrollPosition < releasePoint) {
      // Fully fixed mode
      shouldBeFixed.value = true

      // Calculate progress for video playback
      const scrollableDistance = releasePoint - sectionTop
      const scrolled = scrollPosition - sectionTop

      // OPTIMIZED PLAYBACK: Use 70% of the section height for video playback
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
      // Transition zone - fade out smoothly without moving up
      shouldBeFixed.value = true

      // Calculate how far into transition zone we are (0 to 1)
      const transitionProgress = (scrollPosition - releasePoint) / transitionZone

      // Apply fade out effect
      if (videoContainer.value) {
        // Start fading out after 20% into the transition zone
        if (transitionProgress > 0.2) {
          const adjustedProgress = (transitionProgress - 0.2) / 0.8 // Rescale 0.2-1.0 to 0-1.0
          videoContainer.value.style.opacity = (1 - adjustedProgress).toString()
        } else {
          videoContainer.value.style.opacity = '1' // Fully visible for first 20%
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

// Handle video loading errors
function handleVideoError(e) {
  console.error('Video loading error:', e)
  // If primary source fails, try the fallback URL directly
  if (videoPlayer.value && videoPlayer.value.src !== fallbackVideoUrl.value) {
    console.log('Trying fallback video URL')
    videoPlayer.value.src = fallbackVideoUrl.value
    videoPlayer.value.load()
  }
}

// Initialize video player
function initializeVideoPlayer() {
  if (videoPlayer.value) {
    try {
      console.log('Loading video from URL:', videoUrl.value)
      videoPlayer.value.load()

      videoPlayer.value.addEventListener('loadedmetadata', () => {
        console.log('Video metadata loaded, duration:', videoPlayer.value.duration)
        updateVideoProgress()
      })

      videoPlayer.value.addEventListener('error', handleVideoError)
    } catch (e) {
      console.error('Error setting up video player:', e)
      handleVideoError(e)
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
    const scrollableDistance = sectionHeight - viewportHeight
    const scrolled = Math.max(0, scrollPosition - sectionTop)
    const progress = Math.min(Math.max(scrolled / (scrollableDistance * 0.7), 0), 1)

    // Update our progress ref
    videoProgress.value = progress
    emit('update-video-progress', progress)

    // Update video time if properly loaded
    if (videoPlayer.value.readyState >= 2 && !isNaN(videoPlayer.value.duration)) {
      videoPlayer.value.currentTime = progress * videoPlayer.value.duration
    }
  } catch (error) {
    console.error('Error updating video progress:', error)
  }
}

// Additional metadata loading function for better reliability
function checkVideoLoaded() {
  if (videoPlayer.value) {
    if (videoPlayer.value.readyState < 2) {
      console.log('Video still loading, current readyState:', videoPlayer.value.readyState)
      // Try forcing a reload with the fallback URL if still not loading after 5 seconds
      setTimeout(() => {
        if (videoPlayer.value && videoPlayer.value.readyState < 2) {
          console.log('Video still not ready after timeout, trying fallback...')
          videoPlayer.value.src = fallbackVideoUrl.value
          videoPlayer.value.load()
        }
      }, 5000)
    } else {
      console.log('Video successfully loaded and ready')
    }
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

    // Check if video loaded properly after a brief delay
    setTimeout(checkVideoLoaded, 2000)
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
  background: black;
  z-index: 10;
}

.narrative-video-container {
  position: relative;
  height: 100vh;
  width: 100%;
  overflow: hidden;
  perspective: 1000px;
  transition: opacity 0.5s ease-out;
}

.video-fixed {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 100vh;
  z-index: 15;
}

.narrative-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Smooth transitions for the overlays */
.narrative-video-container>div {
  transition: opacity 0.5s ease-out;
}

/* Text shadow for better readability */
.text-shadow-lg {
  text-shadow: 0 0 8px rgba(0, 0, 0, 0.8), 0 0 30px rgba(0, 0, 0, 0.6);
}
</style>