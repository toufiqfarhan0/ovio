import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Terminal, Copy, Check, ShieldCheck, Cpu } from 'lucide-react'
import { useSectionId } from '../utils/navigation'

export const TERMINAL_SESSIONS = {
  auth: {
    id: 'auth',
    title: '#1 Auth JWT Refactor',
    branch: 'feature/auth-flow',
    filesCount: '3 files (src/auth/jwt.ts, src/auth/token.ts, +1)',
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
    filesCount: '2 files (src/db/schema.ts, src/db/migrations.ts)',
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
    filesCount: '2 files (src/components/Navbar.tsx, src/hooks/useTheme.ts)',
    keyterms: ['useThemePreference', 'darkModeToggle', 'hairlineBorder', 'localStorage'],
    verbatim: 'um in navbar component we added the theme preference switcher with local storage persistence and wait fixed the mobile drawer toggle',
    commitTitle: 'feat(ui): add theme switcher to Navbar and fix mobile drawer',
    commitBullets: [
      '- Integrate useThemePreference with localStorage persistence in Navbar',
      '- Resolve mobile drawer toggle click event boundary issue'
    ],
    latency: 580,
  },
  silence: {
    id: 'silence',
    title: '#4 Silence Guidance',
    branch: 'fix/token-guard',
    filesCount: '2 files (src/auth/tokenGuard.ts, src/auth/types.ts)',
    keyterms: ['verifyToken', 'tokenExpiresAt', 'authService'],
    statusNote: 'pause detected — speak more or release',
    verbatim: '[2.4s silence] -> ovio intercepted dead air -> developer spoke: "in auth service check tokenExpiresAt before verifyToken"',
    commitTitle: 'fix(auth): check tokenExpiresAt prior to verifyToken',
    commitBullets: [
      '- Ensure tokenExpiresAt validation occurs before verifyToken invocation',
      '- Prevent uncaught expiration crashes in authService'
    ],
    latency: 635,
  }
}

export const MULTILANG_SESSIONS = {
  en: {
    lang: 'en',
    label: 'English (en)',
    verbatim: 'In auth routes, we implemented refreshToken endpoint and tokenBlacklist for session logout.',
    commitTitle: 'feat(auth): implement refreshToken endpoint and tokenBlacklist for session logout',
    commitBullets: [
      '- Added refreshToken endpoint in auth/routes',
      '- Implemented tokenBlacklist for session logout'
    ],
    latency: 2445,
  },
  fr: {
    lang: 'fr',
    label: 'French (fr)',
    verbatim: "Le déploiement est bloqué parce que l'API d'authentification retourne des erreurs 500.",
    commitTitle: 'fix(auth): deployment blocked by 500 errors from authentication API',
    commitBullets: [
      '- Deployment is blocked due to 500 errors returned by the authentication API.'
    ],
    latency: 2515,
  },
  es: {
    lang: 'es',
    label: 'Spanish (es)',
    verbatim: 'El despliegue está retrasado porque la API de autenticación está devolviendo errores de servidor.',
    commitTitle: 'fix(auth): authentication API returning server errors',
    commitBullets: [
      '- Deployment delayed due to authentication API errors',
      '- Server errors returned by the authentication API'
    ],
    latency: 1328,
  },
  de: {
    lang: 'de',
    label: 'German (de)',
    verbatim: 'Die Bereitstellung ist verzögert, weil die Authentifizierungs-API 500 Fehler zurückgibt.',
    commitTitle: 'fix(auth): resolve 500 errors causing deployment delay',
    commitBullets: [
      '- Resolve 500 errors from authentication API',
      '- Unblock delayed production deployment'
    ],
    latency: 1280,
  },
  hi: {
    lang: 'hi',
    label: 'Hindi (hi)',
    verbatim: 'डिप्लॉयमेंट ब्लॉक हो गया है क्योंकि ऑथेंटिकेशन एपीआई 500 एरर दे रहा है।',
    commitTitle: 'fix(auth): resolve 500 errors blocking deployment',
    commitBullets: [
      '- Fix authentication API returning 500 errors',
      '- Unblock deployment pipeline'
    ],
    latency: 3500,
  }
}

