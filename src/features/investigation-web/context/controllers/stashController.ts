import { reactive } from "vue";
import type { ViewController } from "./viewController";

export interface StashRect { x:number; y:number; w:number; h:number; }

export interface StashController {
  rect: StashRect;
  setRect(r:StashRect): void;
  isClientPointIn(clientX:number, clientY:number): boolean;
  isInside(x:number, y:number): boolean;
}

export function createStashController(view:ViewController): StashController {
  const rect = reactive<StashRect>({ x:0, y:0, w:120, h:0 });

  function setRect(r:StashRect){
    rect.x=r.x; rect.y=r.y; rect.w=r.w; rect.h=r.h;
  }

  function isInside(x:number, y:number){
    return x >= rect.x && y >= rect.y && x <= rect.x + rect.w && y <= rect.y + rect.h;
  }

  function isClientPointIn(clientX:number, clientY:number){
    const svg = view.getSvgEl();
    if (!svg) return false;
    const r = svg.getBoundingClientRect();
    const lx = clientX - r.left;
    const ly = clientY - r.top;
    return lx >= (r.width - rect.w) && lx <= r.width && ly >= rect.y && ly <= rect.y + rect.h;
  }

  return { rect, setRect, isClientPointIn, isInside };
}