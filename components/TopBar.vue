<template>
  <div class="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between relative">
    <!-- App Logo & Title -->
    <h1 class="text-white text-lg font-bold flex items-center">
      Paramilitary Leaks
      <span class="ml-2 text-xs text-gray-500 bg-gray-700 px-1.5 rounded">{{ version }}</span>
    </h1>

    <!-- Mobile hamburger menu button - only visible on mobile -->
    <button @click="mobileMenuOpen = !mobileMenuOpen" class="md:hidden text-gray-300 hover:text-white p-1.5"
      aria-label="Toggle navigation menu">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd"
          :d="mobileMenuOpen
            ? 'M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z'
            : 'M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z'"
          clip-rule="evenodd" />
      </svg>
    </button>

    <!-- Desktop Navigation Links - hidden on mobile -->
    <div class="hidden md:flex items-center overflow-x-auto whitespace-nowrap no-scrollbar">
      <!-- Navigation Links -->
      <NuxtLink v-for="item in navItems" :key="item.path" :to="item.path"
        class="text-sm flex items-center transition-colors mx-2 first:ml-0 last:mr-0"
        :class="currentPage === item.title ? 'text-blue-400 font-medium' : 'text-gray-300 hover:text-white'">
        <!-- Icon -->
        <span v-html="item.icon" class="h-4 w-4 mr-1"></span>
        <span>{{ item.title }}</span>
      </NuxtLink>

      <!-- Slot for additional links -->
      <slot name="additional-links"></slot>
    </div>

    <!-- Mobile Navigation Overlay - only visible when mobileMenuOpen is true -->
    <div v-if="mobileMenuOpen" class="md:hidden fixed inset-0 bg-gray-900 bg-opacity-90 z-50 flex flex-col">
      <!-- Close button -->
      <div class="flex justify-end p-4">
        <button @click="mobileMenuOpen = false" class="text-gray-300 hover:text-white p-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clip-rule="evenodd" />
          </svg>
        </button>
      </div>

      <!-- Mobile Links -->
      <div class="flex-1 flex flex-col justify-center px-4">
        <div class="space-y-4">
          <NuxtLink v-for="item in navItems" :key="item.path" :to="item.path"
            class="flex items-center py-3 px-2 rounded-lg transition-colors"
            :class="currentPage === item.title ? 'bg-blue-900 bg-opacity-50 text-blue-400 font-medium' : 'text-gray-300 hover:text-white hover:bg-gray-800'"
            @click="mobileMenuOpen = false">
            <!-- Icon -->
            <span v-html="item.icon" class="h-5 w-5 mr-3"></span>
            <span class="text-base">{{ item.title }}</span>
          </NuxtLink>

          <!-- Render additional links on mobile too -->
          <div class="py-2 border-t border-gray-700 mt-4">
            <slot name="additional-links"></slot>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

// Define props
const props = defineProps({
  currentPage: {
    type: String,
    default: ''
  }
})

// Mobile menu state
const mobileMenuOpen = ref(false)

// Get version from composable
const { versionWithPrefix: version } = useAppVersion()

// Navigation items with their icons
const navItems = computed(() => [
  {
    title: 'Timeline',
    path: '/',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
      <path d="M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z" />
      <path d="M3 7v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7c0 1.657-3.134 3-7 3S3 8.657 3 7z" />
      <path d="M17 5c0 1.657-3.134 3-7 3S3 6.657 3 5s3.134-3 7-3 7 1.343 7 3z" />
    </svg>`
  },
  {
    title: 'Files Visualization',
    path: '/files',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
      <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
    </svg>`
  },
  {
    title: 'Metadata Analysis',
    path: '/metadata',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
      <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
      <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
    </svg>`
  },
  {
    title: 'Message Feed',
    path: '/feed',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
      <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
      <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
    </svg>`
  },
  {
    title: 'Senders',
    path: '/senders',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
    </svg>`
  },
  {
    title: 'Changelog',
    path: '/changelog',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm2 10a1 1 0 10-2 0v3a1 1 0 102 0v-3zm2-3a1 1 0 011 1v5a1 1 0 11-2 0v-5a1 1 0 011-1zm4-1a1 1 0 10-2 0v7a1 1 0 102 0V8z" clip-rule="evenodd" />
    </svg>`
  }
])
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}

.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* Add transition for mobile menu */
@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

.mobile-menu-animation {
  animation: fadeIn 0.2s ease-out;
}
</style>