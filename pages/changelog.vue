<template>
  <div class="min-h-screen w-screen bg-gray-900 flex flex-col">
    <!-- Navigation Bar -->
    <TopBar current-page="Changelog" />

    <div class="p-6 max-w-5xl mx-auto w-full">
      <h1 class="text-white text-2xl font-bold mb-6">
        Changelog 
        <span class="text-sm text-gray-400 ml-2">{{ version }}</span>
      </h1>
      
      <div v-if="loading" class="flex items-center justify-center py-12">
        <div class="flex items-center">
          <div class="animate-spin mr-3">
            <svg class="w-6 h-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
              </path>
            </svg>
          </div>
          <div class="text-white">Loading changelog...</div>
        </div>
      </div>

      <div v-else-if="error" class="text-red-500 p-4">{{ error }}</div>

      <div v-else class="changelog-content feltron-card p-6 rounded-lg bg-gray-800 text-white">
        <div v-html="changelogHtml"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import TopBar from '~/components/TopBar.vue'
import { marked } from 'marked'

const loading = ref(true)
const error = ref(null)
const changelogHtml = ref('')

// Get current version
const { versionWithPrefix: version } = useAppVersion()

async function fetchChangelog() {
  try {
    console.log('Fetching changelog from public directory...')
    
    // Attempt to fetch the changelog from public directory
    const response = await fetch('/CHANGELOG.md')
    
    if (!response.ok) {
      throw new Error(`Failed to fetch changelog: ${response.status} ${response.statusText}`)
    }
    
    console.log('Changelog loaded successfully')
    const markdownContent = await response.text()
    
    // Log the first 100 chars to see if we got content
    console.log('Changelog content preview:', markdownContent.slice(0, 100))
    
    // Parse markdown to HTML
    changelogHtml.value = marked.parse(markdownContent)
    loading.value = false
  } catch (err) {
    console.error('Error fetching changelog:', err)
    error.value = `Failed to load changelog: ${err.message}`
    loading.value = false
  }
}

onMounted(() => {
  fetchChangelog()
})
</script>

<style scoped>
.changelog-content :deep(h1),
.changelog-content :deep(h2) {
  font-size: 1.5rem;
  font-weight: 600;
  margin-top: 1.5rem;
  margin-bottom: 1rem;
  color: rgba(219, 232, 247, 1);
}

.changelog-content :deep(h3) {
  font-size: 1.25rem;
  font-weight: 600;
  margin-top: 1.25rem;
  margin-bottom: 0.75rem;
  color: rgba(157, 176, 216, 1);
}

.changelog-content :deep(ul) {
  list-style-type: disc;
  padding-left: 1.5rem;
  margin-top: 0.5rem;
  margin-bottom: 1rem;
}

.changelog-content :deep(li) {
  margin-bottom: 0.25rem;
}

.changelog-content :deep(a) {
  color: #3b82f6;
  text-decoration: none;
}

.changelog-content :deep(a:hover) {
  text-decoration: underline;
}

.changelog-content :deep(p) {
  margin-bottom: 1rem;
}

.changelog-content :deep(hr) {
  border-color: rgba(75, 85, 99, 0.5);
  margin: 1.5rem 0;
}

/* Feltron-inspired styling */
.feltron-card {
  background-color: rgba(31, 41, 55, 1);
  border-left: 3px solid rgba(59, 130, 246, 0.8);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.feltron-title {
  font-family: 'Inter', sans-serif;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  font-size: 0.7rem;
  font-weight: 500;
  color: rgba(156, 163, 175, 0.8);
  margin-bottom: 0.5rem;
}
</style>