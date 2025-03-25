import { ref } from 'vue'

export function useAnimationUtils() {
  // Animation state for transitions
  const animatingTransition = ref(false)
  const transitionProgress = ref(0)
  let transitionStartPositions = null
  let transitionEndPositions = null
  const transitionDuration = 750 // milliseconds
  let animationFrame = null

  // Easing function for smooth animation
  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
  }

  // Function to animate transition between visualization states
  function animateTransition(positions, regl, drawPoints, initVisualization) {
    if (!positions || !regl || !drawPoints) return

    // Store current positions as starting positions
    transitionStartPositions = new Float32Array(positions)

    // Initialize visualization to calculate new end positions
    // but don't actually render them yet
    initVisualization(true) // Pass true to indicate we're preparing for animation

    // Store the newly calculated positions as end positions
    transitionEndPositions = new Float32Array(positions)

    // Reset positions to starting positions for the animation
    positions.set(transitionStartPositions)

    // Set animation state
    animatingTransition.value = true
    transitionProgress.value = 0

    // Start animation
    requestAnimationFrame((timestamp) =>
      animateVisualizationTransition(timestamp, positions, regl, drawPoints)
    )
  }

  // Animation loop for transitions
  function animateVisualizationTransition(
    timestamp,
    positions,
    regl,
    drawPoints
  ) {
    if (!animatingTransition.value) return

    // Update progress
    transitionProgress.value += 16 / transitionDuration // Approximately 16ms per frame

    if (transitionProgress.value >= 1) {
      // Animation complete
      transitionProgress.value = 1
      animatingTransition.value = false

      // Set final positions
      positions.set(transitionEndPositions)
    } else {
      // Interpolate positions
      for (let i = 0; i < positions.length; i++) {
        positions[i] =
          transitionStartPositions[i] +
          (transitionEndPositions[i] - transitionStartPositions[i]) *
            easeInOutCubic(transitionProgress.value)
      }

      // Request next frame
      requestAnimationFrame((ts) =>
        animateVisualizationTransition(ts, positions, regl, drawPoints)
      )
    }

    // Redraw with updated positions
    if (regl && drawPoints) {
      regl.clear({
        color: [0, 0, 0, 1],
        depth: 1
      })
      drawPoints()
    }
  }

  // Animation loop for continuous rendering
  function startAnimation(regl, drawPoints) {
    if (!regl || !drawPoints) {
      console.error('Cannot start animation: missing regl or drawPoints')
      return
    }

    const frame = () => {
      // Clear the canvas
      regl.clear({
        color: [0, 0, 0, 1],
        depth: 1
      })

      // Draw the points
      drawPoints()

      // Request next frame
      animationFrame = requestAnimationFrame(frame)
    }

    // Start the animation
    animationFrame = requestAnimationFrame(frame)
  }

  // Clean up animation
  function cleanupAnimation() {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame)
      animationFrame = null
    }
  }

  // New functions for narrative scrolling animations

  // Creates a parallax effect based on scroll position
  function applyParallax(element, scrollY, factor = 0.4) {
    if (!element) return

    // Apply transform based on scroll position
    element.style.transform = `translateY(${scrollY * factor}px)`
  }

  // Animation for fade-in elements as they enter viewport
  function setupScrollFadeIn(elementRefs, thresholdValue = 0.2) {
    if (!window.IntersectionObserver) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Add visible class when element enters viewport
            entry.target.classList.add('opacity-100', 'translate-y-0')
            entry.target.classList.remove('opacity-0', 'translate-y-10')

            // Stop observing after animation is triggered
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: thresholdValue }
    )

    // Start observing each element
    elementRefs.forEach((el) => {
      if (el.value) {
        observer.observe(el.value)
      }
    })

    return observer
  }

  // Creates a scroll-triggered animation for chart data
  function animateChartOnScroll(chart, isActive) {
    if (!chart || !chart.data) return

    if (isActive && !chart.animated) {
      // Animate the chart data
      // This is a placeholder - actual implementation would depend on chart library
      chart.animated = true
      chart.update()
    }
  }

  return {
    animatingTransition,
    transitionProgress,
    easeInOutCubic,
    animateTransition,
    startAnimation,
    cleanupAnimation,
    // Export the new functions
    applyParallax,
    setupScrollFadeIn,
    animateChartOnScroll
  }
}
