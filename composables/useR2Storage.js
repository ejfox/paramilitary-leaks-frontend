/**
 * Simple composable for fetching from R2
 */
export function useR2Storage() {
  const config = useRuntimeConfig()

  /**
   * Get the URL for the parquet file
   * @returns {string} - The URL to the file
   */
  function getFileUrl() {
    return config.public.R2_PARQUET_URL
  }

  /**
   * Fetch the parquet file
   * @returns {Promise<Response>} - The fetch response
   */
  async function fetchFile() {
    const url = getFileUrl()
    console.log(`Fetching parquet file from: ${url}`)

    try {
      // Simpler fetch with minimal headers to avoid CORS issues
      console.log('Fetching file with simple GET request...')
      const response = await fetch(url, {
        method: 'GET',
        // No custom headers to avoid preflight requests
        mode: 'cors',
        credentials: 'omit'
      })

      if (!response.ok) {
        console.error(
          `Failed to fetch file: ${response.status} ${response.statusText}`
        )
        // Log all response headers for debugging
        console.log('Response headers:')
        response.headers.forEach((value, key) => {
          console.log(`${key}: ${value}`)
        })
      } else {
        console.log('Successfully fetched file!')
        // Log the content type and size
        console.log(`Content-Type: ${response.headers.get('content-type')}`)
        console.log(
          `Content-Length: ${response.headers.get('content-length')} bytes`
        )
      }

      return response
    } catch (error) {
      console.error('Error fetching file:', error)
      // More detailed error logging
      if (
        error.name === 'TypeError' &&
        error.message.includes('Failed to fetch')
      ) {
        console.error(
          'This might be a CORS issue or the server is unreachable.'
        )
        console.error('Check that the R2 bucket has proper CORS configuration.')
        console.error(
          'Try accessing the URL directly in your browser to verify it works.'
        )
      }
      throw new Error(`Failed to fetch file: ${error.message}`)
    }
  }

  return {
    getFileUrl,
    fetchFile
  }
}
