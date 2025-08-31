<template>
  <div class="image-selection-page">
    <Drawers>
      <FilePickerPanel
        :drawer="{ icon: 'folder', label: 'Folders' }"
        :folders="folderList"
        :selectedIndex="selectedFolderIndex"
        @pick-root="pickRoot"
        @select-folder="onSelectFolder"
        @refresh="refreshStructure"
      />
      <EditorPanel
        :drawer="{ icon: 'image', label: 'Preview' }"
        :photo="selectedPhoto || null"
        :otherFileName="selectedOtherName"
        :notes="currentNotes"
        :isDirty="isDirty"
        @update:notes="onUpdateNotes"
        @clear="deselect"
        @save="onSaveNotes"
      />
    </Drawers>
    <div class="gallery-container">
      <div class="gallery-header">
        <div class="title">{{ currentFolderName || 'No Root Selected' }}</div>
        <button class="refresh-folder" @click="refreshCurrentFolder" :disabled="selectedFolderIndex === null">Refresh Folder</button>
      </div>

      <div class="gallery" v-if="items.length">
        <Thumbnail
          v-for="(file, i) in items"
          :key="file.name + ':' + i"
          :item="file"
          :notes="notesByKey[fileKey(file)] || ''"
          :selected="!!isSelected(file)"
          @select="onSelectFile"
        />
      </div>

      <div v-else class="empty-state">
        Choose a root folder to load files.
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import axios from "axios";
import Drawers from "@shared/components/layout/Drawers.vue";
import Thumbnail from "@features/player/components/Thumbnail.vue";
import EditorPanel from "@features/player/components/EditorPanel.vue";
import FilePickerPanel from "@features/player/components/panels/FilePickerPanel.vue";
import { toastStore } from "@shared/stores/toastStore";
import { usePlayerPhotoStore } from "@shared/stores/playerMessage";
import { saveDirHandle, loadDirHandle } from "@shared/utils/fsHandles";

type FileItem = { name: string; url: string | null; kind: "image" | "other"; mime?: string; };
type FolderEntry = { name: string; handle: FileSystemDirectoryHandle; count: number; isRoot?: boolean; };

const IMAGES_FOLDER = "images";
const IMAGES_FILENAME = "heist-1";
const LS_ROOT_NAME = "images.rootName";
const LS_FOLDER_NAME = "images.selectedFolderName";
const API_LAST_STATE = "images-last-state";
const IDB_ROOT_KEY = "images.rootHandle";

function isUsableHandle(h: any): h is FileSystemDirectoryHandle {
  return !!h && typeof h.values === "function";
}

