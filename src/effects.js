/**
 * Site-wide interaction effects, installed once from main.jsx.
 *
 * Everything is delegated from the document, so new cards and buttons pick the effects up with no
 * per-component wiring:
 *  - a button's colour bloom starts from the exact point the pointer entered it
 *  - large and primary buttons lean a few pixels toward the pointer, like a magnet
 *  - buttons and chips get a ripple where they were pressed
 *  - listings, panels and section headings fade up the first time they scroll into view
 *  - the header condenses once the page scrolls
 * People who ask their system for reduced motion get none of the motion.
 */

const BLOOM_SELECTOR = '.btn'
const MAGNET_SELECTOR = '.btn-lg, .btn-primary'
const MAGNET_PULL = 0.22
const MAGNET_MAX_PX = 8
const RIPPLE_SELECTOR = '.btn, .chip, .icon-btn, .mic-btn, .send-btn'
const REVEAL_SELECTOR =
  '.product-card, .category-card, .section-head, .shelf-head, .panel, .kpi, .stat-tile, .sub-row, .bento-tile, .step, .concierge-band, .empty-state'

let installed = false

export function installEffects() {
  if (installed || typeof window === 'undefined') return
  installed = true

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)')

  installNavbarState()
  installBloom()
  installMagnet(reducedMotion, finePointer)
  installRipple(reducedMotion)
  if (!reducedMotion.matches && 'IntersectionObserver' in window) installReveal()
}

function installNavbarState() {
  const root = document.documentElement
  let ticking = false
  const update = () => {
    root.classList.toggle('is-scrolled', window.scrollY > 24)
    ticking = false
  }
  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        ticking = true
        requestAnimationFrame(update)
      }
    },
    { passive: true },
  )
  update()
}

/** Records where the pointer entered a button, so its fill blooms from that point. */
function installBloom() {
  document.addEventListener(
    'pointerover',
    (event) => {
      const button = event.target.closest?.(BLOOM_SELECTOR)
      if (!button || button.contains(event.relatedTarget)) return
      const rect = button.getBoundingClientRect()
      button.style.setProperty('--bx', `${(((event.clientX - rect.left) / rect.width) * 100).toFixed(1)}%`)
      button.style.setProperty('--by', `${(((event.clientY - rect.top) / rect.height) * 100).toFixed(1)}%`)
    },
    { passive: true },
  )
}

/** Large and primary buttons drift toward the pointer while it is over them. */
function installMagnet(reducedMotion, finePointer) {
  let active = null
  const release = () => {
    if (!active) return
    active.style.removeProperty('--mgx')
    active.style.removeProperty('--mgy')
    active = null
  }

  document.addEventListener(
    'pointermove',
    (event) => {
      if (reducedMotion.matches || !finePointer.matches) return
      const button = event.target.closest?.(MAGNET_SELECTOR)
      if (button !== active) release()
      if (!button || button.disabled) return
      active = button
      const rect = button.getBoundingClientRect()
      const clamp = (value) => Math.max(-MAGNET_MAX_PX, Math.min(MAGNET_MAX_PX, value))
      const dx = clamp((event.clientX - (rect.left + rect.width / 2)) * MAGNET_PULL)
      const dy = clamp((event.clientY - (rect.top + rect.height / 2)) * MAGNET_PULL)
      button.style.setProperty('--mgx', `${dx.toFixed(1)}px`)
      button.style.setProperty('--mgy', `${dy.toFixed(1)}px`)
    },
    { passive: true },
  )
  document.addEventListener('pointerleave', release, true)
}

function installRipple(reducedMotion) {
  document.addEventListener(
    'pointerdown',
    (event) => {
      if (reducedMotion.matches || event.button !== 0) return
      const target = event.target.closest?.(RIPPLE_SELECTOR)
      if (!target || target.disabled) return
      const rect = target.getBoundingClientRect()
      const size = Math.max(rect.width, rect.height) * 2
      const ripple = document.createElement('span')
      ripple.className = 'ripple'
      ripple.style.width = ripple.style.height = `${size}px`
      ripple.style.left = `${event.clientX - rect.left - size / 2}px`
      ripple.style.top = `${event.clientY - rect.top - size / 2}px`
      target.appendChild(ripple)
      ripple.addEventListener('animationend', () => ripple.remove(), { once: true })
    },
    { passive: true },
  )
}

function installReveal() {
  document.documentElement.classList.add('fx-reveal')

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        const element = entry.target
        // Siblings revealed together cascade instead of popping in at once.
        const siblings = element.parentElement
          ? [...element.parentElement.children].filter((child) => child.classList.contains('reveal'))
          : []
        const index = Math.max(0, siblings.indexOf(element))
        element.style.setProperty('--reveal-delay', `${Math.min(index, 8) * 55}ms`)
        element.classList.add('is-in')
        observer.unobserve(element)
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
  )

  const watch = (root) => {
    const elements = root.matches?.(REVEAL_SELECTOR) ? [root] : []
    elements.push(...(root.querySelectorAll?.(REVEAL_SELECTOR) ?? []))
    for (const element of elements) {
      if (element.classList.contains('reveal')) continue
      element.classList.add('reveal')
      observer.observe(element)
    }
  }

  watch(document.body)
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === 1) watch(node)
      }
    }
  }).observe(document.body, { childList: true, subtree: true })
}
