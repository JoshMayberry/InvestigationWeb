export type CurrentEditState =
  | "none"
  | "add-free-node"
  | "add-link"
  | "place-stashed-node"
  | "drag-free-node"
  | "edit-selected-node";