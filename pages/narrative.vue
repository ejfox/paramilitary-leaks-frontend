<template>
  <div class="min-h-screen bg-gray-950 text-white overflow-hidden">
    <!-- Scroll progress indicator - ultra simplified -->
    <div class="fixed top-0 left-0 w-full h-1.5 z-[100] bg-gray-800/40">
      <div class="bg-blue-500 h-full" :style="{ width: `${simpleScrollProgress}%` }"></div>
    </div>

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
    <StatsSection ref="statsSection" :stats="{
      messages: messageCount,
      members: senderCount,
      files: totalFiles,
      fileSize: totalFileSize
    }" :rawData="rawData" :messagesBySender="messagesBySender" :allSenders="allSenders"
      @update:top-days="handleTopDaysUpdate" :initial-render="statsInitialized" />

    <!-- Transitional buffer section to improve scrolling timing after video ends -->
    <section class="min-h-[50vh] bg-gradient-to-b from-black/90 to-black relative z-10">
      <div class="container mx-auto px-4 py-16">
        <div class="opacity-0 h-5 w-5"><!-- Spacer --></div>
      </div>
    </section>

    <!-- Source information section with fade-in effect -->
    <section class="bg-black py-40 relative z-10" ref="sourceInfoSection">
      <div class="container mx-auto px-4 opacity-0 transform translate-y-10"
        :class="{ 'opacity-100 translate-y-0 transition-all duration-1000 ease-out': sourceInfoVisible }">
        <div class="max-w-prose mx-auto">
          <h2 class="text-5xl font-bold mb-16 text-white tracking-tight">Exploring the Paramilitary Leaks</h2>
          <div class="text-xl leading-relaxed text-gray-300 space-y-12">
            <p class="text-2xl">
              Released by <a href="https://ddosecrets.com/article/paramilitary-leaks"
                class="text-blue-400 hover:underline" target="_blank" rel="noopener">Distributed Denial of
                Secrets</a>:
              "200 gigabytes of chat logs and recordings from paramilitary groups and militias including American
              Patriots Three Percent (APIII) and the Oath Keepers, collected by wilderness survival guide John
              Williams."
            </p>
          </div>
        </div>
        <div class="flex flex-col md:flex-row justify-center gap-6 mt-24">
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

    <!-- Additional spacer section to create better pacing - increased height and padding -->
    <section class="bg-gradient-to-b from-black to-gray-950 py-40 relative z-10">
      <div class="container mx-auto px-4">
        <div class="max-w-3xl mx-auto text-center min-h-[50vh]">
          <div class="border-t border-gray-800 pt-16 mt-8"></div>
          <div class="py-8">
            <p class="text-xl text-gray-400 italic leading-relaxed mb-8">
              "The militias' private communications reveal how these groups operate
              and coordinate behind closed doors."
            </p>
            <p class="text-lg text-gray-500 italic mt-16">
              Scroll down to explore the timeline of events
            </p>
          </div>
          <div class="border-b border-gray-800 pb-16 mb-16"></div>
          <!-- Added extra space to ensure smooth transition -->
          <div class="h-[20vh]"></div>
        </div>
      </div>
    </section>

    <!-- Scroll-Driven StreamGraph section - Updated min-height for better scrolling time -->
    <section ref="scrollGraphSection" class="bg-gray-950 relative z-10" style="min-height: 800vh;">
      <!-- Fixed top margin to prevent abrupt appearance - more subtle gradient -->
      <div class="h-40 bg-gradient-to-b from-gray-950/10 via-gray-950/80 to-gray-950"></div>

      <div class="container mx-auto px-4 pt-32 pb-28 text-center">
        <div id="streamGraphIntro"
          class="max-w-3xl mx-auto opacity-0 transform translate-y-10 transition-all duration-1000 ease-out">
          <h2 class="text-5xl font-bold mb-12 text-white tracking-tight leading-tight">Key Events Timeline</h2>
          <p class="text-2xl text-gray-300 mx-auto mb-20 leading-relaxed">
            Scroll to explore how communication patterns shifted around critical events
          </p>
          <div class="flex justify-center mb-8">
            <svg class="w-10 h-10 text-blue-500 animate-bounce" fill="none" stroke-linecap="round"
              stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
            </svg>
          </div>
        </div>
      </div>

      <!-- The scroll-driven stream graph component -->
      <ScrollStreamGraph :messagesBySender="messagesBySender" :topSenders="allSendersExtended"
        :scrollProgress="scrollGraphProgress" v-if="messagesBySender.length > 0" />

      <!-- Loading indicator -->
      <div v-else class="h-screen flex items-center justify-center">
        <div class="flex flex-col items-center space-y-4 text-gray-400">
          <svg class="animate-spin h-10 w-10 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none"
            viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
            </path>
          </svg>
          <div class="text-lg">Loading timeline visualization...</div>
          <div class="text-sm max-w-md text-center">Preparing data to visualize communication patterns across
            paramilitary groups</div>
        </div>
      </div>

      <div class="container mx-auto px-4 py-16">
        <div class="text-center text-gray-400 text-base max-w-2xl mx-auto italic">
          Notice how communication intensifies around events of national significance,
          revealing coordination patterns within these organizations.
        </div>
      </div>
    </section>

    <!-- Story section -->
    <section ref="storyContainer" class="relative w-full bg-gray-950">
      <!-- Story content -->
      <div class="relative z-10">
        <StorySection ref="storySection" />
      </div>

      <!-- Visualization integrated directly in the narrative flow -->
      <div class="container mx-auto py-28">
        <div class="max-w-4xl mx-auto">
          <h2 class="text-5xl font-bold mb-10 text-white text-center tracking-tight leading-tight">Communication
            Patterns Over Time</h2>
          <p class="text-2xl text-gray-300 max-w-2xl mx-auto mb-16 text-center leading-relaxed">
            The ebb and flow of messages within paramilitary groups reveals coordination patterns and key moments of
            heightened activity
          </p>
        </div>

        <!-- Main StreamGraph -->
        <div class="bg-gray-900 p-8 rounded-lg shadow-lg mx-auto mb-16">
          <h3 class="text-2xl font-bold mb-6 text-white tracking-tight">Overall Communication Activity</h3>
          <StreamGraph v-if="messagesBySender.length > 0" :messagesBySender="messagesBySender"
            :topSenders="allSendersExtended" class="w-full" style="min-height: 60vh" :default-layout="'fill'"
            @highlight-sender="handleSenderHighlight" @clear-highlight="handleClearHighlight" />
          <div v-else class="h-96 flex items-center justify-center">
            <div class="text-gray-400 flex flex-col items-center">
              <svg class="animate-spin mb-4 h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none"
                viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                </path>
              </svg>
              <span>Loading data visualization...</span>
            </div>
          </div>

          <!-- Note about deleted accounts -->
          <div class="mt-4 bg-blue-900/30 border border-blue-800/50 text-blue-100 p-3 rounded-md text-sm">
            <div class="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 flex-shrink-0 text-blue-300 mt-0.5"
                viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z"
                  clip-rule="evenodd" />
              </svg>
              <div>
                <span class="font-medium">Note:</span> "Deleted Account" and "Unknown" each appear as a single user in
                this visualization, but actually represent multiple different users combined into one stream.
              </div>
            </div>
          </div>

          <div class="mt-8 text-sm text-gray-400 text-center max-w-3xl mx-auto">
            This visualization shows communication patterns for the top 100 most active members of the paramilitary
            groups from May 2021 to May 2023, covering the period of highest activity.
          </div>
        </div>

        <!-- Explanation and Context -->
        <div class="bg-gray-900/50 p-8 rounded-lg shadow-lg max-w-2xl mx-auto">
          <h3 class="text-xl font-semibold mb-6 text-white tracking-tight">Understanding the Visualizations</h3>
          <div class="text-gray-300 space-y-6 text-base leading-relaxed">
            <p>
              These streamgraphs reveal communication patterns over time, with the thickness indicating message
              volume.
              Visible spikes often indicate planning coordination, events, or responses to external triggers.
            </p>
            <p>
              The most active communicators often coordinated militia activities, recruitment, and training.
              Notice how communication ebbs and flows, with periods of heightened activity around significant
              political
              events.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Articles section -->
    <section class="bg-gray-950 py-28 relative z-10">
      <div class="container mx-auto px-4">
        <div class="max-w-3xl mx-auto mb-20">
          <h2 class="text-5xl font-bold mb-16 text-white text-center tracking-tight leading-tight">Further Reading
          </h2>
        </div>

        <!-- Micah Lee's Series -->
        <div class="mb-24 max-w-7xl mx-auto">
          <h3 class="text-3xl font-bold mb-12 text-blue-400 tracking-tight">Micah Lee's Investigation Series</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-10">
            <a href="https://micahflee.com/exploring-the-paramilitary-leaks/" target="_blank" rel="noopener"
              class="bg-gray-900 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div class="p-8">
                <h4 class="text-2xl font-bold text-white mb-4 tracking-tight">Exploring the Paramilitary Leaks</h4>
                <p class="text-gray-300 mb-6 leading-relaxed">An introduction to the massive dataset and how to get
                  started with
                  exploring it.</p>
                <div class="text-blue-400 text-sm font-medium">March 5, 2025</div>
              </div>
            </a>
            <a href="https://micahflee.com/step-by-step-guide-to-reading-the-leaked-militia-chats-yourself/"
              target="_blank" rel="noopener"
              class="bg-gray-900 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div class="p-8">
                <h4 class="text-2xl font-bold text-white mb-4 tracking-tight">Step-by-step Guide to Reading the Leaked
                  Militia Chats
                </h4>
                <p class="text-gray-300 mb-6 leading-relaxed">Technical guide showing how to parse and analyze the
                  Telegram chats in the
                  dataset.</p>
                <div class="text-blue-400 text-sm font-medium">March 12, 2025</div>
              </div>
            </a>
            <a href="https://micahflee.com/the-ap-iii-militias-fraudulent-charity-front-group/" target="_blank"
              rel="noopener"
              class="bg-gray-900 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div class="p-8">
                <h4 class="text-2xl font-bold text-white mb-4 tracking-tight">The AP III Militia's Fraudulent Charity
                  Front Group</h4>
                <p class="text-gray-300 mb-6 leading-relaxed">Investigation into ACON, a fake 501c3 charity used by
                  the
                  militia to
                  solicit donations.</p>
                <div class="text-blue-400 text-sm font-medium">March 21, 2025</div>
              </div>
            </a>
          </div>
        </div>

        <!-- ProPublica Investigations -->
        <div class="mb-24 max-w-7xl mx-auto">
          <h3 class="text-3xl font-bold mb-12 text-blue-400 tracking-tight">ProPublica Investigations</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
            <a href="https://www.propublica.org/article/john-williams-infiltrated-militia-movement-american-patriots-three-percent"
              target="_blank" rel="noopener"
              class="bg-gray-900 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div class="p-8">
                <h4 class="text-2xl font-bold text-white mb-4 tracking-tight">The Militia and the Mole</h4>
                <p class="text-gray-300 mb-6 leading-relaxed">The story of John Williams, who spent years infiltrating
                  the American
                  militia movement.</p>
                <div class="text-blue-400 text-sm font-medium">ProPublica</div>
              </div>
            </a>
            <a href="https://www.propublica.org/article/inside-secret-ap3-militia-american-patriots-three-percent"
              target="_blank" rel="noopener"
              class="bg-gray-900 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div class="p-8">
                <h4 class="text-2xl font-bold text-white mb-4 tracking-tight">Armed and Underground</h4>
                <p class="text-gray-300 mb-6 leading-relaxed">Inside the turbulent, secret world of an American
                  militia.
                </p>
                <div class="text-blue-400 text-sm font-medium">ProPublica</div>
              </div>
            </a>
          </div>
        </div>

        <!-- Additional Coverage -->
        <div class="max-w-7xl mx-auto">
          <h3 class="text-3xl font-bold mb-12 text-blue-400 tracking-tight">Additional Coverage</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-10">
            <a href="https://www.theguardian.com/us-news/2022/oct/07/key-oath-keepers-leader-revealed-as-former-las-vegas-police-detective"
              target="_blank" rel="noopener"
              class="bg-gray-900 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div class="p-8">
                <h4 class="text-2xl font-bold text-white mb-4 tracking-tight">Key Oath Keepers Leader Revealed</h4>
                <p class="text-gray-300 mb-6 leading-relaxed">Former Las Vegas police detective identified as Oath
                  Keepers leader.</p>
                <div class="text-blue-400 text-sm font-medium">The Guardian</div>
              </div>
            </a>
            <a href="https://augustafreepress.com/news/i-played-an-unwitting-important-role-in-propublicas-the-militia-and-the-mole/"
              target="_blank" rel="noopener"
              class="bg-gray-900 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div class="p-8">
                <h4 class="text-2xl font-bold text-white mb-4 tracking-tight">Unwitting Role in 'The Militia and the
                  Mole'</h4>
                <p class="text-gray-300 mb-6 leading-relaxed">A journalist's account of their unexpected connection to
                  the
                  investigation.</p>
                <div class="text-blue-400 text-sm font-medium">Augusta Free Press</div>
              </div>
            </a>

          </div>
        </div>
      </div>
    </section>

    <!-- Demo Videos section -->
    <section ref="demoSectionRef" class="bg-gray-900 py-28 relative z-10">
      <div class="container mx-auto px-4">
        <div class="max-w-3xl mx-auto mb-16">
          <h2 class="text-5xl font-bold mb-8 text-white text-center tracking-tight leading-tight">How To Use</h2>
          <p class="text-2xl text-gray-300 mx-auto mb-8 text-center leading-relaxed">
            Watch these short demos to get started exploring the Paramilitary Leaks
          </p>
        </div>

        <!-- Video Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          <!-- Video 1: Exploring the Feed -->
          <div
            class="bg-gray-800 rounded-xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group demo-video-card">
            <div class="relative aspect-[9/16] overflow-hidden video-container">
              <div class="absolute inset-0 bg-gradient-to-br from-blue-900 to-gray-900"></div>
              <!-- Placeholder for video - will be replaced with actual video later -->
              <video class="w-full h-full object-cover demo-video" muted playsinline loading="lazy" fetchpriority="low"
                poster="https://res.cloudinary.com/ejf/video/upload/q_auto,w_640,e_blur:300,f_jpg/v1/demos/exploring-feed.jpg">
                <source
                  src="https://res.cloudinary.com/ejf/video/upload/q_auto:good,f_webm,w_640/v1/demos/exploring-feed.webm"
                  type="video/webm">
                <source
                  src="https://res.cloudinary.com/ejf/video/upload/q_auto:good,f_mp4,w_640/v1/demos/exploring-feed.mp4"
                  type="video/mp4">
              </video>
              <div
                class="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent opacity-80 group-hover:opacity-40 transition-opacity duration-300 video-overlay">
              </div>
              <button
                class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-full shadow-lg transition-transform duration-300 group-hover:scale-110 video-play-button">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                    clip-rule="evenodd" />
                </svg>
              </button>
            </div>
            <div class="p-6">
              <h3 class="text-2xl font-bold text-white mb-2 tracking-tight">Exploring the Feed</h3>
              <p class="text-gray-300 mb-4">See how to navigate through the chronological message feed and filter by
                date, sender, or keywords.</p>
              <div class="text-blue-400 text-sm font-medium">1:32</div>
            </div>
          </div>

          <!-- Video 2: File Search & Visualization -->
          <div
            class="bg-gray-800 rounded-xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group demo-video-card">
            <div class="relative aspect-[9/16] overflow-hidden video-container">
              <div class="absolute inset-0 bg-gradient-to-br from-purple-900 to-gray-900"></div>
              <!-- Placeholder for video - will be replaced with actual video later -->
              <video class="w-full h-full object-cover demo-video" muted playsinline loading="lazy" fetchpriority="low"
                poster="https://res.cloudinary.com/ejf/video/upload/q_auto,w_640,e_blur:300,f_jpg/v1/demos/file-search.jpg">
                <source
                  src="https://res.cloudinary.com/ejf/video/upload/q_auto:good,f_webm,w_640/v1/demos/file-search.webm"
                  type="video/webm">
                <source
                  src="https://res.cloudinary.com/ejf/video/upload/q_auto:good,f_mp4,w_640/v1/demos/file-search.mp4"
                  type="video/mp4">
              </video>
              <div
                class="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent opacity-80 group-hover:opacity-40 transition-opacity duration-300 video-overlay">
              </div>
              <button
                class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-full shadow-lg transition-transform duration-300 group-hover:scale-110 video-play-button">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                    clip-rule="evenodd" />
                </svg>
              </button>
            </div>
            <div class="p-6">
              <h3 class="text-2xl font-bold text-white mb-2 tracking-tight">File Search & Visualization</h3>
              <p class="text-gray-300 mb-4">Learn how to search through the file repository and use the interactive
                visualizations.</p>
              <div class="text-blue-400 text-sm font-medium">2:14</div>
            </div>
          </div>

          <!-- Video 3: Sender Analysis -->
          <div
            class="bg-gray-800 rounded-xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group demo-video-card">
            <div class="relative aspect-[9/16] overflow-hidden video-container">
              <div class="absolute inset-0 bg-gradient-to-br from-green-900 to-gray-900"></div>
              <!-- Placeholder for video - will be replaced with actual video later -->
              <video class="w-full h-full object-cover demo-video" muted playsinline loading="lazy" fetchpriority="low"
                poster="https://res.cloudinary.com/ejf/video/upload/q_auto,w_640,e_blur:300,f_jpg/v1/demos/sender-analysis.jpg">
                <source
                  src="https://res.cloudinary.com/ejf/video/upload/q_auto:good,f_webm,w_640/v1/demos/sender-analysis.webm"
                  type="video/webm">
                <source
                  src="https://res.cloudinary.com/ejf/video/upload/q_auto:good,f_mp4,w_640/v1/demos/sender-analysis.mp4"
                  type="video/mp4">
              </video>
              <div
                class="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent opacity-80 group-hover:opacity-40 transition-opacity duration-300 video-overlay">
              </div>
              <button
                class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-full shadow-lg transition-transform duration-300 group-hover:scale-110 video-play-button">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                    clip-rule="evenodd" />
                </svg>
              </button>
            </div>
            <div class="p-6">
              <h3 class="text-2xl font-bold text-white mb-2 tracking-tight">Sender Analysis</h3>
              <p class="text-gray-300 mb-4">Discover patterns in communication by analyzing individual senders and
                their
                networks.</p>
              <div class="text-blue-400 text-sm font-medium">1:48</div>
            </div>
          </div>

          <!-- Video 4: Network Graph -->
          <div
            class="bg-gray-800 rounded-xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group demo-video-card">
            <div class="relative aspect-[9/16] overflow-hidden video-container">
              <div class="absolute inset-0 bg-gradient-to-br from-red-900 to-gray-900"></div>
              <!-- Placeholder for video - will be replaced with actual video later -->
              <video class="w-full h-full object-cover demo-video" muted playsinline loading="lazy" fetchpriority="low"
                poster="https://res.cloudinary.com/ejf/video/upload/q_auto,w_640,e_blur:300,f_jpg/v1/demos/network-graph.jpg">
                <source
                  src="https://res.cloudinary.com/ejf/video/upload/q_auto:good,f_webm,w_640/v1/demos/network-graph.webm"
                  type="video/webm">
                <source
                  src="https://res.cloudinary.com/ejf/video/upload/q_auto:good,f_mp4,w_640/v1/demos/network-graph.mp4"
                  type="video/mp4">
              </video>
              <div
                class="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent opacity-80 group-hover:opacity-40 transition-opacity duration-300 video-overlay">
              </div>
              <button
                class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-full shadow-lg transition-transform duration-300 group-hover:scale-110 video-play-button">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                    clip-rule="evenodd" />
                </svg>
              </button>
            </div>
            <div class="p-6">
              <h3 class="text-2xl font-bold text-white mb-2 tracking-tight">Network Graph</h3>
              <p class="text-gray-300 mb-4">Explore connections between different militia members using the
                interactive
                network visualization.</p>
              <div class="text-blue-400 text-sm font-medium">2:05</div>
            </div>
          </div>

          <!-- Video 5: Advanced Search Techniques -->
          <div
            class="bg-gray-800 rounded-xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group demo-video-card">
            <div class="relative aspect-[9/16] overflow-hidden video-container">
              <div class="absolute inset-0 bg-gradient-to-br from-yellow-800 to-gray-900"></div>
              <!-- Placeholder for video - will be replaced with actual video later -->
              <video class="w-full h-full object-cover demo-video" muted playsinline>
                <source src="#" type="video/mp4">
                <source
                  src="https://res.cloudinary.com/ejf/video/upload/q_auto:good,f_webm,w_640/v1/demos/advanced-search.webm"
                  type="video/webm">
                <source
                  src="https://res.cloudinary.com/ejf/video/upload/q_auto:good,f_mp4,w_640/v1/demos/advanced-search.mp4"
                  type="video/mp4">
              </video>
              <div
                class="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent opacity-80 group-hover:opacity-40 transition-opacity duration-300 video-overlay">
              </div>
              <button
                class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-full shadow-lg transition-transform duration-300 group-hover:scale-110 video-play-button">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                    clip-rule="evenodd" />
                </svg>
              </button>
            </div>
            <div class="p-6">
              <h3 class="text-2xl font-bold text-white mb-2 tracking-tight">Advanced Search Techniques</h3>
              <p class="text-gray-300 mb-4">Master advanced search queries to find specific content across the entire
                dataset.</p>
              <div class="text-blue-400 text-sm font-medium">1:56</div>
            </div>
          </div>

          <!-- Video 6: Timeline Analysis -->
          <div
            class="bg-gray-800 rounded-xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group demo-video-card">
            <div class="relative aspect-[9/16] overflow-hidden video-container">
              <div class="absolute inset-0 bg-gradient-to-br from-indigo-900 to-gray-900"></div>
              <!-- Placeholder for video - will be replaced with actual video later -->
              <video class="w-full h-full object-cover demo-video" muted playsinline>
                <source src="#" type="video/mp4">
              </video>
              <div
                class="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent opacity-80 group-hover:opacity-40 transition-opacity duration-300 video-overlay">
              </div>
              <button
                class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-full shadow-lg transition-transform duration-300 group-hover:scale-110 video-play-button">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                    clip-rule="evenodd" />
                </svg>
              </button>
            </div>
            <div class="p-6">
              <h3 class="text-2xl font-bold text-white mb-2 tracking-tight">Timeline Analysis</h3>
              <p class="text-gray-300 mb-4">Track how events unfolded over time and identify significant communication
                patterns.</p>
              <div class="text-blue-400 text-sm font-medium">2:22</div>
            </div>
          </div>
        </div>

        <!-- Call to Action -->
        <div class="mt-20 text-center">
          <h3 class="text-3xl font-bold text-white mb-6">Ready to Dive Deeper?</h3>
          <p class="text-xl text-gray-300 max-w-3xl mx-auto mb-10">
            Start exploring the full dataset and discover the inner workings of these paramilitary organizations.
          </p>
          <div class="flex flex-wrap gap-6 justify-center">
            <NuxtLink to="/feed"
              class="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-lg font-medium shadow-lg hover:shadow-xl">
              Start Exploring
            </NuxtLink>
            <a href="https://github.com/ddosecrets/paramilitary-leaks" target="_blank" rel="noopener"
              class="px-8 py-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-lg font-medium shadow-lg hover:shadow-xl">
              Download Raw Data
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
import StreamGraph from '~/components/metadata/StreamGraph.vue'
import ScrollStreamGraph from '~/components/narrative/ScrollStreamGraph.vue'

