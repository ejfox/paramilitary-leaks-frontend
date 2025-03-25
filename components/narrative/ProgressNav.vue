<template>
  <div class="fixed right-8 top-1/2 transform -translate-y-1/2 z-40 hidden lg:block">
    <div class="flex flex-col space-y-6">
      <button v-for="(section, index) in sections" :key="index" class="group flex items-center"
        @click="scrollToSection(section.ref)">
        <div class="w-3 h-3 rounded-full transition-all duration-300 mr-2" :class="[
          activeSection === index
            ? 'bg-blue-400 scale-125'
            : 'bg-gray-500 group-hover:bg-gray-300'
        ]"></div>
        <span class="text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          :class="activeSection === index ? 'text-blue-400' : 'text-gray-400'">
          {{ section.title }}
        </span>
      </button>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  sections: {
    type: Array,
    required: true
  },
  activeSection: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['section-change'])

function scrollToSection(sectionRef) {
  if (!sectionRef || !sectionRef.value) return

  // Scroll the section into view with smooth behavior
  sectionRef.value.scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  })

  // Emit the section change event
  emit('section-change', sectionRef)
}
</script>