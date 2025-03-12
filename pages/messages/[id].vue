<template>
  <div class="min-h-screen w-screen bg-gray-900 flex flex-col">
    <!-- Header with navigation -->
    <TopBar current-page="Message Detail" />

    <!-- Main content -->
    <div class="flex-1 overflow-auto">
      <!-- Loading state -->
      <div v-if="loading" class="flex-1 flex items-center justify-center">
        <div class="bg-gray-800 p-4 rounded-lg flex items-center space-x-3">
          <div class="animate-spin">
            <svg class="w-5 h-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
              </path>
            </svg>
          </div>
          <div class="text-white text-sm">Loading message...</div>
        </div>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="flex-1 flex items-center justify-center">
        <div class="bg-red-900/50 p-4 rounded-lg text-white max-w-lg">
          <h3 class="text-base font-bold mb-1">Error</h3>
          <p class="text-sm">{{ error }}</p>
        </div>
      </div>

      <!-- Message content -->
      <div v-else class="container mx-auto py-6 px-4 max-w-4xl">
        <!-- Breadcrumb navigation -->
        <div class="mb-6 text-gray-400 text-sm flex items-center">
          <NuxtLink to="/feed" class="hover:text-white transition-colors">
            ← Back to Message Feed
          </NuxtLink>
          <span class="mx-2">|</span>
          <span>
            <span v-if="message.chat_title || message.group_chat_id">
              {{ message.chat_title || message.group_chat_id }}
            </span>
            <span v-else>Message Details</span>
          </span>
        </div>

        <!-- Message card -->
        <div class="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 shadow-xl">
          <!-- Header with sender info and timestamp -->
          <div class="p-6 border-b border-gray-700">
            <div class="flex items-start justify-between">
              <!-- Sender info -->
              <div class="flex items-center space-x-4">
                <!-- Sender avatar/placeholder -->
                <div class="w-12 h-12 rounded-full flex items-center justify-center"
                  :style="{ backgroundColor: getSenderColor(message.from || message.sender || 'Unknown') }">
                  <span class="text-white text-xl font-bold">
                    {{ (message.from || message.sender || 'Unknown').charAt(0).toUpperCase() }}
                  </span>
                </div>

                <div>
                  <h1 class="text-white text-xl font-bold">
                    {{ message.from || message.sender || 'Unknown Sender' }}
                  </h1>
                  <div class="text-gray-400 text-sm">
                    {{ formatMessageDate(message.date || message.timestamp) }}
                  </div>
                </div>
              </div>

              <!-- Message ID -->
              <div class="bg-gray-900 px-3 py-1 rounded-full text-xs text-gray-400">
                ID: {{ route.params.id }}
              </div>
            </div>
          </div>

          <!-- The original message (if this is a reply) -->
          <div v-if="isReply" class="border-b border-gray-700">
            <div class="px-6 pt-4">
              <h2 class="text-gray-400 text-xs uppercase tracking-wider mb-2">In Reply To</h2>
            </div>

            <!-- Loading state for replied-to message -->
            <div v-if="isReplyToMessageLoading" class="px-6 pb-4 flex items-center space-x-2 text-gray-400 text-sm">
              <div class="animate-spin w-4 h-4">
                <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                  </path>
                </svg>
              </div>
              <span>Loading original message...</span>
            </div>

            <!-- Original message details -->
            <div v-else-if="replyToMessage" class="px-6 pb-4">
              <div class="bg-gray-750 rounded-lg p-4 border-l-2 border-blue-500">
                <div class="flex items-start space-x-3">
                  <!-- Sender avatar -->
                  <div class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    :style="{ backgroundColor: getSenderColor(replyToMessage.from || replyToMessage.sender || 'Unknown') }">
                    <span class="text-white text-sm font-bold">
                      {{ (replyToMessage.from || replyToMessage.sender || 'Unknown').charAt(0).toUpperCase() }}
                    </span>
                  </div>

                  <div class="flex-1">
                    <!-- Sender and timestamp -->
                    <div class="flex justify-between items-baseline mb-1">
                      <div class="text-white font-medium text-sm">
                        {{ replyToMessage.from || replyToMessage.sender || 'Unknown Sender' }}
                      </div>
                      <div class="text-gray-500 text-xs">
                        {{ formatMessageDate(replyToMessage.date || replyToMessage.timestamp) }}
                      </div>
                    </div>

                    <!-- Message content -->
                    <div class="text-gray-300 text-sm">
                      {{ replyToMessage.message || replyToMessage.text || replyToMessage.content || 'No content' }}
                    </div>

                    <!-- Link to view the original message -->
                    <div class="mt-2 text-right">
                      <NuxtLink :to="`/messages/${replyToMessage.id}`"
                        class="text-blue-400 text-xs hover:text-blue-300 transition-colors">
                        View Original Message →
                      </NuxtLink>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Message not found state -->
            <div v-else class="px-6 pb-4">
              <div class="bg-gray-750 rounded-lg p-4 border-l-2 border-gray-600">
                <p class="text-gray-400 text-sm italic">Original message not found</p>
              </div>
            </div>
          </div>

          <!-- Message content -->
          <div class="p-6">
            <!-- Content section -->
            <div class="mb-8">
              <h2 class="text-gray-400 text-xs uppercase tracking-wider mb-3">Message Content</h2>

              <div v-if="message.message || message.text"
                class="text-white text-xl leading-relaxed whitespace-pre-wrap">
                <!-- For URL messages -->
                <template v-if="isUrl(message.message || message.text)">
                  <a :href="message.message || message.text" target="_blank" rel="noopener noreferrer"
                    class="text-blue-400 hover:text-blue-300 underline break-all">
                    {{ message.message || message.text }}
                  </a>
                </template>

                <!-- For regular messages with reply -->
                <template v-else-if="isReply">
                  <div class="mb-2">
                    <span class="text-blue-400 font-medium text-base">{{ contentParts.prefix }}</span>
                  </div>
                  <div>{{ contentParts.main }}</div>
                </template>

                <!-- For regular messages without reply -->
                <template v-else>
                  {{ message.message || message.text || message.content }}
                </template>
              </div>
              <div v-else class="text-gray-500 italic">No content in this message</div>
            </div>

            <!-- Media info section (if any) -->
            <div v-if="message.media_filename || message.media_note" class="mb-8 border-l-4 border-blue-500 pl-4">
              <h2 class="text-gray-400 text-xs uppercase tracking-wider mb-3">Media Information</h2>

              <div v-if="message.media_filename" class="mb-2">
                <div class="text-gray-400 text-sm mb-1">Filename</div>
                <div class="text-white">{{ message.media_filename }}</div>
              </div>

              <div v-if="message.media_note">
                <div class="text-gray-400 text-sm mb-1">Note</div>
                <div class="text-white">{{ message.media_note }}</div>
              </div>
            </div>

            <!-- Metadata section -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <!-- Chat Information -->
              <div class="bg-gray-900 p-4 rounded-lg">
                <h2 class="text-gray-400 text-xs uppercase tracking-wider mb-2">Chat Information</h2>
                <div v-if="message.chat_title || message.group_chat_id" class="text-white">
                  {{ message.chat_title || message.group_chat_id }}
                </div>
                <div v-else class="text-gray-500 italic">Unknown chat</div>
              </div>

              <!-- Message Type -->
              <div class="bg-gray-900 p-4 rounded-lg">
                <h2 class="text-gray-400 text-xs uppercase tracking-wider mb-2">Message Type</h2>
                <div class="text-white flex items-center">
                  <span class="w-3 h-3 rounded-full mr-2"
                    :style="{ backgroundColor: getTypeColor(message.type) }"></span>
                  {{ message.type || 'Text Message' }}
                </div>
              </div>
            </div>

            <!-- Raw Data (collapsible) -->
            <div>
              <button @click="showRawData = !showRawData"
                class="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors text-sm mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" :class="{ 'transform rotate-90': showRawData }"
                  viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clip-rule="evenodd" />
                </svg>
                <span>{{ showRawData ? 'Hide' : 'Show' }} Raw Message Data</span>
              </button>

              <div v-if="showRawData" class="bg-gray-900 p-4 rounded-lg overflow-auto max-h-96">
                <pre class="text-gray-300 text-xs"><code>{{ JSON.stringify(message, null, 2) }}</code></pre>
              </div>
            </div>
          </div>

          <!-- Footer with actions -->
          <div class="bg-gray-900 p-4 flex items-center justify-between">
            <div class="flex items-center space-x-4">
              <!-- Copy button -->
              <button @click="copyAsMarkdown"
                class="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" />
                  <path d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h8a2 2 0 00-2-2H5z" />
                </svg>
                <span>Copy as Markdown</span>
              </button>

              <!-- Share button -->
              <button @click="copyLink"
                class="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                </svg>
                <span>Share Link</span>
              </button>
            </div>

            <div>
              <NuxtLink to="/feed" class="text-blue-400 hover:text-blue-300 transition-colors">
                Back to Feed
              </NuxtLink>
            </div>
          </div>
        </div>

        <!-- Related messages from same sender -->
        <div v-if="relatedMessages.length > 0" class="mt-8">
          <h2 class="text-white text-lg font-bold mb-4">
            More messages from {{ message.from || message.sender || 'this sender' }}
          </h2>

          <div class="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
            <div class="divide-y divide-gray-700">
              <div v-for="(relatedMsg, index) in relatedMessages" :key="index"
                class="p-4 hover:bg-gray-700/50 transition-colors">
                <div class="text-gray-400 text-xs mb-1">
                  {{ formatMessageDate(relatedMsg.date || relatedMsg.timestamp) }}
                </div>
                <div class="text-white">
                  {{ relatedMsg.message || relatedMsg.text || relatedMsg.content || 'No content' }}
                </div>
                <div class="mt-1 flex justify-end">
                  <NuxtLink :to="`/messages/${relatedMsg.id}`"
                    class="text-blue-400 text-xs hover:text-blue-300 transition-colors">
                    View Message →
                  </NuxtLink>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Toast notification for copy success -->
      <div v-if="showCopyToast"
        class="fixed bottom-6 right-6 bg-green-600 text-white px-5 py-3 rounded-lg shadow-xl z-50 flex items-center space-x-3 text-sm border border-green-500"
        :class="{ 'animate-fade-in': showCopyToast }">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clip-rule="evenodd" />
        </svg>
        <div>
          <div class="font-medium">{{ copyToastTitle }}</div>
          <div class="text-xs text-green-200 mt-0.5">{{ copyToastMessage }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useParquetLoader } from '~/composables/useParquetLoader'
