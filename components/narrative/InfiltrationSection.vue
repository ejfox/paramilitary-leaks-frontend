<template>
  <section class="mb-16">
    <div class="container mx-auto px-4 max-w-4xl">
      <div class="bg-gray-800/50 p-6 rounded-lg overflow-hidden">
        <h3 class="text-xl font-bold mb-4 text-white">
          <slot name="title">The Man Behind the Leak: John Williams' Infiltration</slot>
        </h3>

        <div class="prose prose-lg prose-invert mx-auto">
          <slot>
            <!-- Default content if none is provided -->
            <p>Content about the infiltration will be provided by the parent component.</p>
          </slot>
        </div>

        <!-- Call-to-action slot for buttons or links -->
        <div class="mt-8 text-center">
          <slot name="cta"></slot>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useScrollAnimations } from '~/composables/useScrollAnimations'

// Get scroll animation helpers
const { observeElement, unobserveElement } = useScrollAnimations()

// Section ref
const sectionRef = ref(null)

// Set up animations
function setupAnimations() {
  // Animate paragraphs with a staggered reveal
  const paragraphs = document.querySelectorAll('.prose p')
  paragraphs.forEach((p, index) => {
    // Wrap in a reveal-text container if not already wrapped
    if (!p.parentNode.classList.contains('reveal-text')) {
      const wrapper = document.createElement('div')
      wrapper.className = 'reveal-text'
      p.parentNode.insertBefore(wrapper, p)
      wrapper.appendChild(p)
    }

    // Add animation
    observeElement(p.parentNode, {
      classes: ['visible'],
      once: true,
      delay: index * 100
    })
  })

  // Animate blockquotes with a different effect
  const blockquotes = document.querySelectorAll('.prose blockquote')
  blockquotes.forEach((quote) => {
    observeElement(quote, {
      classes: ['fade-in', 'visible'],
      once: true
    })
  })

  // Animate callout boxes
  const callouts = document.querySelectorAll('.bg-gray-800, .bg-gray-900, .border-l-4')
  callouts.forEach((callout) => {
    observeElement(callout, {
      classes: ['scale-up', 'visible'],
      once: true
    })
  })
}

onMounted(() => {
  setupAnimations()
})

onBeforeUnmount(() => {
  // Clean up any observers
  const elements = document.querySelectorAll('.prose p, .prose blockquote, .bg-gray-800, .bg-gray-900, .border-l-4')
  elements.forEach(el => {
    if (el.parentNode && el.parentNode.classList.contains('reveal-text')) {
      unobserveElement(el.parentNode)
    } else {
      unobserveElement(el)
    }
  })
})
</script>

<style scoped>
/* Reveal text animation */
.reveal-text {
  position: relative;
  overflow: hidden;
}

.reveal-text::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #1f2937;
  transform: translateX(0);
  transition: transform 1.2s cubic-bezier(0.77, 0, 0.18, 1);
}

.reveal-text.visible::after {
  transform: translateX(100%);
}

/* Fade in animation */
.fade-in {
  opacity: 0;
  transition: opacity 1s ease;
}

.fade-in.visible {
  opacity: 1;
}

/* Scale up animation */
.scale-up {
  opacity: 0;
  transform: scale(0.95);
  transition: opacity 0.8s ease, transform 0.8s cubic-bezier(0.13, 0.8, 0.4, 1);
}

.scale-up.visible {
  opacity: 1;
  transform: scale(1);
}

/* Add some styling to prose elements */
:deep(.prose blockquote) {
  border-left-color: rgba(59, 130, 246, 0.8);
  background-color: rgba(30, 41, 59, 0.5);
  padding: 1rem;
  border-radius: 0.25rem;
}

:deep(.prose blockquote p) {
  margin: 0;
}
</style>