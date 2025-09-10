<template>
  <Transition :css="false" @enter="enter" @leave="leave">
    <div v-if="open" class="right-drawer-anim">
      <Drawers
        class="right-drawers"
        side="right"
        @drawer:hover="onHandleHover"
        @drawer:change="onChange"
        ref="drawers"
      >
        <PanelStaging :drawer="{ icon:'chair', label:'Staging' }" />
        <PanelAdd :drawer="{ icon:'add', label:'Add' }" />
      </Drawers>
    </div>
  </Transition>
</template>

<script lang="ts">
import { defineComponent, inject } from "vue";
import { gsap } from "gsap";
import Drawers from "@shared/components/layout/Drawers.vue";
import PanelStaging from "./PanelStaging.vue";
import PanelAdd from "./PanelAdd.vue";
import { useInvestigationWebStore } from "../../stores/web";
import { InvestigationRuntime, RUNTIME_KEY } from "../../context/runtime";

export default defineComponent({
  name: "DrawersRight",
  components: { Drawers, PanelStaging, PanelAdd },
  data(){
    return {
      store: useInvestigationWebStore(),
      runtime: inject(RUNTIME_KEY, null) as InvestigationRuntime | null
    };
  },
  computed:{
    open(): boolean {
      return this.store.policy.canEditStructure;
    },
    dragging(){ return !!this.runtime?.controllers?.drag?.isActive?.(); }
  },
  mounted(){
    this.$watch(()=> this.open, (on)=>{
      if (!on) {
        this.store.resetTools();
        this.runtime?.controllers?.linkPlacement?.cancel?.();
      }
    }, { immediate:true });
  },
  methods:{
    enter(el:Element, done:()=>void){
      gsap.fromTo(el,{ xPercent:100, autoAlpha:0 },{ xPercent:0, autoAlpha:1, duration:.28, ease:"power2.out", onComplete:done });
    },
    leave(el:Element, done:()=>void){
      gsap.to(el,{ xPercent:100, autoAlpha:0, duration:.22, ease:"power2.in", onComplete:done });
    },
    onHandleHover(e:{ index:number }){
      if (this.dragging && e.index === 0) (this.$refs.drawers as any)?.activate?.(0);
    },
    onChange(p:{ index:number|null }){
      const idx = p.index;
      if (idx !== 1) {
        // Leaving the Add panel or closing the drawer -> clear all add modes
        this.runtime?.controllers?.linkPlacement?.cancel?.();
        this.store.setAddLink(false);
        this.store.setAddTrack(false);
        this.store.setAddFreeNode(false);
        this.store.setEditDefaults(false);
      }
      if (idx !== 0) this.store.setPlaceStaged(null);
    }
  }
});
</script>

<style scoped>
.right-drawer-anim {
  flex:0 0 auto;
  display:flex;
  border-left:1px solid rgba(255,255,255,0.06);
  will-change:transform;
}
</style>