import { format } from 'date-fns'
import TopBar from '~/components/TopBar.vue'
import * as d3 from 'd3'

const route = useRoute()
const loading = ref(true)
const error = ref(null)
const message = ref({})
const relatedMessages = ref([])
const showRawData = ref(false)
const showCopyToast = ref(false)
const copyToastTitle = ref('')
const copyToastMessage = ref('')

// Add new ref for replied-to message
const replyToMessage = ref(null)
const isReplyToMessageLoading = ref(false)

// Load data
const { loadParquetFile } = useParquetLoader()

// Format the message date
function formatMessageDate(timestamp) {
  if (!timestamp) return 'Unknown time'
  try {
    return format(new Date(timestamp), 'MMMM d, yyyy h:mm:ss a')
  } catch (err) {
    console.error('Error formatting date:', err)
    return 'Invalid date'
  }
}

// Get sender color
function getSenderColor(senderName) {
  if (!senderName) return '#4299e1'

  // Simple hash function for consistent colors based on name
  let hash = 0
  for (let i = 0; i < senderName.length; i++) {
    hash = senderName.charCodeAt(i) + ((hash << 5) - hash)
  }

  // Use d3 color scale for an attractive color
  return d3.interpolateViridis(Math.abs(hash) % 1000 / 1000)
}

