import type { Snapshot } from "../types/snapshot";
import { isSnapshot } from "../types/snapshot";

export function exportSnapshot(filename: string, doc: Snapshot) {
  const blob = new Blob([JSON.stringify(doc, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function importSnapshotFile(file: File): Promise<Snapshot | null> {
  try {
    const text = await file.text();
    const json = JSON.parse(text);
    if (!isSnapshot(json)) {
      console.warn("[snapshot] invalid or version mismatch");
      return null;
    }
    return json;
  } catch (e) {
    console.error("[snapshot] import failed", e);
    return null;
  }
}