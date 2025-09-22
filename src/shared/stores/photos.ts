import { defineStore } from 'pinia'
import { createChannel } from "@shared/utils/broadcast";

const PHOTO_CH = createChannel("player-photo");

export interface PhotoFile {
  name: string
  url: string
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(String(fr.result));
    fr.onerror = () => rej(new Error("failed to read file"));
    fr.readAsDataURL(file);
  });
}

export const usePlayerPhotoStore = defineStore('playerPhoto', {
  state: () => ({
    selectedPhoto: null as PhotoFile | null
  }),
  actions: {
    // accept either {name,url} or a File
    async selectPhoto(photo: PhotoFile | File) {
      let p: PhotoFile;
      if (photo instanceof File) {
        const url = await fileToDataUrl(photo);
        p = { name: photo.name || "image", url };
      } else {
        p = { name: photo.name, url: photo.url };
      }
      this.selectedPhoto = p;
      try { localStorage.setItem('selectedPhoto', JSON.stringify(p)); } catch {}
      PHOTO_CH.post({ type: "photo:set", photo: p });
    },
    deselectPhoto() {
      this.selectedPhoto = null;
      try { localStorage.removeItem('selectedPhoto'); } catch {}
      PHOTO_CH.post({ type: "photo:clear" });
    },
    loadFromStorage() {
      const data = localStorage.getItem('selectedPhoto');
      if (!data) { this.selectedPhoto = null; return; }
      try { this.selectedPhoto = JSON.parse(data); }
      catch { this.selectedPhoto = { name: data, url: data }; }
    }
  }
});

// Cross-tab updates - only accept well-formed photo objects with string url
PHOTO_CH.onMessage((msg:any) => {
  if (!msg || typeof msg !== "object") return;
  const store = usePlayerPhotoStore();
  if (msg.type === "photo:set" && msg.photo && typeof msg.photo.url === "string") {
    store.selectedPhoto = { name: String(msg.photo.name || "image"), url: String(msg.photo.url) };
  }
  if (msg.type === "photo:clear") store.selectedPhoto = null;
});