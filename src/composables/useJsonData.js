// JSON Data Provider
import { ref, reactive } from 'vue'

export function useJsonData() {
  const jsonData = ref({})
  const jsonError = ref(null)
  const jsonPanelVisible = ref(false)

  const parseJsonData = (jsonText) => {
    try {
      const parsed = JSON.parse(jsonText)
      jsonData.value = parsed
      jsonError.value = null
      return true
    } catch (error) {
      jsonError.value = `JSON Parse Error: ${error.message}`
      return false
    }
  }

  const toggleJsonPanel = () => {
    jsonPanelVisible.value = !jsonPanelVisible.value
  }

  const getValueFromPath = (path) => {
    if (!path || typeof path !== 'string') return null

    try {
      const keys = path.split('.')
      let current = jsonData.value

      for (const key of keys) {
        if (current === null || current === undefined) {
          return null
        }
        current = current[key]
      }

      return current
    } catch (error) {
      console.error('Error accessing JSON path:', path, error)
      return null
    }
  }

  return {
    jsonData,
    jsonError,
    jsonPanelVisible,
    parseJsonData,
    toggleJsonPanel,
    getValueFromPath,
  }
}
