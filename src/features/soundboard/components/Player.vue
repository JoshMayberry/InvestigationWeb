<template>
  <div class="player">
    <div id="yt-holder">
      <div id="player"></div>
    </div>
    <div class="now">
      Section: <span class="pill">{{ currentSection ? currentSection.title : "—" }}</span><br/>
      Now Playing: <span class="pill">{{ currentItem ? currentItem.title : "—" }}</span>
    </div>
    <div class="controls">
      <button class="btn" @click="$emit('play')">Play</button>
      <button class="btn secondary" @click="$emit('next')">Next ▶</button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";

type Track = { title: string; url: string };
type Group = { title: string };

export default defineComponent({
  name: "Player",
  props: {
    currentSection: { type: [Object, null] as PropType<Group | null>, required: true },
    currentItem: { type: [Object, null] as PropType<Track | null>, required: true },
  },
  data() {
    return {
      player: null as any,
      playerReady: false,
    }
  },
  watch: {
    currentItem: {
      handler(newVal: Track | null) {
        if (this.playerReady && newVal && newVal.url) {
          const id = this.parseId(newVal.url)
          if (id) this.player.loadVideoById(id)
        }
      },
      immediate: true,
    }
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
          onReady: () => { this.playerReady = true },
          onStateChange: (e: any) => {
            if (e.data === (window as any).YT.PlayerState.ENDED) {
              this.$emit('next')
            }
          }
        }
      })
    },
    parseId(u: string): string | null {
      try {
        if (/^[a-zA-Z0-9_-]{11}$/.test(u)) return u
        const x = new URL(u)
        return x.searchParams.get('v')
      } catch { return null }
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