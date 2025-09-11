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
    labelStyle?: {
        mode?: 'angle' | 'free' | 'hidden';
        angle?: number;          // degrees (0 = top)
        offsetX?: number;        // free mode
        offsetY?: number;        // free mode
        rotation?: number;       // deg (free)
        fontSize?: number;
        fontWeight?: string;
        fontStyle?: string;
        color?: string;
        margin?: number;         // distance from node rim (angle mode)
    };
}

export interface NodeFree extends NodeBase {
    kind: 'free'
    sim?: {
        enabled: boolean
        vx?: number
        vy?: number
        fx?: number
        fy?: number
        attraction?: number            // base attraction (neg = repel)
        colorAttractions?: { color:string; force:number }[] // overrides
        maxForce?: number              // clamp per tick
        mass?: number              // explicit mass (ignored if useRadiusMass)
        useRadiusMass?: boolean    // derive mass from radius^2
        massScale?: number         // scale factor when deriving from radius
    }
}

export interface NodeSnap extends NodeBase {
    kind: 'snap'
    trackId: string
    trackOrder: number
    trackPosition: number
    trackSegment?: number
}

export type NodeAny = NodeFree | NodeSnap;

export type NodePatch = { id: string; patch: Partial<NodeFree> | Partial<NodeSnap> };
