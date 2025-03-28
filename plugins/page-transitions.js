export default defineNuxtPlugin((nuxtApp) => {
  // Add transition hooks
  nuxtApp.hook('page:transition:finish', () => {
    // You can add any post-transition animation effects here
    // For example, staggered animations for page elements

    // Reset scroll position on page change
    window.scrollTo(0, 0)
  })
})
