<template>
  <div>
    <!-- Simple time axis label -->
    <div class="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-white text-xs pointer-events-none">
      Time →
    </div>

    <!-- Simple Y-axis label -->
    <div class="absolute left-2 top-0 h-full flex flex-col justify-between pointer-events-none text-white text-xs">
      <div class="py-2 font-bold">Message Density</div>
      <div class="py-2">↑</div>
    </div>
  </div>
</template>

<script setup>
// Keeping it minimal - we can add interactivity later if needed
</script>