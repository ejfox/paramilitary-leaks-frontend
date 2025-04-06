<template>
  <section class="py-24">
    <div class="container mx-auto px-4 max-w-5xl">

        <div
          class="mt-10 flex items-center p-6 bg-gray-900/80 backdrop-blur-md rounded-xl border border-gray-700/50 shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 mr-4 text-blue-400 flex-shrink-0" fill="none"
            viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p class="text-base text-gray-300">
            This website offers an interactive way to explore the data Williams risked his safety to collect.
            Investigations like those by <a
              href="https://micahflee.com/the-ap-iii-militias-fraudulent-charity-front-group/"
              class="text-blue-400 hover:underline" target="_blank">Micah Lee</a> and <a
              href="https://www.propublica.org/article/ap3-oath-keepers-militia-mole"
              class="text-blue-400 hover:underline" target="_blank">ProPublica</a> demonstrate the valuable insights
            that can be gleaned by examining these messages. By making this data accessible, we hope to facilitate
            further research and understanding of these groups.
          </p>
        </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useScrollAnimations } from '~/composables/useScrollAnimations'

// Get scroll animations
const { observeElement } = useScrollAnimations()

// Audio player state
const audioElement = ref(null)
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(100) // Default duration in seconds
const audioUrl = 'https://res.cloudinary.com/ejf/video/upload/v1711414843/paramilitary-leaks/militia-audio-placeholder.mp3'

// Set up text animation on mount
onMounted(() => {
  setupTextAnimations()
  setupAudioPlayer()
})

// Clean up audio player on unmount
onBeforeUnmount(() => {
  if (audioElement.value) {
    audioElement.value.pause()
    audioElement.value.removeEventListener('timeupdate', updateAudioTime)
    audioElement.value.removeEventListener('loadedmetadata', setAudioDuration)
    audioElement.value.removeEventListener('ended', handleAudioEnded)
  }
})

// Set up audio player
function setupAudioPlayer() {
  audioElement.value = new Audio(audioUrl)

  // Set up event listeners
  audioElement.value.addEventListener('timeupdate', updateAudioTime)
  audioElement.value.addEventListener('loadedmetadata', setAudioDuration)
  audioElement.value.addEventListener('ended', handleAudioEnded)

  // Load audio
  audioElement.value.load()
}

function updateAudioTime() {
  if (audioElement.value) {
    currentTime.value = audioElement.value.currentTime
  }
}

function setAudioDuration() {
  if (audioElement.value) {
    duration.value = audioElement.value.duration
  }
}

function handleAudioEnded() {
  isPlaying.value = false
}

function toggleAudio() {
  if (!audioElement.value) return

  if (isPlaying.value) {
    audioElement.value.pause()
  } else {
    audioElement.value.play()
  }

  isPlaying.value = !isPlaying.value
}

function seekAudio(event) {
  if (!audioElement.value) return

  const rect = event.currentTarget.getBoundingClientRect()
  const clickPosition = (event.clientX - rect.left) / rect.width

  audioElement.value.currentTime = clickPosition * duration.value
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

// Text reveal animations
function setupTextAnimations() {
  // Animate paragraphs with reveal effect
  const paragraphs = document.querySelectorAll('.prose p')
  paragraphs.forEach((p, index) => {
    // Wrap in a reveal-text container if not already
    if (!p.parentNode.classList.contains('reveal-text')) {
      const wrapper = document.createElement('div')
      wrapper.className = 'reveal-text'
      p.parentNode.insertBefore(wrapper, p)
      wrapper.appendChild(p)
    }

    // Add animation with staggered delay
    observeElement(p.parentNode, {
      classes: ['visible'],
      once: true,
      delay: index * 120
    })
  })

  // Animate blockquotes and callouts differently
  document.querySelectorAll('.border-l-4, .backdrop-blur-sm, .rounded-xl').forEach((el, index) => {
    observeElement(el, {
      classes: ['fade-in', 'visible'],
      once: true,
      delay: index * 100
    })
  })

  // Animate headings
  document.querySelectorAll('h2, h3, h4').forEach((heading) => {
    observeElement(heading, {
      classes: ['fade-up', 'visible'],
      once: true
    })
  })
}
</script>

<style scoped>
/* Reveal text animation effect */
.reveal-text {
  position: relative;
  overflow: hidden;
}

.reveal-text::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #1f2937;
  transform: translateX(0);
  transition: transform 1.2s cubic-bezier(0.77, 0, 0.18, 1);
}

.reveal-text.visible::after {
  transform: translateX(100%);
}

/* Fade in animation */
.fade-in {
  opacity: 0;
  transition: opacity 0.8s ease;
}

.fade-in.visible {
  opacity: 1;
}

/* Fade up animation */
.fade-up {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}

.fade-up.visible {
  opacity: 1;
  transform: translateY(0);
}

/* Added magazine-style typographic refinements */
.prose-xl p {
  margin-bottom: 2em;
  letter-spacing: -0.01em;
}

.prose-xl {
  line-height: 1.8;
}

/* Audio player pulse animation */
@keyframes pulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.7;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
