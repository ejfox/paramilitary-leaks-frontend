<template>
  <div class="min-h-screen bg-gray-950 text-white overflow-hidden">
    <!-- Fixed navigation -->
    <div class="fixed top-0 left-0 right-0 z-50 bg-gray-950/80 backdrop-blur-lg">
      <div class="container mx-auto px-4 py-3 flex justify-between items-center">
        <NuxtLink to="/" class="text-white hover:text-blue-400 transition-colors">
          <div class="flex items-center space-x-2">
            <span class="text-xl font-semibold">{{ source.title }}</span>
          </div>
        </NuxtLink>
        <div class="flex items-center space-x-6 text-sm">
          <NuxtLink to="/feed" class="text-gray-300 hover:text-white transition-colors">Feed</NuxtLink>
          <NuxtLink to="/files" class="text-gray-300 hover:text-white transition-colors">Files</NuxtLink>
          <NuxtLink to="/senders" class="text-gray-300 hover:text-white transition-colors">Senders</NuxtLink>
          <NuxtLink to="/metadata" class="text-gray-300 hover:text-white transition-colors">Metadata</NuxtLink>
          <NuxtLink to="/narrative" class="text-blue-400 hover:text-blue-300 transition-colors font-medium">
            Narrative
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Hero section with parallax -->
    <HeroSection :scrollY="scrollY" ref="heroSection" class="z-40" />

    <!-- Video section -->
    <VideoSection ref="videoSection" :scrollY="scrollY" :dateRange="dateRange" :loading="loading"
      :visualizationStreaming="visualizationStreaming" :streamingProgress="streamingProgress" @video-ended="videoEnded"
      @cancel-streaming-points="cancelStreamingPoints" @update-video-progress="videoProgress = $event" />

    <!-- Stats section -->
    <StatsSection ref="statsSection" :rawData="rawData" :messagesBySender="messagesBySender" :allSenders="allSenders"
      :totalFileSize="totalFileSize" @update:top-days="handleTopDaysUpdate" />

    <!-- Story section -->
    <section ref="storyContainer" class="relative w-full bg-gray-950">
      <!-- Story content -->
      <div class="relative z-10">
        <StorySection ref="storySection" />
      </div>

      <!-- Visualization integrated directly in the narrative flow -->
      <div class="container mx-auto py-20">
        <h2 class="text-4xl font-bold mb-8 text-white text-center">Visualizing the Network</h2>
        <p class="text-xl text-gray-300 max-w-3xl mx-auto mb-10 text-center">
          A visual representation of the communication patterns within the paramilitary groups
        </p>
        <div class="bg-gray-900 p-6 rounded-lg shadow-lg mx-auto max-w-5xl">
          <NarrativeScatterplot v-if="rawData.length > 0" :data="visibleDataPoints" :getSenderFn="getMessageSender"
            :zoomLevel="1.2" :height="500" class="w-full" />
          <div class="mt-4 text-sm text-gray-400 text-center">
            Each point represents a message sender in the network. The visualization shows common communication
            patterns.
          </div>
        </div>
      </div>
    </section>

    <!-- Footer section with call to action -->
    <section class="bg-black py-20 relative z-10">
      <div class="container mx-auto px-4 text-center">
        <h2 class="text-4xl font-bold mb-8 text-white">Understanding the Paramilitary Leaks</h2>
        <div class="text-xl text-gray-300 max-w-3xl mx-auto mb-10 space-y-6">
          <p>
            According to <a href="https://ddosecrets.com/article/paramilitary-leaks"
              class="text-blue-400 hover:underline" target="_blank" rel="noopener">Distributed Denial of Secrets</a>:
            "Over 200 gigabytes of chat logs and recordings from paramilitary groups and militias including American
            Patriots Three Percent (APIII) and the Oath Keepers, collected by wilderness survival guide John Williams.
            The data identifies members and the organizational structure of the groups."
          </p>
          <p>
            After Trump supporters stormed the U.S. Capitol on January 6, 2021, Williams began infiltrating U.S.
            paramilitary groups. He eventually led the Utah chapter and gained access to the upper echelon of APIII and
            their discussions. This release includes more than 50,000 files from Williams' work.
          </p>
          <p>
            As journalist Micah Lee discovered: "While digging through the Paramilitary Leaks dataset, I came across
            American Community Outreach Network (ACON), a now-defunct front group that American Patriots Three Percent
            used to accept donations. In leaked internal militia chats, video, and voice messages, AP III militia
            leaders repeatedly claimed that ACON was a 501c3 tax-exempt non-profit organization. This was a lie."
          </p>
        </div>
        <div class="flex flex-col md:flex-row justify-center gap-4">
          <NuxtLink to="/feed"
            class="inline-block px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-lg font-medium shadow-lg hover:shadow-xl">
            Explore The Messages
          </NuxtLink>
          <a href="https://micahflee.com/exploring-the-paramilitary-leaks/" target="_blank" rel="noopener"
            class="inline-block px-8 py-4 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors text-lg font-medium shadow-lg hover:shadow-xl">
            Read Micah Lee's Analysis
          </a>
          <a href="https://ddosecrets.com/article/paramilitary-leaks" target="_blank" rel="noopener"
            class="inline-block px-8 py-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-lg font-medium shadow-lg hover:shadow-xl">
            View on DDoSecrets
          </a>
        </div>
      </div>
    </section>

    <!-- Articles section -->
    <section class="bg-gray-950 py-20 relative z-10">
      <div class="container mx-auto px-4">
        <h2 class="text-4xl font-bold mb-12 text-white text-center">Further Reading</h2>

        <!-- Micah Lee's Series -->
        <div class="mb-16">
          <h3 class="text-2xl font-bold mb-6 text-blue-400">Micah Lee's Investigation Series</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <a href="https://micahflee.com/exploring-the-paramilitary-leaks/" target="_blank" rel="noopener"
              class="bg-gray-900 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div class="p-6">
                <h4 class="text-xl font-bold text-white mb-3">Exploring the Paramilitary Leaks</h4>
                <p class="text-gray-300 mb-4">An introduction to the massive dataset and how to get started with
                  exploring it.</p>
                <div class="text-blue-400 text-sm font-medium">March 5, 2025</div>
              </div>
            </a>
            <a href="https://micahflee.com/step-by-step-guide-to-reading-the-leaked-militia-chats-yourself/"
              target="_blank" rel="noopener"
              class="bg-gray-900 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div class="p-6">
                <h4 class="text-xl font-bold text-white mb-3">Step-by-step Guide to Reading the Leaked Militia Chats
                </h4>
                <p class="text-gray-300 mb-4">Technical guide showing how to parse and analyze the Telegram chats in the
                  dataset.</p>
                <div class="text-blue-400 text-sm font-medium">March 12, 2025</div>
              </div>
            </a>
            <a href="https://micahflee.com/the-ap-iii-militias-fraudulent-charity-front-group/" target="_blank"
              rel="noopener"
              class="bg-gray-900 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div class="p-6">
                <h4 class="text-xl font-bold text-white mb-3">The AP III Militia's Fraudulent Charity Front Group</h4>
                <p class="text-gray-300 mb-4">Investigation into ACON, a fake 501c3 charity used by the militia to
                  solicit donations.</p>
                <div class="text-blue-400 text-sm font-medium">March 21, 2025</div>
              </div>
            </a>
          </div>
        </div>

        <!-- ProPublica Investigations -->
        <div class="mb-16">
          <h3 class="text-2xl font-bold mb-6 text-blue-400">ProPublica Investigations</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <a href="https://www.propublica.org/article/john-williams-infiltrated-militia-movement-american-patriots-three-percent"
              target="_blank" rel="noopener"
              class="bg-gray-900 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div class="p-6">
                <h4 class="text-xl font-bold text-white mb-3">The Militia and the Mole</h4>
                <p class="text-gray-300 mb-4">The story of John Williams, who spent years infiltrating the American
                  militia movement.</p>
                <div class="text-blue-400 text-sm font-medium">ProPublica</div>
              </div>
            </a>
            <a href="https://www.propublica.org/article/militia-three-percenter-january-6" target="_blank"
              rel="noopener"
              class="bg-gray-900 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div class="p-6">
                <h4 class="text-xl font-bold text-white mb-3">Armed and Underground</h4>
                <p class="text-gray-300 mb-4">Inside the turbulent, secret world of an American militia.</p>
                <div class="text-blue-400 text-sm font-medium">ProPublica</div>
              </div>
            </a>
          </div>
        </div>

        <!-- Additional Coverage -->
        <div>
          <h3 class="text-2xl font-bold mb-6 text-blue-400">Additional Coverage</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <a href="https://www.theguardian.com/us-news/2022/oct/07/key-oath-keepers-leader-revealed-as-former-las-vegas-police-detective"
              target="_blank" rel="noopener"
              class="bg-gray-900 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div class="p-6">
                <h4 class="text-xl font-bold text-white mb-3">Key Oath Keepers Leader Revealed</h4>
                <p class="text-gray-300 mb-4">Former Las Vegas police detective identified as Oath Keepers leader.</p>
                <div class="text-blue-400 text-sm font-medium">The Guardian</div>
              </div>
            </a>
            <a href="https://augustafreepress.com/news/i-played-an-unwitting-important-role-in-propublicas-the-militia-and-the-mole/"
              target="_blank" rel="noopener"
              class="bg-gray-900 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div class="p-6">
                <h4 class="text-xl font-bold text-white mb-3">Unwitting Role in 'The Militia and the Mole'</h4>
                <p class="text-gray-300 mb-4">A journalist's account of their unexpected connection to the
                  investigation.</p>
                <div class="text-blue-400 text-sm font-medium">Augusta Free Press</div>
              </div>
            </a>
            <a href="https://www.sltrib.com/news/politics/2022/09/07/iron-county-gop-leader-oath/" target="_blank"
              rel="noopener"
              class="bg-gray-900 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div class="p-6">
                <h4 class="text-xl font-bold text-white mb-3">Iron County GOP Leader on Oath Keepers List</h4>
                <p class="text-gray-300 mb-4">Investigation into political figures connected to extremist groups.</p>
                <div class="text-blue-400 text-sm font-medium">Salt Lake Tribune</div>
              </div>
            </a>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick, reactive } from 'vue'
