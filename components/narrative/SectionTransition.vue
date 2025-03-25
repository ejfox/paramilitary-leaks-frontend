<template>
  <div class="relative w-full transition-all duration-1000 ease-in-out overflow-hidden" :class="animationClasses"
    :style="customStyles">
    <slot></slot>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  active: {
    type: Boolean,
    default: false
  },
  delay: {
    type: Number,
    default: 0
  },
  duration: {
    type: Number,
    default: 1000
  },
  effect: {
    type: String,
    default: 'fade-up' // Options: fade-up, fade-in, slide-left, slide-right, zoom-in
  },
  distance: {
    type: Number,
    default: 50
  }
})

// State to track whether animation has started
const animationStarted = ref(false)

// Watch for active state changes
watch(() => props.active, (isActive) => {
  if (isActive && !animationStarted.value) {
    // If we become active and haven't animated yet
    setTimeout(() => {
      animationStarted.value = true
    }, props.delay)
  }
}, { immediate: true })

// Compute animation classes based on effect and active state
const animationClasses = computed(() => {
  const baseClasses = ['transition-all']

  // Only apply duration when not delaying
  if (animationStarted.value) {
    baseClasses.push(`duration-${props.duration}`)
  }

  // Apply different animation classes based on effect
  if (animationStarted.value) {
    // Animated state
    baseClasses.push('opacity-100', 'transform')

    switch (props.effect) {
      case 'fade-up':
        baseClasses.push('translate-y-0')
        break
      case 'fade-in':
        // Only opacity changes, which is handled by the opacity-100 class
        break
      case 'slide-left':
        baseClasses.push('translate-x-0')
        break
      case 'slide-right':
        baseClasses.push('translate-x-0')
        break
      case 'zoom-in':
        baseClasses.push('scale-100')
        break
      default:
        baseClasses.push('translate-y-0')
    }
  } else {
    // Initial state
    baseClasses.push('opacity-0', 'transform')

    switch (props.effect) {
      case 'fade-up':
        baseClasses.push(`translate-y-[${props.distance}px]`)
        break
      case 'fade-in':
        // Only opacity changes, which is handled by the opacity-0 class
        break
      case 'slide-left':
        baseClasses.push(`-translate-x-[${props.distance}px]`)
        break
      case 'slide-right':
        baseClasses.push(`translate-x-[${props.distance}px]`)
        break
      case 'zoom-in':
        baseClasses.push('scale-95')
        break
      default:
        baseClasses.push(`translate-y-[${props.distance}px]`)
    }
  }

  return baseClasses
})

// Apply custom styles for animations
const customStyles = computed(() => {
  // Add transition-delay if we have a delay
  if (props.delay > 0 && !animationStarted.value) {
    return {
      transitionDelay: `${props.delay}ms`
    }
  }
  return {}
})
</script>