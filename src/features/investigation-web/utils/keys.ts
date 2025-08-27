import type { InjectionKey } from 'vue';
import type { TrackDef } from '../types';

export interface TracksApi {
  register(t: TrackDef): void;
  unregister(id: string): void;
}

export const TracksKey: InjectionKey<TracksApi> = Symbol('navweb-tracks');
