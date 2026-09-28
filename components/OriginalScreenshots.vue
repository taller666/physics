<script setup lang="ts">
import { computed, ref } from 'vue'
import screenshots from '../data/screenshots.json'
type Picture = {index:number;source:string;src:string;group:string}
const props=withDefaults(defineProps<{group?:string}>(),{group:'all'})
const pictures=computed(()=>screenshots.filter(x=>props.group==='all'||x.group===props.group))
const selected=ref<Picture|null>(null)
const modal=ref<HTMLDialogElement>()
const show=(picture:Picture)=>{selected.value=picture;modal.value?.showModal()}
const close=()=>modal.value?.close()
</script>
<template>
  <div class="original-screenshots">
    <button v-for="pic in pictures" :key="pic.index" class="screenshot-button" :aria-label="`放大原题截图 ${pic.index}`" @click.stop="show(pic)">
      <img :src="pic.src" :width="pic.width" :height="pic.height" :alt="`原题截图 ${pic.index}`" loading="lazy" />
    </button>
  </div>
  <dialog ref="modal" class="image-dialog" @click.stop="close" @keydown.stop @wheel.stop @touchmove.stop>
    <button class="close-image" @click="close" aria-label="关闭放大截图">关闭 ×</button>
    <img v-if="selected" :src="selected.src" alt="放大的原题截图" @click.stop />
  </dialog>
</template>
