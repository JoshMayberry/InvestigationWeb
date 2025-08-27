<script lang="ts">
import { defineComponent, PropType, inject, onMounted, onBeforeUnmount } from 'vue';
import type { TrackDef } from '../types';
import { TracksKey } from '../utils/keys';

export default defineComponent({
  name: 'TrackDef',
  props: {
    id: { type: String, required: true },
    eval: { type: Function as PropType<TrackDef['eval']>, required: true },
    labelAt: { type: Function as PropType<TrackDef['labelAt']>, required: false }
  },
  setup(props){
    const api = inject(TracksKey);
    onMounted(()=> api?.register({ id: props.id, eval: props.eval, labelAt: props.labelAt }));
    onBeforeUnmount(()=> api?.unregister(props.id));
    return {};
  }
});
</script>

<template><!-- headless --></template>