import { useParquetLoader } from '~/composables/useParquetLoader'
import { useRuntimeConfig } from '#app'
import { format, differenceInDays } from 'date-fns'
import { useNarrativeScrolling } from '~/composables/useNarrativeScrolling'
import { useVisualization } from '~/composables/useVisualization'
import { useColorMap } from '~/composables/useColorMap'
import * as d3 from 'd3'

// Import components
import HeroSection from '~/components/narrative/HeroSection.vue'
import VideoSection from '~/components/narrative/VideoSection.vue'
import StatsSection from '~/components/narrative/StatsSection.vue'
import StorySection from '~/components/narrative/StorySection.vue'
import NarrativeScatterplot from '~/components/narrative/NarrativeScatterplot.vue'

// State variables - define ALL refs at the top of the component
const loading = ref(true)
const error = ref(null)
const topSenders = ref([])
const messagesBySender = ref([])
const messageCount = ref(141157)
const senderCount = ref(1108)
const earliestDate = ref(new Date('2020-11-19'))
const latestDate = ref(new Date('2024-12-27'))
const totalFiles = ref(52161)
const totalFileSize = ref('198.62 GB')
const showDebug = ref(false)
const videoProgress = ref(0)
const videoPlaying = ref(true)
const shouldBeFixed = ref(false)
const scrollHandler = ref(null)
const rawData = ref([])
const filteredData = ref([])
const visualizationStreaming = ref(false)
const streamingProgress = reactive({
  processed: 0,
  total: 0,
  startTime: 0,
  message: ''
})
const storyScrollProgress = ref(0) // Track scroll progress for story section
const visualizationZoomLevel = ref(0) // Track zoom level for the scatterplot

