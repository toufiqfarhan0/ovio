import React, { useState } from 'react'
import { Terminal, Copy, Check, GitBranch, ArrowRight } from 'lucide-react'
import TechTooltip from './TechTooltip'
import { useSectionId } from '../utils/navigation'

export default function Quickstart() {
  const [copiedIndex, setCopiedIndex] = useState(null)
  const sectionId = useSectionId('cli')

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const steps = [
    {
      title: 'Clone & Configure Environment',
      code: `git clone https://github.com/toufiqfarhan0/ovio.git\ncd ovio\necho "ASSEMBLYAI_API_KEY=your_key_here" > .env`
    },
    {
      title: 'Install Package & CLI Command',
      code: `pip install -e .\n# installs standalone global 'ovio' binary`
    },
    {
      title: 'Run Voice Git Anywhere',
      code: `ovio\n# or specify language: ovio --lang en`
    },
    {
      title: <>Audit <TechTooltip term="AST" position="top">AST</TechTooltip> Biasing & Diagnostics</>,
      code: `ovio gate     # inspects staged AST symbols\novio verify   # tests mic and API connectivity`
    }
  ]

  return (
    <section id={sectionId} className="py-16 hairline-border-b bg-paper-light">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              <span className="micro-label text-ink">CLI Setup</span>
              <span className="text-xs font-mono text-muted">•</span>
              <span className="text-xs font-mono text-ink-soft">2-minute setup</span>
            </div>
            <h2 className="font-serif-display text-3xl sm:text-4xl text-ink font-normal tracking-tight">
              Run ovio directly inside any git repository
            </h2>
          </div>
          <div className="text-xs font-mono text-muted">
            Tested on macOS, Linux, and Windows 11
          </div>
        </div>

        {/* Step-by-step installation instructions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {steps.map((item, idx) => (
            <div 
              key={idx}
              className="paper-card p-5 bg-paper flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="micro-label text-muted">STEP {idx + 1}</span>
                  <button
                    onClick={() => copyToClipboard(item.code, idx)}
                    className="flex items-center gap-1 text-xs font-mono text-muted hover:text-ink transition-colors"
                  >
                    {copiedIndex === idx ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <h3 className="font-medium text-ink text-sm mb-3">
                  {item.title}
                </h3>
              </div>

              <div className="p-3 rounded-lg bg-paper-deep/80 hairline-border font-mono text-xs text-ink overflow-x-auto whitespace-pre">
                {item.code}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
