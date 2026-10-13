/**
 * The first-visit intro, shared between the intro itself (components/Intro.jsx), the welcome note
 * (which waits for it) and the page CSS (which holds the hero's entrance until it ends).
 *
 * It plays once per browser, only on the home page, never for a visitor who has been welcomed
 * before, and never for anyone who asks for reduced motion. While it plays, <html> carries the
 * class "intro-playing".
 */

const WELCOMED_KEY = 'handyai.welcomed'
const SEEN_KEY = 'handyai.introSeen'
const DONE_EVENT = 'handyai:intro-done'

function decide() {
  if (typeof window === 'undefined') return false
  try {
    if (localStorage.getItem(WELCOMED_KEY) || localStorage.getItem(SEEN_KEY)) return false
  } catch {
    return false
  }
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
  return window.location.pathname === '/'
}

let pending = decide()
if (pending) document.documentElement.classList.add('intro-playing')

export function introPending() {
  return pending
}

export function finishIntro() {
  if (!pending) return
  pending = false
  try {
    localStorage.setItem(SEEN_KEY, '1')
  } catch {
    /* it just plays again next visit */
  }
  document.documentElement.classList.remove('intro-playing')
  window.dispatchEvent(new Event(DONE_EVENT))
}

/** Calls back once the intro has finished (straight away if there is none). */
export function onIntroDone(callback) {
  if (!pending) {
    callback()
    return () => {}
  }
  window.addEventListener(DONE_EVENT, callback, { once: true })
  return () => window.removeEventListener(DONE_EVENT, callback)
}
