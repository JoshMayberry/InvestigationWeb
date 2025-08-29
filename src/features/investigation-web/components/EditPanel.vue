<template>
  <aside class="edit-panel">
    <h2>Edit Node</h2>
    <div v-if="localNode">
      <label>
        Label:
        <input v-model="localNode.label" />
      </label>
      <label>
        Color:
        <input type="color" v-model="localNode.color" />
      </label>
      <label>
        Radius:
        <input type="number" v-model.number="localNode.r" min="1" max="100" />
      </label>
      <button @click="emitUpdate">Save</button>
      <button @click="emitDelete" class="danger">Delete</button>
    </div>
    <div v-else>
      <em>Select a node to edit.</em>
    </div>
  </aside>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import type { NodeAny } from "../types/node";

export default defineComponent({
  name: "EditPanel",
  props: {
    node: {
      type: Object as () => NodeAny | null,
      default: null,
    },
  },
  emits: ["update", "delete"],
  data() {
    return {
      localNode: this.node ? { ...this.node } : null as NodeAny | null,
    };
  },
  watch: {
    node: {
      handler(newNode) {
        console.log("EditPanel: node prop changed", newNode);
        this.localNode = newNode ? { ...newNode } : null;
      },
      deep: true,
    },
  },
  methods: {
    emitUpdate() {
      if (this.localNode) {
        this.$emit("update", { ...this.localNode });
      }
    },
    emitDelete() {
      if (this.localNode) {
        this.$emit("delete", this.localNode.id);
      }
    },
  },
});
</script>

<style scoped>
.edit-panel {
  background: #232946;
  color: #fff;
  padding: 1.5em;
  min-width: 280px;
  max-width: 340px;
  border-right: 2px solid #1b2460;
  display: flex;
  flex-direction: column;
  gap: 1em;
}
.edit-panel label {
  display: flex;
  flex-direction: column;
  margin-bottom: 0.7em;
}
.edit-panel input[type="color"] {
  width: 2.5em;
  height: 2em;
  border: none;
  background: none;
  margin-top: 0.3em;
}
.edit-panel button {
  margin-right: 0.5em;
  padding: 0.4em 1.2em;
  border-radius: 4px;
  border: none;
  background: #10b981;
  color: #fff;
  cursor: pointer;
}
.edit-panel button.danger {
  background: #e74c3c;
}
</style>