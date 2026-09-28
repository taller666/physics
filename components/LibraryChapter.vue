<script setup lang="ts">
import { computed, ref } from 'vue'
import { useNav } from '@slidev/client'
import library from '../data/library.json'
import 'katex/dist/katex.min.css'
import '../library-slides.css'

const props = defineProps<{ chapterId: string }>()
const chapter = computed(() => library.chapters.find(item => item.id === props.chapterId)!)
const nav = useNav()
const left = ref<HTMLElement>()
const right = ref<HTMLElement>()
const dialog = ref<HTMLDialogElement>()
const selected = ref({ src: '', alt: '' })
function jump(event: Event) {
  const id = (event.target as HTMLSelectElement).value
  const target = [...(left.value?.querySelectorAll<HTMLElement>('[id]') || [])].find(element => element.id === id)
  if (!target || !left.value) return
  const pane = left.value, scale = pane.getBoundingClientRect().height / pane.offsetHeight
  pane.scrollTop += (target.getBoundingClientRect().top - pane.getBoundingClientRect().top) / scale - 12
}
function zoom(event: MouseEvent) {
  const img = (event.target as HTMLElement).closest('img')
  if (!img || !img.closest('.library-body')) return
  event.preventDefault()
  selected.value = { src: img.src, alt: img.alt }
  dialog.value?.showModal()
}
</script>

<template>
  <div v-if="chapter" class="library-lecture">
    <header class="library-lecture-header">
      <div><a href="/" class="library-brand">{{ library.site.title }}</a><h1>{{ chapter.title }}</h1></div>
      <div class="library-lecture-controls">
        <select aria-label="选择讲课章节" :value="chapter.slideNo" @change="nav.go(Number(($event.target as HTMLSelectElement).value))">
          <option v-for="item in library.chapters" :key="item.id" :value="item.slideNo">{{ item.categoryTitle }} · {{ item.title }}</option>
        </select>
        <a :href="chapter.href">阅读模式 ↗</a>
      </div>
    </header>
    <main class="library-lecture-grid" :class="{ 'single-column': !chapter.hasRight }">
      <section class="library-pane">
        <div class="library-pane-header"><h2>笔记</h2><select v-if="chapter.leftToc.length" aria-label="定位笔记小节" @change="jump"><option value="">定位小节…</option><option v-for="item in chapter.leftToc" :key="item.id" :value="item.id">{{ item.title }}</option></select><button @click="left?.scrollTo({ top: 0 })">回到顶部 ↑</button></div>
        <article ref="left" class="library-body library-left" tabindex="0" aria-label="左栏笔记，独立滚动" @wheel.stop @keydown.stop @touchmove.stop @click="zoom" v-html="chapter.leftHtml" />
      </section>
      <section v-if="chapter.hasRight" class="library-pane">
        <div class="library-pane-header"><h2>{{ chapter.rightTitle || '手写笔记与例题' }}</h2><button @click="right?.scrollTo({ top: 0 })">回到顶部 ↑</button></div>
        <article ref="right" class="library-body library-right" tabindex="0" aria-label="右栏材料，独立滚动" @wheel.stop @keydown.stop @touchmove.stop @click="zoom" v-html="chapter.rightHtml" />
      </section>
    </main>
    <footer class="library-lecture-footer"><span>{{ chapter.categoryTitle }} · 鼠标移入哪一栏，就滚动哪一栏</span><span>点击图片可放大 · {{ chapter.slideNo }} / {{ library.chapters.length }}</span></footer>
    <dialog ref="dialog" class="library-image-dialog" @click="dialog?.close()" @wheel.stop @keydown.stop @touchmove.stop>
      <button autofocus aria-label="关闭放大图片" @click="dialog?.close()">关闭 ×</button><img :src="selected.src || undefined" :alt="selected.alt" @click.stop />
    </dialog>
  </div>
</template>