// State variables - define ALL refs at the top of the component
const loading = ref(true)
const error = ref(null)
const topSenders = ref([])
const messagesBySender = ref([])
const messageCount = ref(141157) // Default values that will be replaced when data loads
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
const scrollGraphProgress = ref(0) // Track scroll progress for the ScrollStreamGraph
const demoSectionRef = ref(null) // Reference to the demo video section
const demoVideos = ref([]) // References to the demo videos
const statsInitialized = ref(true) // Flag to track if stats have been initialized

// Component refs
const heroSection = ref(null)
const videoSection = ref(null)
const statsSection = ref(null)
const storyContainer = ref(null)
const storySection = ref(null)
const scrollGraphSection = ref(null)
const sourceInfoSection = ref(null) // New ref for source info section

// State for fade-in effect
const sourceInfoVisible = ref(false)

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
  { title: 'Key Events', ref: scrollGraphSection },
  { title: 'How To Use', ref: demoSectionRef },
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

// Calculate overall scroll progress as percentage - simplified version
const scrollProgress = computed(() => {
  if (typeof window === 'undefined') return 0;

  const scrollPosition = window.scrollY;
  const documentHeight = document.documentElement.scrollHeight;
  const windowHeight = window.innerHeight;
  const scrollableHeight = documentHeight - windowHeight;

  // Prevent division by zero
  if (scrollableHeight <= 0) return 0;

  // Calculate percentage scrolled
  return Math.min(100, Math.max(0, Math.round((scrollPosition / scrollableHeight) * 100)));
});

