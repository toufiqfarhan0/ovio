import React from 'react'
import { Terminal, Shield, Bot, Laptop, ArrowRight } from 'lucide-react'

export default function Surfaces() {
  const surfaces = [
    {
      title: 'Native Terminal CLI',
      badge: 'ovio',
      desc: 'Run directly in any git repository. Push-to-talk audio capture, sub-second AssemblyAI turnaround, and one-key commit execution.',
      icon: Terminal,
      code: '$ git add .\n$ ovio\n[0.6s] Committed: feat(auth): verify JWT expiry'
    },
    {
      title: 'Pre-Commit & CI Gate',
      badge: '.github/workflows',
      desc: 'Fail-closed verification ensuring all commit messages generated comply with Conventional Commits v1.0.0 standards.',
      icon: Shield,
      code: 'name: Commit Verification\nruns-on: ubuntu-latest\nsteps:\n  - uses: toufiqfarhan0/ovio@main'
    },
    {
      title: 'MCP Server for AI Agents',
      badge: 'Model Context Protocol',
      desc: 'Expose ovio as an MCP tool to Claude Code, Cursor, and Windsurf so agents can narrate and review their own git diffs.',
      icon: Bot,
      code: '{\n  "name": "ovio_dictate_diff",\n  "description": "Biases staged diff AST into voice summary"\n}'
    },
    {
      title: 'VS Code & Cursor Overlay',
      badge: 'Desktop Raycast Style',
      desc: 'Floating pill widget triggered by a global hotkey (Cmd+Shift+C) over your editor without leaving your active file.',
      icon: Laptop,
      code: 'Shortcut: Cmd + Shift + C\nScope: Active Editor Diff\nTarget: Staged Git Index'
    }
  ]

  return (
    <section className="py-16 hairline-border-b bg-paper-light">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="max-w-2xl mb-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-ink"></span>
            <span className="micro-label text-ink">Integration Surfaces</span>
          </div>
          <h2 className="font-serif-display text-3xl sm:text-4xl text-ink font-normal tracking-tight mb-3">
            Plugs in four places, wherever you write code
          </h2>
          <p className="text-ink-soft text-sm sm:text-base leading-relaxed">
            From local developer terminals to autonomous AI agent loops, ovio provides the voice-to-intent bridge.
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {surfaces.map((s, idx) => {
            const Icon = s.icon
            return (
              <div 
                key={idx}
                className="paper-card p-6 bg-paper flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-paper-deep text-ink">
                        <Icon className="w-4 h-4" />
                      </div>
                      <h3 className="font-medium text-ink text-base">
                        {s.title}
                      </h3>
                    </div>
                    <span className="micro-label text-[10px] text-accent">
                      {s.badge}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-ink-soft leading-relaxed mb-4">
                    {s.desc}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-paper-deep/80 hairline-border font-mono text-xs text-ink overflow-x-auto whitespace-pre">
                  {s.code}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
