import React, { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import CommandMenu from './components/CommandMenu'
import Hero from './components/Hero'
import ConsoleWindow from './components/ConsoleWindow'
import Quote from './components/Quote'
import Pipeline from './components/Pipeline'
import InteractiveGraph from './components/InteractiveGraph'
import Surfaces from './components/Surfaces'
import Quickstart from './components/Quickstart'
import ResearchLog from './components/ResearchLog'
import Faq from './components/Faq'
import Footer from './components/Footer'

import { scrollToSection } from './utils/navigation'

export default function App() {
  const [commandMenuOpen, setCommandMenuOpen] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState('auth')

  useEffect(() => {
    // Force manual scroll restoration
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual'
    }

    const resetToCleanRoot = () => {
      if (window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search)
      }
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
      const startTime = performance.now()
      let frameId
      const enforceTop = (time) => {
        if (window.scrollY > 0) {
          window.scrollTo(0, 0)
        }
        if (time - startTime < 400) {
          frameId = requestAnimationFrame(enforceTop)
        }
      }
      frameId = requestAnimationFrame(enforceTop)
    }

    if (window.location.hash || window.__HAD_INITIAL_HASH__) {
      resetToCleanRoot()
    }

    window.addEventListener('hashchange', resetToCleanRoot)
    window.addEventListener('popstate', resetToCleanRoot)

    return () => {
      window.removeEventListener('hashchange', resetToCleanRoot)
      window.removeEventListener('popstate', resetToCleanRoot)
    }
  }, [])

  const handleSelectPreset = (presetKey) => {
    setSelectedPreset(presetKey)
    scrollToSection('console')
  }

  const handleStartDemo = () => {
    scrollToSection('console')
  }

  return (
    <div className="min-h-screen bg-paper text-ink font-sans flex flex-col selection:bg-ink selection:text-paper-light">
      {/* Top Navbar & Quick Command Menu */}
      <Navbar onOpenCommandMenu={() => setCommandMenuOpen(true)} />
      <CommandMenu isOpen={commandMenuOpen} onClose={setCommandMenuOpen} />

      {/* Main Editorial Content Sequence */}
      <main className="flex-1 w-full">
        {/* 1. Editorial Hero */}
        <Hero 
          onStartDemo={handleStartDemo} 
          onSelectPreset={handleSelectPreset} 
        />

        {/* 2. Interactive Terminal Console & Push-to-Talk */}
        <ConsoleWindow 
          selectedPreset={selectedPreset} 
          onSelectPreset={setSelectedPreset} 
        />

        {/* 3. Founding Brief Quote */}
        <Quote />

        {/* 4. 5-Step Architecture Pipeline */}
        <Pipeline />

        {/* 5. AST Symbol Extraction & Decoding Gap Inspector (Step 3) */}
        <InteractiveGraph />

        {/* 6. Integration Surfaces */}
        <Surfaces />

        {/* 7. CLI Quickstart Guide */}
        <Quickstart />

        {/* 8. Benchmark Research Log */}
        <ResearchLog />

        {/* 9. Frequently Asked Questions */}
        <Faq />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}
