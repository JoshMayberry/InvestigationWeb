export type Unsub = () => void;

export function createChannel(name: string){
  const key = `bc:${name}`;
  const bc = (typeof window !== "undefined" && "BroadcastChannel" in window)
    ? new BroadcastChannel(name)
    : null;

  const listeners = new Set<(data:any)=>void>();
  let lsHandler: ((e: StorageEvent) => void) | null = null;

  // Ensure data is structured-cloneable (strip proxies/functions/cycles)
  function toPlain<T>(v: T): T {
    // JSON round-trip is safest for our snapshot shape
    try { return JSON.parse(JSON.stringify(v)); } catch { /* fallthrough */ }
    // Last resort: return as-is (may throw again, but we've tried)
    return v;
  }

  function post(data:any){
    const payload = { __ts: Date.now(), __id: Math.random().toString(36).slice(2), data: toPlain(data) };
    if (bc) {
      bc.postMessage(payload); // payload is now plain
    } else {
      localStorage.setItem(key, JSON.stringify(payload));
      setTimeout(()=> localStorage.removeItem(key), 250);
    }
  }

  function onMessage(fn:(data:any)=>void){ listeners.add(fn); return ()=> listeners.delete(fn); }

  function start(){
    if (bc){
      bc.onmessage = (ev:any)=> { const p = ev.data; listeners.forEach(fn=> fn(p?.data)); };
    } else if (!lsHandler) {
      lsHandler = (e: StorageEvent) => {
        if (e.key !== key || !e.newValue) return;
        try { const p = JSON.parse(e.newValue); listeners.forEach(fn=> fn(p?.data)); } catch {}
      };
      window.addEventListener("storage", lsHandler);
    }
  }

  function stop(){
    if (bc) bc.close();
    if (lsHandler){ window.removeEventListener("storage", lsHandler); lsHandler = null; }
    listeners.clear();
  }

  start();
  return { post, onMessage, stop };
}