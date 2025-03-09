import { ref, onMounted, onUnmounted } from 'vue'
import createScatterplot from 'regl-scatterplot'
import * as d3 from 'd3'
import { useTimestampParser } from './useTimestampParser'
import { useColorMap } from './useColorMap'

export function useVisualization() {
  const { parseTimestamp } = useTimestampParser()
  const colorMap = useColorMap()
  const canvas = ref(null)
  let scatterplot = null
  let resizeObserver = null
  let userColorMap = new Map()
  let allData = null
  let highlightedIndices = null
  const selectedPoint = ref(null)
  const selectedPoints = ref([]) // Track multiple selected points
  const isMultiSelectMode = ref(false) // Track if we're in multi-select mode

  function initScatterplot() {
    if (!canvas.value) return

    try {
      if (scatterplot) {
        scatterplot.destroy()
        scatterplot = null
      }

      // Get the parent container dimensions
      const container = canvas.value.parentElement
      const rect = container.getBoundingClientRect()
      const width = rect.width
      const height = rect.height

      console.log(
        `Initializing scatterplot with dimensions: ${width}x${height}`
      )

      // Set canvas dimensions explicitly
      canvas.value.width = width
      canvas.value.height = height

      scatterplot = createScatterplot({
        canvas: canvas.value,
        width,
        height,
        pointSize: 2,
        opacity: 0.9,
        backgroundColor: [0.1, 0.1, 0.1, 1],
        pointSizeSelected: 5, // Make selected points larger
        pointOutlineWidth: 2, // Add thicker outline to selected points
        pointOutlineColor: [1, 1, 1, 1], // White outline for selected points
        opacityInactiveScale: 0.3, // Dim non-selected points
        opacitySelected: 1.0, // Ensure selected points have full opacity
        lassoColor: [0.5, 0.5, 1, 0.8], // Blue lasso selection color
        lassoMinDelay: 10, // Make lasso selection more responsive
        lassoMinDist: 0.001, // Make lasso selection more sensitive
        enableLasso: true // Enable lasso selection
        // Let the scatterplot handle the camera automatically
      })

      // Handle single point selection
      scatterplot.subscribe('select', ({ points }) => {
        if (points && points.length > 0) {
          const pointIndex = points[0]
          selectedPoint.value = allData ? allData[pointIndex] : null

          // If not in multi-select mode, clear previous selections
          if (!isMultiSelectMode.value) {
            selectedPoints.value = []
          }

          // Add to selected points if not already selected
          if (allData && !selectedPoints.value.includes(allData[pointIndex])) {
            console.log('Adding point to selectedPoints:', pointIndex)
            selectedPoints.value.push(allData[pointIndex])
            console.log(
              'selectedPoints now has',
              selectedPoints.value.length,
              'points'
            )
          }

          pulseSelectedPoint()
        } else {
          selectedPoint.value = null
        }
      })

      // Handle lasso selection
      scatterplot.subscribe('lasso', ({ points }) => {
        if (points && points.length > 0) {
          isMultiSelectMode.value = true

          // Get the data points for the selected indices
          console.log('Lasso selected', points.length, 'points')

          // Make sure we have valid indices
          const validIndices = points.filter(
            (index) => index >= 0 && index < allData.length
          )
          console.log('Valid indices:', validIndices.length)

          // Get the actual data points
          const newSelectedPoints = validIndices.map((index) => allData[index])
          console.log('New selected points:', newSelectedPoints.length)

          // Update the selectedPoints array
          selectedPoints.value = newSelectedPoints
          console.log(
            'selectedPoints now has',
            selectedPoints.value.length,
            'points'
          )

          // Set the most recently selected point as the current selected point
          if (newSelectedPoints.length > 0) {
            selectedPoint.value =
              newSelectedPoints[newSelectedPoints.length - 1]
          }
        }
      })

      // Add keyboard event listeners for multi-select mode
      window.addEventListener('keydown', handleKeyDown)
      window.addEventListener('keyup', handleKeyUp)

      if (!resizeObserver) {
        resizeObserver = new ResizeObserver(() => {
          resizeAndCenterVisualization()
        })
        resizeObserver.observe(canvas.value.parentElement)
      }
    } catch (err) {
      console.error('Error initializing scatterplot:', err)
    }
  }

  // Handle key down events for multi-select mode
  function handleKeyDown(event) {
    if (event.key === 'Shift') {
      isMultiSelectMode.value = true
      if (canvas.value) {
        canvas.value.style.cursor = 'crosshair'
      }
    }
  }

  // Handle key up events for multi-select mode
  function handleKeyUp(event) {
    if (event.key === 'Shift') {
      isMultiSelectMode.value = false
      if (canvas.value) {
        canvas.value.style.cursor = 'default'
      }
    }
  }

  function transformData(rawData) {
    if (!rawData?.length) return

    allData = rawData // Store for filtering later
    selectedPoints.value = [] // Reset selected points when data changes

    console.log(`Processing ${rawData.length} rows of data`)
    console.log('First row sample:', rawData[0])

    // Check for expected fields in the new format
    const hasNewFormat =
      rawData[0].hasOwnProperty('date') ||
      rawData[0].hasOwnProperty('message') ||
      rawData[0].hasOwnProperty('from')

    console.log('Using new telegram format:', hasNewFormat)

    // Filter out invalid timestamps
    const validData = rawData.filter((msg) => {
      // Handle different timestamp field names
      const timestampField = hasNewFormat ? 'date' : 'timestamp'
      const timestamp = parseTimestamp(msg[timestampField])
      return !isNaN(timestamp)
    })

    if (!validData.length) {
      console.warn('No valid dates found after filtering')
      return
    }

    console.log(
      `Filtered ${rawData.length - validData.length} invalid timestamps, ${
        validData.length
      } remaining`
    )

    // Make sure the color map is initialized
    const getSender = (msg) => {
      return hasNewFormat
        ? msg.from || msg.sender || 'unknown'
        : msg.sender_name || msg.sender || 'unknown'
    }

    // Initialize color map if it doesn't have any senders yet
    if (colorMap.getAllSenders().length === 0) {
      colorMap.initialize(validData, getSender)
    }

    // Get all unique senders from the color map
    const uniqueSenders = colorMap.getAllSenders()

    // Create a mapping for category indices
    uniqueSenders.forEach((sender, i) => {
      userColorMap.set(sender, i) // Store index for category coloring
    })

    try {
      // Handle different timestamp field names
      const timestampField = hasNewFormat ? 'date' : 'timestamp'

      const timestamps = validData.map(
        (m) => new Date(parseTimestamp(m[timestampField]))
      )
      const extent = d3.extent(timestamps)

      const xScale = d3.scaleTime().domain(extent).range([-1, 1])

      // Prepare data in columnar format
      const x = []
      const y = []
      const categories = [] // For categorical coloring

      validData.forEach((msg) => {
        // Handle different timestamp field names
        const timestampField = hasNewFormat ? 'date' : 'timestamp'
        const date = new Date(parseTimestamp(msg[timestampField]))
        const hours = date.getHours() + date.getMinutes() / 60

        // Handle different sender field names
        const sender = hasNewFormat
          ? msg.from || 'unknown'
          : msg.sender_name || msg.sender || 'unknown'

        x.push(xScale(date))
        y.push((hours / 24) * 2 - 1)
        categories.push(userColorMap.get(sender))
      })

      console.log(`Generated ${x.length} points for visualization`)

      if (scatterplot && x.length > 0) {
        // Prepare colors from the color map
        const colors = uniqueSenders.map((sender) => {
          const colorValue = colorMap.getSenderColorValue(sender)
          const color = d3.rgb(d3.interpolateTurbo(colorValue))
          return [color.r / 255, color.g / 255, color.b / 255, 1]
        })

        // Set color configuration
        scatterplot.set({
          colorBy: 'category',
          pointColor: colors
        })

        // Draw with categories for coloring
        scatterplot.draw({ x, y, category: categories })

        // No need to adjust the camera - let the scatterplot handle it
      }
    } catch (err) {
      console.error('Error transforming data:', err)
    }
  }

  // Highlight specific points (by index) and filter out others
  function highlightPoints(indices) {
    if (!scatterplot || !allData || !indices.length) return

    highlightedIndices = indices

    // Update selected points based on highlighted indices
    selectedPoints.value = indices.map((index) => allData[index])

    try {
      // Use filter to show only the selected points
      scatterplot.filter(indices)

      // Set all filtered points to red with full opacity
      scatterplot.set({
        opacitySelected: 1.0,
        colorBy: 'constant',
        pointColor: [1, 0, 0, 1] // Bright red
      })

      // Since zoomTo is not available, we'll use the camera to focus on the selected points
      const selectedData = indices.map((i) => allData[i])
      const timestamps = selectedData
        .map((m) => {
          const ts = parseTimestamp(m.timestamp || m.date)
          return !isNaN(ts) ? new Date(ts) : null
        })
        .filter(Boolean)

      if (timestamps.length === 0) return

      // Get the extent of the selected points
      const extent = d3.extent(timestamps)

      // Create a slightly expanded time range for better visualization
      const range = extent[1] - extent[0]
      const padding = range * 0.1 // 10% padding
      const paddedExtent = [
        new Date(extent[0].getTime() - padding),
        new Date(extent[1].getTime() + padding)
      ]

      // Calculate the x-scale for the new extent
      const allTimestamps = allData
        .map((m) => {
          const ts = parseTimestamp(m.timestamp || m.date)
          return !isNaN(ts) ? new Date(ts) : null
        })
        .filter(Boolean)

      const fullTimeRange = d3.extent(allTimestamps)
      const fullRange = fullTimeRange[1] - fullTimeRange[0]

      // Calculate the zoom level and center position
      const zoomWidth = (range + padding * 2) / fullRange
      const center = (paddedExtent[0].getTime() + paddedExtent[1].getTime()) / 2
      const centerNormalized = ((center - fullTimeRange[0]) / fullRange) * 2 - 1

      // Use set() to adjust the view
      const camera = scatterplot.get('camera')
      camera.target = [centerNormalized, 0]
      camera.distance = zoomWidth * 5

      scatterplot.set({ camera })
    } catch (err) {
      console.error('Error highlighting points:', err)
    }
  }

  // Filter points without moving the camera
  function filterPointsWithoutMoving(indices) {
    if (!scatterplot || !allData || !indices.length) return

    console.log(
      'filterPointsWithoutMoving called with',
      indices.length,
      'indices'
    )

    highlightedIndices = indices

    // Update selected points based on highlighted indices
    const pointsToSelect = indices.map((index) => allData[index])
    console.log('Setting selectedPoints to', pointsToSelect.length, 'points')
    selectedPoints.value = pointsToSelect

    try {
      // Use filter to show only the selected points
      scatterplot.filter(indices)

      // Get all unique senders from the color map
      const uniqueSenders = colorMap.getAllSenders()

      // Prepare colors from the color map
      const colors = uniqueSenders.map((sender) => {
        const colorValue = colorMap.getSenderColorValue(sender)
        const color = d3.rgb(d3.interpolateTurbo(colorValue))
        return [color.r / 255, color.g / 255, color.b / 255, 1]
      })

      // Keep the original categorical coloring
      scatterplot.set({
        opacitySelected: 1.0,
        colorBy: 'category',
        pointColor: colors
      })
    } catch (err) {
      console.error('Error filtering points:', err)
    }
  }

  // Reset the view and selection
  function resetView() {
    if (!scatterplot) return

    try {
      console.log('Resetting view and restoring colors')

      highlightedIndices = null
      selectedPoint.value = null
      selectedPoints.value = []

      // Remove filtering to show all points
      scatterplot.unfilter()
      scatterplot.deselect()

      // Get all unique senders from the color map
      const uniqueSenders = colorMap.getAllSenders()

      // Prepare colors from the color map
      const colors = uniqueSenders.map((sender) => {
        const colorValue = colorMap.getSenderColorValue(sender)
        const color = d3.rgb(d3.interpolateTurbo(colorValue))
        return [color.r / 255, color.g / 255, color.b / 255, 1]
      })

      // Reset opacity settings and restore categorical coloring
      scatterplot.set({
        opacity: 0.9,
        opacitySelected: 1.0,
        opacityInactiveScale: 0.3,
        colorBy: 'category',
        pointColor: colors
      })

      scatterplot.reset()
    } catch (err) {
      console.error('Error resetting view:', err)
    }
  }

  // Clear the selected point
  function clearSelectedPoint() {
    console.log('clearSelectedPoint called')
    selectedPoint.value = null
    selectedPoints.value = []
    console.log(
      'selectedPoints cleared, now has',
      selectedPoints.value.length,
      'points'
    )
    if (scatterplot) {
      scatterplot.deselect()
    }
  }

  // Add a pulsing effect to the selected point
  function pulseSelectedPoint() {
    if (!scatterplot || !selectedPoint.value) return

    // Get the current selected points
    const currentSelectedPoints = scatterplot.get('selectedPoints')
    if (!currentSelectedPoints || currentSelectedPoints.length === 0) return

    // Get the current point size
    let size = 5
    let growing = true

    // Create a pulsing effect
    const pulse = () => {
      if (!scatterplot || !selectedPoint.value) return

      // Update size
      if (growing) {
        size += 0.2
        if (size >= 8) growing = false
      } else {
        size -= 0.2
        if (size <= 5) growing = true
      }

      // Apply new size
      scatterplot.set({ pointSizeSelected: size })

      // Continue animation if point is still selected
      if (selectedPoint.value) {
        requestAnimationFrame(pulse)
      }
    }

    // Start the animation
    requestAnimationFrame(pulse)
  }

  // Add this function to ensure proper canvas sizing and point centering
  function resizeAndCenterVisualization() {
    if (!scatterplot || !canvas.value) return

    // Get the current dimensions of the container
    const container = canvas.value.parentElement
    const rect = container.getBoundingClientRect()

    // Set the canvas dimensions to match the container
    canvas.value.width = rect.width
    canvas.value.height = rect.height

    // Update the scatterplot dimensions
    scatterplot.set({
      width: rect.width,
      height: rect.height
    })

    console.log(`Canvas resized to ${rect.width}x${rect.height}`)
  }

  onMounted(() => {
    if (canvas.value) initScatterplot()
  })

  onUnmounted(() => {
    // Remove keyboard event listeners
    window.removeEventListener('keydown', handleKeyDown)
    window.removeEventListener('keyup', handleKeyUp)

    if (resizeObserver) {
      resizeObserver.disconnect()
      resizeObserver = null
    }
    if (scatterplot) {
      scatterplot.destroy()
      scatterplot = null
    }
    userColorMap.clear()
    allData = null
    highlightedIndices = null
    selectedPoint.value = null
    selectedPoints.value = []
  })

  return {
    canvas,
    transformData,
    initScatterplot,
    highlightPoints,
    filterPointsWithoutMoving,
    resetView,
    selectedPoint,
    selectedPoints,
    clearSelectedPoint,
    isMultiSelectMode,
    resizeAndCenterVisualization
  }
}
