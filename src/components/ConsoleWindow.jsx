import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Terminal, Copy, Check, Zap } from 'lucide-react'

export const TERMINAL_SESSIONS = {
  auth: {
    id: 'auth',
    title: '#1 Auth JWT Refactor',
    branch: 'feature/auth-flow',
    filesCount: 3,
    keyterms: ['authService', 'verifyToken', 'JWT_SECRET', 'TokenExpiredError'],
    verbatim: 'uh so in auth service we added verifyToken to check the JWT_SECRET wait also handled expired token errors properly',
    commitTitle: 'feat(auth): add verifyToken and handle expired token errors',
    commitBullets: [
      '- Implement token verification against JWT_SECRET in authService',
      '- Add explicit error handling for expired and malformed tokens'
    ],
    latency: 640,
  },
  db: {
    id: 'db',
    title: '#2 Postgres Schema',
    branch: 'fix/user-org-cascade',
    filesCount: 2,
    keyterms: ['UserOrganization', 'foreignKey', 'cascadeDelete', 'organizationId'],
    verbatim: 'we added a foreign key constraint for UserOrganization with cascade delete and uh make sure we indexed organizationId actually',
    commitTitle: 'feat(db): add cascade delete and index to UserOrganization',
    commitBullets: [
      '- Add foreign key constraint with onDelete: Cascade on UserOrganization',
      '- Index organizationId to optimize join queries'
    ],
    latency: 718,
  },
  ui: {
    id: 'ui',
    title: '#3 Tailwind Theme Switcher',
    branch: 'feat/theme-toggle',
    filesCount: 2,
    keyterms: ['useThemePreference', 'darkModeToggle', 'hairlineBorder', 'localStorage'],
    verbatim: 'um in navbar component we added the theme preference switcher with local storage persistence and wait fixed the mobile drawer toggle',
    commitTitle: 'feat(ui): add theme switcher to Navbar and fix mobile drawer',
    commitBullets: [
      '- Integrate useThemePreference with localStorage persistence in Navbar',
      '- Resolve mobile drawer toggle click event boundary issue'
    ],
    latency: 580,
  }
}

const ASCII_BANNER = `  ___   __      __  ___   ___  
 / _ \\  \\ \\    / / |_ _| / _ \\ 
| | | |  \\ \\  / /   | | | | | |
| |_| |   \\ \\/ /    | | | |_| |
 \\___/     \\__/    |___| \\___/ `

const RULE = '────────────────────────────────────────────────────────────────────'

