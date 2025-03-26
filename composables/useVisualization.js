import { ref, onMounted, onUnmounted, watch } from 'vue'
// Fix potential import issues with regl-scatterplot
import * as reglScatterplotModule from 'regl-scatterplot'

// Handle both default and named exports
const createScatterplot =
  reglScatterplotModule.default ||
  reglScatterplotModule.createScatterplot ||
  reglScatterplotModule
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

  function initScatterplot(canvasElement, customOptions = {}) {
    try {
      // If a canvas element is provided, use it
      if (canvasElement) {
        canvas.value = canvasElement
      }

      // Validate canvas
      if (!canvas.value) {
        console.error(
          'Scatterplot initialization failed: Canvas element is missing'
        )
        return false
      }

      console.log('Initializing scatterplot with canvas:', canvas.value)

      // Cleanup any existing scatterplot instance
      if (scatterplot) {
        try {
          scatterplot.destroy()
        } catch (err) {
          console.warn('Error destroying previous scatterplot instance:', err)
        }
        scatterplot = null
      }

      // Get the parent container dimensions
      const container = canvas.value.parentElement
      if (!container) {
        console.error(
          'Scatterplot initialization failed: Canvas has no parent element'
        )
        return false
      }

      const rect = container.getBoundingClientRect()
      const width = rect.width || 300 // Fallback width
      const height = rect.height || 200 // Fallback height

      console.log(
        `Initializing scatterplot with dimensions: ${width}x${height}`
      )

      // Set canvas dimensions explicitly
      canvas.value.width = width
      canvas.value.height = height
      canvas.value.style.width = width + 'px'
      canvas.value.style.height = height + 'px'

      // Default options
      const defaultOptions = {
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
      }

      // Merge default options with custom options
      const finalOptions = { ...defaultOptions, ...customOptions }

      // Create scatterplot with the specified configuration
      scatterplot = createScatterplot(finalOptions)

      // Make the scatterplot accessible globally for debugging
      if (typeof window !== 'undefined') {
        window._scatterplot = scatterplot
      }

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
      return true
    } catch (err) {
      console.error('Fatal error initializing scatterplot:', err)
      return false
    }
  }

  function getPointTimestamp(point) {
    if (!point) return null

    // Support multiple timestamp field names
    const timestamp = point.timestamp || point.date

    if (!timestamp) {
      console.warn('Point missing timestamp:', point)
      return null
    }

    // If it's already a Date object, return it
    if (timestamp instanceof Date) return timestamp

    // If it's a string with ISO format
    if (typeof timestamp === 'string') {
      // Log a sample of timestamps for debugging (only occasionally)
      if (Math.random() < 0.0001) {
        // Log only 0.01% of timestamps
        console.log('Sample timestamp string format:', timestamp)
      }

      try {
        // First try parsing as-is
        const date = new Date(timestamp)
        if (!isNaN(date.getTime())) return date

        // If that fails, try parsing just the date portion for partial ISO strings
        if (timestamp.includes('-') && timestamp.length >= 10) {
          const datePart = timestamp.substring(0, 10)
          const dateOnlyObj = new Date(datePart)
          if (!isNaN(dateOnlyObj.getTime())) return dateOnlyObj
        }

        // Try unix-style timestamp if it's all digits
        if (/^\d+$/.test(timestamp)) {
          const num = parseInt(timestamp, 10)
          // Convert to ms if needed (seconds vs milliseconds)
          const msTimestamp = num < 10000000000 ? num * 1000 : num
          const unixDate = new Date(msTimestamp)
          if (!isNaN(unixDate.getTime())) return unixDate
        }
      } catch (err) {
        console.warn('Failed to parse string timestamp:', timestamp)
      }
    }

    // If it's a number (unix timestamp)
    if (typeof timestamp === 'number') {
      try {
        // Convert seconds to milliseconds if needed
        const msTimestamp =
          timestamp < 10000000000 ? timestamp * 1000 : timestamp
        const date = new Date(msTimestamp)
        if (!isNaN(date.getTime())) return date
      } catch (err) {
        console.warn('Failed to parse numeric timestamp:', timestamp)
      }
    }

    // Last resort: if the point has from/from_date separate fields
    if (point.from_date) {
      try {
        const date = new Date(point.from_date)
        if (!isNaN(date.getTime())) return date
      } catch (err) {
        console.warn('Failed to parse from_date:', point.from_date)
      }
    }

    return null
  }

  // Track batching state
  let currentBatchTimeout = null
  let isProcessingBatch = false
  let remainingPoints = []
  const BATCH_SIZE = 1000 // Process 1000 points at a time
  const BATCH_DELAY = 10 // Milliseconds between batches

  // Create refs for streaming progress
  const streamingStatus = reactive({
    active: false,
    processed: 0,
    total: 0,
    startTime: 0,
    message: ''
  })

  function transformData(rawData, options = {}) {
    if (!rawData?.length) {
      console.warn('No data provided to transformData')
      return
    }

    // Cancel any existing batch processing
    if (currentBatchTimeout) {
      clearTimeout(currentBatchTimeout)
      currentBatchTimeout = null
    }

    // Store for filtering later
    allData = rawData
    selectedPoints.value = [] // Reset selected points when data changes

    // Set up streaming mode
    const streaming = options.streaming !== false // Default to streaming mode

    console.log(
      `Processing ${rawData.length} rows of data${
        streaming ? ' in streaming mode' : ''
      }`
    )

    try {
      // First verify the data structure and log a sample
      console.log('Sample data point:', rawData[0])

      // Check timestamp parsing for first few points
      const samplePoints = rawData.slice(0, 5)
      console.log(
        'Timestamp parsing check:',
        samplePoints.map((p) => ({
          raw: p.date || p.timestamp,
          parsed: getPointTimestamp(p),
          valid: !!getPointTimestamp(p)
        }))
      )

      // Filter out invalid timestamps and transform data
      const validData = rawData.filter((msg) => {
        const timestamp = getPointTimestamp(msg)
        if (!timestamp) {
          // For debugging: log some invalid points
          if (Math.random() < 0.01) {
            // Only log ~1% of invalid points to avoid flooding
            console.warn('Invalid timestamp in data point:', msg)
          }
          return false
        }
        return true
      })

      if (!validData.length) {
        console.error(
          'No valid dates found after filtering. Check data format!'
        )
        return
      }

      // Create a sorted copy of the data for arrow key navigation
      sortedDataByTime = [...validData].sort((a, b) => {
        try {
          const timeA = getPointTimestamp(a).getTime()
          const timeB = getPointTimestamp(b).getTime()
          return timeA - timeB
        } catch (err) {
          console.error('Error sorting by time:', err)
          return 0
        }
      })

      console.log(
        `Filtered ${rawData.length - validData.length} invalid timestamps, ${
          validData.length
        } remaining`
      )

      // Get sender with fallback to multiple field formats
      const getSender = (msg) => {
        return msg.from || msg.sender || msg.sender_name || 'unknown'
      }

      // Initialize color map if needed
      if (colorMap.getAllSenders().length === 0) {
        colorMap.initialize(validData, getSender)
      }

      // Check if scatterplot is initialized
      if (!scatterplot) {
        console.error('Scatterplot not initialized! Canvas may be missing.')
        return
      }

      // Preserve the current camera state if available
      let currentCamera = null
      try {
        currentCamera = scatterplot ? scatterplot.get('camera') : null
      } catch (err) {
        console.warn('Failed to get camera state:', err)
      }

      // Calculate date range with error handling
      let startDate, endDate
      try {
        const timestamps = validData.map((msg) => getPointTimestamp(msg))
        const extent = d3.extent(timestamps)
        startDate = extent[0]
        endDate = extent[1]

        // Safety check
        if (!startDate || !endDate) {
          throw new Error('Failed to determine date range')
        }

        // Add padding to date range to avoid edge points being exactly at the boundary
        const range = endDate.getTime() - startDate.getTime()
        const padding = range * 0.01 // 1% padding
        startDate = new Date(startDate.getTime() - padding)
        endDate = new Date(endDate.getTime() + padding)
      } catch (err) {
        console.error('Error calculating date range:', err)
        // Fallback to a reasonable date range if we can't determine from data
        startDate = new Date('2020-01-01')
        endDate = new Date('2023-12-31')
      }

      // Create scales for x and y coordinates
      const xScale = d3.scaleTime().domain([startDate, endDate]).range([-1, 1])

      // Prepare colors from the color map
      const uniqueSenders = colorMap.getAllSenders()
      const colors = uniqueSenders.map((sender) => {
        try {
          const colorValue = colorMap.getSenderColorValue(sender)
          const color = d3.rgb(d3.interpolateTurbo(colorValue))
          return [color.r / 255, color.g / 255, color.b / 255, 1]
        } catch (colorErr) {
          console.warn(`Error generating color for ${sender}:`, colorErr)
          // Fallback color
          return [0.5, 0.5, 0.5, 1]
        }
      })

      // Set color configuration once
      scatterplot.set({
        colorBy: 'category',
        pointColor: colors,
        pointSize: 1.5,
        opacity: 0.92
      })

      // Arrays for all points
      let allX = []
      let allY = []
      let allCategories = []

      // Function to process a batch of points
      const processBatch = (dataToProcess, isLastBatch) => {
        console.log(`Processing batch of ${dataToProcess.length} points`)

        // Process each point in the batch
        dataToProcess.forEach((msg, index) => {
          try {
            const date = getPointTimestamp(msg)
            if (!date) return

            // Calculate X coordinate (date)
            const xCoord = xScale(date)
            if (isNaN(xCoord)) return

            // Calculate Y coordinate (time of day)
            let yCoord
            try {
              const hours = date.getHours()
              const minutes = date.getMinutes()
              yCoord = ((hours * 60 + minutes) / (24 * 60)) * 2 - 1

              // Add slight random jitter to avoid exact overlaps
              yCoord += (Math.random() - 0.5) * 0.005

              if (isNaN(yCoord)) return
            } catch (timeErr) {
              // Fallback: use a random Y position
              yCoord = Math.random() * 2 - 1
            }

            // Get category (sender) for coloring
            let categoryIndex
            try {
              const sender = getSender(msg)
              categoryIndex = colorMap.getSenderIndex(sender)

              // Fallback for unknown sender
              if (categoryIndex === undefined || categoryIndex < 0) {
                categoryIndex = 0
              }
            } catch (catErr) {
              categoryIndex = 0
            }

            // Add the point to the full arrays
            allX.push(xCoord)
            allY.push(yCoord)
            allCategories.push(categoryIndex)
          } catch (pointErr) {
            // Silently ignore individual point errors
          }
        })

        // Only draw on the last batch or if we're not streaming
        if (isLastBatch || !streaming) {
          try {
            console.log(`Drawing all ${allX.length} points...`)

            // Safety check - if we have no valid points, create at least one dummy point
            if (allX.length === 0) {
              console.warn(
                'No valid points to draw! Adding a dummy point to avoid errors.'
              )
              allX.push(0)
              allY.push(0)
              allCategories.push(0)
            }

            scatterplot.draw({
              x: allX,
              y: allY,
              category: allCategories
            })

            // Restore camera position
            if (currentCamera) {
              scatterplot.set({ camera: currentCamera })
            }
          } catch (drawErr) {
            console.error('Error drawing points:', drawErr)
          }
        }
      }

      // Function to process the next batch
      const processNextBatch = () => {
        // Reset timeout reference
        currentBatchTimeout = null

        // If there are no points left or we're stopping, exit
        if (remainingPoints.length === 0 || !isProcessingBatch) {
          console.log('Finished processing all batches')
          isProcessingBatch = false
          return
        }

        // Determine batch size
        const batchSize = Math.min(BATCH_SIZE, remainingPoints.length)

        // Get the next batch
        const batch = remainingPoints.splice(0, batchSize)

        // Process this batch
        processBatch(
          batch,
          remainingPoints.length === 0 // isLastBatch
        )

        // Update progress
        streamingStatus.processed = validData.length - remainingPoints.length

        // Schedule next batch if there are more points
        if (remainingPoints.length > 0) {
          currentBatchTimeout = setTimeout(processNextBatch, BATCH_DELAY)
        } else {
          isProcessingBatch = false
          streamingStatus.active = false
          streamingStatus.processed = streamingStatus.total
          console.log('All batches processed successfully')
        }
      }

      // Start batch processing if we're streaming
      if (streaming && validData.length > BATCH_SIZE) {
        console.log(`Using batched processing for ${validData.length} points`)

        // Set up remaining points
        remainingPoints = [...validData]
        isProcessingBatch = true

        // Update streaming status
        streamingStatus.active = true
        streamingStatus.total = validData.length
        streamingStatus.processed = 0
        streamingStatus.startTime = Date.now()
        streamingStatus.message = 'Processing visualization data...'

        // Start the first batch immediately
        processNextBatch()
      } else {
        // For small datasets or when streaming is disabled, process all at once
        console.log('Processing all points at once')

        // Prepare data in columnar format for the scatterplot
        x = []
        y = []
        categories = []

        validData.forEach((msg, index) => {
          try {
            const date = getPointTimestamp(msg)
            if (!date) return

            // Calculate X coordinate (date)
            const xCoord = xScale(date)
            if (isNaN(xCoord)) return

            // Calculate Y coordinate (time of day)
            let yCoord
            try {
              const hours = date.getHours()
              const minutes = date.getMinutes()
              yCoord = ((hours * 60 + minutes) / (24 * 60)) * 2 - 1
              // Add jitter
              yCoord += (Math.random() - 0.5) * 0.005
            } catch (timeErr) {
              yCoord = Math.random() * 2 - 1
            }

            // Get category (sender) for coloring
            let categoryIndex = 0
            try {
              const sender = getSender(msg)
              categoryIndex = colorMap.getSenderIndex(sender) || 0
            } catch (catErr) {
              // Use default category
            }

            // Add the point
            x.push(xCoord)
            y.push(yCoord)
            categories.push(categoryIndex)
          } catch (pointErr) {
            // Ignore errors for individual points
          }
        })

        console.log(`Generated ${x.length} points for immediate drawing`)

        if (x.length > 0) {
          try {
            // Draw all points at once
            console.log('Drawing all points...')
            scatterplot.draw({ x, y, category: categories })

            // Restore camera position
            if (currentCamera) {
              scatterplot.set({ camera: currentCamera })
            }

            console.log('All points drawn successfully')
          } catch (drawErr) {
            console.error('Error drawing all points:', drawErr)
          }
        } else {
          console.error('No valid points to draw!')

          // Add a single dummy point to avoid rendering errors
          try {
            console.warn('Adding a dummy point to avoid rendering errors')
            scatterplot.draw({
              x: [0],
              y: [0],
              category: [0]
            })
          } catch (fallbackErr) {
            console.error('Fallback rendering also failed:', fallbackErr)
          }
        }
      }
    } catch (err) {
      console.error('Fatal error transforming data:', err)
    }
  }

  // Filter points without moving the camera
  function filterPointsWithoutMoving(
    indices,
    isTextSearch = false,
    dimOthers = false
  ) {
    if (!scatterplot || !allData) return

    if (indices.length === 0) {
      // If no indices, just reset the view but preserve camera
      const currentCamera = scatterplot.get('camera')
      resetView()
      scatterplot.set({ camera: currentCamera })
      return
    }

    // Store current camera state
    const currentCamera = scatterplot.get('camera')

    // Create a new array for filtered indices
    const filteredIndices = indices

    // Update selectedPoints array regardless of dimming approach
    selectedPoints.value = filteredIndices.map((index) => allData[index])

    // Determine what to do with points not in the filtered set
    if (dimOthers || isTextSearch) {
      // Also dim others for text search
      // Dim other points by setting them as "inactive" rather than completely filtering them
      const allIndices = Array.from({ length: allData.length }, (_, i) => i)

      // Set which points are active vs inactive
      scatterplot.deselect()

      // For text search, we want to highlight all matches
      if (isTextSearch) {
        // Set all filtered points as selected
        scatterplot.select(filteredIndices)

        // Make non-matching points very dim
        scatterplot.set({
          opacityInactiveScale: 0.1, // Even dimmer for text search
          pointsInactive: allIndices.filter((i) => !filteredIndices.includes(i))
        })
      } else {
        // For other filters, use normal dimming
        scatterplot.select(filteredIndices)
        scatterplot.set({
          opacityInactiveScale: 0.15,
          pointsInactive: allIndices.filter((i) => !filteredIndices.includes(i))
        })
      }
    } else {
      // Original behavior - filter points
      scatterplot.select([])
      scatterplot.filter(filteredIndices)
    }

    // Restore camera position to prevent auto-panning
    scatterplot.set({ camera: currentCamera })
  }

  // Reset the view to show all points
  function resetView() {
    if (!scatterplot || !allData) return

    try {
      console.log('Resetting view and redrawing all points')

      // Store current camera state - save this FIRST before any other operations
      const currentCamera = scatterplot.get('camera')

      // Reset filters and selection
      scatterplot.filter(null)
      scatterplot.deselect()

      // Reset point size and opacity
      scatterplot.set({
        pointSize: 1.5,
        opacityInactiveScale: 0.3,
        pointsInactive: [] // Clear any dimmed points
      })

      // Redraw all points from scratch if needed
      if (scatterplot.get('points').length === 0) {
        // If no points are visible, transform the data again
        const oldCamera = { ...currentCamera } // Make a copy before transformData
        transformData(allData)
        // Restore camera after transform
        scatterplot.set({ camera: oldCamera })
      } else {
        // Otherwise just redraw with current data
        scatterplot.draw()
      }

      // Always restore the original camera position at the end
      scatterplot.set({ camera: currentCamera })

      // Clear selected point
      selectedPoint.value = null
      selectedPoints.value = []
      hoveredPoint.value = null
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

  // Clean up any streaming in progress
  function cancelStreamingPoints() {
    if (currentBatchTimeout) {
      clearTimeout(currentBatchTimeout)
      currentBatchTimeout = null
    }
    isProcessingBatch = false
    remainingPoints = []
    streamingStatus.active = false
    console.log('Streaming point loading canceled')
  }

  // The rest of onUnmounted can be simplified since useEventListener handles cleanup
  onUnmounted(() => {
    // Cancel any ongoing streaming
    cancelStreamingPoints()

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
    resizeVisualization,
    cancelStreamingPoints,
    streamingStatus
  }
}
