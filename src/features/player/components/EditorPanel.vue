<template>
  <div class="editor-panel">
    <div class="panel-scroll">
      <FullImage
        :photo="photo"
        :fill="false"
      />
      <div class="notes">
        <label>Notes</label>
        <textarea
          :value="notes"
          @input="$emit('update:notes', ($event.target as HTMLTextAreaElement).value)"
          placeholder="Enter notes/comments..."
        />
      </div>
    </div>

    <div class="panel-actions">
      <button class="save" :class="{ dirty: isDirty }" :disabled="!isDirty" @click="$emit('save')">Save</button>
      <button class="clear" @click="$emit('clear')">Clear</button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import FullImage from "@features/player/components/FullImage.vue";
import type { PhotoFile } from "@shared/stores/playerMessage";

type DrawerMeta = { icon?: string; label?: string };

export default defineComponent({
  name: "EditorPanel",
  components: { FullImage },
  props: {
    drawer: { type: Object as PropType<DrawerMeta>, default: () => ({}) },
    photo: { type: Object as PropType<PhotoFile | null>, default: null },
    otherFileName: { type: String as PropType<string | null>, default: null },
    notes: { type: String, default: "" },
    isDirty: { type: Boolean, default: false },
  },
  emits: ["update:notes", "clear", "save"],
});
</script>

<style scoped>
.editor-panel {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;  /* occupy allocated space */
  height: 100%;    /* respect parent’s height */
  min-height: 0;   /* allow inner scroll */
  color: var(--text);
  overflow: hidden; /* prevent panel from growing beyond its slot */
}

/* Single scroll surface for the whole editor area */
.panel-scroll {
  flex: 1 1 auto;
  min-height: 0;        /* key for scrolling inside flex */
  overflow-y: auto;     /* vertical scroll only */
  overflow-x: hidden;
  padding: 0.5rem;
  background: var(--panel);
  border-radius: 10px;
}

/* Ensure FullImage itself doesn't create nested scrollbars here */
:deep(.image-wrap) { max-height: none !important; overflow: visible !important; }

/* Notes UI */
.notes label { display: block; font-weight: 600; margin: 10px 0 6px; }
.notes textarea {
  width: 100%;
  min-height: 120px;
  resize: vertical;
  border-radius: 8px;
  border: 1px solid var(--muted);
  padding: 8px;
  background: var(--panel);
  color: var(--text);
}

/* Actions bar */
.panel-actions {
  flex: 0 0 auto;   /* don’t grow */
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding-top: 8px;
}
.save {
  background: var(--muted);
  color: #000;
  border: none;
  border-radius: 6px;
  padding: 0.4rem 0.8rem;
  cursor: not-allowed;
  opacity: 0.8;
}
.save.dirty { background: var(--accent); cursor: pointer; opacity: 1; }
.clear {
  background: var(--panel);
  color: var(--text);
  border: 1px solid var(--muted);
  border-radius: 6px;
  padding: 0.4rem 0.8rem;
  cursor: pointer;
}
</style>