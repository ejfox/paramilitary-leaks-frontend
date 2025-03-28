<template>
  <div v-show="show" class="page-progress">
    <div class="progress-bar" :style="{ width: `${progress}%` }"></div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { pageTransition } from '~/composables/usePageTransition';

// Props
const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  progress: {
    type: Number,
    default: 0
  }
});

// Watch for route changes
const router = useRouter();
let transitionInterval = null;

onMounted(() => {
  router.beforeEach((to, from) => {
    if (to.path !== from.path) {
      transitionInterval = pageTransition.startTransition();
    }
  });

  router.afterEach(() => {
    pageTransition.endTransition(transitionInterval);
  });
});
</script>

<style scoped>
.page-progress {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  z-index: 9999;
  background-color: rgba(31, 41, 55, 0.8);
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #60a5fa);
  box-shadow: 0 0 8px rgba(59, 130, 246, 0.5);
  transition: width 0.2s ease-out;
}
</style>