const BANNER_TOP = `  ██████╗ ██╗   ██╗██╗ ██████╗ 
 ██╔═══██╗██║   ██║██║██╔═══██╗
 ██║   ██║██║   ██║██║██║   ██║
 ██║   ██║╚██╗ ██╔╝██║██║   ██║
 ╚██████╔╝ ╚████╔╝ ██║╚██████╔╝
  ╚═════╝   ╚═══╝  ╚═╝ ╚═════╝ `

const BANNER_BOT = `   ██╗   ██╗ ██████╗ ██╗ ██████╗███████╗    ██████╗ ██╗████████╗
   ██║   ██║██╔═══██╗██║██╔════╝██╔════╝   ██╔════╝ ██║╚══██╔══╝
───██║   ██║██║   ██║██║██║     █████╗     ██║  ███╗██║   ██║   
───╚██╗ ██╔╝██║   ██║██║██║     ██╔══╝     ██║   ██║██║   ██║   
    ╚████╔╝ ╚██████╔╝██║╚██████╗███████║   ╚██████╔╝██║   ██║   
     ╚═══╝   ╚═════╝ ╚═╝ ╚═════╝╚══════╝    ╚═════╝ ╚═╝   ╚═╝   `

const RULE = '────────────────────────────────────────────────────────────────────'

