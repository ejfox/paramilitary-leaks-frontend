import * as d3 from 'd3'

// Singleton instance to ensure the same color mapping is used everywhere
let instance = null

export function useColorMap() {
  if (instance) return instance

  // Create a new instance
  const senderColorMap = new Map()
  let uniqueSenders = []

  // Initialize the color map with data
  function initialize(data, getSenderFn) {
    // Extract all unique senders
    const senderSet = new Set()
    data.forEach((item) => {
      const sender = getSenderFn(item)
      if (sender) senderSet.add(sender)
    })

    // Convert to array and sort alphabetically (same as in useVisualization)
    uniqueSenders = Array.from(senderSet).sort()

    // Create color mapping
    uniqueSenders.forEach((sender, index) => {
      const colorValue = index / Math.max(uniqueSenders.length - 1, 1)
      senderColorMap.set(sender, colorValue)
    })

    console.log(`Color map initialized with ${uniqueSenders.length} senders`)
  }

  // Get color for a sender
  function getSenderColor(senderName) {
    if (!senderColorMap.has(senderName)) return '#ffffff'

    const colorValue = senderColorMap.get(senderName)
    return d3.interpolateTurbo(colorValue)
  }

  // Get raw color value (0-1) for a sender
  function getSenderColorValue(senderName) {
    return senderColorMap.get(senderName) || 0
  }

  // Get all unique senders
  function getAllSenders() {
    return [...uniqueSenders]
  }

  instance = {
    initialize,
    getSenderColor,
    getSenderColorValue,
    getAllSenders
  }

  return instance
}
