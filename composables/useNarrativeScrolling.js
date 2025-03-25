import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useIntersectionObserver } from '@vueuse/core'
import { useAnimationUtils } from './useAnimationUtils'

export function useNarrativeScrolling() {
  // Import animation utilities
  const { applyParallax, setupScrollFadeIn } = useAnimationUtils()

  // Scroll position state
  const scrollY = ref(0)

  // Section activation states
  const activeSection = ref(0)
  const sectionStates = {
    section1: ref(false),
    section2: ref(false),
    section3: ref(false),
    section4: ref(false)
  }

  // Function to handle scroll events
  function handleScroll() {
    scrollY.value = window.scrollY
  }

  // Set up intersection observers for each section
  function setupSectionObservers(sectionRefs) {
    if (!sectionRefs) return

    // Set up observers for each section
    if (sectionRefs.section1) {
      useIntersectionObserver(
        sectionRefs.section1,
        ([{ isIntersecting }]) => {
          if (isIntersecting) {
            sectionStates.section1.value = true
            activeSection.value = 1
          }
        },
        { threshold: 0.2 }
      )
    }

    if (sectionRefs.section2) {
      useIntersectionObserver(
        sectionRefs.section2,
        ([{ isIntersecting }]) => {
          if (isIntersecting) {
            sectionStates.section2.value = true
            activeSection.value = 2
          }
        },
        { threshold: 0.2 }
      )
    }

    if (sectionRefs.section3) {
      useIntersectionObserver(
        sectionRefs.section3,
        ([{ isIntersecting }]) => {
          if (isIntersecting) {
            sectionStates.section3.value = true
            activeSection.value = 3
          }
        },
        { threshold: 0.2 }
      )
    }

    if (sectionRefs.section4) {
      useIntersectionObserver(
        sectionRefs.section4,
        ([{ isIntersecting }]) => {
          if (isIntersecting) {
            sectionStates.section4.value = true
            activeSection.value = 4
          }
        },
        { threshold: 0.2 }
      )
    }
  }

  // Apply parallax effect to elements
  function applyParallaxToElement(element, factor = 0.4) {
    if (!element) return
    applyParallax(element, scrollY.value, factor)
  }

  // Setup element fade-ins
  function setupElementFadeIns(elementRefs) {
    return setupScrollFadeIn(elementRefs)
  }

  // Initialize scroll listener
  function initScrollListeners() {
    window.addEventListener('scroll', handleScroll)
    handleScroll() // Call once to get initial position
  }

  // Clean up event listeners
  function cleanupScrollListeners() {
    window.removeEventListener('scroll', handleScroll)
  }

  // Setup auto-initiated on mount
  onMounted(() => {
    initScrollListeners()
  })

  onBeforeUnmount(() => {
    cleanupScrollListeners()
  })

  return {
    scrollY,
    activeSection,
    sectionStates,
    handleScroll,
    setupSectionObservers,
    applyParallaxToElement,
    setupElementFadeIns,
    initScrollListeners,
    cleanupScrollListeners
  }
}
