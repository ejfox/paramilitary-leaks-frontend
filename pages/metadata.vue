<template>
  <div class="container mx-auto px-4 py-6 max-w-7xl">
    <div class="w-full mb-10">
      <h1 class="text-2xl sm:text-3xl text-white font-light mb-2">{{ source.title }} Metadata Overview</h1>
      <p class="text-gray-400 text-sm mb-8">Explore the composition and structure of the leak through time, file types, and metadata.</p>
    
      <!-- Stream Graph Section -->
      <section class="mb-16">
        <h2 class="text-xl text-white font-light mb-6">Files Through Time</h2>
        <StreamGraph />
      </section>

      <!-- Files Overview Section -->
      <section class="mb-16">
        <h2 class="text-xl text-white font-light mb-6">File Composition</h2>
        <FilesOverview />
      </section>

      <!-- Comparison Section -->
      <section class="mb-16">
        <h2 class="text-xl text-white font-light mb-6">Size & Format Distribution</h2>
        <ComparisonPies />
      </section>

      <!-- Source Info -->
      <section class="mt-16 pt-8 border-t border-gray-800">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 class="text-lg text-white font-light mb-4">About This Dataset</h3>
            <p class="text-sm text-gray-400 mb-4">
              This is a data visualization of leaked documents from {{ source.title }}. Our analysis shows file metadata,
              creation dates, and composition to help provide context and understanding of the material.
            </p>
          </div>

          <div>
            <h3 class="text-lg text-white font-light mb-4">Source Information</h3>
            <div class="text-sm text-gray-400 space-y-2">
              <div><span class="text-gray-500">Source:</span> {{ source.title }}</div>
              <div><span class="text-gray-500">Year:</span> {{ source.year }}</div>
              <div><span class="text-gray-500">Type:</span> {{ source.type }}</div>
              <div><span class="text-gray-500">Size:</span> {{ formatFileSize(source.size) }}</div>
            </div>
          </div>

          <div>
            <h3 class="text-lg text-white font-light mb-4">Navigation</h3>
            <div class="space-y-3">
              <NuxtLink to="/files" class="block text-blue-400 hover:text-blue-300 transition-colors text-sm">
                → Browse Files
              </NuxtLink>
              <NuxtLink to="/search" class="block text-blue-400 hover:text-blue-300 transition-colors text-sm">
                → Search Documents
              </NuxtLink>
              <NuxtLink :to="`/about/${source.slug}`" class="block text-blue-400 hover:text-blue-300 transition-colors text-sm">
                → About This Dataset
              </NuxtLink>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRuntimeConfig } from '#app'
import StreamGraph from '~/components/metadata/StreamGraph.vue'
import FilesOverview from '~/components/metadata/FilesOverview.vue'
import ComparisonPies from '~/components/metadata/ComparisonPies.vue'

const config = useRuntimeConfig()

// Get source info from config
const source = computed(() => {
  return {
    title: config.public.SOURCE_TITLE || 'Paramilitary Leaks',
    slug: config.public.SOURCE_SLUG || 'paramilitary-leaks',
    year: config.public.SOURCE_YEAR || '2023',
    type: config.public.SOURCE_TYPE || 'Documents',
    size: parseInt(config.public.SOURCE_SIZE || '0')
  }
})

// Format file size
const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B'
  
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + sizes[i]
}
</script>

<style>
.feltron-card {
  background-color: rgba(25, 25, 25, 0.5);
  backdrop-filter: blur(5px);
  border: 1px solid rgba(50, 50, 50, 0.3);
}

.feltron-title {
  font-size: 16px;
  font-weight: 400;
  color: #fff;
  letter-spacing: 0.5px;
}
</style>