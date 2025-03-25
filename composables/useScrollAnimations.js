import { ref, onMounted, onBeforeUnmount } from 'vue'

export function useScrollAnimations() {
  const animatedElements = ref(new Map())
  const observer = ref(null)

  const createObserver = () => {
    observer.value = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const element = entry.target
          const animation = animatedElements.value.get(element)

          if (entry.isIntersecting) {
            // Start or play animation when element enters viewport
            if (animation.once && animation.hasPlayed) return

            // Apply animation classes
            if (animation.classes) {
              element.classList.add(...animation.classes)
            }

            // Run custom animation function if provided
            if (animation.onEnter) {
              animation.onEnter(element, entry.intersectionRatio)
            }

            animation.hasPlayed = true
          } else if (!animation.once) {
            // Reset animation when element leaves viewport
            if (animation.classes) {
              element.classList.remove(...animation.classes)
            }

            // Run exit animation if provided
            if (animation.onExit) {
              animation.onExit(element, entry.intersectionRatio)
            }

            animation.hasPlayed = false
          }
        })
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: [0.1, 0.3, 0.5, 0.7, 0.9]
      }
    )
  }

  const observeElement = (element, options = {}) => {
    if (!element) return

    // Store animation configuration
    animatedElements.value.set(element, {
      classes: options.classes || [],
      once: options.once !== undefined ? options.once : true,
      delay: options.delay || 0,
      onEnter: options.onEnter,
      onExit: options.onExit,
      hasPlayed: false
    })

    // Start observing
    observer.value.observe(element)
  }

  const unobserveElement = (element) => {
    if (!element || !observer.value) return
    observer.value.unobserve(element)
    animatedElements.value.delete(element)
  }

  // Setup and cleanup
  onMounted(() => {
    createObserver()
  })

  onBeforeUnmount(() => {
    if (observer.value) {
      animatedElements.value.forEach((_, element) => {
        observer.value.unobserve(element)
      })
      observer.value.disconnect()
    }
  })

  return {
    observeElement,
    unobserveElement
  }
}
