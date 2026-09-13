import React, { useState, useEffect } from 'react'
import {
  Terminal,
  BookOpen,
  Cpu,
  Globe2,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Copy,
  Check,
  Search,
  ChevronRight,
  Code2,
  Sparkles,
  Layers,
  Sliders,
  FileCode,
  Zap,
  Volume2
} from 'lucide-react'
import Logo from './Logo'

// Utility component for code blocks with one-click copy
function CodeBlock({ code, language = 'bash', label }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="my-4 rounded-lg border border-line bg-paper-card overflow-hidden shadow-xs font-mono text-xs">
      {label && (
        <div className="flex items-center justify-between px-3.5 py-2 border-b border-line bg-paper-deep/40 text-ink-soft">
          <span className="text-[11px] font-medium tracking-wide uppercase">{label}</span>
          <span className="text-[10px] text-muted">{language}</span>
        </div>
      )}
      <div className="relative group p-4 bg-[#141211] text-[#f5f4ee] overflow-x-auto">
        <pre className="leading-relaxed whitespace-pre font-mono">
          <code>{code}</code>
        </pre>
        <button
          onClick={handleCopy}
          aria-label="Copy code"
          className="absolute top-3 right-3 p-1.5 rounded bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  )
}

// Callout alert badge
function Callout({ type = 'note', title, children }) {
  const styles = {
    note: {
      border: 'border-line',
      bg: 'bg-paper-light',
      icon: <BookOpen className="w-4 h-4 text-ink-soft shrink-0" />,
      header: 'text-ink-soft'
    },
    tip: {
      border: 'border-emerald-600/30',
      bg: 'bg-emerald-500/5',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />,
      header: 'text-emerald-900'
    },
    warning: {
      border: 'border-amber-600/30',
      bg: 'bg-amber-500/5',
      icon: <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />,
      header: 'text-amber-900'
    },
    important: {
      border: 'border-[#ff571a]/30',
      bg: 'bg-[#ff571a]/5',
      icon: <Zap className="w-4 h-4 text-[#ff571a] shrink-0" />,
      header: 'text-[#ff571a]'
    }
  }

  const current = styles[type] || styles.note

  return (
    <div className={`my-4 p-4 rounded-lg border ${current.border} ${current.bg} text-xs leading-relaxed text-ink-soft`}>
      <div className="flex items-center gap-2 mb-1.5 font-medium">
        {current.icon}
        <span className={`text-[12px] font-semibold tracking-tight ${current.header}`}>
          {title || type.toUpperCase()}
        </span>
      </div>
      <div className="pl-6">{children}</div>
    </div>
  )
}