// Component refs
const heroSection = ref(null)
const videoSection = ref(null)
const statsSection = ref(null)
const storyContainer = ref(null)
const storySection = ref(null)

// Calculated date range in days
const dateRange = computed(() => {
  return differenceInDays(latestDate.value, earliestDate.value) + 1 // Add 1 to include the start day
})

// Use the narrative scrolling composable
const {
  scrollY,
  activeSection,
  sectionStates,
  setupSectionObservers
} = useNarrativeScrolling()

// Compute the active navigation section based on activeSection
const activeNavSection = computed(() => {
  if (scrollY.value < 100) return 0
  return activeSection.value
})

// Navigation sections configuration
const navSections = [
  { title: 'The Beginning', ref: heroSection },
  { title: 'Inside the Network', ref: videoSection },
  { title: 'The Archive', ref: statsSection },
  { title: 'The Investigation', ref: storySection },
  { title: 'The Legacy', ref: null }
]

// Logic for animated scatterplot - controls how many data points are visible based on scroll
const visibleDataPoints = computed(() => {
  if (!rawData.value || rawData.value.length === 0) return [];

  // Calculate how many points to show based on scroll progress
  const maxPoints = Math.min(5000, rawData.value.length); // Limit to 5000 points max for performance

  // Show 40% of points right away, then add more as scrolling progresses
  let pointsToShow = Math.round(maxPoints * 0.4); // Start with 40% minimum

  // Add the remaining 60% gradually during scroll
  if (storyScrollProgress.value > 0) {
    const additionalPoints = Math.round(storyScrollProgress.value * (maxPoints * 0.6));
    pointsToShow += additionalPoints;
  }

  // Cap at maxPoints
  pointsToShow = Math.min(pointsToShow, maxPoints);

  // Return a slice of the data based on scroll progress
  return rawData.value.slice(0, pointsToShow);
});

