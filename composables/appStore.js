import { createGlobalState } from '@vueuse/core'
import { ref, reactive } from 'vue'

// WARNING: NEVER store visualization data in the store!
// Large datasets should be kept as vanilla JS arrays in the visualization component
// or processed directly from the data source to visualization format.
export const useAppStore = createGlobalState(() => {
  // UI state only
  const loading = ref(true)
  const error = ref(null)
  const tooltip = ref({ show: false, data: null, x: 0, y: 0 })

  // Global filters
  const filters = reactive({
    startDate: '',
    endDate: '',
    sender: '',
    chat: '',
    searchTerm: ''
  })

  return {
    // UI State only - NO visualization data!
    loading,
    error,
    tooltip,
    filters,

    // Mutations
    setLoading: (isLoading) => (loading.value = isLoading),
    setError: (err) => (error.value = err),
    setTooltip: (show, data = null, x = 0, y = 0) => {
      tooltip.value = { show, data, x, y }
    },

    // Filter mutations
    setDateRange: (start, end) => {
      filters.startDate = start
      filters.endDate = end
    },
    setSender: (sender) => {
      filters.sender = sender
    },
    setChat: (chat) => {
      filters.chat = chat
    },
    setSearchTerm: (term) => {
      filters.searchTerm = term
    },
    resetFilters: () => {
      filters.startDate = ''
      filters.endDate = ''
      filters.sender = ''
      filters.chat = ''
      filters.searchTerm = ''
    }
  }
})
