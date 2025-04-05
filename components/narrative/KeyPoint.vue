<template>
  <div class="key-point-container relative my-6" :class="[`theme-${theme}`, { 'visible': isVisible }]" ref="pointRef">
    <div class="key-point p-5 md:p-6 rounded-lg bg-gray-900 border border-gray-800 overflow-hidden">
      <!-- Indicator and icon -->
      <div class="flex items-start mb-4">
        <div class="point-indicator relative flex-shrink-0 w-8 h-8 rounded-full mr-3 flex items-center justify-center">
          <slot name="icon">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 icon" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clip-rule="evenodd" />
            </svg>
          </slot>
        </div>

        <!-- Title -->
        <h4 class="text-lg md:text-xl font-bold text-white leading-tight">{{ title }}</h4>
      </div>

      <!-- Content -->
      <div class="ml-11 text-gray-300 space-y-2">
        <slot></slot>
      </div>

      <!-- Background decoration line -->
      <div class="point-line absolute"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';

// Props
const props = defineProps({
  title: {
    type: String,
    required: true
  },
  theme: {
    type: String,
    default: 'blue',
    validator: (value) => ['blue', 'red', 'green', 'purple', 'amber'].includes(value)
  }
});

// Visibility state for animation
const isVisible = ref(false);
const pointRef = ref(null);

// Setup intersection observer for animation
onMounted(() => {
  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      isVisible.value = true;
      observer.unobserve(pointRef.value);
    }
  }, {
    threshold: 0.2,
    rootMargin: '0px 0px -100px 0px' // Trigger a bit before fully visible
  });

  if (pointRef.value) {
    observer.observe(pointRef.value);
  }

  // Cleanup
  onBeforeUnmount(() => {
    if (pointRef.value) {
      observer.unobserve(pointRef.value);
    }
  });
});
</script>

<style scoped>
.key-point-container {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.6s ease, transform 0.6s cubic-bezier(0.13, 0.8, 0.4, 1);
}

.key-point-container.visible {
  opacity: 1;
  transform: translateY(0);
}

.key-point {
  position: relative;
  transition: border-color 0.3s ease;
}

/* Animated line */
.point-line {
  left: 3.25rem;
  top: 0;
  width: 1px;
  bottom: 0;
  transform: scaleY(0);
  transform-origin: top;
  transition: transform 0.8s cubic-bezier(0.19, 1, 0.22, 1) 0.2s;
}

.key-point-container.visible .point-line {
  transform: scaleY(1);
}

/* Themes */
.theme-blue .point-indicator {
  background-color: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
}

.theme-blue .point-line {
  background-color: #3b82f6;
}

.theme-blue.visible .key-point {
  border-color: rgba(59, 130, 246, 0.3);
}

.theme-red .point-indicator {
  background-color: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.theme-red .point-line {
  background-color: #ef4444;
}

.theme-red.visible .key-point {
  border-color: rgba(239, 68, 68, 0.3);
}

.theme-green .point-indicator {
  background-color: rgba(16, 185, 129, 0.2);
  color: #10b981;
}

.theme-green .point-line {
  background-color: #10b981;
}

.theme-green.visible .key-point {
  border-color: rgba(16, 185, 129, 0.3);
}

.theme-purple .point-indicator {
  background-color: rgba(139, 92, 246, 0.2);
  color: #8b5cf6;
}

.theme-purple .point-line {
  background-color: #8b5cf6;
}

.theme-purple.visible .key-point {
  border-color: rgba(139, 92, 246, 0.3);
}

.theme-amber .point-indicator {
  background-color: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
}

.theme-amber .point-line {
  background-color: #f59e0b;
}

.theme-amber.visible .key-point {
  border-color: rgba(245, 158, 11, 0.3);
}

/* Animation for the icon */
.key-point-container .icon {
  opacity: 0;
  transform: scale(0.5);
  transition: opacity 0.4s ease 0.4s, transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.4s;
}

.key-point-container.visible .icon {
  opacity: 1;
  transform: scale(1);
}
</style>