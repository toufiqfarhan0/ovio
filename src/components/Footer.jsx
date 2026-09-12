import React from 'react'
import { Terminal, GitBranch, ExternalLink, Heart } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="w-full bg-paper-deep/60 py-12 px-4 sm:px-6 text-xs text-muted font-mono">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <span className="font-serif-display text-xl text-ink font-semibold">ovio</span>
          <span className="hidden sm:inline text-muted">•</span>
          <span className="text-ink-soft">
            Voice Git & Codebase Dictation Engine
          </span>
          <span className="hidden sm:inline text-muted">•</span>
          <span className="text-emerald-800">MIT License</span>
        </div>

        <div className="flex items-center gap-6">
          <a
            href="https://github.com/toufiqfarhan0/ovio"
            target="_blank"
            rel="noreferrer"
            className="hover:text-ink transition-colors flex items-center gap-1"
          >
            <span>GitHub</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <a
            href="https://www.assemblyai.com/docs/dictation"
            target="_blank"
            rel="noreferrer"
            className="hover:text-ink transition-colors flex items-center gap-1"
          >
            <span>AssemblyAI Docs</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <a
            href="#cli"
            className="hover:text-ink transition-colors"
          >
            CLI Setup
          </a>
          <a
            href="#console"
            className="hover:text-ink transition-colors"
          >
            Terminal Demo
          </a>
        </div>
      </div>

      <div className="max-w-6xl mx-auto mt-8 pt-6 hairline-border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-muted">
        <div>
          Built for <strong className="text-ink font-medium">AssemblyAI Voice Hackathon: Hack into Dictation</strong> (Sept 2026)
        </div>
        <div className="flex items-center gap-1">
          <span>Powered by Universal-3.5 Pro · Sub-second Turnaround</span>
        </div>
      </div>
    </footer>
  )
}
