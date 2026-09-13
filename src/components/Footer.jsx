import React from 'react'
import { Terminal, GitBranch, ExternalLink, ShieldCheck } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="w-full bg-paper-deep/30 border-t border-line py-14 px-4 sm:px-6 font-sans">
      <div className="max-w-6xl mx-auto">
        {/* Main Grid: 4 columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
          {/* Brand & Description (2 cols on lg) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="font-serif-display text-2xl text-ink font-semibold tracking-tight">
                ovio
              </span>
              <span className="text-muted font-mono text-xs">/</span>
              <span className="micro-label text-[10px] text-ink-soft">
                voice-to-git
              </span>
            </div>

            <p className="text-[13px] text-ink-soft leading-relaxed max-w-sm">
              Voice Git & codebase dictation engine. Extracts local repository AST symbols to bias AssemblyAI&apos;s streaming Dictation API for zero-hallucination conventional commits in under 800ms.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-paper-light border border-line text-[11px] font-mono text-ink-soft">
                <Terminal className="w-3 h-3 text-muted" />
                <span>ovio</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-paper-light border border-line text-[11px] font-mono text-muted">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                Universal-3.5 Pro
              </span>
            </div>
          </div>

          {/* Col 1: Architecture */}
          <div className="space-y-3">
            <div className="micro-label text-[10px] text-muted tracking-wider uppercase">
              Architecture
            </div>
            <ul className="space-y-2 text-[13px] text-ink-soft font-normal">
              <li>
                <a href="#pipeline" className="hover:text-ink transition-colors">
                  5-Stage Pipeline
                </a>
              </li>
              <li>
                <a href="#biasing" className="hover:text-ink transition-colors">
                  AST Biasing Engine
                </a>
              </li>
              <li>
                <a href="#console" className="hover:text-ink transition-colors">
                  Interactive Terminal
                </a>
              </li>
              <li>
                <a href="#research" className="hover:text-ink transition-colors">
                  Benchmark & Latency SLA
                </a>
              </li>
            </ul>
          </div>

          {/* Col 2: Developer Tooling */}
          <div className="space-y-3">
            <div className="micro-label text-[10px] text-muted tracking-wider uppercase">
              Tooling
            </div>
            <ul className="space-y-2 text-[13px] text-ink-soft font-normal">
              <li>
                <a href="#cli" className="hover:text-ink transition-colors">
                  CLI Reference
                </a>
              </li>
              <li>
                <a href="#cli" className="hover:text-ink transition-colors">
                  Shell Aliases
                </a>
              </li>
              <li>
                <a href="#surfaces" className="hover:text-ink transition-colors">
                  Integration Surfaces
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-ink transition-colors">
                  Technical FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Ecosystem */}
          <div className="space-y-3">
            <div className="micro-label text-[10px] text-muted tracking-wider uppercase">
              Ecosystem
            </div>
            <ul className="space-y-2 text-[13px] text-ink-soft font-normal">
              <li>
                <a
                  href="https://github.com/toufiqfarhan0/ovio"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-ink transition-colors inline-flex items-center gap-1"
                >
                  <span>GitHub Repository</span>
                  <ExternalLink className="w-3 h-3 text-muted" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.assemblyai.com/docs/dictation"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-ink transition-colors inline-flex items-center gap-1"
                >
                  <span>AssemblyAI Dictation</span>
                  <ExternalLink className="w-3 h-3 text-muted" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.assemblyai.com"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-ink transition-colors inline-flex items-center gap-1"
                >
                  <span>Universal-3.5 Pro</span>
                  <ExternalLink className="w-3 h-3 text-muted" />
                </a>
              </li>
              <li className="text-muted text-[12px] pt-1">
                AssemblyAI Hackathon &apos;26
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Colophon Bar */}
        <div className="mt-12 pt-6 border-t border-line/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11.5px] font-mono text-muted">
          <div>
            Built for <span className="text-ink font-medium">AssemblyAI Voice Hackathon: Hack into Dictation</span> (Sept 2026)
          </div>
          <div className="flex items-center gap-2">
            <span>&lt;800ms SLA</span>
            <span>•</span>
            <span>Zero Hallucination</span>
            <span>•</span>
            <span className="text-ink-soft">Local AST Inference</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
