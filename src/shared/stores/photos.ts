import { defineStore } from 'pinia'

export interface PhotoFile {
  name: string
  url: string
}

export const usePlayerPhotoStore = defineStore('playerPhoto', {
  state: () => ({
    selectedPhoto: null as PhotoFile | null
  }),
  actions: {
    selectPhoto(photo: PhotoFile) {
      this.selectedPhoto = photo
      localStorage.setItem('selectedPhoto', JSON.stringify(photo))
    },
    deselectPhoto() {
      this.selectedPhoto = null
      localStorage.removeItem('selectedPhoto')
    },
    loadFromStorage() {
      const data = localStorage.getItem('selectedPhoto')
      if (!data) {
        this.selectedPhoto = null
        return
      }
      try {
        // Try to parse as JSON (object)
        this.selectedPhoto = JSON.parse(data)
      } catch {
        // Fallback: treat as string (URL)
        this.selectedPhoto = { name: data, url: data }
      }
    }
  }
})

// Listen for changes from other tabs
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === 'selectedPhoto') {
      const store = usePlayerPhotoStore()
      store.selectedPhoto = event.newValue ? JSON.parse(event.newValue) : null
    }
  })
}