// Simplified scroll handler
function handleScroll() {
  // Just update scrollY to trigger recomputation of scrollProgress
  scrollY.value = window.scrollY;
}

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
    .slice(0, 100) // Increased from 10 to 100 senders for better representation
})

// Create an extended version of allSenders with colors for StreamGraph
const allSendersExtended = computed(() => {
  return allSenders.value.map(sender => ({
    ...sender,
    color: colorMap.getSenderColor(sender.name)
  }))
})

// Get stream data for a specific sender
function getSenderStreamData(senderName) {
  if (!messagesBySender.value || messagesBySender.value.length === 0) return []

  // Create a filtered dataset that only includes date and the specific sender
  return messagesBySender.value.map(weekData => {
    const filteredData = { date: weekData.date }
    // Only include the specified sender's data
    if (senderName in weekData) {
      filteredData[senderName] = weekData[senderName]
    } else {
      filteredData[senderName] = 0 // Ensure the sender has a value even if 0
    }
    return filteredData
  })
}

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

    // Preload main video for faster animation once scrolling starts
    if (typeof window !== 'undefined') {
      const videoPreload = new Image();
      videoPreload.src = "https://res.cloudinary.com/ejf/video/upload/q_auto,f_auto,w_1280/so_auto,e_blur:400/v1742858893/PARALEAKS_COMP_SHORTER_jm8fjw.jpg";
    }

    // Defer data loading to prioritize UI rendering
    setTimeout(async () => {
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
    }, 100) // Small delay to allow UI elements to render first
  } catch (err) {
    console.error('Error in data/visualization loading:', err)
    error.value = err.message
    loading.value = false
  }
}

