import React from 'react'
import { motion } from 'framer-motion'
import { Mic, ArrowRight, GitBranch, Sparkles, Terminal, ShieldCheck } from 'lucide-react'

export default function Hero({ onStartDemo, onSelectPreset }) {
  return (
    <section className="pt-12 sm:pt-16 pb-12 hairline-border-b bg-paper">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Category micro badge */}
        <motion.div 
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-wrap items-center gap-2 mb-6"
        >
          <span className="micro-label px-2.5 py-1 rounded-full bg-paper-deep text-ink-soft hairline-border">
            ENGINE · ASSEMBLYAI DICTATION BETA · UNIVERSAL-3.5 PRO
          </span>
          <span className="text-xs font-mono text-muted">•</span>
          <span className="text-xs font-mono text-ink-soft flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
            Sub-second SLA (&lt;1.0s)
          </span>
        </motion.div>

        {/* Large Editorial Headline */}
        <motion.h1 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="font-serif-display text-5xl sm:text-6xl lg:text-7xl font-normal tracking-tight leading-[1.05] text-ink mb-6 max-w-4xl"
        >
          Before your tool writes a commit, <br className="hidden sm:inline" />
          listen to what the developer <em className="italic font-normal">meant</em>.
        </motion.h1>

        {/* Subtitle */}
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-base sm:text-lg text-ink-soft max-w-2xl font-normal leading-relaxed mb-8"
        >
          A pure terminal-native voice assistant (<code className="px-1.5 py-0.5 rounded bg-paper-deep text-xs font-mono text-ink font-semibold">ovio</code>). 
          Biases your staged <code className="px-1.5 py-0.5 rounded bg-paper-deep text-xs font-mono text-ink font-semibold">git diff</code> AST into AssemblyAI's Dictation API, turning rambling developer mutterings into production-ready Conventional Commits in under 800ms.
        </motion.p>

        {/* Action pills */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-wrap items-center gap-3 mb-12"
        >
          <a
            href="#cli"
            className="pill-dark"
          >
            <Terminal className="w-4 h-4 text-paper-light" />
            <span>Install CLI: ovio</span>
            <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-white/20 font-mono">$</kbd>
          </a>

          <a href="#console" className="pill-dashed">
            <span>Inspect Terminal Session</span>
            <ArrowRight className="w-4 h-4 text-muted" />
          </a>

          <div className="flex items-center gap-2 pl-2 text-xs font-mono text-muted">
            <span className="text-emerald-700 font-medium">● 0.6s latency</span>
            <span>·</span>
            <span>Zero web-recording bloat</span>
          </div>
        </motion.div>

        {/* Sample preset triggers */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="pt-6 hairline-border-t flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-ink-soft"
        >
          <div className="flex items-center gap-2">
            <span className="micro-label text-muted">Quick Demos:</span>
            <button 
              onClick={() => onSelectPreset('auth')} 
              className="px-2.5 py-1 rounded bg-paper-light hover:bg-paper-deep transition-colors hairline-border hover:border-ink/40 text-ink-soft"
            >
              #1 Auth JWT Refactor
            </button>
            <button 
              onClick={() => onSelectPreset('db')} 
              className="px-2.5 py-1 rounded bg-paper-light hover:bg-paper-deep transition-colors hairline-border hover:border-ink/40 text-ink-soft"
            >
              #2 Postgres Migration
            </button>
            <button 
              onClick={() => onSelectPreset('ui')} 
              className="px-2.5 py-1 rounded bg-paper-light hover:bg-paper-deep transition-colors hairline-border hover:border-ink/40 text-ink-soft"
            >
              #3 Tailwind Dark Mode
            </button>
            <button 
              onClick={() => onSelectPreset('silence')} 
              className="px-2.5 py-1 rounded bg-paper-light hover:bg-paper-deep transition-colors hairline-border hover:border-ink/40 text-ink-soft"
            >
              #4 Silence Guidance
            </button>
          </div>

          <div className="flex items-center gap-3 text-muted">
            <span>Zero filler words</span>
            <span>•</span>
            <span>AST symbol extraction</span>
            <span>•</span>
            <span>Silence detection</span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