export default function DocsPage({ onBack }) {
  const [activeSection, setActiveSection] = useState('overview')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  const docSections = [
    {
      id: 'overview',
      group: 'Getting Started',
      title: 'Introduction & Overview',
      icon: BookOpen
    },
    {
      id: 'quickstart',
      group: 'Getting Started',
      title: 'Installation & Setup',
      icon: Terminal
    },
    {
      id: 'architecture',
      group: 'Architecture',
      title: '5-Stage Pipeline',
      icon: Layers
    },
    {
      id: 'diff-biasing',
      group: 'Architecture',
      title: 'Diff Biasing Mechanics',
      icon: Cpu
    },
    {
      id: 'commands',
      group: 'CLI Reference',
      title: 'CLI Command Matrix',
      icon: Code2
    },
    {
      id: 'multilingual',
      group: 'CLI Reference',
      title: 'Multilingual Dictation',
      icon: Globe2
    },
    {
      id: 'configuration',
      group: 'Configuration & Security',
      title: 'Env Keys & Safety',
      icon: Sliders
    },
    {
      id: 'troubleshooting',
      group: 'Troubleshooting',
      title: 'Diagnostics & FAQ',
      icon: AlertCircle
    }
  ]

  const filteredSections = docSections.filter(s =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.group.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const scrollToDoc = (id) => {
    setActiveSection(id)
    const element = document.getElementById(`doc-${id}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="min-h-screen bg-paper text-ink font-sans flex flex-col selection:bg-ink selection:text-paper-light">
      {/* Main Container */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-8 py-8 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left Sidebar Navigation */}
        <aside className="lg:col-span-3">
          <div className="sticky top-20 sm:top-24 space-y-6">
            {/* Search filter */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter documentation..."
                className="w-full bg-paper-light border border-line rounded-lg pl-8 pr-3 py-1.5 text-xs font-mono text-ink placeholder:text-muted focus:outline-hidden focus:border-ink transition-colors"
              />
            </div>

            {/* Navigation links by group */}
            <nav className="space-y-5 text-xs">
              {['Getting Started', 'Architecture', 'CLI Reference', 'Configuration & Security', 'Troubleshooting'].map((group) => {
                const groupItems = filteredSections.filter(item => item.group === group)
                if (groupItems.length === 0) return null

                return (
                  <div key={group} className="space-y-1.5">
                    <div className="micro-label text-[10px] text-muted tracking-wider uppercase px-2 font-medium">
                      {group}
                    </div>
                    <div className="space-y-0.5">
                      {groupItems.map(item => {
                        const Icon = item.icon
                        const isActive = activeSection === item.id
                        return (
                          <button
                            key={item.id}
                            onClick={() => scrollToDoc(item.id)}
                            className={`w-full text-left flex items-center justify-between px-2.5 py-1.5 rounded-md transition-colors ${
                              isActive
                                ? 'bg-ink text-paper-light font-medium'
                                : 'text-ink-soft hover:bg-paper-deep/60 hover:text-ink'
                            }`}
                          >
                            <span className="flex items-center gap-2 truncate">
                              <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[#ff571a]' : 'text-muted'}`} />
                              <span className="truncate">{item.title}</span>
                            </span>
                            {isActive && <ChevronRight className="w-3 h-3 shrink-0" />}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </nav>

            {/* Quick spec card */}
            <div className="p-3.5 rounded-lg border border-line bg-paper-deep/30 space-y-2 text-[11px] font-mono text-ink-soft">
              <div className="flex items-center justify-between text-muted">
                <span>Model Engine</span>
                <span className="text-ink font-semibold">Universal-3.5</span>
              </div>
              <div className="flex items-center justify-between text-muted">
                <span>Measured Latency</span>
                <span className="text-emerald-700 font-semibold">1,003ms – 1,512ms</span>
              </div>
              <div className="flex items-center justify-between text-muted">
                <span>Biasing Slot Limit</span>
                <span className="text-ink font-semibold">30 Symbols</span>
              </div>
              <div className="flex items-center justify-between text-muted">
                <span>Supported Langs</span>
                <span className="text-ink font-semibold">10+ Locales</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Right Editorial Documentation Content */}
        <main className="lg:col-span-9 space-y-16 pb-24 text-[14px] leading-relaxed text-ink">
          
          {/* SECTION 1: Introduction */}
          <section id="doc-overview" className="scroll-mt-32 space-y-4">
            <div className="micro-label text-muted">Introduction & Problem Statement</div>
            <h1 className="font-serif-display text-4xl sm:text-5xl text-ink tracking-tight font-semibold">
              Voice Git & Codebase Dictation Engine
            </h1>
            <p className="text-ink-soft text-base leading-relaxed">
              <strong>ovio</strong> bridges spoken intent and Git execution. Standard speech-to-text engines fail when software engineers speak codebase vocabulary—turning camelCase variables and code symbols into generic phonetic approximations. ovio extracts your staged Git diff symbols and dynamically biases AssemblyAI&apos;s streaming Dictation API for rapid, zero-drift Conventional Commits.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-lg border border-line bg-paper-light">
                <div className="text-xs font-mono text-muted mb-1">THE ACOUSTIC GAP</div>
                <h4 className="font-semibold text-sm mb-1 text-red-700">Generic Speech Recognition</h4>
                <p className="text-xs text-ink-soft">
                  Transcribes <code className="font-mono text-[11px]">jwtSecret</code> as <em>&quot;J W T secret&quot;</em>, and <code className="font-mono text-[11px]">TokenExpiredError</code> as <em>&quot;token expired era&quot;</em>.
                </p>
              </div>

              <div className="p-4 rounded-lg border border-emerald-600/30 bg-emerald-500/5">
                <div className="text-xs font-mono text-emerald-700 mb-1">THE OVIO APPROACH</div>
                <h4 className="font-semibold text-sm mb-1 text-emerald-900">Diff-Biased Universal-3.5</h4>
                <p className="text-xs text-ink-soft">
                  Staged symbols are pre-injected into the acoustic vocabulary via <code className="font-mono text-[11px]">keyterms_prompt</code>. Exact symbol casing and scope are guaranteed.
                </p>
              </div>
            </div>
          </section>

          <hr className="border-line" />

          {/* SECTION 2: Installation & Quickstart */}
          <section id="doc-quickstart" className="scroll-mt-32 space-y-4">
            <div className="micro-label text-muted">Quickstart & Installation</div>
            <h2 className="font-serif-display text-3xl text-ink font-semibold">
              Installation & Initial Setup
            </h2>
            <p className="text-ink-soft text-sm">
              ovio requires Python 3.10+ and an AssemblyAI API key.
            </p>

            <h3 className="font-semibold text-base pt-2">1. Install Package</h3>
            <CodeBlock
              code={`# On macOS, install portaudio via Homebrew first:\n# brew install portaudio git python\n\npip install -e .`}
              language="bash"
              label="Terminal Installation"
            />

            <h3 className="font-semibold text-base pt-2">2. Provide AssemblyAI API Key</h3>
            <p className="text-ink-soft text-xs">
              ovio resolves your API key from your environment or configuration files:
            </p>
            <CodeBlock
              code={`# Option A: Local project environment (make sure .env is in .gitignore!)\necho "ASSEMBLYAI_API_KEY=your_assemblyai_api_key_here" > .env\n\n# Option B: Global home directory (works across all repositories safely)\necho "ASSEMBLYAI_API_KEY=your_assemblyai_api_key_here" > ~/.ovio.env\n\n# Option C: Direct shell export\nexport ASSEMBLYAI_API_KEY="your_assemblyai_api_key_here"`}
              language="bash"
              label="API Key Setup"
            />

            <h3 className="font-semibold text-base pt-2">3. Verify Your Environment</h3>
            <p className="text-ink-soft text-xs">
              Run diagnostics to audit audio devices, Git working tree, and AssemblyAI connectivity:
            </p>
            <CodeBlock
              code="ovio verify"
              language="bash"
              label="Environment Diagnostics"
            />

            <Callout type="tip" title="macOS (MacBook Pro / Air) Setup & Permissions">
              On macOS, grant <strong>Microphone Access</strong> when prompted. For Spacebar push-to-talk, grant <strong>Accessibility</strong> in <em>System Settings &gt; Privacy &amp; Security &gt; Accessibility</em>. If running without accessibility, ovio automatically switches to the <code>&lt;Enter&gt;</code> toggle fallback.
            </Callout>

            <Callout type="tip" title="Zero-Mic Dry Run">
              Don&apos;t have an active microphone or running in a headless VM? Test ovio instantly with synthetic developer audio using <code className="font-mono">ovio --demo</code> or test live API fixtures with <code className="font-mono">ovio --file fixtures/short_command.wav</code>.
            </Callout>
          </section>

          <hr className="border-line" />

          {/* SECTION 3: Sub-800ms Pipeline Architecture */}
          <section id="doc-architecture" className="scroll-mt-32 space-y-4">
            <div className="micro-label text-muted">Core Engine</div>
            <h2 className="font-serif-display text-3xl text-ink font-semibold">
              The 5-Stage Voice-to-Git Pipeline
            </h2>
            <p className="text-ink-soft text-sm">
              Every voice commit execution traverses five synchronous, fault-tolerant stages designed to hit a strict &lt;800ms SLA:
            </p>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3.5 rounded-lg border border-line bg-paper-card">
                <div className="flex items-center gap-2 font-bold text-ink mb-1">
                  <span className="w-5 h-5 rounded-full bg-ink text-paper-light flex items-center justify-center text-[10px]">1</span>
                  <span>Audio Capture (Push-to-Talk)</span>
                </div>
                <p className="text-ink-soft pl-7 font-sans">
                  Streams 16kHz mono linear PCM directly from your local hardware device using <code className="font-mono text-[11px]">sounddevice</code> or low-level PortAudio bindings. Spacebar hold initiates and terminates capture.
                </p>
              </div>

              <div className="p-3.5 rounded-lg border border-line bg-paper-card">
                <div className="flex items-center gap-2 font-bold text-ink mb-1">
                  <span className="w-5 h-5 rounded-full bg-ink text-paper-light flex items-center justify-center text-[10px]">2</span>
                  <span>Git Diff Symbol Extraction</span>
                </div>
                <p className="text-ink-soft pl-7 font-sans">
                  Inspects staged index (<code className="font-mono text-[11px]">git diff --staged</code>). Regex and language heuristics extract modified identifiers, exported classes, and functions across Python, TypeScript, Go, Rust, and JavaScript.
                </p>
              </div>

              <div className="p-3.5 rounded-lg border border-line bg-paper-card">
                <div className="flex items-center gap-2 font-bold text-ink mb-1">
                  <span className="w-5 h-5 rounded-full bg-ink text-paper-light flex items-center justify-center text-[10px]">3</span>
                  <span>AssemblyAI Dictation API Ingestion</span>
                </div>
                <p className="text-ink-soft pl-7 font-sans">
                  Dispatches audio payload to AssemblyAI Universal-3.5 Pro with <code className="font-mono text-[11px]">keyterms_prompt</code> containing extracted diff symbols and <code className="font-mono text-[11px]">stt_prompt</code> with staged file paths.
                </p>
              </div>

              <div className="p-3.5 rounded-lg border border-line bg-paper-card">
                <div className="flex items-center gap-2 font-bold text-ink mb-1">
                  <span className="w-5 h-5 rounded-full bg-ink text-paper-light flex items-center justify-center text-[10px]">4</span>
                  <span>Conventional Commit Synthesis</span>
                </div>
                <p className="text-ink-soft pl-7 font-sans">
                  AssemblyAI&apos;s LLM instruction formatting standardizes output strictly into Conventional Commits v1.0.0 (e.g. <code className="font-mono text-[11px]">feat(auth): ...</code>, <code className="font-mono text-[11px]">fix(payment): ...</code>).
                </p>
              </div>

              <div className="p-3.5 rounded-lg border border-line bg-paper-card">
                <div className="flex items-center gap-2 font-bold text-ink mb-1">
                  <span className="w-5 h-5 rounded-full bg-ink text-paper-light flex items-center justify-center text-[10px]">5</span>
                  <span>Developer Confirmation & Git Commit</span>
                </div>
                <p className="text-ink-soft pl-7 font-sans">
                  The TUI displays the transcription, audio turnaround latency, and commit message. Developer presses Enter to execute <code className="font-mono text-[11px]">git commit -m</code> or uses <code className="font-mono text-[11px]">--push</code> for automated pushes.
                </p>
              </div>
            </div>
          </section>

          <hr className="border-line" />

          {/* SECTION 4: Diff Biasing Mechanics */}
          <section id="doc-diff-biasing" className="scroll-mt-32 space-y-4">
            <div className="micro-label text-muted">Diff Biasing Deep Dive</div>
            <h2 className="font-serif-display text-3xl text-ink font-semibold">
              Diff Vocabulary Biasing Mechanics
            </h2>
            <p className="text-ink-soft text-sm">
              How ovio guarantees 100% spelling fidelity for symbols in your codebase:
            </p>

            <div className="space-y-3 text-xs">
              <h4 className="font-semibold text-sm">Extraction Algorithm (Why Regex Beats AST on Diffs)</h4>
              <p className="text-ink-soft">
                When you run <code className="font-mono">ovio</code> or <code className="font-mono">ovio gate</code>, the CLI scans the hunk headers (<code className="font-mono">@@ ... @@</code>) and modified lines in <code className="font-mono">git diff --staged</code> using targeted regular expressions rather than an AST compiler parser. Because diff hunks are incomplete fragments, full AST compilers choke on partial syntax; regex extraction operates in &lt;5ms across any programming language without requiring compilable source files:
              </p>

              <CodeBlock
                code={`# Extracted Diff Symbols\n1. Staged file base names without extension: ["auth", "tokens", "paymentRoutes"]\n2. Function and method declarations: ["verifyToken", "refreshToken", "handleWebhook"]\n3. Class and struct names: ["TokenBlacklist", "PaymentGateway"]\n4. Variable and property identifiers: ["jwtSecret", "expiresIn", "idempotencyKey"]`}
                language="yaml"
                label="Symbol Biasing Dictionary Payload"
              />

              <p className="text-ink-soft">
                These symbols are compiled into an array of up to 25 prioritized keyterms. The keyterms are sent as part of the <code className="font-mono">keyterms_prompt</code> parameter to AssemblyAI, increasing the acoustic probability of these exact strings during phonetic decoding.
              </p>

              <h4 className="font-semibold text-sm pt-2">Audit with `ovio gate`</h4>
              <p className="text-ink-soft">
                You can audit exactly which symbols are staged and locked into the vocabulary before dictating:
              </p>
              <CodeBlock
                code="ovio gate --verbose"
                language="bash"
                label="Pre-flight Vocabulary Audit"
              />
            </div>
          </section>

          <hr className="border-line" />

          {/* SECTION 5: CLI Command Matrix */}
          <section id="doc-commands" className="scroll-mt-32 space-y-4">
            <div className="micro-label text-muted">CLI Reference</div>
            <h2 className="font-serif-display text-3xl text-ink font-semibold">
              CLI Command Matrix & Flags
            </h2>

            <div className="overflow-x-auto rounded-lg border border-line bg-paper-card">
              <table className="w-full text-left text-xs font-mono border-collapse">
                <thead>
                  <tr className="border-b border-line bg-paper-deep/50 text-ink">
                    <th className="py-2.5 px-3 font-semibold">Command / Flag</th>
                    <th className="py-2.5 px-3 font-semibold">Alias</th>
                    <th className="py-2.5 px-3 font-semibold font-sans">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line text-ink-soft">
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-ink">ovio</td>
                    <td className="py-2.5 px-3 text-muted">—</td>
                    <td className="py-2.5 px-3 font-sans">Runs interactive voice commit. Push-to-talk with Spacebar, biased by staged diff symbols.</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-ink">ovio gate</td>
                    <td className="py-2.5 px-3 text-muted">-v / --verbose</td>
                    <td className="py-2.5 px-3 font-sans">Diff Biasing Audit. Displays staged files, extracted symbols, and vocabulary readiness.</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-ink">ovio verify</td>
                    <td className="py-2.5 px-3 text-muted">—</td>
                    <td className="py-2.5 px-3 font-sans">Runs local diagnostics: Git repository status, audio input devices, and AssemblyAI API key.</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-ink">ovio --demo</td>
                    <td className="py-2.5 px-3 text-muted">-d</td>
                    <td className="py-2.5 px-3 font-sans">Runs dry-run simulation using built-in synthetic audio fixtures. Zero microphone required.</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-ink">ovio --lang &lt;code&gt;</td>
                    <td className="py-2.5 px-3 text-muted">-l</td>
                    <td className="py-2.5 px-3 font-sans">Sets input spoken language code (e.g. <code>en</code>, <code>es</code>, <code>fr</code>, <code>de</code>, <code>hi</code>). Generates English commit.</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-ink">ovio --file &lt;path&gt;</td>
                    <td className="py-2.5 px-3 text-muted">-f</td>
                    <td className="py-2.5 px-3 font-sans">Testing & Headless CI: Transcribes existing WAV audio file through AssemblyAI Dictation API.</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-ink">ovio --push</td>
                    <td className="py-2.5 px-3 text-muted">-p</td>
                    <td className="py-2.5 px-3 font-sans">Automated push: Immediately pushes to remote branch after commit confirmation without secondary prompt.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <hr className="border-line" />

          {/* SECTION 6: Multilingual Dictation */}
          <section id="doc-multilingual" className="scroll-mt-32 space-y-4">
            <div className="micro-label text-muted">Internationalization</div>
            <h2 className="font-serif-display text-3xl text-ink font-semibold">
              Multilingual Voice Dictation
            </h2>
            <p className="text-ink-soft text-sm">
              Speak in your native language—ovio captures your native speech verbatim while synthesizing strict, standardized Conventional Commits in English for team clarity.
            </p>

            <CodeBlock
              code={`# French dictation\novio --lang fr\n# Spoken: "ajouter la vérification de jeton dans le service d'authentification"\n# Commit: "feat(auth): add token verification to authService"\n\n# Spanish dictation\novio --lang es\n# Spoken: "actualizar jwtSecret y corregir el manejo de errores"\n# Commit: "fix(auth): update jwtSecret and improve error handling"\n\n# Hindi dictation\novio --lang hi\n# Spoken: "payment validation mein idempotency key add karo"\n# Commit: "feat(payment): add idempotencyKey to payment validation"`}
              language="bash"
              label="Multilingual Dictation Examples"
            />

            <div className="overflow-x-auto rounded-lg border border-line bg-paper-card">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-line bg-paper-deep/50 text-ink">
                    <th className="py-2 px-3">Language Code</th>
                    <th className="py-2 px-3">Language Name</th>
                    <th className="py-2 px-3 font-sans">Commit Message Target</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line text-ink-soft">
                  <tr><td className="py-2 px-3 font-bold">en</td><td className="py-2 px-3">English</td><td className="py-2 px-3 font-sans">Conventional Commit (English)</td></tr>
                  <tr><td className="py-2 px-3 font-bold">es</td><td className="py-2 px-3">Spanish</td><td className="py-2 px-3 font-sans">Conventional Commit (English)</td></tr>
                  <tr><td className="py-2 px-3 font-bold">fr</td><td className="py-2 px-3">French</td><td className="py-2 px-3 font-sans">Conventional Commit (English)</td></tr>
                  <tr><td className="py-2 px-3 font-bold">de</td><td className="py-2 px-3">German</td><td className="py-2 px-3 font-sans">Conventional Commit (English)</td></tr>
                  <tr><td className="py-2 px-3 font-bold">hi</td><td className="py-2 px-3">Hindi</td><td className="py-2 px-3 font-sans">Conventional Commit (English)</td></tr>
                  <tr><td className="py-2 px-3 font-bold">it</td><td className="py-2 px-3">Italian</td><td className="py-2 px-3 font-sans">Conventional Commit (English)</td></tr>
                  <tr><td className="py-2 px-3 font-bold">pt</td><td className="py-2 px-3">Portuguese</td><td className="py-2 px-3 font-sans">Conventional Commit (English)</td></tr>
                  <tr><td className="py-2 px-3 font-bold">nl</td><td className="py-2 px-3">Dutch</td><td className="py-2 px-3 font-sans">Conventional Commit (English)</td></tr>
                  <tr><td className="py-2 px-3 font-bold">ja</td><td className="py-2 px-3">Japanese</td><td className="py-2 px-3 font-sans">Conventional Commit (English)</td></tr>
                  <tr><td className="py-2 px-3 font-bold">zh</td><td className="py-2 px-3">Chinese</td><td className="py-2 px-3 font-sans">Conventional Commit (English)</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <hr className="border-line" />

          {/* SECTION 7: Configuration & Security */}
          <section id="doc-configuration" className="scroll-mt-32 space-y-4">
            <div className="micro-label text-muted">Security Best Practices</div>
            <h2 className="font-serif-display text-3xl text-ink font-semibold">
              Configuration & Environment Security
            </h2>
            <p className="text-ink-soft text-sm">
              ovio is designed so that secrets are never accidentally leaked into version control.
            </p>

            <h3 className="font-semibold text-sm pt-1">Key Resolution Order</h3>
            <p className="text-ink-soft text-xs">
              When ovio initializes, it searches for <code className="font-mono">ASSEMBLYAI_API_KEY</code> in the following priority order:
            </p>
            <ol className="list-decimal pl-5 text-xs text-ink-soft space-y-1 font-mono">
              <li>Current working directory: <code className="text-ink">./.env</code></li>
              <li>User home directory: <code className="text-ink">~/.ovio.env</code></li>
              <li>Active shell environment: <code className="text-ink">$ASSEMBLYAI_API_KEY</code></li>
            </ol>

            <Callout type="important" title="Preventing Git Secret Leaks">
              If storing your key in your repository&apos;s local <code className="font-mono">.env</code> file, verify that <code className="font-mono">.env</code> is added to <code className="font-mono">.gitignore</code>. 
              <br /><br />
              <strong>Recommended Best Practice:</strong> Save your key in <code className="font-mono">~/.ovio.env</code> in your user home directory. This allows ovio to work seamlessly across every repository on your machine without placing any sensitive files inside git work trees.
            </Callout>
          </section>

          <hr className="border-line" />

          {/* SECTION 8: Troubleshooting & FAQ */}
          <section id="doc-troubleshooting" className="scroll-mt-32 space-y-4">
            <div className="micro-label text-muted">Troubleshooting</div>
            <h2 className="font-serif-display text-3xl text-ink font-semibold">
              Diagnostics & Common Issues
            </h2>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-lg border border-line bg-paper-card space-y-2">
                <h4 className="font-semibold text-sm text-ink flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>Microphone Permission Denied or No Input Device</span>
                </h4>
                <p className="text-ink-soft">
                  On macOS, grant Terminal, iTerm2, or VS Code permission to access the Microphone in <em>System Settings &gt; Privacy &amp; Security &gt; Microphone</em>. On Linux, ensure <code className="font-mono">libportaudio2</code> is installed (<code className="font-mono">sudo apt-get install libportaudio2</code>).
                </p>
              </div>

              <div className="p-4 rounded-lg border border-line bg-paper-card space-y-2">
                <h4 className="font-semibold text-sm text-ink flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>401 Unauthorized API Error</span>
                </h4>
                <p className="text-ink-soft">
                  Verify that your AssemblyAI API key is valid and has active credits. Run <code className="font-mono">ovio verify</code> to confirm your key is loaded and properly formatted.
                </p>
              </div>

              <div className="p-4 rounded-lg border border-line bg-paper-card space-y-2">
                <h4 className="font-semibold text-sm text-ink flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>&quot;No staged changes found&quot; Warning</span>
                </h4>
                <p className="text-ink-soft">
                  ovio automatically stages tracked modifications, but for brand-new files you must run <code className="font-mono">git add &lt;file&gt;</code> before dictating so that the diff symbol extractor can analyze their content.
                </p>
              </div>
            </div>
          </section>

          {/* Bottom Colophon */}
          <div className="pt-8 border-t border-line flex items-center justify-between text-xs text-muted font-mono">
            <span>ovio documentation v0.1.0</span>
            <span>Universal-3.5 Pro • 1,003ms – 1,512ms</span>
          </div>

        </main>
      </div>
    </div>
  )
}
