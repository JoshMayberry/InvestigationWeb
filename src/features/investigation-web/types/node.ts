export interface NodeBase {
    id: string
    r: number
    color?: string
    label?: string
}

export interface NodeFree extends NodeBase {
    kind: 'free'
    x: number
    y: number
};
export interface NodeSnap extends NodeBase {
    kind: 'snap'
    trackId: string
    t: number
    r: number
};
export type NodeAny = NodeFree | NodeSnap;