// Get message type color
function getTypeColor(type) {
  const typeColorMap = {
    'text': '#4299e1',
    'photo': '#48bb78',
    'video': '#ed8936',
    'audio': '#9f7aea',
    'document': '#f56565',
    'sticker': '#ecc94b'
  }

  return typeColorMap[type] || '#4299e1'
}

// Check if a string is a URL
function isUrl(str) {
  if (!str) return false
  try {
    // Simple regex to detect URLs
    const urlRegex = /^(https?:\/\/[^\s]+)$/i
    return urlRegex.test(str.trim())
  } catch (err) {
    return false
  }
}

// NEW: Extract reply message ID from content
function extractReplyMessageId(content) {
  if (!content) return null

  // Look for patterns like "In reply to message13437:" or similar variations
  const replyPattern = /in reply to message(\d+):/i
  const match = content.match(replyPattern)

  if (match && match[1]) {
    return match[1] // Return just the message ID number
  }

  return null
}

// NEW: Process message content to highlight the reply reference
function processMessageContent(content) {
  if (!content) return content

  // Replace the "In reply to messageXXX:" text with styled version if it's a reply
  const replyPattern = /(in reply to message\d+:)/i
  if (replyPattern.test(content)) {
    // We're not doing the replacement here - we'll use a computed property
    // in the template to split and style the content
    return content
  }

  return content
}

