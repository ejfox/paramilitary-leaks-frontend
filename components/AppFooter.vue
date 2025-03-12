<template>
  <footer class="bg-gray-800 border-t border-gray-700 px-4 py-3 text-xs text-gray-400">
    <div class="container mx-auto">
      <!-- Top row: Version and links -->
      <div class="flex flex-wrap justify-between items-center mb-2">
        <div class="mb-2 md:mb-0">
          <span class="font-medium">Paramilitary Leaks</span> <span class="text-gray-500">{{ version }}</span>
        </div>
        <div class="flex items-center space-x-4">
          <NuxtLink to="/changelog" class="text-gray-400 hover:text-white transition-colors">
            Changelog
          </NuxtLink>
          <div class="relative group">
            <a href="https://ejfox.com/pgp.txt" target="_blank" rel="noopener noreferrer"
              class="text-gray-400 hover:text-white transition-colors flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd"
                  d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v-2l1-1 1-1 .257-.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 1 1 0 000-2z"
                  clip-rule="evenodd" />
              </svg>
              PGP Key
            </a>
            <div
              class="absolute bottom-full left-0 mb-2 w-64 p-2 bg-gray-900 rounded shadow-lg text-gray-300 invisible group-hover:visible">
              <div class="text-xs">
                1. Get key: curl ejfox.com/pgp.txt<br>
                2. Import: gpg --import pgp.txt<br>
                3. Encrypt: gpg -e -r ejfox@ejfox.com file.txt<br>
                4. Email: Send file.txt.gpg to ejfox@ejfox.com
              </div>
              <div class="absolute bottom-0 left-4 transform translate-y-full">
                <div class="w-2 h-2 bg-gray-900 rotate-45 transform origin-center"></div>
              </div>
            </div>
          </div>
          <a href="https://www.patreon.com/mobiusblack" target="_blank" rel="noopener noreferrer"
            class="text-gray-400 hover:text-white transition-colors flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M14.82 2.41c3.96 0 7.18 3.24 7.18 7.21 0 3.96-3.22 7.18-7.18 7.18-3.97 0-7.21-3.22-7.21-7.18 0-3.97 3.24-7.21 7.21-7.21zM2 21.6h3.5V2.41H2V21.6z" />
            </svg>
            Support John
          </a>
          <a href="https://ddosecrets.com/article/paramilitary-leaks" target="_blank" rel="noopener noreferrer"
            class="text-gray-400 hover:text-white transition-colors flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd"
                d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 6a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2zm0 6a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z"
                clip-rule="evenodd" />
            </svg>
            Source Data
          </a>
          <a href="https://github.com/ejfox/paramilitary-leaks-frontend" target="_blank" rel="noopener noreferrer"
            class="text-gray-400 hover:text-white transition-colors flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd"
                d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482C17.139 18.193 20 14.44 20 10.017 20 4.484 15.522 0 10 0z"
                clip-rule="evenodd" />
            </svg>
            GitHub
          </a>
        </div>
      </div>

      <!-- Bottom row: News links -->
      <div class="pt-2 border-t border-gray-700">
        <div class="flex flex-col md:flex-row">
          <div class="text-gray-500 mb-2 md:mb-0 md:mr-3 feltron-title">In the news:</div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
            <a v-for="(article, index) in newsArticles" :key="index" :href="article.url" target="_blank"
              rel="noopener noreferrer" class="news-link group">
              <div class="flex items-start">
                <span class="inline-block w-2 h-2 rounded-full mr-1.5 mt-1 group-hover:scale-125 transition-transform"
                  :style="{ backgroundColor: getArticleColor(index) }"></span>
                <div>
                  <span class="text-blue-400 group-hover:text-blue-300 transition-colors">{{ article.title }}</span>
                  <div class="flex items-center mt-0.5">
                    <span class="text-gray-500">{{ article.source }}</span>
                    <span class="mx-1 text-gray-600">•</span>
                    <span class="text-gray-600">{{ formatArticleDate(article.date) }}</span>
                  </div>
                </div>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { ref } from 'vue'
import * as d3 from 'd3'
import { format } from 'date-fns'
const { versionWithPrefix: version } = useAppVersion()

// News articles data
const newsArticles = ref([
  {
    title: "The Militia and the Mole",
    source: "ProPublica",
    url: "https://www.propublica.org/article/ap3-oath-keepers-militia-mole",
    date: "2025-01-04"
  },
  {
    title: "Step-by-step guide to reading the leaked militia chats yourself",
    source: "Micah Lee",
    url: "https://micahflee.com/step-by-step-guide-to-reading-the-leaked-militia-chats-yourself/",
    date: "2025-03-12"
  },
  {
    title: "Processing Telegram Leaks for Fast Web Visualization",
    source: "EJ Fox",
    url: "https://ejfox.com/blog/2025/paramilitary-telegram-leaks-001",
    date: "2023-03-09"
  }
])

// Generate a color for each article
function getArticleColor(index) {
  const colorScale = d3.interpolateBlues
  const normalizedIndex = (index + 1) / (newsArticles.value.length + 1)
  return colorScale(0.3 + normalizedIndex * 0.5)
}

// Format the article date
function formatArticleDate(dateString) {
  try {
    const date = new Date(dateString)
    return format(date, 'MMM d, yyyy')
  } catch (err) {
    return dateString
  }
}
</script>

<style scoped>
.news-link {
  transition: all 0.2s ease;
  padding: 6px;
  border-radius: 4px;
}

.news-link:hover {
  background-color: rgba(31, 41, 55, 0.7);
}

.feltron-title {
  letter-spacing: 0.05em;
  text-transform: uppercase;
  font-size: 0.65rem;
  font-weight: 500;
}
</style>