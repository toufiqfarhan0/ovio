import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Terminal, Play, Copy, Check, ChevronRight, Zap, GitBranch, ArrowUpRight } from 'lucide-react'

export const TERMINAL_SESSIONS = {
  auth: {
    id: 'auth',
    title: '#1 Auth JWT Refactor',
    branch: 'feature/auth-flow',
    filesCount: 3,
    keyterms: ['authService', 'verifyToken', 'JWT_SECRET', 'TokenExpiredError'],
    verbatim: 'uh so in auth service we added verifyToken to check the JWT_SECRET wait also handled expired token errors properly',
    commit: `feat(auth): add verifyToken and handle expired token errors\n\n- Implement token verification against JWT_SECRET in authService\n- Add explicit error handling for expired and malformed tokens`,
    latency: 640,
  },
  db: {
    id: 'db',
    title: '#2 Postgres Schema',
    branch: 'fix/user-org-cascade',
    filesCount: 2,
    keyterms: ['UserOrganization', 'foreignKey', 'cascadeDelete', 'organizationId'],
    verbatim: 'we added a foreign key constraint for UserOrganization with cascade delete and uh make sure we indexed organizationId actually',
    commit: `feat(db): add cascade delete and index to UserOrganization\n\n- Add foreign key constraint with onDelete: Cascade on UserOrganization\n- Index organizationId to optimize join queries`,
    latency: 718,
  },
  ui: {
    id: 'ui',
    title: '#3 Tailwind Theme Switcher',
    branch: 'feat/theme-toggle',
    filesCount: 2,
    keyterms: ['useThemePreference', 'darkModeToggle', 'hairlineBorder', 'localStorage'],
    verbatim: 'um in navbar component we added the theme preference switcher with local storage persistence and wait fixed the mobile drawer toggle',
    commit: `feat(ui): add theme switcher to Navbar and fix mobile drawer\n\n- Integrate useThemePreference with localStorage persistence in Navbar\n- Resolve mobile drawer toggle click event boundary issue`,
    latency: 580,
  }
}