// Process data for the StreamGraph
function processDataForStreamgraph(data) {
  if (!data || !data.length) return []

  // Filter data to specific date range (May 2021 to May 2023) for narrative page
  // Expanded date range slightly to capture more context
  const startDate = new Date('2021-03-01')
  const endDate = new Date('2023-06-30')

  // Filter data by date range
  const filteredData = data.filter(d => {
    const timestamp = getMessageTimestamp(d)
    return timestamp && timestamp >= startDate && timestamp <= endDate
  })

  // First, determine the time intervals (use weeks instead of months for more detail)
  const timestamps = filteredData.map(d => new Date(getMessageTimestamp(d)))
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
  filteredData.forEach(msg => {
    const sender = getMessageSender(msg)
    senderCounts[sender] = (senderCounts[sender] || 0) + 1
  })

  // Sort by count and get top senders
  const topSenderNames = Object.entries(senderCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 120) // Increased from 100 to 120 for better visualization
    .map(([name]) => name)

  // Group messages by week and sender
  const nestedData = d3.groups(filteredData,
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

// Get color for a sender from the colorMap
function getSenderColor(senderName) {
  return colorMap.getSenderColor(senderName)
}

// Format numbers in a nice way (1k, 15k, etc.)
function formatNumber(value) {
  if (value === undefined || value === null || isNaN(value)) {
    return '0';
  }
  return d3.format('.2~s')(value)
    .replace('k', 'K')
    .replace('M', 'M')
    .replace('G', 'B')
    .replace('.0', '');
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
  // Use requestAnimationFrame for smoother performance
  scrollAnimationFrame = requestAnimationFrame(() => {
    // Cache window.scrollY to avoid repeated access
    const currentScrollY = window.scrollY;
    const windowHeight = window.innerHeight;

    // Update scrollY to trigger recomputation of scrollProgress
    scrollY.value = currentScrollY;

    // Calculate specific scroll progress for story section
    if (storyContainer.value) {
      const rect = storyContainer.value.getBoundingClientRect();

      // Start when the section enters view, finish when it's at 40% through (much quicker)
      const start = windowHeight;
      const end = -windowHeight * 0.4;

      // Calculate progress from 0 to 1
      let progress = 0;
      if (rect.top <= start) {
        progress = Math.min(1, Math.max(0, (start - rect.top) / (start - end)));
      }

      // Only update when value changes significantly to avoid unnecessary rerenders
      if (Math.abs(storyScrollProgress.value - progress) > 0.01) {
        storyScrollProgress.value = progress;
        // Update zoom level based on scroll progress
        visualizationZoomLevel.value = computeZoomLevel(progress);
      }

      // Only show the scatterplot when we're actually in the story section
      if (currentScrollY < windowHeight * 0.6) { // Adjusted threshold
        // If we're still in the hero section viewport, force progress to 0
        storyScrollProgress.value = 0;
        visualizationZoomLevel.value = 0;
      }
    }

    // Check if stats elements should animate
    animateCounters();

    // Calculate scroll progress for the ScrollStreamGraph section - adjusted for taller section
    if (scrollGraphSection.value) {
      const rect = scrollGraphSection.value.getBoundingClientRect();

      // Calculate the total scrollable height of the section
      const sectionHeight = scrollGraphSection.value.offsetHeight;

      // Calculate how far the section has been scrolled through
      let progress = 0;

      // New condition: Only start showing streamgraph when video is complete or user has scrolled far enough
      const videoComplete = !videoPlaying.value || videoProgress.value > 0.95;
      const pastVideoSection = videoSection.value && videoSection.value.$el.getBoundingClientRect().bottom < 0;

      // Start when section enters view AND video conditions are met
      if (rect.top < windowHeight && (videoComplete || pastVideoSection)) {
        // How much of section has scrolled past the top of viewport
        const scrolledPastTop = Math.max(0, -rect.top);

        // Calculate scrollable area (section height minus viewport height)
        const scrollableArea = sectionHeight - windowHeight;

        // Calculate progress as a ratio of how much has been scrolled
        // Use a power function to make the progress more gradual at the beginning
        progress = Math.min(0.95, Math.pow(scrolledPastTop / scrollableArea, 0.8));
      }

      // Make sure progress is 0 when section not yet in view
      if (rect.top >= windowHeight) {
        progress = 0;
      }

      // Only update when value changes significantly
      if (Math.abs(scrollGraphProgress.value - progress) > 0.01) {
        scrollGraphProgress.value = progress;
      }
    }

    // Continue animation loop
    updateScrollProgress();
  });
}

// Add scrollAnimationFrame variable for cleanup
let scrollAnimationFrame = null;

// Update onMounted hook
onMounted(() => {
  // Create cleanup function
  const cleanup = () => {
    // Clean up event listeners
    window.removeEventListener('scroll', updateSimpleProgress)
    window.removeEventListener('resize', updateSimpleProgress)

    // Cancel any other animation frames
    if (scrollAnimationFrame) {
      cancelAnimationFrame(scrollAnimationFrame)
    }
    cancelStreamingPoints()
  }

  // Register cleanup
  onBeforeUnmount(() => {
    cleanup()
  })

  // Handle event setup - prioritize critical rendering path
  // First add basic event listeners for immediate UI responsiveness
  window.addEventListener('scroll', updateSimpleProgress, { passive: true })
  window.addEventListener('resize', updateSimpleProgress, { passive: true })

  // Call once immediately to initialize
  updateSimpleProgress()

  // Use requestIdleCallback or setTimeout to defer non-critical operations
  const startDeferredOperations = () => {
    // Start the scroll animation frame for streamgraph and other animated sections
    scrollAnimationFrame = requestAnimationFrame(updateScrollProgress)

    // Continue with other initialization...
    loadDataAndVisualization()
      .then(() => {
        // Defer section observers until after initial render
        setTimeout(() => {
          setupSectionObservers([
            { name: 'section1', ref: heroSection },
            { name: 'section2', ref: videoSection },
            { name: 'section3', ref: statsSection },
            { name: 'section4', ref: storySection, threshold: 0.15 },
            { name: 'section5', ref: scrollGraphSection, threshold: 0.2 },
            { name: 'section4Footer', ref: storySection, threshold: 0.7 },
            { name: 'section6', ref: demoSectionRef, threshold: 0.2 }
          ])

          initializeDemoVideos()
          setupCounterObservers()
        }, 100)
      })
  }

  // Use requestIdleCallback if available, otherwise setTimeout
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    window.requestIdleCallback(startDeferredOperations, { timeout: 1000 })
  } else {
    setTimeout(startDeferredOperations, 200)
  }
})

// Set up counter animation observers
function setupCounterObservers() {
  // Wait for DOM to be ready
  nextTick(() => {
    // Find elements with the counter-value attribute
    const counterElements = document.querySelectorAll('[data-counter-value]');

    // If no elements, exit
    if (!counterElements.length) return;

    // Create intersection observer
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Start animation when element is visible
          startCounterAnimation(entry.target);
          // Unobserve after animation starts
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    // Observe all counter elements
    counterElements.forEach(el => observer.observe(el));

    // Setup source info section observer
    if (sourceInfoSection.value) {
      const sourceObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            sourceInfoVisible.value = true;
            sourceObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15 });

      sourceObserver.observe(sourceInfoSection.value);
    }
  });
}