// NEW: Computed property to check if message is a reply
const isReply = computed(() => {
  const content = message.value.message || message.value.text || message.value.content
  return content && /in reply to message\d+:/i.test(content)
})

// NEW: Computed property to get styled content parts
const contentParts = computed(() => {
  const content = message.value.message || message.value.text || message.value.content
  if (!content) return { prefix: '', main: '' }

  const replyPattern = /(in reply to message\d+:)/i
  const parts = content.split(replyPattern)

  if (parts.length > 1) {
    return {
      prefix: parts[1], // The "In reply to messageXXX:" part
      main: parts.slice(2).join('') // The rest of the message
    }
  }

  return { prefix: '', main: content }
})

// Copy message as markdown
function copyAsMarkdown() {
  const sender = message.value.from || message.value.sender || 'Unknown'
  const timestamp = formatMessageDate(message.value.date || message.value.timestamp)
  const content = message.value.message || message.value.text || message.value.content
  const chatName = message.value.chat_title || message.value.group_chat_id
  const messageType = message.value.type
  const mediaFilename = message.value.media_filename
  const mediaNotes = message.value.media_note

  // Create a well-formatted markdown version
  let markdown = `## Message from ${sender}\n\n`
  markdown += `**Date:** ${timestamp}\n`

  if (chatName) {
    markdown += `**Chat:** ${chatName}\n`
  }

  if (messageType) {
    markdown += `**Type:** ${messageType}\n`
  }

  markdown += "\n"

  // Add content
  if (content) {
    markdown += `${content}\n\n`
  }

  // Add media info if available
  if (mediaFilename || mediaNotes) {
    markdown += "### Media Information\n"

    if (mediaFilename) {
      markdown += `- **File:** ${mediaFilename}\n`
    }

    if (mediaNotes) {
      markdown += `- **Notes:** ${mediaNotes}\n`
    }
  }

  // Add replied-to message if available
  if (replyToMessage.value) {
    markdown += "\n### In Reply To\n"
    markdown += `**From:** ${replyToMessage.value.from || replyToMessage.value.sender || 'Unknown'}\n`
    markdown += `**Date:** ${formatMessageDate(replyToMessage.value.date || replyToMessage.value.timestamp)}\n`
    markdown += `**Content:** ${replyToMessage.value.message || replyToMessage.value.text || replyToMessage.value.content || 'No content'}\n`
  }

  // Add a source citation and link
  markdown += "\n---\n"
  markdown += `*Source: Paramilitary Leaks Database v${useRuntimeConfig().public.version}*\n`
  markdown += `*Link: ${window.location.href}*\n`

  // Copy to clipboard
  navigator.clipboard.writeText(markdown)
    .then(() => {
      copyToastTitle.value = 'Message copied as Markdown!'
      copyToastMessage.value = 'You can now paste it into any markdown editor'
      showCopyToast.value = true

      // Hide toast after a delay
      setTimeout(() => {
        showCopyToast.value = false
      }, 2000)
    })
    .catch(err => {
      console.error('Failed to copy markdown:', err)
      error.value = 'Failed to copy message. Please try again.'
    })
}

