export function clamp01(v:number){ return v<0?0: v>1?1: v; }
export function lerp(a:number,b:number,t:number){ return a + (b-a)*t; }
export function clamp(v:number, a:number, b:number){ return Math.min(b, Math.max(a, v)); }