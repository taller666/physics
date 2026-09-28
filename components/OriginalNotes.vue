<script setup lang="ts">
import notes from '../data/notes.json'
import 'katex/dist/katex.min.css'
import {ref} from 'vue'
withDefaults(defineProps<{section?: keyof typeof notes}>(),{section:'all'})
const article=ref<HTMLElement>()
const jump=(event:Event)=>{
  const id=(event.target as HTMLSelectElement).value
  const target=article.value?.querySelector<HTMLElement>(`[data-note-id="${id}"]`)
  const panel=article.value?.closest<HTMLElement>('.notes-scroll')
  if(!target||!panel)return
  const pr=panel.getBoundingClientRect(),tr=target.getBoundingClientRect()
  const scale=pr.height/panel.offsetHeight
  panel.scrollTop+=(tr.top-pr.top)/scale-58
}
</script>
<template>
  <div class="notes-outline"><select aria-label="定位笔记小节" @change="jump"><option value="">定位到笔记小节…</option><option v-for="item in notes[section].toc" :key="item.id" :value="item.id">{{ item.label }}</option></select></div>
  <article ref="article" class="original-notes" v-html="notes[section].html" />
</template>
