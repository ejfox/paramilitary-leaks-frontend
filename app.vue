<template>
  <div class="flex flex-col min-h-screen">
    <main class="flex-grow">
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </main>
    <AppFooter />
  </div>
</template>
<script setup>
import AppFooter from '~/components/AppFooter.vue'
</script>
<style>
/* use Figtree font for everything */
body {
  font-family: 'Figtree', sans-serif;
}
</style>
