<template>
  <div class="flex flex-col min-h-screen">
    <!-- Page progress bar -->
    <PageProgress :show="pageTransition.isTransitioning" :progress="pageTransition.progressValue" />

    <main class="flex-grow">
      <NuxtLayout>
        <NuxtPage :transition="{
          name: 'page',
          mode: 'out-in'
        }" />
      </NuxtLayout>
    </main>
    <AppFooter />
  </div>
</template>

<script setup>
import AppFooter from '~/components/AppFooter.vue'
import PageProgress from '~/components/utils/PageProgress.vue'
import { pageTransition } from '~/composables/usePageTransition'
</script>

<style>
/* use Figtree font for everything */
body {
  font-family: 'Figtree', sans-serif;
}
</style>
