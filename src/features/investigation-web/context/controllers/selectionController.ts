import { ref } from "vue";

export interface SelectionController {
  id: ReturnType<typeof ref<string|null>>;
  get(): string|null;
  set(id:string|null): void;
  clear(): void;
  is(id:string): boolean;
  toggle(id:string): void;
  clearIf(id:string): void;
}

export function createSelectionController(): SelectionController {
  const id = ref<string|null>(null);
  return {
    id,
    get: () => id.value,
    set(v){ id.value = v; },
    clear(){ id.value = null; },
    is(v){ return id.value === v; },
    toggle(v){ id.value === v ? (id.value = null) : (id.value = v); },
    clearIf(v){ if (id.value === v) id.value = null; }
  };
}