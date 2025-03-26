<template>
  <svg :width="width" :height="height" class="sparkline">
    <!-- Gradient definition -->
    <defs>
      <linearGradient :id="gradientId" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" :stop-color="color" stop-opacity="0.3" />
        <stop offset="100%" :stop-color="color" stop-opacity="0.02" />
      </linearGradient>
    </defs>

    <!-- Filled area -->
    <path v-if="showFill" :d="areaD" :fill="`url(#${gradientId})`" />

    <!-- Line -->
    <path :d="pathD" :stroke="color" stroke-width="1.2" fill="none" />

    <!-- End dot -->
    <circle v-if="showEndDot" :cx="endX" :cy="endY" r="2" :fill="color" />
  </svg>
</template>

<script setup>
import { computed } from 'vue'
import * as d3 from 'd3'

const props = defineProps({
  data: {
    type: Array,
    required: true
  },
  width: {
    type: Number,
    default: 80
  },
  height: {
    type: Number,
    default: 20
  },
  color: {
    type: String,
    default: 'rgba(59, 130, 246, 0.8)' // blue-500 with opacity
  },
  showEndDot: {
    type: Boolean,
    default: true
  },
  showFill: {
    type: Boolean,
    default: true
  }
})

// Unique ID for the gradient
const gradientId = computed(() => `sparkline-gradient-${Math.random().toString(36).substring(2, 10)}`)

// Calculate the line path
const pathD = computed(() => {
  if (!props.data || props.data.length < 2) return ''

  // Create scales
  const x = d3.scaleLinear()
    .domain([0, props.data.length - 1])
    .range([0, props.width])

  const y = d3.scaleLinear()
    .domain([0, d3.max(props.data)])
    .range([props.height, 0])

  // Create line generator
  const line = d3.line()
    .x((d, i) => x(i))
    .y(d => y(d))
    .curve(d3.curveMonotoneX)

  return line(props.data)
})

// Calculate the area path for the gradient fill
const areaD = computed(() => {
  if (!props.data || props.data.length < 2) return ''

  // Create scales
  const x = d3.scaleLinear()
    .domain([0, props.data.length - 1])
    .range([0, props.width])

  const y = d3.scaleLinear()
    .domain([0, d3.max(props.data)])
    .range([props.height, 0])

  // Create area generator
  const area = d3.area()
    .x((d, i) => x(i))
    .y0(props.height)
    .y1(d => y(d))
    .curve(d3.curveMonotoneX)

  return area(props.data)
})

// End point coordinates for the dot
const endX = computed(() => {
  if (!props.data || !props.data.length) return 0
  return props.width
})

const endY = computed(() => {
  if (!props.data || !props.data.length) return 0

  const y = d3.scaleLinear()
    .domain([0, d3.max(props.data)])
    .range([props.height, 0])

  return y(props.data[props.data.length - 1])
})
</script>

<style scoped>
.sparkline {
  display: inline-block;
  vertical-align: middle;
}
</style>