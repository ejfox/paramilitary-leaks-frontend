<template>
  <div class="min-h-screen h-screen w-screen bg-gray-900 flex flex-col">
    <!-- Navigation Bar -->
    <TopBar current-page="Changelog" />

    <div class="flex-1 overflow-auto px-4 py-6">
      <div class="max-w-5xl mx-auto w-full">
        <div class="mb-6 flex items-center justify-between">
          <h1 class="text-xl font-bold text-white">
            Changelog
            <span class="text-sm text-gray-400 ml-2">{{ version }}</span>
          </h1>
        </div>

        <div v-if="loading" class="flex items-center justify-center py-12">
          <div class="flex items-center">
            <div class="animate-spin mr-3">
              <svg class="w-5 h-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                </path>
              </svg>
            </div>
            <div class="text-white text-sm">Loading changelog...</div>
          </div>
        </div>

        <div v-else-if="error" class="bg-red-900/50 p-3 rounded border-l-2 border-red-500">
          <p class="text-red-200 font-bold">Error</p>
          <p>{{ error }}</p>
        </div>

        <div v-else class="changelog-content border-t border-gray-700 pt-2">
          <div v-html="changelogHtml"></div>
        </div>
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
.changelog-content {
  color: rgba(209, 213, 219, 1);
  /* Base text color - lighter gray */
}

.changelog-content :deep(h1) {
  font-size: 1.75rem;
  font-weight: 700;
  margin-top: 2rem;
  margin-bottom: 1.5rem;
  color: white;
  border-bottom: 1px solid rgba(75, 85, 99, 0.5);
  padding-bottom: 0.5rem;
}

.changelog-content :deep(h2) {
  font-size: 1.5rem;
  font-weight: 600;
  margin-top: 2rem;
  margin-bottom: 1rem;
  color: rgba(243, 244, 246, 1);
}

.changelog-content :deep(h3) {
  font-size: 1.25rem;
  font-weight: 600;
  margin-top: 1.5rem;
  margin-bottom: 1rem;
  color: rgba(229, 231, 235, 1);
}

.changelog-content :deep(ul) {
  list-style-type: none;
  padding-left: 1rem;
  margin: 1rem 0;
}

.changelog-content :deep(li) {
  margin-bottom: 0.75rem;
  font-size: 0.9375rem;
  line-height: 1.5;
  position: relative;
  padding-left: 1.5rem;
}

.changelog-content :deep(li::before) {
  content: "•";
  position: absolute;
  left: 0;
  color: rgba(96, 165, 250, 1);
  /* blue-400 */
}

.changelog-content :deep(a) {
  color: rgba(96, 165, 250, 1);
  /* blue-400 */
  text-decoration: none;
  transition: all 0.2s;
  border-bottom: 1px solid transparent;
}

.changelog-content :deep(a:hover) {
  color: rgba(147, 197, 253, 1);
  /* blue-300 */
  border-bottom-color: currentColor;
}

.changelog-content :deep(p) {
  margin-bottom: 1rem;
  font-size: 0.9375rem;
  line-height: 1.6;
}

.changelog-content :deep(hr) {
  border: 0;
  height: 1px;
  background: rgba(75, 85, 99, 0.5);
  margin: 2rem 0;
}

/* Style commit hashes differently */
.changelog-content :deep(code) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.875rem;
  color: rgba(147, 197, 253, 1);
  /* blue-300 */
  background: rgba(30, 58, 138, 0.3);
  /* blue-900 with opacity */
  padding: 0.2rem 0.4rem;
  border-radius: 0.25rem;
}

/* Add some spacing between sections */
.changelog-content :deep(h2 + h3) {
  margin-top: 1rem;
}

/* Style the Unreleased section differently */
.changelog-content :deep(h2:first-of-type) {
  color: rgba(110, 231, 183, 1);
  /* emerald-300 */
  font-weight: 700;
}

/* Make commit messages more readable */
.changelog-content :deep(li:has(code)) {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.changelog-content :deep(li:has(code) code) {
  margin-top: 0.25rem;
  font-size: 0.8125rem;
}
</style>