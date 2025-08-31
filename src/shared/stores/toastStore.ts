import { reactive } from "vue";

export type ToastType = "success" | "error" | "info";
export interface Toast {
  id: number;
  type: ToastType;
  text: string;
  sticky?: boolean;
  timeout?: number;
}

let nextId = 1;

function makeToast(base: Omit<Toast, "id">): Toast {
  return {
    id: nextId++,
    timeout: base.sticky ? undefined : base.timeout ?? 3000,
    ...base,
  };
}

export const toastStore = reactive({
  active: [] as Toast[],
  queue: [] as Toast[],

  push(toast: Omit<Toast, "id">) {
    const t = makeToast(toast);
    if (this.active.length < 3) {
      this.active.push(t);
    } else {
      this.queue.push(t);
    }
  },

  success(text: string, timeout = 2500) {
    this.push({ type: "success", text, timeout });
  },
  info(text: string, timeout = 2500) {
    this.push({ type: "info", text, timeout });
  },
  error(text: string) {
    this.push({ type: "error", text, sticky: true });
  },

  dismiss(id: number) {
    const idx = this.active.findIndex(t => t.id === id);
    if (idx >= 0) {
      this.active.splice(idx, 1);
      this.promoteNext();
      return;
    }
    const q = this.queue.findIndex(t => t.id === id);
    if (q >= 0) this.queue.splice(q, 1);
  },

  promoteNext() {
    while (this.active.length < 3 && this.queue.length) {
      this.active.push(this.queue.shift()!);
    }
  },
});