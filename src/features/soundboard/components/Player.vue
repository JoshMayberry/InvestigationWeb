<template>
  <div class="player">
    <div id="yt-holder"><div id="player"></div></div>
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

<script>
export default {
  name: "Player",
  props: {
    currentSection: Object,
    currentItem: Object,
  },
  data() {
    return {
      player: null,
      playerReady: false,
    }
  },
  watch: {
    currentItem: {
      handler(newVal) {
        if (this.playerReady && newVal && newVal.url) {
          const id = this.parseId(newVal.url)
          if (id) this.player.loadVideoById(id)
        }
      },
      immediate: true,
    }
  },
  mounted() {
    if (!window.YT) {
      const tag = document.createElement('script')
      tag.src = "https://www.youtube.com/iframe_api"
      document.head.appendChild(tag)
      window.onYouTubeIframeAPIReady = this.initPlayer
    } else {
      this.initPlayer()
    }
  },
  methods: {
    initPlayer() {
      this.player = new window.YT.Player('player', {
        playerVars: { autoplay: 0, rel: 0, modestbranding: 1 },
        events: {
          onReady: () => { this.playerReady = true },
          onStateChange: (e) => {
            if (e.data === window.YT.PlayerState.ENDED) {
              this.$emit('next')
            }
          }
        }
      })
    },
    parseId(u) {
      try {
        if (/^[a-zA-Z0-9_-]{11}$/.test(u)) return u
        const x = new URL(u)
        return x.searchParams.get('v')
      } catch { return null }
    }
  }
}
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
}
#yt-holder {
  width: 100%;
  display: flex;
  align-items: stretch;
  min-height: 0;
}
#player {
  width: 100% !important;
  aspect-ratio: 16/9;
  min-height: 0;
  border-radius: 8px;
  background: black;
  flex: 1 1 auto;
  overflow: hidden;
  display: block;
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