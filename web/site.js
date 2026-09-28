const $ = (selector, root = document) => root.querySelector(selector)
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)]
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const scrollBehavior = reducedMotion ? 'instant' : 'smooth'

// Title and description search uses only the current manifest's real chapters.
const search = $('#site-search')
if (search) {
  const cards = $$('[data-search-card]')
  const status = $('[data-search-status]')
  const initialStatus = status?.textContent || ''
  const normalize = value => value.normalize('NFKC').toLocaleLowerCase().trim()
  const update = () => {
    const words = normalize(search.value).split(/\s+/).filter(Boolean)
    let count = 0
    for (const card of cards) {
      card.hidden = !words.every(word => normalize(card.dataset.searchText || '').includes(word))
      if (!card.hidden) count++
    }
    $('[data-search-clear]').hidden = !search.value
    $('[data-search-empty]').hidden = count > 0
    if (status) status.textContent = words.length ? `找到 ${count} / ${cards.length} 章` : initialStatus
  }
  search.addEventListener('input', update)
  $$('[data-search-clear], [data-search-reset]').forEach(button => button.addEventListener('click', () => { search.value = ''; update(); search.focus() }))
  if (location.hash === '#site-search') requestAnimationFrame(() => search.focus({ preventScroll: false }))
}

$('[data-chapter-select]')?.addEventListener('change', event => { if (event.target.value) location.assign(event.target.value) })

const tabs = $$('[data-reader-tab]')
function activatePane(panel, focusTab = false) {
  if (!['left', 'right'].includes(panel)) return
  document.body.dataset.activePane = panel
  tabs.forEach(tab => {
    const selected = tab.dataset.readerTab === panel
    tab.setAttribute('aria-selected', String(selected))
    tab.tabIndex = selected ? 0 : -1
    if (selected && focusTab) tab.focus()
  })
}
tabs.forEach(tab => {
  tab.addEventListener('click', () => activatePane(tab.dataset.readerTab))
  tab.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const panel = event.key === 'Home' ? 'left' : event.key === 'End' ? 'right' : tab.dataset.readerTab === 'left' ? 'right' : 'left'
    activatePane(panel, true)
  })
})

