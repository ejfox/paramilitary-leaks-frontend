<template>
  <div class="bg-gray-800 rounded-lg p-4 space-y-3 text-sm h-[300px] flex flex-col">
    <!-- Message Content -->
    <div class="space-y-2 flex-shrink-0">
      <div class="text-gray-400 text-xs uppercase tracking-wider">Message</div>
      <div class="text-white max-h-[80px] overflow-y-auto">{{ point.content }}</div>
    </div>

    <!-- Message Details -->
    <div class="grid grid-cols-2 gap-4 flex-shrink-0">
      <div>
        <div class="text-gray-400 text-xs uppercase tracking-wider">Sender</div>
        <div class="text-white truncate">{{ point.sender }}</div>
      </div>
      <div>
        <div class="text-gray-400 text-xs uppercase tracking-wider">Chat</div>
        <div class="text-white truncate">{{ point.chat_name }}</div>
      </div>
    </div>

    <!-- Timestamp -->
    <div class="flex-shrink-0">
      <div class="text-gray-400 text-xs uppercase tracking-wider">Time</div>
      <div class="text-white">{{ point.timestamp }}</div>
    </div>

    <!-- Scrollable section for additional details -->
    <div class="flex-1 overflow-y-auto space-y-3 pr-2">
      <!-- IDs Section -->
      <div class="text-xs bg-gray-900 rounded p-2 font-mono">
        <div class="grid grid-cols-2 gap-2">
          <div>
            <span class="text-gray-400">ID:</span>
            <span class="text-blue-400">{{ point.id }}</span>
          </div>
          <div>
            <span class="text-gray-400">Chat ID:</span>
            <span class="text-blue-400">{{ point.chat_id }}</span>
          </div>
          <div>
            <span class="text-gray-400">Message ID:</span>
            <span class="text-blue-400">{{ point.message_id }}</span>
          </div>
        </div>
      </div>

      <!-- Reply/Forward Info -->
      <div v-if="point.reply || point.fwd" class="text-xs">
        <div v-if="point.reply" class="text-gray-400">↩️ Reply to: {{ point.reply }}</div>
        <div v-if="point.fwd" class="text-gray-400">↪️ Forwarded from: {{ point.fwd }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  point: {
    type: Object,
    required: true
  }
})
</script>