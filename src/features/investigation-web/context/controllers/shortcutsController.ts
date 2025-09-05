import { ref } from "vue";

export interface ShortcutsController {
  enabled: ReturnType<typeof ref<boolean>>;
  register(combo:string, fn:(e:KeyboardEvent)=>void): void;
  unregister(combo:string): void;
  handle(e:KeyboardEvent): void;
  enable(): void;
  disable(): void;
}

function normCombo(e:KeyboardEvent){
  const parts:string[] = [];
  if (e.ctrlKey || e.metaKey) parts.push("ctrl");
  if (e.shiftKey) parts.push("shift");
  if (e.altKey) parts.push("alt");
  let k = e.key.toLowerCase();
  // normalize Arrow keys
  if (k === "arrowup" || k === "arrowdown" || k === "arrowleft" || k === "arrowright") {
    // keep as-is
  }
  parts.push(k);
  return parts.join("+");
}

function norm(str:string){
  return str.toLowerCase().replace(/\s+/g,"");
}

export function createShortcutsController(): ShortcutsController {
  const enabled = ref(true);
  const map = new Map<string,(e:KeyboardEvent)=>void>();

  function register(combo:string, fn:(e:KeyboardEvent)=>void){
    map.set(norm(combo), fn);
  }
  function unregister(combo:string){ map.delete(norm(combo)); }

  function handle(e:KeyboardEvent){
    if (!enabled.value) return;
    const active = document.activeElement as HTMLElement | null;
    if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA" || active.isContentEditable)) {
      // allow Esc & Delete though
      if (e.key !== "Escape" && e.key !== "Delete" && !((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==="z")) return;
    }
    const key = normCombo(e);
    const fn = map.get(key);
    if (fn){
      fn(e);
      e.preventDefault();
    }
  }

  return {
    enabled,
    register,
    unregister,
    handle,
    enable(){ enabled.value = true; },
    disable(){ enabled.value = false; }
  };
}