export type SoundboardMode = "view" | "edit";
export type SidebarOptions = "tree" | "player" | "edit" | null;
export type TrackState = "stopped" | "playing" | "paused" | "editing";

export type SubGroup = { id: string; title: string; items: Track[] };
export type Group = { id: string; title: string; subGroups: SubGroup[] };
export type Track = {
  id: string,
  title: string;
  url: string;
  useVolume: boolean;
  volume: number;
  isLoop: boolean;
};

export type EditSelection =
  | { type: "track"; data: Track }
  | { type: "subgroup"; data: SubGroup }
  | { type: "group"; data: Group }
  | null;