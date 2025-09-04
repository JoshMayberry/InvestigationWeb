export type SoundboardActions = {
  setTrackState: (payload: {
    state: "playing" | "paused" | "stopped";
    groupIndex: number;
    subGroupIndex: number;
    trackIndex: number;
  }) => void;

  updateTrack: (payload: {
    groupIndex: number;
    subGroupIndex: number;
    trackIndex: number;
    key: string;
    value: any;
  }) => void;

  dragTrack?: (evt: any) => void;
  dragSubGroup?: (evt: any) => void;

  selectGroup?: (payload: { groupIndex: number }) => void;
  selectSubGroup?: (payload: { groupIndex: number; subGroupIndex: number }) => void;
  selectTrack?: (payload: { groupIndex: number; subGroupIndex: number; trackIndex: number }) => void;
};

export type SoundboardCtx = { actions: SoundboardActions };

// String key keeps Options API inject simple
export const SOUNDBOARD_CTX_KEY = "soundboardCtx";