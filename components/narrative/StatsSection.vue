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

      <!-- Stats cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 my-12">
        <div ref="statsItems[0]" class="bg-gray-800/50 p-5 rounded-lg">
          <div class="text-center">
            <span class="text-4xl font-light text-blue-400 counter-value" :data-value="stats.messages">0</span>
            <div class="text-sm text-gray-300 mt-2">
              <slot name="messages-label">Private Messages</slot>
            </div>
          </div>
        </div>
        <div ref="statsItems[1]" class="bg-gray-800/50 p-5 rounded-lg">
          <div class="text-center">
            <span class="text-4xl font-light text-purple-400 counter-value" :data-value="stats.members">0</span>
            <div class="text-sm text-gray-300 mt-2">
              <slot name="members-label">Network Members</slot>
            </div>
          </div>
        </div>
        <div ref="statsItems[2]" class="bg-gray-800/50 p-5 rounded-lg">
          <div class="text-center">
            <span class="text-4xl font-light text-green-400 counter-value" :data-value="stats.files">0</span>
            <div class="text-sm text-gray-300 mt-2">
              <slot name="files-label">Media Files</slot> ({{ stats.fileSize }})
            </div>
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
    }
  }

  requestAnimationFrame(updateCounter)
}

// Set up animations
function setupAnimations() {
  nextTick(() => {
    const counterElements = document.querySelectorAll('.counter-value')

    counterElements.forEach((element, index) => {
      if (element && element.parentElement && element.parentElement.parentElement) {
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
  })
}

onMounted(() => {
  setupAnimations()
})

onBeforeUnmount(() => {
  // Clean up any animations or observers
  const counterElements = document.querySelectorAll('.counter-value')
  counterElements.forEach((element) => {
    if (element && element.parentElement && element.parentElement.parentElement) {
      unobserveElement(element.parentElement.parentElement)
    }
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
</style>