// Animate a specific counter element
function startCounterAnimation(element) {
  const targetValue = parseInt(element.getAttribute('data-counter-value'), 10);
  const duration = 1500; // Animation duration in ms
  const startTime = performance.now();
  const startValue = 0;

  // Make sure we have a valid target value
  if (isNaN(targetValue) || targetValue === 0) {
    // If no valid target value, just use the original text content
    const originalText = element.getAttribute('data-original-text') || element.textContent;
    element.textContent = originalText;
    element.classList.add('completed');
    return;
  }

  // Add animation class
  element.classList.add('animating');

  // Animation function
  function updateCounter(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Use easeOutQuart for natural slowing effect
    const easeProgress = 1 - Math.pow(1 - progress, 4);

    // Calculate current value
    const currentValue = Math.floor(startValue + (targetValue - startValue) * easeProgress);

    // Format with commas
    element.textContent = new Intl.NumberFormat().format(currentValue);

    // Continue animation if not complete
    if (progress < 1) {
      requestAnimationFrame(updateCounter);
    } else {
      element.classList.remove('animating');
      element.classList.add('completed');
    }
  }

  requestAnimationFrame(updateCounter);
}

// Check which counters are visible and should animate
function animateCounters() {
  // Check if we need to initialize observers
  if (!document.querySelector('[data-counter-value]')) {
    // Convert appropriate elements to counter elements
    convertToCounters();
  }
}

