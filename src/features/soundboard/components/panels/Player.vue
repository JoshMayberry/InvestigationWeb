<template>
  <div class="player">
    <div id="yt-holder">
      <div id="player"></div>
    </div>
    <div class="now">
      Group: <span class="pill">{{ currentGroup ? currentGroup.title : "—" }}</span><br/>
      SubGroup: <span class="pill">{{ currentSubGroup ? currentSubGroup.title : "—" }}</span><br/>
      Now Playing: <span class="pill">{{ currentTrack ? currentTrack.title : "—" }}</span>
    </div>
    <div class="controls">
      <button class="btn" @click="$emit('play')">Play</button>
      <button class="btn secondary" @click="$emit('next')">Next ▶</button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { Group, SoundboardMode, SubGroup, Track, TrackState } from "../../types";

export default defineComponent({
  name: "Player",
  props: {
    currentGroup: { type: [Object, null] as PropType<Group | null>, required: true },
    currentSubGroup: { type: [Object, null] as PropType<SubGroup | null>, required: true },
    currentTrack: { type: [Object, null] as PropType<Track | null>, required: true },
    trackState: { type: String as PropType<TrackState>, required: true },
    currentMode: { type: String as PropType<SoundboardMode>, required: true },
    masterVol: { type: Number, required: true },
  },
  data() {
    return {
      player: null as any,
      playerReady: false,
    }
  },
  watch: {
    trackState(newVal) {
      if (!this.playerReady || (this.currentMode === "edit")) return;
      if (newVal === "playing") {
        this.ensureVideoLoaded();
        this.player.playVideo && this.player.playVideo();
        this.applyVolume();
      } else if (newVal === "paused") {
        this.player.pauseVideo && this.player.pauseVideo();
      } else if (newVal === "stopped") {
        this.player.stopVideo && this.player.stopVideo();
      }
    },
    currentTrack: {
      handler(newVal: Track | null) {
        if (!this.playerReady || !newVal || !newVal.url) return;
        const id = this.parseId(newVal.url);
        if (!id) return;
        const shouldAutoplay = this.trackState === "playing" && this.currentMode !== "edit";
        // load video (object form lets us be explicit)
        try {
          this.player.loadVideoById({ videoId: id, startSeconds: 0 });
        } catch {
          try { this.player.loadVideoById(id); } catch {}
        }
        // play after short delay if we are in playing state
        setTimeout(() => {
          this.applyVolume();
          if (shouldAutoplay) {
            try { this.player.playVideo(); } catch {}
          }
        }, 200);
      },
      immediate: true,
    },
    masterVol() { this.applyVolume(); },
    "currentTrack.useVolume"() { this.applyVolume(); },
    "currentTrack.volume"() { this.applyVolume(); },
    "currentTrack.isLoop"() { /* no-op: read at END event */ }
  },
  mounted() {
    if (!(window as any).YT) {
      const tag = document.createElement('script')
      tag.src = "https://www.youtube.com/iframe_api"
      document.head.appendChild(tag)
      ;(window as any).onYouTubeIframeAPIReady = this.initPlayer
    } else {
      this.initPlayer()
    }
  },
  methods: {
    initPlayer() {
      this.player = new (window as any).YT.Player('player', {
        playerVars: { autoplay: 0, rel: 0, modestbranding: 1 },
        events: {
          onReady: () => {
            this.playerReady = true;
            this.applyVolume();
            // If already have a track & should be playing, ensure load
            if (this.currentTrack?.url && this.trackState === "playing" && this.currentMode !== "edit") {
              this.ensureVideoLoaded(true);
            }
          },
          onStateChange: (e: any) => {
            if (e.data === (window as any).YT.PlayerState.ENDED) {
              if (this.currentTrack?.isLoop) {
                try {
                  this.player.seekTo(0, true);
                  this.player.playVideo();
                  this.applyVolume();
                } catch (err) {
                  console.error("Error playing video:", err);
                }
              } else {
                this.$emit('next');
              }
            } else if (e.data === (window as any).YT.PlayerState.PLAYING) {
              this.applyVolume();
            }
          }
        }
      })
    },
    parseId(u: string): string | null {
      try {
        if (/^[a-zA-Z0-9_-]{11}$/.test(u)) return u;
        const x = new URL(u);
        return x.searchParams.get('v');
      } catch { return null; }
    },
    ensureVideoLoaded(force=false) {
      if (!this.currentTrack?.url) return;
      const id = this.parseId(this.currentTrack.url);
      if (!id) return;
      // If force or player has no video cued (getVideoData might be undefined early)
      let currentId: string | null = null;
      try { currentId = this.player?.getVideoData?.()?.video_id || null; } catch {}
      if (force || id !== currentId) {
        try {
          this.player.loadVideoById({ videoId: id, startSeconds: 0 });
        } catch {
          try { this.player.loadVideoById(id); } catch {}
        }
      }
    },
    applyVolume() {
      if (!this.playerReady || !this.player?.setVolume) return;
      const vol = this.currentTrack && this.currentTrack.useVolume && (this.currentTrack.volume !== undefined)
        ? this.currentTrack.volume
        : this.masterVol;
      const clamped = Math.min(100, Math.max(0, Number(vol) || 0));
      try { this.player.setVolume(clamped); } catch {}
    }
  }
});
</script>

<style scoped>
.player {
  background: rgba(255,255,255,.03);
  border: 1px solid rgba(255,255,255,.06);
  border-radius: 12px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
  min-height: 0;
  box-shadow: 0 4px 24px 0 rgba(0,0,0,0.18);
  max-width: 320px;
  width: 100%;
}
#yt-holder {
  margin-bottom: 8px;
  display: flex;
  align-items: stretch;
  min-height: 0;
}
.player .now {
  font-size: 13px;
  color: var(--muted);
  margin-top: 4px;
}
.player .controls {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}
.player .btn {
  min-width: 60px;
}
</style>

<style>

#player {
  width: 100% !important;
  height: 100% !important;
  max-width: 100% !important;
  max-height: 100% !important;
  border-radius: 8px;
  background: black;
  overflow: hidden;
  display: block;
}
</style>