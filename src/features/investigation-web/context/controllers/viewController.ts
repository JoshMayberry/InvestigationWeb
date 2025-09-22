import { reactive } from "vue";

export interface TransformState { k:number; x:number; y:number; }

export interface ViewController {
  transform: TransformState;
  setTransform(t:TransformState): void;
  setSvgEl(el:SVGSVGElement|null): void;
  getSvgEl(): SVGSVGElement|null;
  worldFromClient(clientX:number, clientY:number): { x:number; y:number };
  clientFromWorld(x:number,y:number): { x:number; y:number };
}

export function createViewController(): ViewController {
  const transform = reactive<TransformState>({ k:1, x:0, y:0 });
  let svgEl: SVGSVGElement | null = null;

  function setTransform(t:TransformState){
    transform.k = t.k; transform.x = t.x; transform.y = t.y;
  }
  function setSvgEl(el:SVGSVGElement|null){ svgEl = el; }
  function getSvgEl(){ return svgEl; }

  function worldFromClient(clientX:number, clientY:number){
    if (!svgEl) return { x:0, y:0 };
    const r = svgEl.getBoundingClientRect();
    const sx = clientX - r.left;
    const sy = clientY - r.top;
    return { x:(sx - transform.x)/transform.k, y:(sy - transform.y)/transform.k };
  }

  function clientFromWorld(x:number,y:number){
    if (!svgEl) return { x:0, y:0 };
    const r = svgEl.getBoundingClientRect();
    return {
      x: r.left + (x*transform.k + transform.x),
      y: r.top + (y*transform.k + transform.y)
    };
  }

  return {
    transform,
    setTransform,
    setSvgEl,
    getSvgEl,
    worldFromClient,
    clientFromWorld
  };
}