<template>
  <section ref="heroSection" class="relative h-screen flex items-center justify-center overflow-hidden z-20">
    <!-- Hero image with fade-in effect -->
    <div class="absolute inset-0 w-full h-full overflow-hidden">
      <div class="hero-image-container w-full h-full" :class="{ 'visible': imageLoaded }">
        <img ref="heroImage"
          src="https://res.cloudinary.com/ejf/image/upload/v1742874494/Screenshot_2025-03-24_at_11.47.57_PM.png"
          alt="Paramilitary Leaks" class="w-full h-full object-cover object-center" style="object-position: 50% 30%;"
          @load="onImageLoaded" />
        <div class="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-gray-900/90"></div>
      </div>
    </div>

    <div class="absolute inset-0 flex items-center justify-center">
      <div ref="heroContent" class="text-center z-30 px-6 transform fade-up" :class="{ 'visible': contentVisible }"
        :style="{ transform: `translateY(${scrollY * 0.4}px)` }">
        <h1 class="text-5xl sm:text-7xl font-bold mb-6 text-white">The Hidden Communications</h1>
        <p class="text-xl sm:text-2xl text-gray-300 max-w-3xl mx-auto mb-8">
          A journey through the secret Telegram messages that exposed a paramilitary network's inner workings
        </p>
        <div class="animate-bounce mt-16">
          <svg class="w-6 h-6 mx-auto text-gray-400" fill="none" stroke-linecap="round" stroke-linejoin="round"
            stroke-width="2" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
          </svg>
          <span class="text-sm text-gray-400">Begin the story</span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'

const props = defineProps({
  scrollY: {
    type: Number,
    default: 0
  }
})

// Expose hero section ref to parent
const heroSection = ref(null)
const heroContent = ref(null)
const heroImage = ref(null)
const imageLoaded = ref(false)
const contentVisible = ref(false)

// Handle image load event
function onImageLoaded() {
  // Start fade-in after 150ms delay
  setTimeout(() => {
    imageLoaded.value = true

    // Show content after image starts fading in
    setTimeout(() => {
      contentVisible.value = true
    }, 300)
  }, 150)
}

defineExpose({
  heroSection
})
</script>

<style scoped>
.hero-image-container {
  opacity: 0;
  transition: opacity 1.5s ease-in-out;
  position: relative;
  z-index: 25;
  /* Ensure the hero image displays above the scatterplot */
}

.hero-image-container.visible {
  opacity: 1;
}

.hero-image-container img {
  /* Remove zoom animation */
  z-index: 25;
  /* Extra insurance the image is above everything */
}

/* Magazine-style adjustments */
h1 {
  font-family: 'Inter', system-ui, sans-serif;
  letter-spacing: -0.02em;
  font-weight: 800;
}

p {
  font-family: 'Inter', system-ui, sans-serif;
  font-weight: 300;
  letter-spacing: 0.01em;
  line-height: 1.6;
}
</style>