export default function ConsoleWindow({ selectedPreset, onSelectPreset }) {
  const [internalSession, setInternalSession] = useState('auth')
  const [activeCommand, setActiveCommand] = useState('ovio') // 'ovio', 'lang', 'gate', 'verify'
  const [selectedLang, setSelectedLang] = useState('en')
  const activeSession = selectedPreset || internalSession
  const session = TERMINAL_SESSIONS[activeSession] || TERMINAL_SESSIONS.auth
  const [copied, setCopied] = useState(false)
  const [copiedCmd, setCopiedCmd] = useState(false)

  const currentCommandDisplay = activeCommand === 'ovio'
    ? 'ovio'
    : activeCommand === 'lang'
      ? `ovio --lang ${selectedLang}`
      : `ovio ${activeCommand}`

  const setActiveSession = (key) => {
    setActiveCommand('ovio')
    setInternalSession(key)
    if (onSelectPreset) {
      onSelectPreset(key)
    }
  }

  const fullCommitText = `${session.commitTitle}\n\n${session.commitBullets.join('\n')}`

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCopyCmd = () => {
    navigator.clipboard.writeText(currentCommandDisplay)
    setCopiedCmd(true)
    setTimeout(() => setCopiedCmd(false), 2000)
  }

  const sectionId = useSectionId('console')

  return (
    <section id={sectionId} className="py-16 hairline-border-b bg-paper-light">
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

          {/* Command Switcher */}
          <div className="flex flex-wrap items-center gap-2 bg-paper p-1 rounded-lg hairline-border text-xs font-mono">
            <span className="text-muted px-2">Command:</span>
            <button
              onClick={() => setActiveCommand('ovio')}
              className={`px-2.5 py-1 rounded transition-all ${
                activeCommand === 'ovio'
                  ? 'bg-paper-light text-ink font-semibold shadow-sm hairline-border'
                  : 'text-ink-soft hover:text-ink'
              }`}
            >
              ovio
            </button>
            <button
              onClick={() => setActiveCommand('lang')}
              className={`px-2.5 py-1 rounded transition-all ${
                activeCommand === 'lang'
                  ? 'bg-paper-light text-ink font-semibold shadow-sm hairline-border'
                  : 'text-ink-soft hover:text-ink'
              }`}
            >
              ovio --lang
            </button>
            <button
              onClick={() => setActiveCommand('gate')}
              className={`px-2.5 py-1 rounded transition-all ${
                activeCommand === 'gate'
                  ? 'bg-paper-light text-ink font-semibold shadow-sm hairline-border'
                  : 'text-ink-soft hover:text-ink'
              }`}
            >
              ovio gate
            </button>
            <button
              onClick={() => setActiveCommand('verify')}
              className={`px-2.5 py-1 rounded transition-all ${
                activeCommand === 'verify'
                  ? 'bg-paper-light text-ink font-semibold shadow-sm hairline-border'
                  : 'text-ink-soft hover:text-ink'
              }`}
            >
              ovio verify
            </button>
          </div>
        </div>

        {/* Preset selector when in main ovio mode */}
        {activeCommand === 'ovio' && (
          <div className="flex flex-wrap items-center justify-between mb-3 px-1 text-xs font-mono text-muted">
            <div className="flex items-center gap-2">
              <span>Preset Scenarios:</span>
              {Object.keys(TERMINAL_SESSIONS).map((key) => (
                <button
                  key={key}
                  onClick={() => setActiveSession(key)}
                  className={`px-2 py-0.5 rounded transition-all ${
                    activeSession === key
                      ? 'bg-paper text-ink font-semibold hairline-border'
                      : 'text-muted hover:text-ink'
                  }`}
                >
                  {key === 'silence' ? 'Silence Guidance' : key}
                </button>
              ))}
            </div>
            <span className="hidden sm:inline text-[11px] text-muted">Universal-3.5 Pro · Sub-second SLA &lt;800ms</span>
          </div>
        )}

        {/* Language selector when in ovio --lang mode */}
        {activeCommand === 'lang' && (
          <div className="flex flex-wrap items-center justify-between mb-3 px-1 text-xs font-mono text-muted">
            <div className="flex items-center gap-2">
              <span>Select Language:</span>
              {Object.entries(MULTILANG_SESSIONS).map(([key, item]) => (
                <button
                  key={key}
                  onClick={() => setSelectedLang(key)}
                  className={`px-2 py-0.5 rounded transition-all ${
                    selectedLang === key
                      ? 'bg-paper text-ink font-semibold hairline-border'
                      : 'text-muted hover:text-ink'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <span className="hidden sm:inline text-[11px] text-muted">Universal-3.5 Pro · 19 Languages Supported</span>
          </div>
        )}

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
              <span className="text-xs font-mono text-ink font-semibold">~/test-apy-sync — zsh / pwsh</span>
              <span className="text-xs font-mono text-muted">•</span>
              <span className="text-[11px] font-mono text-muted">
                {currentCommandDisplay}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono">
              <button
                onClick={handleCopyCmd}
                className="px-2 py-0.5 rounded bg-paper-light text-ink hover:bg-paper hairline-border text-[11px] flex items-center gap-1 transition-colors"
                title="Copy command"
              >
                {copiedCmd ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{currentCommandDisplay}</span>
              </button>
            </div>
          </div>

          {/* Terminal Body */}
          <div className="p-5 sm:p-7 bg-[#0b0a09] text-[#e6e4dc] font-mono text-xs sm:text-sm leading-relaxed overflow-x-auto selection:bg-white/20">
            {/* Command execution prompt */}
            <div className="text-[#8e8b83] mb-4">
              <span className="text-emerald-400 font-semibold">$</span> {currentCommandDisplay}
            </div>

            {/* Render based on activeCommand */}
            {activeCommand === 'ovio' && (
              <>
                {/* Dual-Tone ANSI Shadow Banner */}
                <div className="select-none mb-3">
                  <pre className="text-[#F5EE27] font-bold leading-none tracking-normal">
                    {BANNER_TOP}
                  </pre>
                  <pre className="text-white font-bold leading-none tracking-normal mt-2">
                    {BANNER_BOT}
                  </pre>
                  <div className="text-[#6e6e6e] text-xs mt-3 tracking-wide">
                    measure what the developer meant
                  </div>
                </div>

                {/* Status Verdict */}
                <div className="mb-4 text-xs sm:text-[13px]">
                  <span className="text-emerald-400 font-bold">[LIVE]</span>{' '}
                  <span className="text-white font-bold">DICTATION</span>{' '}
                  <span className="text-[#8e8b83]">model=Universal-3.5-Pro  sla&lt;800ms</span>
                </div>

                {/* Framed Telemetry Block */}
                <div className="text-[#3a3834] select-none text-xs">{RULE}</div>
                <div className="py-0.5 text-xs sm:text-[13px] flex items-center gap-3">
                  <span className="text-[#F5EE27] font-bold">{session.branch}</span>
                  <span className="text-white font-bold">LIVE — AssemblyAI Dictation Engine</span>
                </div>
                <div className="text-[#3a3834] select-none text-xs">{RULE}</div>

                <div className="grid grid-cols-[140px_1fr] gap-y-0.5 py-1 text-xs sm:text-[13px]">
                  <span className="text-[#a0a0a0]">branch</span>
                  <span className="text-white font-bold">: {session.branch}</span>

                  <span className="text-[#a0a0a0]">staged files</span>
                  <span className="text-white font-bold">: {session.filesCount}</span>

                  <span className="text-[#a0a0a0]">language</span>
                  <span className="text-white font-bold">: en  (English)</span>

                  <span className="text-[#a0a0a0]">diff biasing</span>
                  <span className="text-white font-bold">: {session.keyterms.length} symbols [{session.keyterms.join(', ')}]</span>

                  <span className="text-[#a0a0a0]">engine</span>
                  <span className="text-white font-bold">: Universal-3.5 Pro (streaming dictation)</span>

                  <span className="text-[#a0a0a0]">instruction</span>
                  <span className="text-white font-bold">: Conventional Commit + code symbol fidelity</span>
                </div>

                <div className="text-[#F5EE27] font-bold text-xs py-1">
                  BIAS HIT: {session.keyterms.length} staged symbol(s) locked into STT vocabulary [{session.keyterms.slice(0, 3).join(', ')}].
                </div>
                <div className="text-[#3a3834] select-none text-xs mb-4">{RULE}</div>

                {/* Recording Live Indicator */}
                <div className="mb-4 text-xs sm:text-[13px]">
                  <div className="text-[#8e8b83] mb-1">
                    hold <span className="bg-white/20 text-white px-1.5 py-0.5 rounded text-[11px] font-bold">SPACEBAR</span> to dictate — release when done
                  </div>
                  <div className="flex flex-wrap items-center gap-2 font-semibold">
                    <span className="text-red-500">● recording</span>
                    <span className="text-[#F5EE27] tracking-wider">{session.statusNote ? '·······' : '▁▂▃▄▅▄▃▂'}</span>
                    <span className="text-[#8e8b83] text-xs font-normal">2.4s</span>
                    {session.statusNote ? (
                      <span className="text-amber-400 text-xs font-mono font-normal">({session.statusNote})</span>
                    ) : (
                      <span className="text-emerald-400 text-xs font-mono font-normal">(voice active)</span>
                    )}
                  </div>
                </div>

                {/* Result Card with Framed Header */}
                <div className="text-[#3a3834] select-none text-xs">{RULE}</div>
                <div className="py-0.5 text-xs sm:text-[13px] flex items-center gap-3">
                  <span className="text-[#F5EE27] font-bold">commit_transcribe</span>
                  <span className="text-white font-bold">TRANSCRIBED — in {session.latency} ms</span>
                </div>
                <div className="text-[#3a3834] select-none text-xs">{RULE}</div>

                <div className="grid grid-cols-[140px_1fr] gap-y-1.5 py-2 text-xs sm:text-[13px]">
                  <span className="text-[#a0a0a0]">verbatim</span>
                  <span className="text-[#a8a59c] italic">: "{session.verbatim}"</span>

                  <span className="text-[#a0a0a0]">conventional</span>
                  <div>
                    <span className="text-white font-bold">: {session.commitTitle}</span>
                    <div className="mt-2 space-y-0.5">
                      {session.commitBullets.map((bullet, i) => (
                        <div key={i} className="text-[#a8a59c] text-xs sm:text-[13px]">
                          {bullet}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="text-[#3a3834] select-none text-xs mb-3">{RULE}</div>

                {/* Interactive Decision Loop */}
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs sm:text-[13px]">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-white font-bold">[Enter]</span>
                    <span className="text-[#a8a59c]">commit &amp; push</span>
                    <span className="text-[#55524c]">│</span>
                    <span className="text-white font-bold">[c]</span>
                    <span className="text-[#a8a59c]">commit only</span>
                    <span className="text-[#55524c]">│</span>
                    <span className="text-white font-bold">[e]</span>
                    <span className="text-[#a8a59c]">edit</span>
                    <span className="text-[#55524c]">│</span>
                    <span className="text-[#F5EE27] font-bold">[q]</span>
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

                <div className="mt-3 text-xs font-bold text-[#F5EE27]">
                  VERIFY OK: committed to local branch {session.branch}; pushed to origin/{session.branch}
                </div>
              </>
            )}

            {activeCommand === 'lang' && (() => {
              const currentLang = MULTILANG_SESSIONS[selectedLang] || MULTILANG_SESSIONS.fr
              const fullLangCommitText = `${currentLang.commitTitle}\n\n${currentLang.commitBullets.join('\n')}`
              return (
                <>
                  <div className="select-none mb-3">
                    <pre className="text-[#F5EE27] font-bold leading-none tracking-normal">
                      {BANNER_TOP}
                    </pre>
                    <pre className="text-white font-bold leading-none tracking-normal mt-2">
                      {BANNER_BOT}
                    </pre>
                    <div className="text-[#6e6e6e] text-xs mt-3 tracking-wide">
                      measure what the developer meant
                    </div>
                  </div>

                  <div className="mb-4 text-xs sm:text-[13px]">
                    <span className="text-emerald-400 font-bold">[LIVE]</span>{' '}
                    <span className="text-white font-bold">MULTILINGUAL DICTATION</span>{' '}
                    <span className="text-[#8e8b83]">model=Universal-3.5-Pro  lang={selectedLang}  output=Conventional-Commit-EN</span>
                  </div>

                  <div className="text-[#3a3834] select-none text-xs">{RULE}</div>
                  <div className="py-0.5 text-xs sm:text-[13px] flex items-center gap-3">
                    <span className="text-[#F5EE27] font-bold">main</span>
                    <span className="text-white font-bold">LIVE — AssemblyAI Universal-3.5 Pro Multilingual Engine</span>
                  </div>
                  <div className="text-[#3a3834] select-none text-xs">{RULE}</div>

                  <div className="grid grid-cols-[140px_1fr] gap-y-0.5 py-1 text-xs sm:text-[13px]">
                    <span className="text-[#a0a0a0]">branch</span>
                    <span className="text-white font-bold">: main</span>

                    <span className="text-[#a0a0a0]">staged files</span>
                    <span className="text-white font-bold">: 0 (clean working tree)</span>

                    <span className="text-[#a0a0a0]">language</span>
                    <span className="text-white font-bold">: {selectedLang}  ({currentLang.label})</span>

                    <span className="text-[#a0a0a0]">engine</span>
                    <span className="text-white font-bold">: Universal-3.5 Pro (sub-second SLA &lt; 800ms)</span>

                    <span className="text-[#a0a0a0]">instruction</span>
                    <span className="text-white font-bold">: Native speech audio → English Conventional Commit standard</span>
                  </div>

                  <div className="text-[#F5EE27] font-bold text-xs py-1">
                    LANGUAGE ACTIVE: Universal-3.5 Pro configured for &apos;{selectedLang}&apos;. Spoken verbatim is captured in native tongue; commit is output in English.
                  </div>
                  <div className="text-[#3a3834] select-none text-xs mb-4">{RULE}</div>

                  {/* Recording Live Indicator */}
                  <div className="mb-4 text-xs sm:text-[13px]">
                    <div className="text-[#8e8b83] mb-1">
                      hold <span className="bg-white/20 text-white px-1.5 py-0.5 rounded text-[11px] font-bold">SPACEBAR</span> to dictate in {currentLang.label.split(' ')[0]} — release when done
                    </div>
                    <div className="flex flex-wrap items-center gap-2 font-semibold">
                      <span className="text-red-500">● recording</span>
                      <span className="text-[#F5EE27] tracking-wider">▁▂▃▄▅▄▃▂</span>
                      <span className="text-[#8e8b83] text-xs font-normal">2.4s</span>
                      <span className="text-emerald-400 text-xs font-mono font-normal">(voice active · {currentLang.label})</span>
                    </div>
                  </div>

                  {/* Result Card */}
                  <div className="text-[#3a3834] select-none text-xs">{RULE}</div>
                  <div className="py-0.5 text-xs sm:text-[13px] flex items-center gap-3">
                    <span className="text-[#F5EE27] font-bold">commit_transcribe</span>
                    <span className="text-white font-bold">TRANSCRIBED — in {currentLang.latency} ms</span>
                  </div>
                  <div className="text-[#3a3834] select-none text-xs">{RULE}</div>

                  <div className="grid grid-cols-[140px_1fr] gap-y-1.5 py-2 text-xs sm:text-[13px]">
                    <span className="text-[#a0a0a0]">verbatim</span>
                    <span className="text-[#a8a59c] italic">: &quot;{currentLang.verbatim}&quot;</span>

                    <span className="text-[#a0a0a0]">conventional</span>
                    <div>
                      <span className="text-white font-bold">: {currentLang.commitTitle}</span>
                      <div className="mt-2 space-y-0.5">
                        {currentLang.commitBullets.map((bullet, i) => (
                          <div key={i} className="text-[#a8a59c] text-xs sm:text-[13px]">
                            {bullet}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="text-[#3a3834] select-none text-xs mb-3">{RULE}</div>

                  {/* Interactive Decision Loop */}
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs sm:text-[13px]">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-white font-bold">[Enter]</span>
                      <span className="text-[#a8a59c]">commit &amp; push</span>
                      <span className="text-[#55524c]">│</span>
                      <span className="text-white font-bold">[c]</span>
                      <span className="text-[#a8a59c]">commit only</span>
                      <span className="text-[#55524c]">│</span>
                      <span className="text-white font-bold">[e]</span>
                      <span className="text-[#a8a59c]">edit</span>
                      <span className="text-[#55524c]">│</span>
                      <span className="text-[#F5EE27] font-bold">[q]</span>
                      <span className="text-[#a8a59c]">cancel</span>
                    </div>

                    <button
                      onClick={() => handleCopy(fullLangCommitText)}
                      className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-1.5 text-xs font-mono"
                    >
                      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-[#a8a59c]" />}
                      <span>{copied ? 'Copied' : 'Copy Commit'}</span>
                    </button>
                  </div>

                  <div className="mt-3 text-xs font-bold text-[#F5EE27]">
                    VERIFY OK: committed to local branch main; pushed to origin/main
                  </div>
                </>
              )
            })()}

            {activeCommand === 'gate' && (
              <>
                <div className="select-none mb-3">
                  <pre className="text-[#F5EE27] font-bold leading-none tracking-normal">
                    {BANNER_TOP}
                  </pre>
                  <pre className="text-white font-bold leading-none tracking-normal mt-2">
                    {BANNER_BOT}
                  </pre>
                  <div className="text-[#6e6e6e] text-xs mt-3 tracking-wide">
                    measure what the developer meant
                  </div>
                </div>

                <div className="mb-4 text-xs sm:text-[13px]">
                  <span className="text-emerald-400 font-bold">[PASS]</span>{' '}
                  <span className="text-white font-bold">GATE_READY</span>{' '}
                  <span className="text-[#8e8b83]">branch=main  staged=1  symbols=4</span>
                </div>

                <div className="text-[#3a3834] select-none text-xs">{RULE}</div>
                <div className="py-0.5 text-xs sm:text-[13px] flex items-center gap-3">
                  <span className="text-[#F5EE27] font-bold">main</span>
                  <span className="text-white font-bold">INSPECT — symbol biasing audit</span>
                </div>
                <div className="text-[#3a3834] select-none text-xs">{RULE}</div>

                <div className="grid grid-cols-[140px_1fr] gap-y-1 py-1 text-xs sm:text-[13px]">
                  <span className="text-[#a0a0a0]">branch</span>
                  <span className="text-white font-bold">: main</span>

                  <span className="text-[#a0a0a0]">staged files</span>
                  <span className="text-white font-bold">: 1 files (src/index.ts)</span>

                  <span className="text-[#a0a0a0]">diff biasing</span>
                  <div>
                    <span className="text-white font-bold">: 4 symbol(s) locked into vocabulary</span>
                    <div className="mt-1 space-y-0.5 text-[#a8a59c] text-xs">
                      <div>01. index.ts</div>
                      <div>02. index</div>
                      <div>03. teamsRouter</div>
                      <div>04. GET</div>
                    </div>
                  </div>

                  <span className="text-[#a0a0a0]">engine</span>
                  <span className="text-white font-bold">: Universal-3.5 Pro (streaming dictation)</span>

                  <span className="text-[#a0a0a0]">stt prompt</span>
                  <span className="text-[#a8a59c]">: A developer dictating git commits for branch 'main'. Files: index.ts.</span>
                </div>
                <div className="text-[#3a3834] select-none text-xs mb-3">{RULE}</div>
              </>
            )}

            {activeCommand === 'verify' && (
              <>
                <div className="text-[#3a3834] select-none text-xs">{RULE}</div>
                <div className="py-0.5 text-xs sm:text-[13px] flex items-center gap-3">
                  <span className="text-[#F5EE27] font-bold">ovio_verify</span>
                  <span className="text-white font-bold">DIAGNOSTICS — environment audit</span>
                </div>
                <div className="text-[#3a3834] select-none text-xs">{RULE}</div>

                <div className="grid grid-cols-[140px_1fr] gap-y-1.5 py-2 text-xs sm:text-[13px]">
                  <span className="text-[#a0a0a0]">git repository</span>
                  <span className="text-white font-bold">: OK (work tree detected)</span>

                  <span className="text-[#a0a0a0]">audio backend</span>
                  <span className="text-white font-bold">: OK (sounddevice active · 16kHz PCM ready)</span>

                  <span className="text-[#a0a0a0]">api key</span>
                  <span className="text-white font-bold">: OK (AssemblyAI Universal-3.5 Pro verified)</span>
                </div>
                <div className="text-[#3a3834] select-none text-xs mb-3">{RULE}</div>

                <div className="text-xs font-bold text-[#F5EE27]">
                  VERIFY OK: system fully operational; audio capture, diff biasing, and dictation ready.
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-4 flex flex-wrap items-center justify-between text-xs font-mono text-muted px-2">
          <span>CLI binary: <strong className="text-ink">ovio</strong> (powered by AssemblyAI Dictation API)</span>
          <span>Modes: <code className="px-1.5 py-0.5 bg-paper rounded text-ink font-semibold">ovio</code> · <code className="px-1.5 py-0.5 bg-paper rounded text-ink font-semibold">ovio --lang &lt;code&gt;</code> · <code className="px-1.5 py-0.5 bg-paper rounded text-ink font-semibold">ovio gate</code> · <code className="px-1.5 py-0.5 bg-paper rounded text-ink font-semibold">ovio verify</code></span>
        </div>
      </div>
    </section>
  )
}
