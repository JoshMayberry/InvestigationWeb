<template>
  <li :class="{ selected: isSelected }">
    <div class="tree-label" @click="selectNode">
      <span
        v-if="hasChildren"
        class="expand-icon"
        ref="arrow"
        @click.stop="toggleExpand"
      >▶</span>
      <span v-else class="expand-icon-placeholder"></span>
      <span class="label-content">{{ renderLabel(node) }}</span>
    </div>
    <transition @enter="onEnter" @leave="onLeave">
      <ul
        v-if="hasChildren && expanded"
        ref="childrenList"
      >
        <TreeNode
          v-for="(child, ci) in children"
          :key="nodeKey(child)"
          :node="child"
          :get-children="getChildren"
          :render-label="renderLabel"
          :selected-node="selectedNode"
          :node-key="nodeKey"
          :index-path="indexPath.concat([ci])"
          @select="$emit('select', $event)"
        />
      </ul>
    </transition>
  </li>
</template>

<script lang="ts">
import { gsap } from "gsap";
import { defineComponent, PropType } from "vue";

export default defineComponent({
  name: "TreeNode",
  props: {
    node: { type: Object as PropType<any>, required: true },
    getChildren: { type: Function as PropType<(node: any) => any[]>, required: true },
    renderLabel: { type: Function as PropType<(node: any) => string>, required: true },
    selectedNode: { type: Object as PropType<any | null>, default: null },
    nodeKey: { type: Function as PropType<(node: any) => string | number>, required: true },
    indexPath: { type: Array as PropType<number[]>, required: true }
  },
  emits: ["select"],
  data() {
    return {
      expanded: false as boolean,
      arrow: null as HTMLElement | null
    };
  },
  computed: {
    children() {
      return this.getChildren(this.node) || [];
    },
    hasChildren() {
      return this.children.length > 0;
    },
    isSelected() {
      return (
        this.selectedNode &&
        this.nodeKey(this.selectedNode) === this.nodeKey(this.node)
      );
    },
  },
  methods: {
    toggleExpand(e: MouseEvent) {
      e.stopPropagation();
      if (this.hasChildren) this.expanded = !this.expanded;
    },
    selectNode() {
      this.$emit("select", {
        node: this.node,
        indexList: this.indexPath,
      });
    },
    onEnter(el: Element, done: () => void) {
      const htmlEl = el as HTMLElement;
      htmlEl.style.overflow = "hidden";
      gsap.fromTo(
        htmlEl,
        { height: 0, opacity: 0 },
        {
          height: htmlEl.scrollHeight,
          opacity: 1,
          duration: 0.3,
          ease: "power2.out",
          onComplete: () => {
            htmlEl.style.overflow = "";
            gsap.set(htmlEl, { clearProps: "height" });
            done();
          }
        }
      );
    },
    onLeave(el: Element, done: () => void) {
      const htmlEl = el as HTMLElement;
      htmlEl.style.overflow = "hidden";
      gsap.to(htmlEl, {
        height: 0,
        opacity: 0,
        duration: 0.25,
        ease: "power2.in",
        onComplete: () => {
          htmlEl.style.overflow = "";
          done();
        }
      });
    }
  },
  mounted() {
    this.arrow = this.$refs.arrow as HTMLElement | null;
  },
  watch: {
    expanded(val: boolean) {
      this.$nextTick(() => {
        if (this.arrow) {
          gsap.to(this.arrow, {
            rotate: val ? 90 : 0,
            duration: 0.25,
            transformOrigin: "50% 50%",
            ease: "power2.out"
          });
        }
      });
    }
  }
});
</script>

<style scoped>
.tree-label {
  display: flex;
  align-items: center;
  user-select: none;
  padding: 2px 0 2px 0.2em;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  transition: background 0.15s;
}
.tree-label:hover {
  background: #26324a;
}
.selected > .tree-label {
  background: #ffd166;
  color: #222;
}
.expand-icon,
.expand-icon-placeholder {
  display: inline-block;
  width: 1.2em;
  text-align: center;
  margin-right: 0.3em;
  font-size: 1em;
  color: #ffd166;
  cursor: pointer;
  user-select: none;
  transition: transform 0.2s;
}
.expand-icon-placeholder {
  visibility: hidden;
}
.label-content {
  flex: 1;
  font-weight: 500;
  cursor: pointer;
  padding: 2px 0.5em 2px 0;
  border-radius: 3px;
}
ul {
  padding-left: 1.2em;
}
</style>