<template>
  <section class="mb-16">
    <div class="container mx-auto px-4 max-w-4xl">
      <!-- Contributors visualization -->
      <div class="bg-gray-800/50 p-6 rounded-lg mt-12 overflow-hidden" ref="contributorsSection">
        <h3 class="text-xl font-bold mb-4 text-white">
          <slot name="contributors-title">Top Contributors</slot>
        </h3>

        <!-- Explanation about Unknown users -->
        <div class="text-sm text-gray-400 mb-6">
          <slot name="contributors-explanation">
            *"Unknown" represents aggregated messages from Telegram users who deleted their accounts or had their data
            removed.
          </slot>
        </div>

        <!-- Streamgraph with proper data binding -->
        <div class="mt-4 relative h-[400px] overflow-hidden rounded-lg streamgraph-container" ref="streamGraph"
          :style="{ opacity: Math.min(1, scrollProgress * 2), transform: `translateY(${(1 - scrollProgress) * 50}px)` }">
          <StreamGraph v-show="messagesBySender.length > 0" :messages-by-sender="messagesBySender"
            :top-senders="allSenders" :highlight-sender="streamGraphHighlightedSender"
            @highlight-sender="handleStreamGraphHighlight" />
          <div v-show="!messagesBySender.length" class="flex items-center justify-center h-full">
            <div class="text-gray-400">Loading visualization data...</div>
          </div>
        </div>
      </div>

      <!-- Communication Network visualization -->
      <div class="bg-gray-800/50 p-6 rounded-lg mt-8 overflow-hidden" ref="dataVizSection">
        <h3 class="text-xl font-bold mb-4 text-white">
          <slot name="network-title">Communication Network</slot>
        </h3>

        <div class="relative h-[300px] rounded-lg overflow-hidden bg-gray-900/50"
          :style="{ transform: `translateY(${(1 - scrollProgress) * 40}px)` }">
          <NarrativeScatterplot v-show="rawData.length > 0" :data="rawData" :getSenderFn="getSenderFn" />

          <!-- Overlay caption -->
          <div class="absolute inset-0 flex flex-col items-center justify-center text-center p-4 pointer-events-none">
            <div class="bg-black/40 backdrop-blur-sm p-3 rounded-lg max-w-md fade-up">
              <slot name="network-caption">
                <p class="text-white text-sm">
                  Each point represents a message in the network, revealing connections between
                  <span class="text-blue-400 counter-value" :data-value="memberCount">0</span> members across
                  <span class="text-green-400 counter-value" :data-value="dayCount">0</span> days of activity.
                </p>
              </slot>
            </div>
          </div>
        </div>
      </div>

      <!-- Top Message Days component -->
      <div class="bg-gray-800/50 p-6 rounded-lg mt-8 overflow-hidden" ref="timelineSection">
        <h3 class="text-xl font-bold mb-4 text-white">
          <slot name="top-days-title">Top Message Days</slot>
        </h3>

        <div class="relative bg-gray-900/50 rounded-lg" ref="topMessageDaysRef"
          :style="{ opacity: Math.min(1, scrollProgress * 1.3), transform: `scale(${0.8 + scrollProgress * 0.2})` }">
          <TopMessageDays v-show="rawData.length > 0" :raw-data="rawData" @update:top-days="handleTopDaysUpdate" />
        </div>
      </div>

      <!-- Additional content slot -->
      <slot name="additional-content"></slot>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useScrollAnimations } from '~/composables/useScrollAnimations'
import StreamGraph from '~/components/metadata/StreamGraph.vue'
import TopMessageDays from '~/components/metadata/TopMessageDays.vue'
import NarrativeScatterplot from '~/components/narrative/NarrativeScatterplot.vue'

const props = defineProps({
  rawData: {
    type: Array,
    required: true
  },
  messagesBySender: {
    type: Array,
    default: () => []
  },
  allSenders: {
    type: Array,
    default: () => []
  },
  memberCount: {
    type: Number,
    default: 1108
  },
  dayCount: {
    type: Number,
    default: 1500
  },
  getSenderFn: {
    type: Function,
    default: (message) => message?.from || message?.sender || message?.sender_name || 'Unknown'
  }
})

// Emit events for parent component
const emit = defineEmits(['update:top-days', 'highlight-sender'])

// Local state
const contributorsSection = ref(null)
const dataVizSection = ref(null)
const timelineSection = ref(null)
const topMessageDaysRef = ref(null)
const streamGraph = ref(null)
const scrollProgress = ref(0)
const streamGraphHighlightedSender = ref(null)

// Get scroll animations helper
const { observeElement, unobserveElement } = useScrollAnimations()

// Handle streamgraph highlight and emit to parent
function handleStreamGraphHighlight(sender) {
  streamGraphHighlightedSender.value = sender
  emit('highlight-sender', sender)
}

// Handle top days update and emit to parent
function handleTopDaysUpdate(days) {
  emit('update:top-days', days)
}

// Update scroll progress for animations
function updateScrollProgress() {
  const sections = [contributorsSection, dataVizSection, timelineSection]

  // Find the first visible section
  for (const sectionRef of sections) {
    if (!sectionRef.value) continue

    const rect = sectionRef.value.getBoundingClientRect()
    const windowHeight = window.innerHeight

    // Calculate how far the element is in the viewport (0 to 1)
    // 0 = just entered viewport at bottom
    // 1 = just about to exit viewport at top
    const visiblePortion = 1 - (rect.bottom / windowHeight)

    if (visiblePortion >= 0 && visiblePortion <= 1) {
      scrollProgress.value = visiblePortion
      return
    }
  }
}

