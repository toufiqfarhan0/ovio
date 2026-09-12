import React, { useState } from 'react'
import Navbar from './components/Navbar'
import CommandMenu from './components/CommandMenu'
import Hero from './components/Hero'
import ConsoleWindow from './components/ConsoleWindow'
import Quote from './components/Quote'
import Pipeline from './components/Pipeline'
import Quickstart from './components/Quickstart'
import ResearchLog from './components/ResearchLog'
import Faq from './components/Faq'
import Footer from './components/Footer'

export default function App() {
  const [commandMenuOpen, setCommandMenuOpen] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState('auth')

  const handleSelectPreset = (presetKey) => {
    setSelectedPreset(presetKey)
    const el = document.getElementById('console')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleStartDemo = () => {
    const el = document.getElementById('console')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
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

        {/* 5. CLI Quickstart Guide */}
        <Quickstart />

        {/* 6. Benchmark Research Log */}
        <ResearchLog />

        {/* 7. Frequently Asked Questions */}
        <Faq />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}