export default function ConsoleWindow() {
  const [activeSession, setActiveSession] = useState('auth')
  const [copied, setCopied] = useState(false)
  const [copiedCmd, setCopiedCmd] = useState(false)
  const session = TERMINAL_SESSIONS[activeSession]

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCopyCmd = () => {
    navigator.clipboard.writeText('git speak')
    setCopiedCmd(true)
    setTimeout(() => setCopiedCmd(false), 2000)
  }

  return (
    <section id="console" className="py-16 hairline-border-b bg-paper-light">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              <span className="micro-label text-ink">Terminal Native Experience</span>
              <span className="text-xs font-mono text-muted">•</span>
              <span className="text-xs font-mono text-ink-soft">Real CLI Session Capture</span>
            </div>
            <h2 className="font-serif-display text-3xl sm:text-4xl text-ink font-normal tracking-tight">
              What it looks like in your terminal (<code className="text-2xl font-mono">git speak</code>)
            </h2>
          </div>

          {/* Session Switcher */}
          <div className="flex items-center gap-2 bg-paper p-1 rounded-lg hairline-border text-xs font-mono">
            <span className="text-muted px-2">Terminal Capture:</span>
            {Object.keys(TERMINAL_SESSIONS).map((key) => (
              <button
                key={key}
                onClick={() => setActiveSession(key)}
                className={`px-2.5 py-1 rounded transition-all capitalize ${
                  activeSession === key
                    ? 'bg-paper-light text-ink font-semibold shadow-sm hairline-border'
                    : 'text-ink-soft hover:text-ink'
                }`}
              >
                {key}
              </button>
            ))}
          </div>
        </div>

        {/* Authentic Terminal Window */}
        <div className="rounded-xl hairline-border bg-paper shadow-paper-lg overflow-hidden border border-line-strong">
          {/* Terminal Title Bar */}
          <div className="bg-paper-deep px-4 py-2.5 hairline-border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 mr-2">
                <span className="w-2.5 h-2.5 rounded-full bg-line-strong"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-line-strong"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-line-strong"></span>
              </div>
              <Terminal className="w-3.5 h-3.5 text-muted" />
              <span className="text-xs font-mono text-ink font-semibold">~/repo — zsh / pwsh</span>
              <span className="text-xs font-mono text-muted">•</span>
              <span className="text-[11px] font-mono text-muted">cli/ovio.py</span>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono">
              <button
                onClick={handleCopyCmd}
                className="px-2 py-0.5 rounded bg-paper-light text-ink hover:bg-paper hairline-border text-[11px] flex items-center gap-1 transition-colors"
                title="Copy command: git speak"
              >
                {copiedCmd ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>git speak</span>
              </button>
            </div>
          </div>

          {/* Terminal Body */}
          <div className="p-5 sm:p-7 bg-[#161413] text-[#ecebe4] font-mono text-xs sm:text-sm leading-relaxed overflow-x-auto selection:bg-white/20">
            {/* Command execution prompt */}
            <div className="text-[#8e8b83] mb-3">
              <span className="text-emerald-400 font-semibold">$</span> git add . <br />
              <span className="text-emerald-400 font-semibold">$</span> git speak
            </div>

            {/* ANSI Box */}
            <div className="text-[#c9c8bf] whitespace-pre mb-3 font-normal">
              ┌─────────────────────────────────────────────────────────────┐<br />
              │ 🎙️  <span className="text-white font-bold">CommitSpeak</span> — Voice Git Assistant                      │<br />
              │ 🌿  Branch: <span className="text-white font-semibold">{session.branch.padEnd(18)}</span> |  📁 {session.filesCount} files staged        │<br />
              │ 🎯  Biased Keyterms: [<span className="text-white font-semibold">{session.keyterms.join(', ').padEnd(38)}</span>] │<br />
              └─────────────────────────────────────────────────────────────┘
            </div>

            {/* Listening Waveform */}
            <div className="text-rose-400 font-semibold mb-1 flex items-center gap-2">
              <span>🔴 Listening...</span>
              <span className="text-[#8e8b83] font-normal">[Speak your changes, press &lt;ENTER&gt; to stop]</span>
            </div>
            <div className="text-rose-300/80 tracking-widest text-xs mb-4 select-none">
              &nbsp;&nbsp;&nbsp;∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿
            </div>

            {/* Latency Turnaround */}
            <div className="text-emerald-400 font-bold mb-3 flex items-center gap-1.5">
              <Zap className="w-4 h-4 fill-emerald-400 text-emerald-400" />
              <span>Transcribed &amp; Rewritten in {session.latency}ms!</span>
            </div>

            {/* Verbatim Output */}
            <div className="text-[#8e8b83] text-xs uppercase tracking-wider mb-1">
              🗣️ What you said (Verbatim):
            </div>
            <div className="text-[#deddd5] bg-white/5 p-3 rounded border border-white/10 mb-4 whitespace-pre-wrap">
              "{session.verbatim}"
            </div>

            {/* Cleaned Conventional Commit Output */}
            <div className="text-emerald-400 text-xs uppercase tracking-wider mb-1 font-semibold">
              ✨ Generated Conventional Commit (Cleaned):
            </div>
            <div className="text-white bg-emerald-950/40 p-3 rounded border border-emerald-500/30 mb-4 whitespace-pre-wrap font-medium">
              {session.commit}
            </div>

            {/* Interactive Confirmation Menu */}
            <div className="text-[#deddd5] bg-white/10 p-3 rounded flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 bg-white/20 rounded text-white font-bold">[Enter]</span>
                <span>Commit now</span>
                <span className="text-[#8e8b83] mx-1">•</span>
                <span className="px-2 py-0.5 bg-white/20 rounded text-white font-bold">[p]</span>
                <span>Commit &amp; Push</span>
                <span className="text-[#8e8b83] mx-1">•</span>
                <span className="px-2 py-0.5 bg-white/20 rounded text-white font-bold">[e]</span>
                <span>Edit text</span>
                <span className="text-[#8e8b83] mx-1">•</span>
                <span className="px-2 py-0.5 bg-white/20 rounded text-white font-bold">[Esc]</span>
                <span>Cancel</span>
              </div>

              <button
                onClick={() => handleCopy(session.commit)}
                className="px-3 py-1 rounded bg-white text-black font-semibold hover:bg-neutral-200 transition-colors flex items-center gap-1"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-700" /> : <Copy className="w-3 h-3 text-black" />}
                <span>{copied ? 'Copied' : 'Copy Commit'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-4 flex flex-wrap items-center justify-between text-xs font-mono text-muted px-2">
          <span>Native CLI script located in: <strong className="text-ink">cli/ovio.py</strong></span>
          <span>Run anywhere via: <code className="px-1.5 py-0.5 bg-paper rounded text-ink font-semibold">git speak</code></span>
        </div>
      </div>
    </section>
  )
}