// Convert stats elements to counter elements
function convertToCounters() {
  // Find stats containers and convert to counters
  nextTick(() => {
    // Find elements that should become counters
    const statsElements = document.querySelectorAll('.stats-value:not([data-counter-value])');

    statsElements.forEach(el => {
      // Get the current text value and clean it
      const currentText = el.textContent.trim();
      const numericValue = parseInt(currentText.replace(/,/g, ''), 10);

      // Store the original text regardless of numeric validity
      el.setAttribute('data-original-text', currentText);

      // Only proceed with animation if we have a valid number
      if (!isNaN(numericValue) && numericValue > 0) {
        // Store original value as attribute
        el.setAttribute('data-counter-value', numericValue);
        // Reset displayed value to 0
        el.textContent = '0';
        // Add counter class
        el.classList.add('counter-ready');
      }
    });

    // Now set up observers for new elements
    setupCounterObservers();
  });
}

// Add resize handler
function handleResize() {
  // Any global resize handling needed
}

// Function to handle demo video playback
function initializeDemoVideos() {
  // Wait for DOM to be fully loaded
  nextTick(() => {
    // Collect all demo video elements
    const videoElements = document.querySelectorAll('.demo-video');
    const videoContainers = document.querySelectorAll('.video-container');

    // Store references to video elements
    demoVideos.value = Array.from(videoElements);

    // Add click listeners to all video cards
    const videoCards = document.querySelectorAll('.demo-video-card');
    videoCards.forEach((card, index) => {
      card.addEventListener('click', (event) => {
        event.preventDefault();
        handleDemoCardClick(index);
      });
    });

    // Track video progress on timeupdate events
    demoVideos.value.forEach((video, index) => {
      video.addEventListener('timeupdate', () => {
        if (videoContainers[index]) {
          // Set the progress as a CSS variable
          const progress = video.currentTime / video.duration;
          videoContainers[index].style.setProperty('--video-progress', progress);
        }
      });

      // Handle video end
      video.addEventListener('ended', () => {
        if (videoContainers[index]) {
          videoContainers[index].classList.remove('playing');
          const playButton = videoContainers[index].querySelector('.video-play-button');
          if (playButton) playButton.classList.remove('hidden');
        }
      });
    });

    // Set up a simple intersection observer for streamgraph intro
    const streamGraphIntroEl = document.getElementById('streamGraphIntro');
    if (streamGraphIntroEl) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            streamGraphIntroEl.classList.add('opacity-100', 'translate-y-0');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.2 });

      observer.observe(streamGraphIntroEl);
    }
  });
}