// Computed property for visualization zoom level based on scroll progress
const computeZoomLevel = (progress) => {
  // Start at considerable zoom immediately when section becomes visible
  if (progress === 0) return 0;

  // Jump to 50% zoom as soon as ANY scroll happens
  if (progress < 0.1) return 0.5;

  // Reach max zoom by 30% scroll for dramatic effect
  const normalizedProgress = Math.min(1, (progress - 0.1) / 0.2);

  // Start at 0.5 and go to 1.0
  return 0.5 + (normalizedProgress * 0.5);
};

// Handle section change from nav component
function handleSectionChange(sectionRef) {
  // Logic for any additional actions when manually changing sections
  if (sectionRef && sectionRef.value) {
    sectionRef.value.scrollIntoView({ behavior: 'smooth' })
  }
}

// Get source info from config
const config = useRuntimeConfig()
const source = computed(() => {
  return {
    title: config.public.SOURCE_TITLE || 'Paramilitary Leaks',
    slug: config.public.SOURCE_SLUG || 'paramilitary-leaks',
    year: config.public.SOURCE_YEAR || '2023',
    type: config.public.SOURCE_TYPE || 'Documents',
    size: parseInt(config.public.SOURCE_SIZE || '0')
  }
})

// Visualization methods from composable
const {
  initScatterplot,
  transformData,
  cancelStreamingPoints,
  streamingStatus
} = useVisualization()

const { loadParquetFile, resetDuckDB } = useParquetLoader()
const colorMap = useColorMap()

// Computed property for allSenders
const allSenders = computed(() => {
  if (!rawData.value || !rawData.value.length) return []

  const senderCounts = {}
  rawData.value.forEach(msg => {
    const sender = getMessageSender(msg)
    senderCounts[sender] = (senderCounts[sender] || 0) + 1
  })

  return Object.entries(senderCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10) // Limit to top 10 senders for performance
})

// Handle top days update
function handleTopDaysUpdate(days) {
  topMessageDays.value = days
}

// Video ended event
const videoEnded = () => {
  videoPlaying.value = false
}

