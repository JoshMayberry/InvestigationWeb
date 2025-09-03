<template>
  <aside class="edit-panel">
    <div class="panel-scroll">
      <div v-if="localNode" class="fields">
        <label>
          Label
          <input v-model="localNode.label" type="text" placeholder="Node label..." />
        </label>
        <label>
          Color
          <input type="color" v-model="localNode.color" />
        </label>
        <label>
          Radius
          <input type="number" v-model.number="localNode.r" min="1" max="100" />
        </label>
      </div>
      <div v-else>
        <em>Select a node to edit.</em>
      </div>
    </div>
    <div class="panel-actions" v-if="localNode">
      <button class="save" @click="emitUpdate">Save</button>
      <button class="clear danger" @click="emitDelete">Delete</button>
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
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  background: var(--panel);
  color: var(--text);
  padding: 0;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.07);
  max-width: 340px;
  overflow: hidden;
}

.edit-panel h2 {
  font-size: 1.2rem;
  font-weight: 700;
  margin-bottom: 0.7em;
}

.panel-scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0.5rem;
  background: var(--panel);
  border-radius: 10px;
}

.fields {
  margin-bottom: 1rem;
}

.fields label {
  display: block;
  font-weight: 600;
  margin: 10px 0 6px;
}

.fields input[type="text"],
.fields input[type="number"] {
  width: 90%;
  border-radius: 8px;
  border: 1px solid var(--muted);
  padding: 8px;
  background: var(--panel);
  color: var(--text);
  margin-top: 4px;
}

.fields input[type="color"] {
  width: 2.5em;
  height: 2em;
  border: none;
  background: none;
  margin-top: 0.3em;
}

.panel-actions {
  flex: 0 0 auto;
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
  cursor: pointer;
  opacity: 0.9;
}

.save:hover {
  background: var(--accent);
  color: #fff;
  opacity: 1;
}

.clear {
  background: var(--panel);
  color: var(--text);
  border: 1px solid var(--muted);
  border-radius: 6px;
  padding: 0.4rem 0.8rem;
  cursor: pointer;
}

.clear.danger {
  background: #e74c3c;
  color: #fff;
  border: none;
}

.clear.danger:hover {
  background: #c0392b;
}
</style>