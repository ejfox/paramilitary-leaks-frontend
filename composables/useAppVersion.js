/**
 * Hook to get the application version from package.json
 * Can be used anywhere in the app to display the current version
 */
export function useAppVersion() {
  const config = useRuntimeConfig()
  const version = config.public.version || '0.0.0'
  
  return {
    version,
    versionWithPrefix: computed(() => `v${version}`),
    versionMajor: computed(() => version.split('.')[0]),
    versionMinor: computed(() => version.split('.')[1]),
    versionPatch: computed(() => version.split('.')[2])
  }
}