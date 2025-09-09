export interface NodeBase {
    id: string
    r: number
    color?: string
    label?: string
    // Free-form bonuses per node
    bonuses?: { title: string; description?: string }[]
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
    x: number // computed
    y: number // computed
};
export type NodeAny = NodeFree | NodeSnap;

export type NodePatch = { id: string; patch: Partial<NodeFree> | Partial<NodeSnap> };