// Set up animations
function setupAnimations() {
  // Setup StreamGraph animations
  if (streamGraph.value) {
    observeElement(streamGraph.value, {
      classes: ['build-in-left', 'visible'],
      once: true,
      onEnter: (el) => {
        // After container animation, find and animate SVG paths
        setTimeout(() => {
          const paths = el.querySelectorAll('path')
          paths.forEach((path, index) => {
            setTimeout(() => {
              path.classList.add('draw-path', 'visible')
            }, index * 50)
          })
        }, 300)
      }
    })
  }

  // Set up counter animations
  const counterElements = document.querySelectorAll('.counter-value')
  counterElements.forEach((element, index) => {
    if (element) {
      observeElement(element.parentElement.parentElement, {
        classes: ['stagger-item', 'visible'],
        once: true,
        onEnter: (el) => {
          // Apply staggered delay
          el.style.animationDelay = `${index * 150}ms`

          // Get the target value
          const targetValue = parseInt(element.dataset.value || element.textContent.replace(/,/g, ''), 10)

          // Start counter animation
          setTimeout(() => {
            animateCounter(element, targetValue)
          }, index * 150 + 300)
        }
      })
    }
  })

  // Observe the network visualization
  if (dataVizSection.value) {
    observeElement(dataVizSection.value, {
      classes: ['scale-up', 'visible'],
      once: true,
      onEnter: (el) => {
        // After the container scales in, add a subtle pulse animation
        setTimeout(() => {
          el.classList.add('pulse-animation')
        }, 1000)
      }
    })
  }

  // Observe the timeline visualization for a different animation
  if (timelineSection.value) {
    const visualization = timelineSection.value.querySelector('.top-message-days-viz')
    if (visualization) {
      observeElement(visualization, {
        classes: ['build-in-right', 'visible'],
        once: true
      })
    }
  }
}

// Animate counter from 0 to target
function animateCounter(element, targetValue, duration = 1500) {
  if (!element) return

  const startValue = 0
  const startTime = performance.now()

  const updateCounter = (timestamp) => {
    const elapsed = timestamp - startTime
    const progress = Math.min(elapsed / duration, 1)

    // Use easeOutExpo for smoother animation near the end
    const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
    const currentValue = Math.floor(startValue + easeProgress * (targetValue - startValue))

    element.textContent = new Intl.NumberFormat().format(currentValue)

    if (progress < 1) {
      requestAnimationFrame(updateCounter)
    }
  }

  requestAnimationFrame(updateCounter)
}

// Setup event listeners on mount
onMounted(() => {
  setupAnimations()
  window.addEventListener('scroll', updateScrollProgress, { passive: true })

  // Initial update
  updateScrollProgress()
})

// Cleanup on unmount
onBeforeUnmount(() => {
  window.removeEventListener('scroll', updateScrollProgress)

  // Clean up observers
  const sections = [contributorsSection, dataVizSection, timelineSection, streamGraph]
  sections.forEach(section => {
    if (section.value) {
      unobserveElement(section.value)
    }
  })
})
</script>

<style scoped>
/* Animation styles */
@keyframes pulse {

  0%,
  100% {
    opacity: 0.8;
  }

  50% {
    opacity: 1;
  }
}

.pulse-animation {
  animation: pulse 2s infinite;
}

/* Fade and scale animations */
.fade-up {
  opacity: 0;
  transform: translateY(40px);
  transition: opacity 0.8s ease, transform 0.8s cubic-bezier(0.13, 0.8, 0.4, 1);
}

.fade-up.visible {
  opacity: 1;
  transform: translateY(0);
}

.scale-up {
  opacity: 0;
  transform: scale(0.85);
  transition: opacity 0.8s ease, transform 0.8s cubic-bezier(0.13, 0.8, 0.4, 1);
}

.scale-up.visible {
  opacity: 1;
  transform: scale(1);
}

/* Staggered items animation */
.stagger-item {
  opacity: 0;
  transform: translateY(30px);
}

.stagger-item.visible {
  animation: staggerFadeIn 0.8s forwards;
}

@keyframes staggerFadeIn {
  0% {
    opacity: 0;
    transform: translateY(30px);
  }

  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Build-in animation for visualizations */
.build-in-left {
  transform: translateX(-100%);
  opacity: 0;
  transition: transform 1.2s cubic-bezier(0.19, 1, 0.22, 1),
    opacity 0.5s ease 0.3s;
}

.build-in-left.visible {
  transform: translateX(0);
  opacity: 1;
}

.build-in-right {
  transform: translateX(100%);
  opacity: 0;
  transition: transform 1.2s cubic-bezier(0.19, 1, 0.22, 1),
    opacity 0.5s ease 0.3s;
}

.build-in-right.visible {
  transform: translateX(0);
  opacity: 1;
}

/* Sequenced line drawing animation for graphs */
.draw-path {
  stroke-dasharray: 1000;
  stroke-dashoffset: 1000;
  transition: stroke-dashoffset 2s ease-in-out;
}

.draw-path.visible {
  stroke-dashoffset: 0;
}
</style>