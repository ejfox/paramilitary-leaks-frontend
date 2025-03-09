import { parse, isValid, format } from 'date-fns'

// Helper function to parse timestamps consistently
export function useTimestampParser() {
  function parseTimestamp(timestamp) {
    if (!timestamp) return NaN

    try {
      // If it's already a Date object
      if (timestamp instanceof Date) {
        return isValid(timestamp) ? timestamp.getTime() : NaN
      }

      // If it's a number (unix timestamp)
      if (typeof timestamp === 'number') {
        // Check if it's seconds (before year 2286) or milliseconds
        const date =
          timestamp < 10000000000
            ? new Date(timestamp * 1000)
            : new Date(timestamp)

        return isValid(date) ? date.getTime() : NaN
      }

      // If it's a string
      if (typeof timestamp === 'string') {
        // Try standard ISO format first
        let date = new Date(timestamp)
        if (isValid(date)) return date.getTime()

        // Try European format (DD.MM.YYYY HH:MM:SS)
        try {
          date = parse(timestamp, 'dd.MM.yyyy HH:mm:ss', new Date())
          if (isValid(date)) return date.getTime()
        } catch (e) {
          // Ignore parsing errors
        }

        // Try SQLite format (YYYY-MM-DDThh:mm:ssZ)
        try {
          date = parse(timestamp, "yyyy-MM-dd'T'HH:mm:ss'Z'", new Date())
          if (isValid(date)) return date.getTime()
        } catch (e) {
          // Ignore parsing errors
        }

        // Try Unix timestamp as string
        const unixSeconds = parseInt(timestamp, 10)
        if (!isNaN(unixSeconds)) {
          date = new Date(unixSeconds * 1000)
          if (isValid(date)) return date.getTime()
        }
      }
    } catch (e) {
      console.warn(`Error parsing timestamp: ${timestamp}`, e)
    }

    return NaN
  }

  function formatTimestamp(timestamp) {
    const parsedTime = parseTimestamp(timestamp)
    if (isNaN(parsedTime)) return 'Invalid date'
    return format(new Date(parsedTime), 'MMM d, yyyy h:mm a')
  }

  return {
    parseTimestamp,
    formatTimestamp
  }
}
