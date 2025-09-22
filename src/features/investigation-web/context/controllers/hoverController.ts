import { ref } from "vue";

export interface HoverController {
  id: ReturnType<typeof ref<string|null>>;
  set(id:string|null): void;
  is(id:string): boolean;
  clear(): void;
}

export function createHoverController(): HoverController {
  const id = ref<string|null>(null);
  return {
    id,
    set(v){ id.value = v; },
    clear(){ id.value = null; },
    is(v){ return id.value === v; }
  };
}