// Copy link to clipboard
function copyLink() {
  const url = window.location.href

  navigator.clipboard.writeText(url)
    .then(() => {
      copyToastTitle.value = 'Link copied to clipboard!'
      copyToastMessage.value = 'You can now share this message'
      showCopyToast.value = true

      // Hide toast after a delay
      setTimeout(() => {
        showCopyToast.value = false
      }, 2000)
    })
    .catch(err => {
      console.error('Failed to copy link:', err)
      error.value = 'Failed to copy link. Please try again.'
    })
}

// NEW: Function to find and load the replied-to message
async function loadReplyToMessage(replyToId) {
  if (!replyToId) return

  try {
    console.log(`Looking for replied-to message with ID: ${replyToId}`)
    isReplyToMessageLoading.value = true

    // First try to find it in the already loaded messages
    const foundMessage = relatedMessages.value.find(msg =>
      msg.id && msg.id.toString() === replyToId.toString()
    )

    if (foundMessage) {
      replyToMessage.value = foundMessage
      console.log('Found replied-to message in related messages')
      isReplyToMessageLoading.value = false
      return
    }

    // Not found in related, check in all messages
    const result = await loadParquetFile()
    if (!result.success) {
      throw new Error('Failed to load messages for reply lookup')
    }

    const targetMessage = result.data.find(msg =>
      msg.id && msg.id.toString() === replyToId.toString()
    )

    if (targetMessage) {
      replyToMessage.value = targetMessage
      console.log('Found replied-to message in all messages')
    } else {
      console.log(`Could not find message with ID: ${replyToId}`)
    }

    isReplyToMessageLoading.value = false
  } catch (err) {
    console.error('Error loading replied-to message:', err)
    isReplyToMessageLoading.value = false
  }
}

// Load the message data
onMounted(async () => {
  try {
    const messageId = route.params.id
    console.log(`Loading message data for ID: ${messageId}`)

    if (!messageId) {
      throw new Error('No message ID provided')
    }

    // Load all messages (we'll filter for the one we want)
    const result = await loadParquetFile()

    if (!result.success) {
      throw new Error(result.error || 'Failed to load message data')
    }

    console.log(`Loaded ${result.data.length} messages, searching for ID: ${messageId}`)

    // Find the message with the matching ID
    const targetMessage = result.data.find(msg => msg.id && msg.id.toString() === messageId.toString())

    if (!targetMessage) {
      throw new Error(`Message with ID ${messageId} not found`)
    }

    message.value = targetMessage
    console.log('Found message:', targetMessage)

    // Find related messages from the same sender (up to 5)
    const sender = targetMessage.from || targetMessage.sender
    if (sender) {
      relatedMessages.value = result.data
        .filter(msg => (msg.from === sender || msg.sender === sender) &&
          (msg.id !== targetMessage.id))
        .slice(0, 5)

      console.log(`Found ${relatedMessages.value.length} related messages from ${sender}`)
    }

    // NEW: Check if this is a reply to another message
    const content = targetMessage.message || targetMessage.text || targetMessage.content
    const replyToId = extractReplyMessageId(content)

    if (replyToId) {
      console.log(`This message is a reply to message ID: ${replyToId}`)
      await loadReplyToMessage(replyToId)
    }

    loading.value = false
  } catch (err) {
    console.error('Error loading message:', err)
    error.value = err.message
    loading.value = false
  }
})
</script>

<style scoped>
/* Toast notification animation */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fadeIn 0.3s ease-out forwards;
}

/* Add a darker gray for the replied-to message background */
.bg-gray-750 {
  background-color: rgba(31, 41, 55, 0.8);
}
</style>