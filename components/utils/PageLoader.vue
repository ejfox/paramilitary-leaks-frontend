<template>
  <div v-if="loading" class="page-loader">
    <div class="loader-content">
      <div class="spinner">
        <div class="double-bounce1"></div>
        <div class="double-bounce2"></div>
      </div>
      <div v-if="message" class="loading-message">{{ message }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';

const props = defineProps({
  loading: {
    type: Boolean,
    default: false
  },
  message: {
    type: String,
    default: 'Loading...'
  }
});

// Auto-loader that watches for route changes
const route = useRoute();
const internalLoading = ref(false);

// Watch route changes to show loader automatically
watch(route, () => {
  internalLoading.value = true;
  setTimeout(() => {
    internalLoading.value = false;
  }, 800); // Adjust timeout as needed
}, { immediate: true });
</script>

<style scoped>
.page-loader {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(17, 24, 39, 0.8);
  /* gray-900 with opacity */
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(3px);
  animation: fadeIn 0.2s ease-out forwards;
}

.loader-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.loading-message {
  color: white;
  margin-top: 1rem;
  font-size: 0.875rem;
}

.spinner {
  width: 40px;
  height: 40px;
  position: relative;
}

.double-bounce1,
.double-bounce2 {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background-color: rgba(59, 130, 246, 0.8);
  /* blue-500 with opacity */
  opacity: 0.6;
  position: absolute;
  top: 0;
  left: 0;
  animation: bounce 2s infinite ease-in-out;
}

.double-bounce2 {
  animation-delay: -1.0s;
}

@keyframes bounce {

  0%,
  100% {
    transform: scale(0.0);
  }

  50% {
    transform: scale(1.0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}
</style>