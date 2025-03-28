import { ref } from 'vue'

// Create a composable for managing page transitions
export const usePageTransition = () => {
  // State for page transitions
  const isTransitioning = ref(false)
  const progressValue = ref(0)

  // Start transition
  const startTransition = () => {
    isTransitioning.value = true
    progressValue.value = 0

    // Animate progress
    let progress = 0
    const interval = setInterval(() => {
      progress += 5
      // Slow down as we approach 100%
      if (progress > 80) {
        progress += 1
      }
      progressValue.value = Math.min(progress, 95) // Never quite reach 100% until complete

      if (progress >= 95) {
        clearInterval(interval)
      }
    }, 50)

    return interval
  }

  // End transition
  const endTransition = (interval) => {
    if (interval) {
      clearInterval(interval)
    }

    progressValue.value = 100

    // Small delay before hiding
    setTimeout(() => {
      isTransitioning.value = false
      progressValue.value = 0
    }, 300)
  }

  return {
    isTransitioning,
    progressValue,
    startTransition,
    endTransition
  }
}

// Create a singleton instance for global state
export const pageTransition = usePageTransition()
