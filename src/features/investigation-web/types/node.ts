export interface NodeBase {
    id: string
    r: number
    x: number
    y: number
    color?: string
    label?: string
    bonuses?: { title: string; description?: string }[]
    discovered?: boolean
    locked?: boolean
}

export interface NodeFree extends NodeBase {
    kind: 'free'
};
export interface NodeSnap extends NodeBase {
    kind: 'snap'
    trackId: string
    trackPosition: number // track position
    x: number // computed
    y: number // computed
};
export type NodeAny = NodeFree | NodeSnap;

export type NodePatch = { id: string; patch: Partial<NodeFree> | Partial<NodeSnap> };