// Handle demo card click
function handleDemoCardClick(index) {
  if (index < 0 || index >= demoVideos.value.length) return;

  const video = demoVideos.value[index];
  const videoContainers = document.querySelectorAll('.video-container');
  const videoContainer = videoContainers[index];
  const playButton = videoContainer.querySelector('.video-play-button');

  // Since we don't have actual videos yet, just show a placeholder animation
  if (video.src === '' || video.src.endsWith('#')) {
    // If no real video, toggle a simulated playing state
    if (videoContainer.classList.contains('playing')) {
      // "Stop" the simulated video
      videoContainer.classList.remove('playing');
      playButton.classList.remove('hidden');

      // Reset the progress bar
      videoContainer.style.setProperty('--video-progress', 0);
    } else {
      // Pause any other "playing" videos
      document.querySelectorAll('.video-container.playing').forEach(container => {
        container.classList.remove('playing');
        const btn = container.querySelector('.video-play-button');
        if (btn) btn.classList.remove('hidden');
      });

      // "Play" the simulated video
      videoContainer.classList.add('playing');
      playButton.classList.add('hidden');

      // Animate the progress bar over 5 seconds
      let progress = 0;
      const duration = 5000; // 5 seconds for demo
      const interval = 50; // Update every 50ms
      const increment = interval / duration;

      const progressInterval = setInterval(() => {
        progress += increment;
        videoContainer.style.setProperty('--video-progress', progress);

        if (progress >= 1) {
          clearInterval(progressInterval);
          // "End" the simulated video
          setTimeout(() => {
            videoContainer.classList.remove('playing');
            playButton.classList.remove('hidden');
          }, 300);
        }
      }, interval);

      // Show a message that this is just a placeholder
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg z-50';
      notification.innerHTML = 'Demo videos coming soon! This is just a placeholder animation.';
      document.body.appendChild(notification);

      setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.5s ease';
        setTimeout(() => notification.remove(), 500);
      }, 3000);
    }
    return;
  }

  // If video is already playing, pause it
  if (!video.paused) {
    video.pause();
    videoContainer.classList.remove('playing');
    playButton.classList.remove('hidden');
    return;
  }

  // Pause any other playing videos
  demoVideos.value.forEach((v, i) => {
    if (i !== index && !v.paused) {
      v.pause();
      if (videoContainers[i]) {
        videoContainers[i].classList.remove('playing');
        const btn = videoContainers[i].querySelector('.video-play-button');
        if (btn) btn.classList.remove('hidden');
      }
    }
  });

  // Play the selected video
  videoContainer.classList.add('playing');
  playButton.classList.add('hidden');

  video.play()
    .then(() => {
      // Try to go fullscreen on mobile
      if (window.innerWidth <= 768 && videoContainer.requestFullscreen) {
        videoContainer.requestFullscreen().catch(err => {
          console.log('Could not enter fullscreen mode:', err);
        });
      }
    })
    .catch(err => {
      console.error('Error playing video:', err);
      // Show a message to the user
      videoContainer.classList.remove('playing');
      playButton.classList.remove('hidden');

      const notification = document.createElement('div');
      notification.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-4 py-3 rounded-lg shadow-lg z-50';
      notification.innerHTML = 'Could not play video. Please try again by tapping directly on the play button.';
      document.body.appendChild(notification);

      setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.5s ease';
        setTimeout(() => notification.remove(), 500);
      }, 3000);
    });
}

// New independent variable for scroll progress
const simpleScrollProgress = ref(0)

// Ultra simple scroll handler
function updateSimpleProgress() {
  if (typeof window === 'undefined') return

  const scrollPosition = window.scrollY
  const documentHeight = document.documentElement.scrollHeight
  const windowHeight = window.innerHeight
  const scrollableHeight = documentHeight - windowHeight

  if (scrollableHeight <= 0) {
    simpleScrollProgress.value = 0
  } else {
    simpleScrollProgress.value = Math.min(100, Math.max(0, Math.round((scrollPosition / scrollableHeight) * 100)))
  }
}

