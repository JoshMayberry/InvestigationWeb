export type Unit = number | string;
export interface Point {
    x: number
    y: number
}
export interface Rect extends Point {
    w: number
    h: number
}

export type ViewPolicy = {
  canEditStructure: boolean;
  canDiscover: boolean;
  canInteract: boolean;
};