// Load data function
async function loadDataAndVisualization() {
  try {
    console.log('Loading parquet data...')
    loading.value = true

    // Load data
    const result = await loadParquetFile()
    if (!result || !result.success) {
      throw new Error('Failed to load data')
    }

    // Store the raw data
    console.log(`Successfully loaded ${result.data.length} rows of data.`)
    rawData.value = result.data

    // Shuffle data slightly to create more visual diversity
    rawData.value = shuffleArray(result.data.slice(0, 10000))

    // Set filtered data as backup
    filteredData.value = rawData.value

    // Process data for the StreamGraph component
    messagesBySender.value = processDataForStreamgraph(result.data)

    // Update stats
    if (!messageCount.value) {
      messageCount.value = result.data.length
    }
    if (!senderCount.value) {
      const uniqueSenders = new Set(result.data.map(msg => getMessageSender(msg)))
      senderCount.value = uniqueSenders.size
    }

    // Initialize color map
    colorMap.initialize(result.data, getMessageSender)

    // Initialize visualizations after data is loaded
    nextTick(async () => {
      // Initialize video section visualizations if component is ready
      if (videoSection.value && videoSection.value.initializeVisualizations) {
        await videoSection.value.initializeVisualizations(result.data)
      }

      loading.value = false

      // Set up watcher for streaming status
      watch(() => streamingStatus.active, (isActive) => {
        visualizationStreaming.value = isActive
        if (isActive) {
          streamingProgress.processed = streamingStatus.processed
          streamingProgress.total = streamingStatus.total
          streamingProgress.startTime = streamingStatus.startTime
          streamingProgress.message = streamingStatus.message
        }
      }, { immediate: true })

      // Set up watcher for progress updates
      watch(() => streamingStatus.processed, (processed) => {
        streamingProgress.processed = processed
      })
    })
  } catch (err) {
    console.error('Error in data/visualization loading:', err)
    error.value = err.message
    loading.value = false
  }
}

// Process data for the StreamGraph
function processDataForStreamgraph(data) {
  if (!data || !data.length) return []

  // First, determine the time intervals (use weeks instead of months for more detail)
  const timestamps = data.map(d => new Date(getMessageTimestamp(d)))
  const timeExtent = d3.extent(timestamps)

  // Create an array of week intervals for more granular visualization
  const weeks = []
  let currentDate = new Date(timeExtent[0])
  currentDate.setDate(currentDate.getDate() - currentDate.getDay()) // Start at the beginning of the week

  while (currentDate <= timeExtent[1]) {
    weeks.push(new Date(currentDate))
    currentDate.setDate(currentDate.getDate() + 7) // Move to next week
  }

  // Get all senders (limited to top senders)
  const senderCounts = {}
  data.forEach(msg => {
    const sender = getMessageSender(msg)
    senderCounts[sender] = (senderCounts[sender] || 0) + 1
  })

  // Sort by count and get top senders
  const topSenderNames = Object.entries(senderCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10) // Limit to top 10 for performance
    .map(([name]) => name)

  // Group messages by week and sender
  const nestedData = d3.groups(data,
    d => d3.timeFormat('%Y-%U')(new Date(getMessageTimestamp(d))), // Use ISO week format
    d => getMessageSender(d)
  )

  // Convert to the format needed for the streamgraph
  const streamData = []

  // For each week
  weeks.forEach(week => {
    const weekKey = d3.timeFormat('%Y-%U')(week)
    const weekData = { date: week }

    // Initialize all senders to 0
    topSenderNames.forEach(sender => {
      weekData[sender] = 0
    })

    // Fill in actual values
    const weekGroup = nestedData.find(([key]) => key === weekKey)
    if (weekGroup) {
      weekGroup[1].forEach(([sender, messages]) => {
        if (topSenderNames.includes(sender)) {
          weekData[sender] = messages.length
        }
      })
    }

    streamData.push(weekData)
  })

  return streamData
}

// Helper function to get message sender
function getMessageSender(message) {
  if (!message) return 'Unknown';
  return message.from || message.sender || message.sender_name || 'Unknown';
}

