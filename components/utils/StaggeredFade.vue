<template>
  <div class="staggered-container">
    <slot></slot>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const props = defineProps({
  selector: {
    type: String,
    default: '.stagger-item'
  },
  delay: {
    type: Number,
    default: 50 // ms between animations
  },
  initialDelay: {
    type: Number,
    default: 0
  }
});

const container = ref(null);

onMounted(() => {
  // Get the container element
  container.value = document.querySelector('.staggered-container');
  if (!container.value) return;

  // Find all elements to animate
  const elements = container.value.querySelectorAll(props.selector);

  // Stagger their animations
  elements.forEach((el, index) => {
    // Initial state
    el.style.opacity = '0';
    el.style.transform = 'translateY(15px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';

    // Animate with staggered delay
    setTimeout(() => {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }, props.initialDelay + (index * props.delay));
  });
});
</script>

<style scoped>
.staggered-container {
  position: relative;
}
</style>