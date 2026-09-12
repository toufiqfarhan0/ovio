import React, { useState } from 'react'
import Navbar from './components/Navbar'
import CommandMenu from './components/CommandMenu'
import { Terminal, Mic, GitBranch, ArrowRight, Zap, CheckCircle2, Sparkles, Cpu } from 'lucide-react'

export default function App() {
  const [commandMenuOpen, setCommandMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-paper text-ink font-sans flex flex-col selection:bg-ink selection:text-paper-light">
      <Navbar onOpenCommandMenu={() => setCommandMenuOpen(true)} />
      <CommandMenu isOpen={commandMenuOpen} onClose={setCommandMenuOpen} />

      {/* Main hero teaser & design system showcase (Step 1 Foundation) */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 pt-12 pb-24">
        {/* Top badge */}
        <div className="flex items-center gap-2 mb-6">
          <span className="micro-label px-2.5 py-1 rounded-full bg-paper-deep text-ink-soft hairline-border">
            AssemblyAI Voice Hackathon Week · Dictation API
          </span>
          <span className="text-xs font-mono text-muted">•</span>
          <span className="text-xs font-mono text-ink-soft flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            Universal-3.5 Pro
          </span>
        </div>

        {/* Large Editorial Headline in Instrument Serif */}
        <h1 className="font-serif-display text-5xl sm:text-6xl lg:text-7xl font-normal tracking-tight leading-[1.08] text-ink mb-6 max-w-4xl">
          Speak your chaotic code changes. <br className="hidden sm:inline" />
          Ship crisp Conventional Commits in <em className="italic font-normal">sub-second</em> time.
        </h1>

        <p className="text-base sm:text-lg text-ink-soft max-w-2xl font-normal leading-relaxed mb-8">
          Conventional speech-to-text transcribes your "ums", "ahs", and retracted sentences verbatim.
          <strong className="text-ink font-medium"> ovio</strong> biases your local <code className="px-1.5 py-0.5 rounded bg-paper-deep text-xs font-mono text-ink font-semibold">git diff</code> AST into AssemblyAI's Dictation API, turning rambling developer mutterings into production-ready commits in under 800ms.
        </p>

        {/* Action pills */}
        <div className="flex flex-wrap items-center gap-3 mb-16">
          <button 
            onClick={() => setCommandMenuOpen(true)}
            className="pill-dark"
          >
            <Mic className="w-4 h-4" />
            <span>Open Interactive Console</span>
            <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-white/20 font-mono">⌘K</kbd>
          </button>

          <a href="#pipeline" className="pill-dashed">
            <span>Inspect 5-Step Pipeline</span>
            <ArrowRight className="w-4 h-4 text-muted" />
          </a>
        </div>

        {/* Telemetry Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-paper-light hairline-border mb-16 shadow-paper-sm">
          <div>
            <div className="micro-label mb-1">Target Latency</div>
            <div className="text-xl sm:text-2xl font-mono font-medium text-ink flex items-center gap-1.5">
              <span>&lt; 800ms</span>
              <Zap className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-[11px] text-muted font-mono mt-0.5">Sub-second turnaround</div>
          </div>

          <div>
            <div className="micro-label mb-1">Speech Model</div>
            <div className="text-xl sm:text-2xl font-mono font-medium text-ink flex items-center gap-1.5">
              <span>U-3.5 Pro</span>
              <Cpu className="w-4 h-4 text-ink-soft" />
            </div>
            <div className="text-[11px] text-muted font-mono mt-0.5">19 languages supported</div>
          </div>

          <div>
            <div className="micro-label mb-1">AST Biasing</div>
            <div className="text-xl sm:text-2xl font-mono font-medium text-ink flex items-center gap-1.5">
              <span>Zero-Miss</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-[11px] text-muted font-mono mt-0.5">Diff symbols injected</div>
          </div>

          <div>
            <div className="micro-label mb-1">CLI Integration</div>
            <div className="text-xl sm:text-2xl font-mono font-medium text-ink flex items-center gap-1.5">
              <span>git speak</span>
              <GitBranch className="w-4 h-4 text-ink-soft" />
            </div>
            <div className="text-[11px] text-muted font-mono mt-0.5">Native terminal tool</div>
          </div>
        </div>

        {/* Step-1 Verification Card */}
        <section className="paper-card p-6 sm:p-8 bg-paper-light">
          <div className="flex items-center justify-between pb-4 hairline-border-b mb-6">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              <span className="micro-label text-ink font-semibold">Step 1 Status · System Foundation Ready</span>
            </div>
            <span className="text-xs font-mono text-muted">Vite + React + Tailwind + Dictation API Proxy</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div className="space-y-3">
              <h3 className="font-serif-display text-xl text-ink font-medium">Design & Architecture Standard</h3>
              <p className="text-ink-soft leading-relaxed text-[13.5px]">
                Built strictly to the light-mode, warm paper aesthetic inspired by <code>substrate-friction</code> and <code>tasteskill.dev</code>. Zero neon AI-gradients, crisp hairline borders, high-taste Instrument Serif and Geist typography.
              </p>
              <ul className="text-xs font-mono text-ink-soft space-y-1.5 pt-2">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600">✓</span>
                  <span>Vite Proxy configured for AssemblyAI Dictation API</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600">✓</span>
                  <span>Python standalone CLI ready in <code>cli/ovio.py</code></span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600">✓</span>
                  <span>ASSEMBLYAI_API_KEY connected from <code>.env</code></span>
                </li>
              </ul>
            </div>

            <div className="p-4 rounded-lg bg-paper font-mono text-xs text-ink-soft hairline-border space-y-2">
              <div className="text-[11px] text-muted flex items-center justify-between pb-1 hairline-border-b">
                <span>TERMINAL CLI PREVIEW</span>
                <span>cli/ovio.py</span>
              </div>
              <p className="text-ink font-semibold">$ ovio</p>
              <p className="text-muted">🎯 Loaded 12 git keyterms: [DictationTranscriber, ASTBiasing, ...]</p>
              <p className="text-muted">🔴 Listening... [Speak your changes]</p>
              <p className="text-emerald-700 font-semibold">⚡ Transcribed & Rewritten in 640ms!</p>
              <p className="text-ink">✨ feat(ast): bias keyterms directly from git diff</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full hairline-border-t bg-paper-deep/40 py-8 px-4 sm:px-6 text-xs text-muted font-mono">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-ink font-medium">ovio</span>
            <span>—</span>
            <span>Built for AssemblyAI Dictation API Hackathon</span>
          </div>
          <div>
            <span>Universal-3.5 Pro · Zero-compromise developer UX</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