// Sender highlight handler
function handleSenderHighlight(senderName) {
  // You can add any additional logic here when a sender is highlighted
  console.log('Sender highlighted:', senderName);
}

// Clear highlight handler
function handleClearHighlight() {
  // You can add any additional logic here when highlight is cleared
  console.log('Highlight cleared');
}
</script>

<style>
/* Base styles for the narrative page */
body {
  overflow-x: hidden;
}

/* Typography enhancements */
h2,
h3,
h4 {
  letter-spacing: -0.02em;
  line-height: 1.2;
}

h2 {
  font-weight: 800;
}

p {
  line-height: 1.7;
}

.prose {
  max-width: 65ch;
  margin-left: auto;
  margin-right: auto;
}

.prose p {
  margin-bottom: 1.8em;
}

/* Magazine-style spacing - increased vertical spacing */
section {
  padding-top: 10rem;
  padding-bottom: 10rem;
  position: relative;
  /* This helps with z-index stacking */
}

.container {
  padding-left: 2rem;
  padding-right: 2rem;
}

/* Extra max-width constraints to control line lengths */
.max-w-prose {
  max-width: 65ch;
}

.max-w-narrow {
  max-width: 45ch;
}

/* For smooth scrolling - improved timing */
html {
  scroll-behavior: smooth;
  scrollbar-color: rgba(45, 55, 72, 0.3) rgba(17, 24, 39, 0.8);
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

/* Progress indicator styles */
.fixed.top-0 .bg-blue-500 {
  background: linear-gradient(90deg, #3B82F6, #60A5FA);
  box-shadow: 0 0 8px rgba(59, 130, 246, 0.5);
  will-change: width;
  transform: translateZ(0);
  backface-visibility: hidden;
}

/* Text shadow for better readability on video */
.text-shadow-lg {
  text-shadow: 0 0 8px rgba(0, 0, 0, 0.8), 0 0 30px rgba(0, 0, 0, 0.6);
}

.text-shadow-md {
  text-shadow: 0 0 4px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0, 0, 0, 0.6);
}

/* Improved text readability */
.text-gray-300 {
  color: rgba(209, 213, 219, 0.95);
}

/* Animation styles - improved animation timing */
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

/* Use hardware acceleration for heavy animations */
.narrative-video-container,
.scrollgraph-container,
.narrative-streamgraph {
  will-change: transform, opacity;
  transform: translateZ(0);
  backface-visibility: hidden;
}

/* Improved transitions for scroll animations */
.transform {
  transition: transform 0.7s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.7s cubic-bezier(0.22, 1, 0.36, 1);
}

/* Fade+slide animations with different directions - slowed down slightly for more presence */
.fade-up {
  opacity: 0;
  transform: translateY(40px);
  transition: opacity 0.9s ease, transform 0.9s cubic-bezier(0.13, 0.8, 0.4, 1);
  will-change: transform, opacity;
}

.fade-up.visible {
  opacity: 1;
  transform: translateY(0);
}

.fade-left {
  opacity: 0;
  transform: translateX(40px);
  transition: opacity 0.9s ease, transform 0.9s cubic-bezier(0.13, 0.8, 0.4, 1);
  will-change: transform, opacity;
}

.fade-left.visible {
  opacity: 1;
  transform: translateX(0);
}

.fade-right {
  opacity: 0;
  transform: translateX(-40px);
  transition: opacity 0.9s ease, transform 0.9s cubic-bezier(0.13, 0.8, 0.4, 1);
  will-change: transform, opacity;
}

.fade-right.visible {
  opacity: 1;
  transform: translateX(0);
}

/* Additional section spacing for tablet and larger */
@media (min-width: 768px) {
  .container {
    padding-left: 3rem;
    padding-right: 3rem;
  }

  section {
    padding-top: 12rem;
    padding-bottom: 12rem;
  }

  h2 {
    font-size: 3.75rem;
  }

  p {
    font-size: 1.125rem;
  }

  /* Section transitions are more substantial on larger screens */
  section+section::before {
    top: -8rem;
    height: 8rem;
  }
}

/* Ensure smooth performance on mobile */
@media (max-width: 767px) {
  .stagger-item {
    opacity: 1;
    transform: none;
  }

  .scale-up,
  .fade-up,
  .fade-left,
  .fade-right {
    opacity: 1;
    transform: none;
    transition: none;
  }
}

/* Scale animations */
.scale-up {
  opacity: 0;
  transform: scale(0.85);
  transition: opacity 0.9s ease, transform 0.9s cubic-bezier(0.13, 0.8, 0.4, 1);
  will-change: transform, opacity;
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
  animation: staggerFadeIn 0.9s forwards;
  will-change: transform, opacity;
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
  transition: transform 1.4s cubic-bezier(0.19, 1, 0.22, 1),
    opacity 0.6s ease 0.3s;
  will-change: transform, opacity;
}

.build-in-left.visible {
  transform: translateX(0);
  opacity: 1;
}

.build-in-right {
  transform: translateX(100%);
  opacity: 0;
  transition: transform 1.4s cubic-bezier(0.19, 1, 0.22, 1),
    opacity 0.6s ease 0.3s;
  will-change: transform, opacity;
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
  transition: transform 1.4s cubic-bezier(0.77, 0, 0.18, 1);
  will-change: transform;
}

.reveal-text.visible::after {
  transform: translateX(100%);
}

/* Count-up animation class */
.count-animate {
  opacity: 0;
  transform: translateY(10px);
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.count-animate.visible {
  opacity: 1;
  transform: translateY(0);
}

/* Sequenced line drawing animation for graphs */
.draw-path {
  stroke-dasharray: 1000;
  stroke-dashoffset: 1000;
  transition: stroke-dashoffset 2.5s ease-in-out;
  will-change: stroke-dashoffset;
}

.draw-path.visible {
  stroke-dashoffset: 0;
}

/* Optimize video card hover effects */
.demo-video-card {
  transform: translate3d(0, 0, 0);
  backface-visibility: hidden;
  will-change: transform, box-shadow;
}

/* Video container hardware acceleration */
.video-container {
  will-change: opacity;
  transform: translateZ(0);
}
</style>