function goToHeading(id, preferredPanel, updateHash = true) {
  const preferred = preferredPanel ? $(`[data-panel-scroll="${preferredPanel}"]`) : null
  let target = preferred ? $$('[id]', preferred).find(element => element.id === id) : null
  target ||= document.getElementById(id)
  if (!target) return false
  const scroller = target.closest('[data-panel-scroll]')
  if (!scroller) return false
  const panel = scroller.dataset.panelScroll
  activatePane(panel)
  requestAnimationFrame(() => {
    const offset = target.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop - 22
    scroller.scrollTo({ top: Math.max(0, offset), behavior: scrollBehavior })
    if (updateHash) history.replaceState(null, '', `#${encodeURIComponent(id)}`)
    const mobileToc = $('.mobile-toc')
    if (mobileToc) mobileToc.open = false
  })
  return true
}
$$('[data-toc-link]').forEach(link => link.addEventListener('click', event => {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  event.preventDefault()
  goToHeading(link.dataset.headingId, link.dataset.panel)
}))
$$('.prose a[href^="#"]').forEach(link => link.addEventListener('click', event => {
  const fragment = link.getAttribute('href').slice(1)
  if (!fragment || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  let id
  try { id = decodeURIComponent(fragment) } catch { id = fragment }
  if (goToHeading(id, link.closest('[data-panel-scroll]')?.dataset.panelScroll)) event.preventDefault()
}))

for (const scroller of $$('[data-panel-scroll]')) {
  const panel = scroller.dataset.panelScroll
  const topButton = $(`[data-panel-top="${panel}"]`)
  const headings = $$('h1[id],h2[id],h3[id],h4[id]', scroller)
  let frame = 0
  const reflectPosition = () => {
    frame = 0
    if (topButton) topButton.hidden = scroller.scrollTop < 280
    const threshold = scroller.getBoundingClientRect().top + 85
    let active = headings[0]
    for (const heading of headings) { if (heading.getBoundingClientRect().top <= threshold) active = heading; else break }
    $$(`[data-toc-link][data-panel="${panel}"]`).forEach(link => {
      if (active && link.dataset.headingId === active.id) link.setAttribute('aria-current', 'location')
      else link.removeAttribute('aria-current')
    })
  }
  scroller.addEventListener('scroll', () => { if (!frame) frame = requestAnimationFrame(reflectPosition) }, { passive: true })
  topButton?.addEventListener('click', () => { scroller.scrollTo({ top: 0, behavior: scrollBehavior }); scroller.focus({ preventScroll: true }) })
  reflectPosition()
}
if (document.body.classList.contains('page-reader') && location.hash) {
  let id
  try { id = decodeURIComponent(location.hash.slice(1)) } catch { id = location.hash.slice(1) }
  requestAnimationFrame(() => goToHeading(id, undefined, false))
}
window.addEventListener('hashchange', () => {
  if (!document.body.classList.contains('page-reader')) return
  try { goToHeading(decodeURIComponent(location.hash.slice(1)), undefined, false) } catch { /* malformed external hash */ }
})

// A native modal dialog supplies focus containment and Escape handling.
const dialog = $('[data-image-dialog]')
if (dialog) {
  const triggers = $$('[data-zoom]')
  const images = [...new Set(triggers.map(trigger => trigger.matches('img') ? trigger : $('img', trigger)).filter(Boolean))]
  const view = $('[data-image-view]', dialog)
  const caption = $('[data-image-caption]', dialog)
  const counter = $('[data-image-counter]', dialog)
  const original = $('[data-image-original]', dialog)
  const previous = $('[data-image-prev]', dialog)
  const next = $('[data-image-next]', dialog)
  const stage = $('.lightbox-stage', dialog)
  let currentIndex = 0
  let returnFocus = null
  function show(index) {
    currentIndex = Math.max(0, Math.min(images.length - 1, index))
    const img = images[currentIndex]
    if (!img) return
    view.src = img.dataset.fullSrc || img.currentSrc || img.src
    view.alt = img.alt || '笔记图片'
    caption.textContent = img.alt || $('figcaption', img.closest('figure') || img.parentElement)?.textContent || '笔记图片'
    counter.textContent = `${currentIndex + 1} / ${images.length}`
    original.href = view.src
    previous.disabled = currentIndex === 0
    next.disabled = currentIndex === images.length - 1
    previous.hidden = next.hidden = images.length < 2
    stage.classList.remove('is-expanded')
    stage.scrollTo(0, 0)
  }
  function open(img, trigger) {
    returnFocus = trigger
    show(images.indexOf(img))
    if (!dialog.open) dialog.showModal()
    $('[data-image-close]', dialog).focus()
  }
  images.forEach(img => {
    const parentTrigger = img.closest('[data-zoom]')
    const trigger = parentTrigger && parentTrigger !== img ? parentTrigger : img
    if (!trigger.matches('button, a')) {
      trigger.tabIndex = 0
      trigger.setAttribute('role', 'button')
      trigger.setAttribute('aria-label', `放大图片：${img.alt || '笔记图片'}`)
      trigger.addEventListener('keydown', event => { if (['Enter', ' '].includes(event.key)) { event.preventDefault(); open(img, trigger) } })
    }
    trigger.setAttribute('aria-haspopup', 'dialog')
    trigger.addEventListener('click', event => { event.preventDefault(); open(img, trigger) })
  })
  $('[data-image-close]', dialog).addEventListener('click', () => dialog.close())
  previous.addEventListener('click', () => show(currentIndex - 1))
  next.addEventListener('click', () => show(currentIndex + 1))
  view.addEventListener('click', () => stage.classList.toggle('is-expanded'))
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close() })
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' && !previous.disabled) { event.preventDefault(); show(currentIndex - 1) }
    if (event.key === 'ArrowRight' && !next.disabled) { event.preventDefault(); show(currentIndex + 1) }
  })
  dialog.addEventListener('close', () => { stage.classList.remove('is-expanded'); returnFocus?.focus({ preventScroll: true }) })
}
