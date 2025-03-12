import pkg from './package.json'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    head: {
      title: pkg.name,
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: pkg.version }
      ]
    },
    buildAssetsDir: '/_nuxt/'
  },

  // for netlify deploy
  ssr: false,

  experimental: {
    appManifest: false
  },

  devtools: { enabled: true },

  modules: [
    // '@nuxtjs/supabase',
    '@vueuse/nuxt',
    [
      '@nuxtjs/google-fonts',
      {
        families: {
          Figtree: [400, 700]
        }
      }
    ]
  ],

  runtimeConfig: {
    public: {
      OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      PRODUCTION: process.env.PRODUCTION,
      // R2 Configuration
      R2_PARQUET_URL: process.env.R2_PARQUET_URL,
      // App version from package.json
      version: pkg.version
    }
  },

  css: ['~/assets/css/main.css'],

  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {}
    }
  },

  compatibilityDate: '2025-03-09'
})