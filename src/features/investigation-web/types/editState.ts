export type CurrentEditState =
  | "none"
  | "add-free-node"
  | "add-link"
  | "add-track"
  | "place-stashed-node"
  | "drag-free-node"
  | "drag-track"
  | "drag-track-end"
  | "edit-selected-node";