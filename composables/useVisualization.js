import { ref, onMounted, onUnmounted, watch } from 'vue'
import createScatterplot from 'regl-scatterplot'
import * as d3 from 'd3'
import { useTimestampParser } from './useTimestampParser'
import { useColorMap } from './useColorMap'
import { useEventListener } from '@vueuse/core'

export function useVisualization() {
  const { parseTimestamp } = useTimestampParser()
  const colorMap = useColorMap()
  const canvas = ref(null)
  let scatterplot = null
  let resizeObserver = null
  let allData = null
  let sortedDataByTime = null // Store data sorted by timestamp for arrow navigation
  const selectedPoint = ref(null)
  const selectedPoints = ref([]) // Track multiple selected points
  const hoveredPoint = ref(null) // Track the currently hovered point

  // Handle keyboard navigation between points
  function handleLeftArrow() {
    navigatePoints('prev')
  }

  function handleRightArrow() {
    navigatePoints('next')
  }

  // Navigate to previous or next point
  function navigatePoints(direction) {
    // Only proceed if we have a single point selected
    if (
      !selectedPoint.value ||
      selectedPoints.value.length !== 1 ||
      !sortedDataByTime ||
      !sortedDataByTime.length
    ) {
      return
    }

    // First try to find the index using direct object reference (most reliable)
    let currentIndex = sortedDataByTime.findIndex(
      (item) => item === selectedPoint.value
    )

    // If that fails, try using timestamp comparison as a fallback
    if (currentIndex === -1) {
      console.log(
        'Could not find point by reference, trying timestamp comparison...'
      )
      const currentTimestamp = getPointTimestamp(selectedPoint.value).getTime()

      // Find points with the exact same timestamp
      const matchingTimestampIndices = sortedDataByTime.reduce(
        (indices, item, idx) => {
          const timestamp = getPointTimestamp(item).getTime()
          if (timestamp === currentTimestamp) indices.push(idx)
          return indices
        },
        []
      )

      if (matchingTimestampIndices.length > 0) {
        // If we found multiple messages with the same timestamp,
        // pick the first one or try to find the best match
        currentIndex = matchingTimestampIndices[0]
        console.log(
          `Found ${matchingTimestampIndices.length} messages with the same timestamp`
        )
      } else {
        // As a last resort, find the closest timestamp
        console.log('No exact timestamp match, finding closest timestamp...')

        let closestIndex = 0
        let closestDiff = Infinity

        sortedDataByTime.forEach((item, idx) => {
          const timestamp = getPointTimestamp(item).getTime()
          const diff = Math.abs(timestamp - currentTimestamp)

          if (diff < closestDiff) {
            closestDiff = diff
            closestIndex = idx
          }
        })

        currentIndex = closestIndex
        console.log(
          `Found closest timestamp at index ${currentIndex}, diff: ${closestDiff}ms`
        )
      }
    }

    if (currentIndex === -1) {
      console.error('Could not find current point in sorted data')
      return
    }

    // Determine the next point based on direction
    let nextIndex
    if (direction === 'prev') {
      // Previous message in time
      nextIndex = currentIndex - 1
      if (nextIndex < 0) nextIndex = sortedDataByTime.length - 1 // Wrap around to the end
    } else {
      // Next message in time
      nextIndex = currentIndex + 1
      if (nextIndex >= sortedDataByTime.length) nextIndex = 0 // Wrap around to the beginning
    }

    // Get the next point
    const nextPoint = sortedDataByTime[nextIndex]

    // Safety check
    if (!nextPoint) {
      console.error('Next point is undefined', {
        nextIndex,
        totalPoints: sortedDataByTime.length
      })
      return
    }

    // Find the index of this point in the original data array
    const nextPointIndex = allData.findIndex((item) => item === nextPoint)
    if (nextPointIndex !== -1) {
      // Select this point in the scatterplot
      scatterplot.select([nextPointIndex])

      // Update the selected point reference
      selectedPoint.value = nextPoint
      selectedPoints.value = [nextPoint]

      // Optional: scroll the view to center on this point
      const pointPosition = scatterplot.getPointPosition(nextPointIndex)
      if (pointPosition) {
        const currentCamera = scatterplot.get('camera')
        scatterplot.set({
          camera: {
            ...currentCamera,
            target: [pointPosition.x, pointPosition.y]
          }
        })
      }

      console.log(
        `Navigated to ${
          direction === 'prev' ? 'previous' : 'next'
        } message in time: index ${nextIndex} of ${sortedDataByTime.length}`
      )
    } else {
      console.error('Could not find next point in original data array')
    }
  }

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

      // Create scatterplot with simplified configuration
      scatterplot = createScatterplot({
        canvas: canvas.value,
        width,
        height,
        pointSize: 1.5,
        opacity: 0.92,
        backgroundColor: [0.1, 0.1, 0.1, 1],
        pointSizeSelected: 5,
        pointOutlineWidth: 2,
        pointOutlineColor: [1, 1, 1, 1],
        opacityInactiveScale: 0.3,
        opacitySelected: 1.0,
        lassoColor: [0.5, 0.5, 1, 0.8],
        lassoMinDelay: 10,
        lassoMinDist: 0.001,
        enableLasso: true,
        // Use shift key for lasso selection
        actionKeyMap: { lasso: 'shift' }
      })

      // Handle point selection
      scatterplot.subscribe('select', ({ points }) => {
        if (points && points.length > 0) {
          // Store current camera state before selection
          const currentCamera = scatterplot.get('camera')

          // Set the most recently selected point as the current selected point
          const pointIndex = points[0]
          selectedPoint.value = allData ? allData[pointIndex] : null

          // Update selected points array
          selectedPoints.value = points.map((index) => allData[index])
          console.log('Selected points:', selectedPoints.value.length)

          // Restore camera position to prevent auto-panning
          scatterplot.set({ camera: currentCamera })
        } else {
          selectedPoint.value = null
          selectedPoints.value = []
        }
      })

      // Handle hover events
      scatterplot.subscribe('pointover', ({ points }) => {
        if (points && points.length > 0 && allData) {
          const pointIndex = points[0]
          hoveredPoint.value = allData[pointIndex]

          // Change cursor to pointer
          if (canvas.value) {
            canvas.value.style.cursor = 'pointer'
          }
        }
      })

      scatterplot.subscribe('pointout', () => {
        hoveredPoint.value = null

        // Reset cursor
        if (canvas.value) {
          canvas.value.style.cursor = 'default'
        }
      })

      // Handle lasso selection
      scatterplot.subscribe('lasso', ({ points }) => {
        if (points && points.length > 0 && allData) {
          // Store current camera state before selection
          const currentCamera = scatterplot.get('camera')

          // Update selected points array
          selectedPoints.value = points.map((index) => allData[index])
          console.log('Lasso selected points:', selectedPoints.value.length)

          // Set the most recently selected point as the current selected point
          if (selectedPoints.value.length > 0) {
            selectedPoint.value = selectedPoints.value[0]
          }

          // Restore camera position to prevent auto-panning
          scatterplot.set({ camera: currentCamera })
        }
      })

      // Set up resize observer
      if (!resizeObserver) {
        resizeObserver = new ResizeObserver(() => {
          resizeVisualization()
        })
        resizeObserver.observe(canvas.value.parentElement)
      }
    } catch (err) {
      console.error('Error initializing scatterplot:', err)
    }
  }

  function getPointTimestamp(point) {
    const timestamp = point.timestamp

    if (!timestamp) return null

    // If it's already a Date object, return it
    if (timestamp instanceof Date) return timestamp

    // If it's a string with ISO format
    if (typeof timestamp === 'string' && timestamp.length >= 10) {
      const date = new Date(timestamp)
      if (!isNaN(date.getTime())) return date
    }

    // If it's a number (unix timestamp)
    if (typeof timestamp === 'number') {
      const msTimestamp = timestamp < 10000000000 ? timestamp * 1000 : timestamp
      return new Date(msTimestamp)
    }

    return null
  }

  function transformData(rawData) {
    if (!rawData?.length) return

    allData = rawData // Store for filtering later
    selectedPoints.value = [] // Reset selected points when data changes

    console.log(`Processing ${rawData.length} rows of data`)

    // Filter out invalid timestamps and transform data
    const validData = rawData.filter((msg) => getPointTimestamp(msg) !== null)

    if (!validData.length) {
      console.warn('No valid dates found after filtering')
      return
    }

    // Create a sorted copy of the data for arrow key navigation
    sortedDataByTime = [...validData].sort((a, b) => {
      const timeA = getPointTimestamp(a).getTime()
      const timeB = getPointTimestamp(b).getTime()
      return timeA - timeB
    })

    console.log(
      `Filtered ${rawData.length - validData.length} invalid timestamps, ${
        validData.length
      } remaining`
    )

    // Initialize color map if needed
    const getSender = (msg) => msg.sender || 'unknown'

    if (colorMap.getAllSenders().length === 0) {
      colorMap.initialize(validData, getSender)
    }

    try {
      // Get the date range
      const timestamps = validData.map((msg) => getPointTimestamp(msg))
      const [startDate, endDate] = d3.extent(timestamps)

      // Create scales for x and y coordinates
      const xScale = d3.scaleTime().domain([startDate, endDate]).range([-1, 1])

      // Prepare data in columnar format for the scatterplot
      const x = []
      const y = []
      const categories = []

      validData.forEach((msg) => {
        const date = getPointTimestamp(msg)
        if (!date) return

        // X coordinate: scaled date
        x.push(xScale(date))

        // Y coordinate: time of day normalized to [-1, 1]
        const hours = date.getHours()
        const minutes = date.getMinutes()
        const normalizedTime = ((hours * 60 + minutes) / (24 * 60)) * 2 - 1
        y.push(normalizedTime)

        // Category for coloring
        const sender = getSender(msg)
        const senderIndex = colorMap.getSenderIndex(sender)
        categories.push(senderIndex)
      })

      console.log(`Generated ${x.length} points for visualization`)

      if (scatterplot && x.length > 0) {
        // Prepare colors from the color map
        const uniqueSenders = colorMap.getAllSenders()
        const colors = uniqueSenders.map((sender) => {
          const colorValue = colorMap.getSenderColorValue(sender)
          const color = d3.rgb(d3.interpolateTurbo(colorValue))
          return [color.r / 255, color.g / 255, color.b / 255, 1]
        })

        // Set color configuration
        scatterplot.set({
          colorBy: 'category',
          pointColor: colors,
          pointSize: 1.5,
          opacity: 0.92
        })

        // Draw with categories for coloring
        scatterplot.draw({ x, y, category: categories })
      }
    } catch (err) {
      console.error('Error transforming data:', err)
    }
  }

  // Filter points without moving the camera
  function filterPointsWithoutMoving(indices, isTextSearch = false) {
    if (!scatterplot || !allData || !indices.length) return

    console.log(
      'Filtering to show',
      indices.length,
      'points',
      isTextSearch ? 'from text search' : ''
    )

    // Update selected points based on filtered indices
    selectedPoints.value = indices.map((index) => allData[index])

    try {
      // Store current camera state
      const currentCamera = scatterplot.get('camera')

      // Use filter to show only the selected points
      scatterplot.filter(indices)

      // If this is a text search, make points twice as big
      if (isTextSearch) {
        scatterplot.set({ pointSize: 3.0 })
      }

      // Restore camera position to prevent auto-panning
      scatterplot.set({ camera: currentCamera })
    } catch (err) {
      console.error('Error filtering points:', err)
    }
  }

  // Reset the view and selection
  function resetView() {
    if (!scatterplot) return

    try {
      console.log('Resetting view and restoring colors')

      // Store the current camera state
      const currentCamera = scatterplot.get('camera')

      // Reset point filtering
      scatterplot.reset()

      // Reset point size back to default
      scatterplot.set({ pointSize: 1.5 })

      // Restore camera position to prevent auto-panning
      scatterplot.set({ camera: currentCamera })

      // Clear selection
      selectedPoint.value = null
      selectedPoints.value = []
    } catch (err) {
      console.error('Error resetting view:', err)
    }
  }

  // Clear the selected point
  function clearSelectedPoint() {
    console.log('Clearing selected points')
    selectedPoint.value = null
    selectedPoints.value = []

    if (scatterplot) {
      scatterplot.deselect()
    }
  }

  // Resize the visualization to match container
  function resizeVisualization() {
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

    // Use VueUse's useEventListener instead of manually managing listeners
    // This will automatically clean up when the component is unmounted
  })

  // Use VueUse's useEventListener to handle keyboard navigation
  // These will automatically be cleaned up when the component is unmounted
  useEventListener(document, 'keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      handleLeftArrow()
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      handleRightArrow()
    }
  })

  // The rest of onUnmounted can be simplified since useEventListener handles cleanup
  onUnmounted(() => {
    if (resizeObserver) {
      resizeObserver.disconnect()
      resizeObserver = null
    }
    if (scatterplot) {
      scatterplot.destroy()
      scatterplot = null
    }

    allData = null
    sortedDataByTime = null
    selectedPoint.value = null
    selectedPoints.value = []
  })

  return {
    canvas,
    transformData,
    initScatterplot,
    filterPointsWithoutMoving,
    resetView,
    selectedPoint,
    selectedPoints,
    hoveredPoint,
    clearSelectedPoint,
    resizeVisualization
  }
}
