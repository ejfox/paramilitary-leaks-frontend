import * as d3 from 'd3'

// Singleton instance to ensure the same color mapping is used everywhere
let instance = null

export function useColorMap() {
  if (instance) return instance

  // Create a new instance
  const senderColorMap = new Map()
  let uniqueSenders = []
  let initialized = false

  // Initialize the color map with data
  function initialize(data, getSenderFn) {
    try {
      if (!data || !Array.isArray(data) || data.length === 0) {
        console.warn('useColorMap: No data provided for initialization')
        return
      }

      if (typeof getSenderFn !== 'function') {
        console.error('useColorMap: getSenderFn must be a function')
        getSenderFn = (item) => item // Default identity function
      }

      // Extract all unique senders
      const senderSet = new Set()
      data.forEach((item) => {
        try {
          const sender = getSenderFn(item)
          if (sender) senderSet.add(sender)
        } catch (err) {
          console.error('useColorMap: Error extracting sender', err)
        }
      })

      // Convert to array and sort alphabetically (same as in useVisualization)
      uniqueSenders = Array.from(senderSet).sort()

      // Default color if no senders
      if (uniqueSenders.length === 0) {
        console.warn('useColorMap: No unique senders found')
        return
      }

      // Create color mapping
      uniqueSenders.forEach((sender, index) => {
        const colorValue = index / Math.max(uniqueSenders.length - 1, 1)
        senderColorMap.set(sender, colorValue)
      })

      initialized = true
      console.log(`Color map initialized with ${uniqueSenders.length} senders`)
    } catch (err) {
      console.error('useColorMap: Error initializing color map', err)
    }
  }

  // Get color for a sender
  function getSenderColor(senderName) {
    if (!initialized) {
      console.warn('useColorMap: Color map not initialized')
    }

    // Handle case where sender is not in the map
    if (!senderName || !senderColorMap.has(senderName)) {
      return '#808080' // Default gray for unknown senders
    }

    const colorValue = senderColorMap.get(senderName)
    const isDark = document.documentElement.classList.contains('dark')

    // Get base color from Turbo colorscale
    let color = d3.interpolateTurbo(colorValue)

    // Process the color to adjust for light/dark modes
    try {
      // Parse the RGB values
      const rgbMatch =
        color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/) ||
        color.match(/rgba\((\d+),\s*(\d+),\s*(\d+)/)

      if (rgbMatch) {
        const r = parseInt(rgbMatch[1])
        const g = parseInt(rgbMatch[2])
        const b = parseInt(rgbMatch[3])

        // Boost brightness for better visibility in dark mode
        if (isDark) {
          // Boost brightness for dark mode
          const brightnessBoost = 0.15
          const rNew = Math.min(255, r + (255 - r) * brightnessBoost)
          const gNew = Math.min(255, g + (255 - g) * brightnessBoost)
          const bNew = Math.min(255, b + (255 - b) * brightnessBoost)
          return `rgba(${Math.round(rNew)}, ${Math.round(gNew)}, ${Math.round(
            bNew
          )}, 0.85)`
        } else {
          // Make slightly more saturated for light mode
          const satBoost = 0.1
          const avg = (r + g + b) / 3
          const rNew = r + (r - avg) * satBoost
          const gNew = g + (g - avg) * satBoost
          const bNew = b + (b - avg) * satBoost
          return `rgba(${Math.round(rNew)}, ${Math.round(gNew)}, ${Math.round(
            bNew
          )}, 0.85)`
        }
      }
    } catch (e) {
      console.warn('Error adjusting color:', e)
    }

    // Fallback to direct color if parsing fails
    return color
  }

  // Get raw color value (0-1) for a sender
  function getSenderColorValue(senderName) {
    if (!senderName || !senderColorMap.has(senderName)) {
      return 0.5 // Middle value for unknown senders
    }
    return senderColorMap.get(senderName) || 0
  }

  // Get all unique senders
  function getAllSenders() {
    return [...uniqueSenders]
  }

  // Get the index of a sender in the uniqueSenders array
  function getSenderIndex(senderName) {
    const index = uniqueSenders.indexOf(senderName)
    return index >= 0 ? index : 0 // Return 0 as default if not found
  }

  // Check if the color map has been initialized
  function isInitialized() {
    return initialized
  }

  instance = {
    initialize,
    getSenderColor,
    getSenderColorValue,
    getAllSenders,
    getSenderIndex,
    isInitialized
  }

  return instance
}
