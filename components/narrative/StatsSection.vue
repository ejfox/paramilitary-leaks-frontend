<template>
  <section class="py-24 bg-gradient-to-b from-gray-950 to-gray-900">
    <div class="container mx-auto px-6 max-w-4xl">
      <!-- Title slot -->
      <slot name="title">
        <h2 class="text-3xl sm:text-4xl font-bold mb-12 text-white text-center">The Paramilitary Archive</h2>
      </slot>

      <!-- Introduction slot -->
      <slot name="introduction">
        <div class="prose prose-lg prose-invert mx-auto mb-16 px-4">
          <p class="text-center text-xl">
            The leaked database includes messages from paramilitary groups and militias spanning multiple years.
          </p>
        </div>
      </slot>

      <!-- Stats cards with enhanced animations -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 my-12">
        <!-- Messages stat card -->
        <div ref="statsItems[0]"
          class="stats-card-container bg-gray-800/30 backdrop-blur-sm p-5 rounded-lg border border-gray-800/50 relative overflow-hidden group">
          <!-- NYTimes style vertical indicator line on hover -->
          <div
            class="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-400 transform scale-y-0 group-hover:scale-y-100 transition-transform duration-500 origin-top">
          </div>

          <div class="text-center relative">
            <div class="absolute -top-1 right-4 text-[10px] uppercase tracking-widest text-blue-400/70 font-medium">01
            </div>
            <div class="text-sm text-gray-400 mb-2 uppercase tracking-wider">
              <slot name="messages-label">Private Messages</slot>
            </div>
            <span class="stats-value text-4xl font-light text-blue-400 counter-value"
              :data-value="stats.messages">0</span>
          </div>
        </div>

        <!-- Members stat card -->
        <div ref="statsItems[1]"
          class="stats-card-container bg-gray-800/30 backdrop-blur-sm p-5 rounded-lg border border-gray-800/50 relative overflow-hidden group">
          <!-- NYTimes style vertical indicator line on hover -->
          <div
            class="absolute left-0 top-0 bottom-0 w-0.5 bg-purple-400 transform scale-y-0 group-hover:scale-y-100 transition-transform duration-500 origin-top">
          </div>

          <div class="text-center relative">
            <div class="absolute -top-1 right-4 text-[10px] uppercase tracking-widest text-purple-400/70 font-medium">02
            </div>
            <div class="text-sm text-gray-400 mb-2 uppercase tracking-wider">
              <slot name="members-label">Network Members</slot>
            </div>
            <span class="stats-value text-4xl font-light text-purple-400 counter-value"
              :data-value="stats.members">0</span>
          </div>
        </div>

        <!-- Files stat card -->
        <div ref="statsItems[2]"
          class="stats-card-container bg-gray-800/30 backdrop-blur-sm p-5 rounded-lg border border-gray-800/50 relative overflow-hidden group">
          <!-- NYTimes style vertical indicator line on hover -->
          <div
            class="absolute left-0 top-0 bottom-0 w-0.5 bg-green-400 transform scale-y-0 group-hover:scale-y-100 transition-transform duration-500 origin-top">
          </div>

          <div class="text-center relative">
            <div class="absolute -top-1 right-4 text-[10px] uppercase tracking-widest text-green-400/70 font-medium">03
            </div>
            <div class="text-sm text-gray-400 mb-2 uppercase tracking-wider">
              <slot name="files-label">Media Files</slot>
            </div>
            <span class="stats-value text-4xl font-light text-green-400 counter-value"
              :data-value="stats.files">0</span>
            <div class="text-xs text-gray-500 mt-1">({{ stats.fileSize }})</div>
          </div>
        </div>
      </div>

      <!-- Additional content slot -->
      <slot name="additional-content"></slot>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useScrollAnimations } from '~/composables/useScrollAnimations'

const props = defineProps({
  stats: {
    type: Object,
    default: () => ({
      messages: 141157,
      members: 1108,
      files: 52161,
      fileSize: '198.62 GB'
    })
  }
})

// Store stats item DOM references
const statsItems = ref([])

// Get scroll animation helpers
const { observeElement, unobserveElement } = useScrollAnimations()

// Animation functions
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
    } else {
      // Add finish class after animation completes
      setTimeout(() => {
        element.classList.add('counter-finished')
      }, 500)
    }
  }

  requestAnimationFrame(updateCounter)
}

// Set up animations
function setupAnimations() {
  nextTick(() => {
    const counterElements = document.querySelectorAll('.counter-value')
    const containers = document.querySelectorAll('.stats-card-container')

    // Set up container animations
    containers.forEach((container, index) => {
      observeElement(container, {
        classes: ['stagger-item', 'visible'],
        once: true,
        threshold: 0.2,
        onEnter: (el) => {
          // Apply staggered delay
          el.style.animationDelay = `${index * 150}ms`
        }
      })
    })

    // Set up counter animations
    counterElements.forEach((element, index) => {
      if (element) {
        // Get the target value
        const targetValue = parseInt(element.dataset.value || element.textContent.replace(/,/g, ''), 10)

        // Start counter animation with a staggered delay
        setTimeout(() => {
          animateCounter(element, targetValue, 2000)
        }, 300 + index * 150)
      }
    })
  })
}

onMounted(() => {
  setupAnimations()
})

onBeforeUnmount(() => {
  // Clean up any animations or observers
  const containers = document.querySelectorAll('.stats-card-container')
  containers.forEach((element) => {
    unobserveElement(element)
  })
})
</script>

<style scoped>
/* Animation classes */
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

.stagger-item {
  opacity: 0;
  transform: translateY(30px);
}

.stagger-item.visible {
  animation: staggerFadeIn 0.8s forwards;
}

/* NYTimes/Bloomberg style stats cards */
.stats-card-container {
  transition: all 0.3s ease;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.stats-card-container:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  background-color: rgba(31, 41, 55, 0.5);
}

/* Counter animations */
.counter-value {
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum";
  transition: color 0.3s ease, text-shadow 0.3s ease;
}

.counter-value:not(.counter-finished) {
  text-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
}

.stats-card-container:hover .counter-value {
  text-shadow: 0 0 15px rgba(59, 130, 246, 0.7);
}
</style>