// Helper function to get message timestamp
function getMessageTimestamp(message) {
  // Handle different data formats
  const timestamp = message.date || message.timestamp;

  if (!timestamp) {
    return null;
  }

  // If it's already a Date object, return it
  if (timestamp instanceof Date) {
    return timestamp;
  }

  // If it's a string, handle various formats
  if (typeof timestamp === 'string') {
    // If it looks like an ISO date string (YYYY-MM-DD...)
    if (timestamp.length >= 10 && timestamp.includes('-')) {
      // Take just the date part if it has time
      const dateStr = timestamp.substring(0, 10);
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        date.setHours(0, 0, 0, 0);
        return date;
      }
    }

    // Try parsing as regular date
    const date = new Date(timestamp);
    if (!isNaN(date.getTime())) {
      date.setHours(0, 0, 0, 0);
      return date;
    }
  }

  // If it's a number (unix timestamp), convert to milliseconds if needed
  if (typeof timestamp === 'number') {
    const msTimestamp = timestamp < 10000000000 ? timestamp * 1000 : timestamp;
    const date = new Date(msTimestamp);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  return null;
}

// Store variables needed for top message days component
const topMessageDays = ref([])

// Helper function to shuffle array for better visualization 
function shuffleArray(array) {
  // Only shuffle a copy of the array to avoid mutating the original
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// Update scroll progress for animations
function updateScrollProgress() {
  // Calculate specific scroll progress for story section
  if (storyContainer.value) {
    const rect = storyContainer.value.getBoundingClientRect();
    const windowHeight = window.innerHeight;

    // Start when the section enters view, finish when it's at 40% through (much quicker)
    const start = windowHeight;
    const end = -windowHeight * 0.4;

    // Calculate progress from 0 to 1
    let progress = 0;
    if (rect.top <= start) {
      progress = Math.min(1, Math.max(0, (start - rect.top) / (start - end)));
    }

    storyScrollProgress.value = progress;

    // Update zoom level based on scroll progress
    visualizationZoomLevel.value = computeZoomLevel(progress);

    // Only show the scatterplot when we're actually in the story section
    if (window.scrollY < window.innerHeight * 0.8) {
      // If we're still in the hero section viewport, force progress to 0
      storyScrollProgress.value = 0;
      visualizationZoomLevel.value = 0;
    }
  }
}

// Update onMounted hook for better sequencing
onMounted(() => {
  // Create cleanup function
  const cleanup = () => {
    // Clean up event listeners
    window.removeEventListener('scroll', scrollHandler.value)
    window.removeEventListener('resize', handleResize)

    // Cancel any animation frames
    cancelStreamingPoints()
  }

  // Register cleanup first, before any async operations
  onBeforeUnmount(() => {
    cleanup()
  })

  // Handle event setup and initialization
  nextTick(async () => {
    // Load data and then initialize visualizations
    await loadDataAndVisualization()

    // Set up scroll handler
    scrollHandler.value = () => {
      updateScrollProgress()
    }

    // Add event listeners
    window.addEventListener('scroll', scrollHandler.value, { passive: true })
    window.addEventListener('resize', handleResize, { passive: true })

    // Set up section observers for navigation
    setupSectionObservers([
      { name: 'section1', ref: heroSection },
      { name: 'section2', ref: videoSection },
      { name: 'section3', ref: statsSection },
      { name: 'section4', ref: storySection, threshold: 0.15 },
      { name: 'section4Footer', ref: storySection, threshold: 0.7 }
    ])
  })
})

// Add resize handler
function handleResize() {
  // Any global resize handling needed
}
</script>

<style>
/* Base styles for the narrative page */
body {
  overflow-x: hidden;
}

.prose {
  max-width: 100%;
}

.prose p {
  margin-bottom: 1.5em;
}

/* For smooth scrolling */
html {
  scroll-behavior: smooth;
}

/* Add subtle pulsing background effect to cards on hover */
.bg-gray-800\/50:hover {
  animation: subtlePulse 2s infinite;
}

@keyframes subtlePulse {
  0% {
    background-color: rgba(31, 41, 55, 0.5);
  }

  50% {
    background-color: rgba(31, 41, 55, 0.65);
  }

  100% {
    background-color: rgba(31, 41, 55, 0.5);
  }
}

/* Text shadow for better readability on video */
.text-shadow-lg {
  text-shadow: 0 0 8px rgba(0, 0, 0, 0.8), 0 0 30px rgba(0, 0, 0, 0.6);
}

.text-shadow-md {
  text-shadow: 0 0 4px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0, 0, 0, 0.6);
}

