import React from 'react'
import TechTooltip from './TechTooltip'
import { useSectionId } from '../utils/navigation'

export default function ResearchLog() {
  const sectionId = useSectionId('research')
  const metrics = [
    {
      metric: 'Formulating Conventional Commit',
      manual: '~45 seconds (manual typing)',
      ovio: '~3.4 seconds (voice utterance)',
      gain: 'Saves 30–40s / commit',
      note: 'Eliminates mental context switch away from active IDE code'
    },
    {
      metric: 'Code Identifier Fidelity',
      manual: 'Frequent phonetic decay ("J W T secret")',
      ovio: 'Verbatim casing (jwtSecret)',
      gain: 'Acoustically biased',
      note: 'keyterms_prompt pins exact camelCase & snake_case symbols from diff'
    },
    {
      metric: 'Turnaround Latency',
      manual: 'N/A',
      ovio: '1,003ms – 1,512ms',
      gain: 'Rapid execution',
      note: 'Measured live across checked-in fixtures on production Universal-3.5 Pro'
    },
    {
      metric: 'Self-Correction & Filler Removal',
      manual: 'Manual backspacing & re-typing',
      ovio: 'Single-pass LLM cleanup',
      gain: 'Zero hesitation noise',
      note: 'Hesitation words like "um", "uh", "wait actually" stripped cleanly'
    },
    {
      metric: 'Execution Safety Guarantee',
      manual: 'Direct shell commands',
      ovio: 'Human-in-the-loop confirmation',
      gain: '100% developer control',
      note: 'LLM only formats text; developer explicitly approves [Enter/c/e/q]'
    }
  ]

  return (
    <section id={sectionId} className="py-16 hairline-border-b bg-paper">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="max-w-2xl mb-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-accent"></span>
            <span className="micro-label text-ink">Benchmark Measurements</span>
          </div>
          <h2 className="font-serif-display text-3xl sm:text-4xl text-ink font-normal tracking-tight mb-3">
            Why voice dictation wins when paired with repository diff symbol biasing
          </h2>
          <p className="text-ink-soft text-sm sm:text-base leading-relaxed">
            We evaluated voice-to-git against traditional keyboard entry across real developer workflows and measured test fixtures.
          </p>
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="hairline-border-b bg-paper-deep/60 text-muted">
                <th className="py-3 px-4 micro-label">METRIC / TEST</th>
                <th className="py-3 px-4 micro-label">CONVENTIONAL KEYBOARD</th>
                <th className="py-3 px-4 micro-label text-ink">OVIO ENGINE</th>
                <th className="py-3 px-4 micro-label text-emerald-800">MEASURED DELTA</th>
                <th className="py-3 px-4 micro-label">RECEIPT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60 bg-paper-light">
              {metrics.map((row, idx) => (
                <tr key={idx} className="hover:bg-paper-deep/30 transition-colors">
                  <td className="py-4 px-4 font-sans font-medium text-ink text-sm">
                    {row.metric}
                  </td>
                  <td className="py-4 px-4 text-muted">
                    {row.manual}
                  </td>
                  <td className="py-4 px-4 text-ink font-semibold">
                    {row.ovio}
                  </td>
                  <td className="py-4 px-4 text-emerald-800 font-medium">
                    {row.gain}
                  </td>
                  <td className="py-4 px-4 text-muted text-[11px]">
                    {row.note}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
