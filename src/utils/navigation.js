import { useState, useEffect } from 'react'

/**
 * Smoothly scrolls to a target section by ID without altering the window hash/URL.
 * This guarantees the browser address bar remains at the clean base URL (http://localhost:3000/),
 * preventing page refresh from reloading with an anchor hash.
 */
export function scrollToSection(id, behavior = 'smooth') {
  if (typeof window === 'undefined') return

  if (!id || id === 'top' || id === '#') {
    window.scrollTo({ top: 0, left: 0, behavior })
    return
  }

  const cleanId = id.replace(/^#/, '')
  const element = document.getElementById(cleanId)
  if (element) {
    element.scrollIntoView({ behavior, block: 'start' })
  }
}

/**
 * Click handler for navigation links to prevent browser hash pollution.
 */
export function handleNavClick(e, id) {
  if (e && typeof e.preventDefault === 'function') {
    e.preventDefault()
  }
  scrollToSection(id, 'smooth')
}

/**
 * Hook to manage section element IDs.
 * If the page was loaded or pasted with an initial anchor hash,
 * this delays attaching the DOM id for 150ms.
 * This effectively prevents the browser from automatically jumping down to the section,
 * allowing the clean '/' URL replacement and top scroll to take full effect.
 */
export function useSectionId(id) {
  const [activeId, setActiveId] = useState(() => {
    if (typeof window !== 'undefined') {
      const hasHash = Boolean(window.location.hash || window.__HAD_INITIAL_HASH__)
      if (hasHash) {
        return undefined
      }
    }
    return id
  })

  useEffect(() => {
    if (!activeId && id) {
      const timer = setTimeout(() => {
        setActiveId(id)
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [activeId, id])

  return activeId
}