/* Animation styles - needed for all components */
@keyframes pulse {

  0%,
  100% {
    opacity: 0.8;
  }

  50% {
    opacity: 1;
  }
}

.pulse-animation {
  animation: pulse 2s infinite;
}

/* Improved transitions for scroll animations */
.transform {
  transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.6s cubic-bezier(0.22, 1, 0.36, 1);
}

/* Fade+slide animations with different directions */
.fade-up {
  opacity: 0;
  transform: translateY(40px);
  transition: opacity 0.8s ease, transform 0.8s cubic-bezier(0.13, 0.8, 0.4, 1);
}

.fade-up.visible {
  opacity: 1;
  transform: translateY(0);
}

.fade-left {
  opacity: 0;
  transform: translateX(40px);
  transition: opacity 0.8s ease, transform 0.8s cubic-bezier(0.13, 0.8, 0.4, 1);
}

.fade-left.visible {
  opacity: 1;
  transform: translateX(0);
}

.fade-right {
  opacity: 0;
  transform: translateX(-40px);
  transition: opacity 0.8s ease, transform 0.8s cubic-bezier(0.13, 0.8, 0.4, 1);
}

.fade-right.visible {
  opacity: 1;
  transform: translateX(0);
}

/* Scale animations */
.scale-up {
  opacity: 0;
  transform: scale(0.85);
  transition: opacity 0.8s ease, transform 0.8s cubic-bezier(0.13, 0.8, 0.4, 1);
}

.scale-up.visible {
  opacity: 1;
  transform: scale(1);
}

/* Staggered items animation */
.stagger-item {
  opacity: 0;
  transform: translateY(30px);
}

.stagger-item.visible {
  animation: staggerFadeIn 0.8s forwards;
}

@keyframes staggerFadeIn {
  0% {
    opacity: 0;
    transform: translateY(30px);
  }

  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Build-in animation for visualizations */
.build-in-left {
  transform: translateX(-100%);
  opacity: 0;
  transition: transform 1.2s cubic-bezier(0.19, 1, 0.22, 1),
    opacity 0.5s ease 0.3s;
}

.build-in-left.visible {
  transform: translateX(0);
  opacity: 1;
}

.build-in-right {
  transform: translateX(100%);
  opacity: 0;
  transition: transform 1.2s cubic-bezier(0.19, 1, 0.22, 1),
    opacity 0.5s ease 0.3s;
}

.build-in-right.visible {
  transform: translateX(0);
  opacity: 1;
}

/* Reveal text animation */
.reveal-text {
  position: relative;
  overflow: hidden;
}

.reveal-text::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #1f2937;
  transform: translateX(0);
  transition: transform 1.2s cubic-bezier(0.77, 0, 0.18, 1);
}

.reveal-text.visible::after {
  transform: translateX(100%);
}

/* Count-up animation class */
.count-animate {
  opacity: 0;
  transform: translateY(10px);
  transition: opacity 0.4s ease, transform 0.4s ease;
}

.count-animate.visible {
  opacity: 1;
  transform: translateY(0);
}

/* Sequenced line drawing animation for graphs */
.draw-path {
  stroke-dasharray: 1000;
  stroke-dashoffset: 1000;
  transition: stroke-dashoffset 2s ease-in-out;
}

.draw-path.visible {
  stroke-dashoffset: 0;
}

/* Sequence animation delay utility classes */
.delay-100 {
  transition-delay: 100ms;
}

.delay-200 {
  transition-delay: 200ms;
}

.delay-300 {
  transition-delay: 300ms;
}

.delay-400 {
  transition-delay: 400ms;
}

.delay-500 {
  transition-delay: 500ms;
}

.delay-600 {
  transition-delay: 600ms;
}

.delay-700 {
  transition-delay: 700ms;
}

.delay-800 {
  transition-delay: 800ms;
}

.delay-900 {
  transition-delay: 900ms;
}

.delay-1000 {
  transition-delay: 1000ms;
}
</style>