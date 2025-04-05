<template>
  <div class="pull-quote-container my-20 relative" :class="{ 'visible': isVisible }" ref="quoteRef">
    <div class="pull-quote relative pl-4 mx-auto max-w-3xl"
      :class="[alignment === 'left' ? 'text-left' : 'text-right']">
      <div class="quote-mark absolute -top-8 opacity-30 text-blue-400 text-7xl font-serif"
        :class="[alignment === 'left' ? 'left-0' : 'right-0']">
        "
      </div>

      <blockquote class="text-2xl md:text-3xl font-serif text-white leading-relaxed"
        :class="[textColor ? textColor : 'text-white']">
        <slot></slot>
      </blockquote>

      <div class="mt-6 text-sm uppercase tracking-wide opacity-80" :class="[textColor ? textColor : 'text-gray-300']">
        <span v-if="author" class="font-medium">— {{ author }}</span>
        <span v-if="author && source">, </span>
        <span v-if="source" class="italic">{{ source }}</span>
      </div>

      <div class="absolute top-0 bottom-0 w-1 bg-blue-500" :class="[alignment === 'left' ? 'left-0' : 'right-0']"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';

// Props
const props = defineProps({
  author: {
    type: String,
    default: null
  },
  source: {
    type: String,
    default: null
  },
  alignment: {
    type: String,
    default: 'left',
    validator: (value) => ['left', 'right'].includes(value)
  },
  textColor: {
    type: String,
    default: null
  }
});

// Visibility state for animation
const isVisible = ref(false);
const quoteRef = ref(null);

// Setup intersection observer for animation
onMounted(() => {
  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      isVisible.value = true;
      observer.unobserve(quoteRef.value);
    }
  }, {
    threshold: 0.2,
    rootMargin: '0px 0px -100px 0px' // Trigger a bit before fully visible
  });

  if (quoteRef.value) {
    observer.observe(quoteRef.value);
  }

  // Cleanup
  onBeforeUnmount(() => {
    if (quoteRef.value) {
      observer.unobserve(quoteRef.value);
    }
  });
});
</script>

<style scoped>
.pull-quote-container {
  opacity: 0;
  transform: translateX(40px);
  transition: opacity 0.8s ease, transform 0.8s cubic-bezier(0.13, 0.8, 0.4, 1);
}

.pull-quote-container.visible {
  opacity: 1;
  transform: translateX(0);
}

.pull-quote-container[class*="right"] {
  transform: translateX(-40px);
}

.pull-quote-container[class*="right"].visible {
  transform: translateX(0);
}

.pull-quote {
  position: relative;
}

.pull-quote::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  background: #3b82f6;
  left: 0;
  transform: scaleY(0);
  transform-origin: top;
  transition: transform 1s cubic-bezier(0.19, 1, 0.22, 1) 0.3s;
}

.pull-quote-container.visible .pull-quote::before {
  transform: scaleY(1);
}

blockquote {
  position: relative;
  z-index: 10;
}
</style>