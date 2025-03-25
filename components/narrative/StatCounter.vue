<template>
  <div>
    <div class="text-xl sm:text-2xl md:text-3xl font-bold text-center" :class="textColorClass">
      {{ formattedValue }}
    </div>
    <div v-if="label" class="text-sm md:text-base text-gray-400 text-center mt-1">
      {{ label }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'

const props = defineProps({
  value: {
    type: [Number, String],
    required: true
  },
  label: {
    type: String,
    default: ''
  },
  prefix: {
    type: String,
    default: ''
  },
  suffix: {
    type: String,
    default: ''
  },
  duration: {
    type: Number,
    default: 2000
  },
  color: {
    type: String,
    default: 'blue'
  },
  formatter: {
    type: Function,
    default: null
  },
  active: {
    type: Boolean,
    default: false
  }
})

// Current value for the animation
const currentValue = ref(0)

// Convert to number
const targetValue = computed(() => {
  const numValue = Number(props.value)
  return isNaN(numValue) ? 0 : numValue
})

// Determine text color class based on color prop
const textColorClass = computed(() => {
  const colorMap = {
    blue: 'text-blue-400',
    green: 'text-green-400',
    red: 'text-red-400',
    yellow: 'text-yellow-400',
    purple: 'text-purple-400',
    white: 'text-white'
  }
  return colorMap[props.color] || 'text-blue-400'
})

// Format the displayed value
const formattedValue = computed(() => {
  let formattedVal

  // If custom formatter is provided, use it
  if (props.formatter) {
    formattedVal = props.formatter(currentValue.value)
  } else {
    // Default formatting with thousand separators
    formattedVal = new Intl.NumberFormat().format(Math.round(currentValue.value))
  }

  return `${props.prefix}${formattedVal}${props.suffix}`
})

// Animate the counter
function animateCounter(start, end, duration) {
  // Reset to zero if needed
  currentValue.value = start

  const startTime = performance.now()

  // Use requestAnimationFrame for smoother animation
  function updateCounter(timestamp) {
    const elapsed = timestamp - startTime
    const progress = Math.min(elapsed / duration, 1)

    // Use easeOutExpo for more natural counting effect
    const easedProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)

    // Calculate the current value based on progress
    currentValue.value = start + easedProgress * (end - start)

    // Continue animation if not complete
    if (progress < 1) {
      requestAnimationFrame(updateCounter)
    } else {
      // Ensure we hit the exact target value
      currentValue.value = end
    }
  }

  // Start the animation
  requestAnimationFrame(updateCounter)
}

// Watch for changes to the target value
watch(() => props.value, (newVal) => {
  if (props.active) {
    const numValue = Number(newVal)
    if (!isNaN(numValue)) {
      animateCounter(currentValue.value, numValue, props.duration)
    }
  }
})

// Watch for active state change
watch(() => props.active, (isActive) => {
  if (isActive) {
    animateCounter(0, targetValue.value, props.duration)
  }
})

// Initialize counter when mounted
onMounted(() => {
  // If active on mount, start animation
  if (props.active) {
    animateCounter(0, targetValue.value, props.duration)
  } else {
    // Otherwise just set the initial value without animation
    currentValue.value = props.active ? targetValue.value : 0
  }
})
</script>
