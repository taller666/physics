<script setup lang="ts">
import { computed, ref } from 'vue'
import { useNav } from '@slidev/client'
import '../scroll.css'
const nav=useNav()
const activePage=computed(()=>nav.currentPage.value)
const tabs=[{no:1,label:'全部内容'},{no:2,label:'库仑定律'},{no:3,label:'基本性质'},{no:4,label:'数学'}]
const left=ref<HTMLElement>()
const right=ref<HTMLElement>()
const backTop=(pane:'left'|'right')=>(pane==='left'?left:right).value?.scrollTo({top:0,behavior:'instant'})
</script>

<template>
  <div class="slidev-layout scroll-lecture">
    <header class="scroll-header">
      <div><h1>静电场</h1><span class="lecture-subtitle">第一次习题课2026年秋电磁学C</span></div>
      <nav aria-label="章节">
        <button v-for="tab in tabs" :key="tab.no" :class="{active:activePage===tab.no}" @click.stop="nav.go(tab.no)">{{ tab.label }}</button>
      </nav>
    </header>
    <main class="scroll-grid">
      <section class="scroll-column">
        <div class="pane-heading"><h2>基本要点</h2><button title="仅将左栏返回顶部" @click="backTop('left')">回到顶部 ↑</button></div>
        <div ref="left" class="independent-pane notes-scroll" tabindex="0" aria-label="左栏笔记，独立滚动" @wheel.stop @touchmove.stop @keydown.stop><slot /></div>
      </section>
      <section class="scroll-column original-column">
        <div class="pane-heading"><h2>原题截图</h2><button title="仅将右栏返回顶部" @click="backTop('right')">回到顶部 ↑</button></div>
        <div ref="right" class="independent-pane screenshots-scroll" tabindex="0" aria-label="右栏原题截图，独立滚动" @wheel.stop @touchmove.stop @keydown.stop><slot name="right" /></div>
      </section>
    </main>
    <footer class="scroll-footer"><span>2026/9/28</span><span>电磁学C班第一次习题课讲义</span></footer>
  </div>
</template>