export default function ConsoleWindow() {
  const [activeSession, setActiveSession] = useState('auth')
  const [copied, setCopied] = useState(false)
  const [copiedCmd, setCopiedCmd] = useState(false)
  const session = TERMINAL_SESSIONS[activeSession]

  const fullCommitText = `${session.commitTitle}\n\n${session.commitBullets.join('\n')}`

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCopyCmd = () => {
    navigator.clipboard.writeText('ovio')
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
              <span className="text-xs font-mono text-ink-soft">Substrate-Friction Aesthetic</span>
            </div>
            <h2 className="font-serif-display text-3xl sm:text-4xl text-ink font-normal tracking-tight">
              What it looks like in your terminal (<code className="text-2xl font-mono">ovio</code>)
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
                title="Copy command: ovio"
              >
                {copiedCmd ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>ovio</span>
              </button>
            </div>
          </div>

          {/* Terminal Body */}
          <div className="p-5 sm:p-7 bg-[#0f0e0d] text-[#e6e4dc] font-mono text-xs sm:text-sm leading-relaxed overflow-x-auto selection:bg-white/20">
            {/* Command execution prompt */}
            <div className="text-[#8e8b83] mb-4">
              <span className="text-emerald-400 font-semibold">$</span> ovio
            </div>

            {/* Clean ASCII Banner */}
            <pre className="text-white font-bold leading-tight select-none mb-3">
              {ASCII_BANNER}
            </pre>

            {/* Metadata Section */}
            <div className="text-[#55524c] select-none text-xs">{RULE}</div>
            <div className="grid grid-cols-[140px_1fr] gap-y-1 py-1 text-xs sm:text-[13px]">
              <span className="text-[#8e8b83]">version</span>
              <span className="text-white">1.0.0</span>
              <span className="text-[#8e8b83]">model</span>
              <span className="text-white">Universal-3.5 Pro</span>
              <span className="text-[#8e8b83]">provider</span>
              <span className="text-white">AssemblyAI Dictation API</span>
            </div>

            <div className="text-[#55524c] select-none text-xs">{RULE}</div>
            <div className="grid grid-cols-[140px_1fr] gap-y-1 py-1 text-xs sm:text-[13px]">
              <span className="text-[#8e8b83]">branch</span>
              <span className="text-cyan-400 font-semibold">{session.branch}</span>
              <span className="text-[#8e8b83]">staged files</span>
              <span className="text-white font-semibold">{session.filesCount}</span>
              <span className="text-[#8e8b83]">symbols biased</span>
              <span className="text-amber-400 font-semibold">{session.keyterms.length}</span>
            </div>
            <div className="text-[#55524c] select-none text-xs mb-4">{RULE}</div>

            {/* Recording Indicator */}
            <div className="mb-4 text-xs sm:text-[13px]">
              <div className="text-[#8e8b83] mb-1">
                hold <span className="bg-white/20 text-white px-1.5 py-0.5 rounded text-[11px] font-bold">SPACEBAR</span> to dictate — release when done
              </div>
              <div className="flex items-center gap-2 font-semibold">
                <span className="text-red-500">● recording</span>
                <span className="text-[#FF8C00] tracking-wider">▁▂▃▄▅▄▃▂</span>
                <span className="text-[#8e8b83] text-xs font-normal">2.8s</span>
              </div>
            </div>

            {/* Result Header */}
            <div className="text-xs sm:text-[13px] font-semibold text-white mb-1">
              transcribed &amp; formatted <span className="text-[#8e8b83] font-normal text-xs">[{session.latency}ms  Universal-3.5 Pro]</span>
            </div>
            <div className="text-[#55524c] select-none text-xs">{RULE}</div>

            {/* Verbatim Speech */}
            <div className="my-2">
              <div className="text-[#8e8b83] text-xs uppercase tracking-wider mb-1">verbatim</div>
              <div className="text-[#a8a59c] italic pl-2 border-l-2 border-[#33302a]">
                "{session.verbatim}"
              </div>
            </div>

            {/* Conventional Commit (Amber Highlight) */}
            <div className="my-3">
              <div className="text-[#8e8b83] text-xs uppercase tracking-wider mb-1">conventional commit</div>
              <div className="pl-2 border-l-2 border-[#FF8C00]/40">
                <div className="text-[#FF8C00] font-bold text-xs sm:text-[13px] mb-1">
                  {session.commitTitle}
                </div>
                {session.commitBullets.map((bullet, i) => (
                  <div key={i} className="text-[#FF8C00]/90 text-xs sm:text-[13px]">
                    {bullet}
                  </div>
                ))}
              </div>
            </div>

            <div className="text-[#55524c] select-none text-xs mb-3">{RULE}</div>

            {/* Interactive Decision Loop */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs sm:text-[13px]">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-white font-bold">[Enter]</span>
                <span className="text-[#a8a59c]">commit &amp; push</span>
                <span className="text-[#55524c]">|</span>
                <span className="text-white font-bold">[c]</span>
                <span className="text-[#a8a59c]">commit only</span>
                <span className="text-[#55524c]">|</span>
                <span className="text-white font-bold">[e]</span>
                <span className="text-[#a8a59c]">edit</span>
                <span className="text-[#55524c]">|</span>
                <span className="text-red-400 font-bold">[q]</span>
                <span className="text-[#a8a59c]">cancel</span>
              </div>

              <button
                onClick={() => handleCopy(fullCommitText)}
                className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-1.5 text-xs font-mono"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-[#a8a59c]" />}
                <span>{copied ? 'Copied' : 'Copy Commit'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-4 flex flex-wrap items-center justify-between text-xs font-mono text-muted px-2">
          <span>CLI binary: <strong className="text-ink">ovio</strong> (powered by AssemblyAI Dictation API)</span>
          <span>Execution: <code className="px-1.5 py-0.5 bg-paper rounded text-ink font-semibold">ovio</code></span>
        </div>
      </div>
    </section>
  )
}