export default defineComponent({
  name: "ImageSelectionPage",
  components: { Drawers, Thumbnail, EditorPanel, FilePickerPanel },
  data() {
    const store = usePlayerPhotoStore();
    store.loadFromStorage();
    return {
      store,
      rootHandle: null as FileSystemDirectoryHandle | null,
      folderList: [] as FolderEntry[],
      selectedFolderIndex: null as number | null,
      items: [] as FileItem[],
      notesByKey: {} as Record<string, string>,
      selectedOtherName: null as string | null,
      isDirty: false as boolean,
      lastRootName: (localStorage.getItem(LS_ROOT_NAME) || "") as string,
      lastFolderName: (localStorage.getItem(LS_FOLDER_NAME) || "") as string,
    };
  },
  computed: {
    selectedPhoto(): { name: string; url: string } | null { return this.store.selectedPhoto; },
    currentFolder(): FolderEntry | null { return this.selectedFolderIndex == null ? null : this.folderList[this.selectedFolderIndex] || null; },
    currentFolderName(): string { return this.currentFolder?.name ?? ""; },
    currentNotes(): string {
      const key = this.selectedPhoto
        ? this.fileKeyFrom(this.currentFolderName, this.selectedPhoto.name)
        : this.selectedOtherName
        ? this.fileKeyFrom(this.currentFolderName, this.selectedOtherName)
        : null;
      return key ? this.notesByKey[key] ?? "" : "";
    },
  },
  created() {
    this.loadNotes();
    // Try to restore the real handle first; if not available, show API last-known preview
    void this.tryRestoreHandle().then((restored) => {
      if (!restored) this.loadLastState();
    });
  },
  methods: {
    fileKey(file: FileItem): string { return this.fileKeyFrom(this.currentFolderName, file.name); },
    fileKeyFrom(folderName: string, name: string): string { return `${folderName || "(root)"}::${name}`; },
    isImageFile(name: string): boolean { return /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(name); },
    onSelectFile(file: FileItem) {
      if (file.kind === "image" && file.url) {
        this.selectedOtherName = null;
        this.store.selectPhoto({ name: file.name, url: file.url });
      } else {
        this.store.deselectPhoto();
        this.selectedOtherName = file.name;
      }
    },
    deselect() { this.store.deselectPhoto(); this.selectedOtherName = null; },
    isSelected(file: FileItem) {
      return (this.selectedPhoto && file.kind === "image" && file.name === this.selectedPhoto.name) ||
             (this.selectedOtherName && file.kind === "other" && file.name === this.selectedOtherName);
    },
    async tryRestoreHandle(): Promise<boolean> {
      try {
        const h = await loadDirHandle(IDB_ROOT_KEY);
        if (!h) return false;
        const perm = (await h.queryPermission?.({ mode: "read" })) || "prompt";
        if (perm !== "granted") return false;
        // Permission still granted: we can use the handle directly
        this.rootHandle = h;
        localStorage.setItem(LS_ROOT_NAME, h.name);
        await this.scanRootFolders(h);
        // restore previously selected folder if we have it
        const storedFolder = localStorage.getItem(LS_FOLDER_NAME);
        let idx = 0;
        if (storedFolder) {
          const found = this.folderList.findIndex((f) => f.name === storedFolder);
          if (found >= 0) idx = found;
        }
        this.selectedFolderIndex = idx;
        await this.loadFromFolder(this.folderList[idx].handle);
        await this.saveLastState();
        toastStore.success(`Reconnected to previous root: ${h.name}`);
        return true;
      } catch (e) {
        console.error("Restore handle failed", e);
        return false;
      }
    },
    async refreshStructure() {
      if (!isUsableHandle(this.rootHandle)) {
        if (this.lastRootName) {
          toastStore.info(`Previously used root: ${this.lastRootName}. Click "Choose Root Folder" to reconnect.`);
        } else {
          toastStore.info("No root connected. Choose Root Folder to connect.");
        }
        return;
      }
      try {
        const prev = this.currentFolderName;
        await this.scanRootFolders(this.rootHandle);
        const idx = this.folderList.findIndex((f) => f.name === prev);
        if (idx >= 0) {
          this.selectedFolderIndex = idx;
          await this.loadFromFolder(this.folderList[idx].handle);
        } else if (this.folderList.length) {
          this.selectedFolderIndex = 0;
          await this.loadFromFolder(this.folderList[0].handle);
        } else {
          this.selectedFolderIndex = null;
          this.items = [];
          this.deselect();
        }
        await this.saveLastState();
        toastStore.success("Folder structure refreshed");
      } catch (e) {
        console.error(e);
        toastStore.error("Failed to refresh folder structure");
      }
    },
    async refreshCurrentFolder() {
      const folder = this.currentFolder;
      if (!folder) return;
      if (!isUsableHandle(folder.handle)) {
        toastStore.info('Cannot refresh without an active root. Click "Choose Root Folder" to reconnect.');
        return;
      }
      try {
        await this.loadFromFolder(folder.handle);
        toastStore.success(`Refreshed: ${folder.name}`);
      } catch (e) {
        console.error(e);
        toastStore.error("Failed to refresh current folder");
      }
    },
    async pickRoot() {
      if (!window.showDirectoryPicker) {
        alert("Your browser does not support the File System Access API.");
        return;
      }
      try {
        const dirHandle = await window.showDirectoryPicker();
        this.rootHandle = dirHandle;
        localStorage.setItem(LS_ROOT_NAME, dirHandle.name);
        await saveDirHandle(IDB_ROOT_KEY, dirHandle);
        await this.scanRootFolders(dirHandle);
        const storedFolder = localStorage.getItem(LS_FOLDER_NAME);
        let idx = 0;
        if (storedFolder) {
          const found = this.folderList.findIndex((f) => f.name === storedFolder);
          if (found >= 0) idx = found;
        }
        this.selectedFolderIndex = idx;
        await this.loadFromFolder(this.folderList[idx].handle);
        await this.saveLastState();
        toastStore.success(`Root selected: ${dirHandle.name}`);
      } catch {
        // canceled
      }
    },
    async scanRootFolders(dir: FileSystemDirectoryHandle) {
      const folders: FolderEntry[] = [];
      const rootCount = await this.countImagesInDirectory(dir);
      folders.push({ name: dir.name, handle: dir, count: rootCount, isRoot: true });
      for await (const entry of dir.values()) {
        if (entry.kind === "directory") {
          const dh = entry as FileSystemDirectoryHandle;
          const count = await this.countImagesInDirectory(dh);
          folders.push({ name: entry.name, handle: dh, count });
        }
      }
      folders.sort((a, b) => { if (a.isRoot && !b.isRoot) return -1; if (!a.isRoot && b.isRoot) return 1; return a.name.localeCompare(b.name); });
      this.folderList = folders;

      if (this.selectedFolderIndex == null && this.lastFolderName) {
        const match = this.folderList.findIndex(f => f.name === this.lastFolderName);
        if (match >= 0) this.selectedFolderIndex = match;
      }
    },
    onSelectFolder(index: number) {
      this.selectedFolderIndex = index;
      const folder = this.folderList[index];
      if (!folder) return;
      localStorage.setItem(LS_FOLDER_NAME, folder.name);
      if (!isUsableHandle(folder.handle)) {
        toastStore.info('Offline preview only. Click "Choose Root Folder" to reconnect.');
        return;
      }
      void this.loadFromFolder(folder.handle)
        .then(() => this.saveLastState())
        .catch((e) => {
          console.error(e);
          toastStore.error("Failed to load folder");
        });
    },
    async countImagesInDirectory(dh: FileSystemDirectoryHandle): Promise<number> {
      let count = 0;
      for await (const entry of dh.values()) if (entry.kind === "file" && this.isImageFile(entry.name)) count++;
      return count;
    },
    async loadFromFolder(dh: FileSystemDirectoryHandle) {
      if (!isUsableHandle(dh)) throw new Error("Directory handle is not available");
      const results: FileItem[] = [];
      for await (const entry of dh.values()) {
        if (entry.kind === "file") {
          if (this.isImageFile(entry.name)) {
            const file = await (entry as FileSystemFileHandle).getFile();
            const url = URL.createObjectURL(file);
            results.push({ name: entry.name, url, kind: "image", mime: file.type });
          } else {
            results.push({ name: entry.name, url: null, kind: "other" });
          }
        }
      }
      results.sort((a, b) => a.name.localeCompare(b.name));
      this.items = results;
      const hasSelected =
        (this.selectedPhoto && results.some(r => r.kind === "image" && r.name === this.selectedPhoto!.name)) ||
        (this.selectedOtherName && results.some(r => r.kind === "other" && r.name === this.selectedOtherName));
      if (!hasSelected) this.deselect();
    },
    // API-only: Persist last-known state (compact, no blob URLs)
    async saveLastState() {
      try {
        await axios.post("/api/data", {
          folder: IMAGES_FOLDER,
          filename: API_LAST_STATE,
          data: {
            rootName: this.rootHandle?.name || this.currentFolderName || "",
            selectedFolderName: this.currentFolderName || "",
            items: this.items.map(i => ({ name: i.name, kind: i.kind, mime: i.mime })),
          },
        });
      } catch (error) {
        console.error(error);
        toastStore.error("Failed to save last-known state");
      }
    },
    // API-only: Load last-known state (offline preview)
    async loadLastState() {
      if (this.rootHandle) return;
      let state: any = null;
      try {
        const res = await axios.get("/api/data", { params: { folder: IMAGES_FOLDER, filename: API_LAST_STATE } });
        if (res && res.data && typeof res.data === "object") state = res.data;
      } catch {
        state = null;
      }
      if (!state) return;
      this.lastRootName = String(state.rootName || "");
      this.lastFolderName = String(state.selectedFolderName || "");
      const count = Array.isArray(state.items) ? state.items.filter((x: any) => x && x.kind === "image").length : 0;
      this.folderList = this.lastRootName
        ? [{ name: this.lastRootName, handle: {} as any, count, isRoot: true }]
        : [];
      this.selectedFolderIndex = this.folderList.length ? 0 : null;
      this.items = Array.isArray(state.items)
        ? state.items.map((x: any) => ({
            name: String(x.name || ""),
            url: null,
            kind: x.kind === "image" ? "image" : "other",
            mime: x.mime ? String(x.mime) : undefined,
          }))
        : [];
      toastStore.info("Showing last-known file list. Choose Root Folder to reconnect.");
    },
    async loadNotes() {
      try {
        const res = await axios.get("/api/data", { params: { folder: IMAGES_FOLDER, filename: IMAGES_FILENAME } });
        if (res && typeof res.data === "object" && !Array.isArray(res.data)) {
          this.notesByKey = res.data as Record<string, string>;
        } else {
          this.notesByKey = {};
        }
        this.isDirty = false;
        toastStore.success("Notes loaded");
      } catch (e) {
        this.notesByKey = {};
        toastStore.error("Failed to load notes");
      }
    },
    async onSaveNotes() {
      try {
        await axios.post("/api/data", { folder: IMAGES_FOLDER, filename: IMAGES_FILENAME, data: this.notesByKey });
        this.isDirty = false;
        toastStore.success("Notes saved");
      } catch (e) {
        toastStore.error("Failed to save notes");
      }
    },
    onUpdateNotes(val: string) {
      const key = this.selectedPhoto
        ? this.fileKeyFrom(this.currentFolderName, this.selectedPhoto.name)
        : this.selectedOtherName
        ? this.fileKeyFrom(this.currentFolderName, this.selectedOtherName)
        : null;
      if (!key) return;
      this.notesByKey[key] = val;
      this.isDirty = true;
    },
  },
});
</script>

<style scoped>
.image-selection-page {
  display: flex;
  flex-direction: row;
  height: 100%;
  color: var(--text);
  background: var(--bg);
}

.gallery-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding: 0.5rem;
  background: var(--panel);
  overflow: hidden;
  min-height: 0;
}

.gallery-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin: 0.25rem 0 0.5rem;
}
.title { color: var(--text); font-weight: 600; }
.refresh-folder {
  padding: 0.35rem 0.7rem;
  font-size: 14px;
  color: #000;
  background: var(--accent);
  border: none;
  border-radius: 6px;
  cursor: pointer;
}
.refresh-folder:disabled { opacity: 0.6; cursor: not-allowed; }

.gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 1rem;
  width: 100%;
  align-content: start;

  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 4px;
}

.empty-state { color: var(--muted); padding: 1rem; }
</style>