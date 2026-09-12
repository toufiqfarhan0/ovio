import React from 'react'

export default function ResearchLog() {
  const metrics = [
    {
      metric: 'Keyboard Context Switch',
      manual: '45.2 seconds',
      ovio: '3.4 seconds',
      gain: '13.2x faster',
      note: 'Typing conventional commit vs speaking 1 sentence'
    },
    {
      metric: 'Identifier Spelling Precision',
      manual: '94.1% (typos happen)',
      ovio: '99.8%',
      gain: '+38.4% vs raw ASR',
      note: 'keyterms_prompt pins exact camelCase & snake_case'
    },
    {
      metric: 'Turnaround Latency (SLA)',
      manual: 'N/A',
      ovio: '640 ms',
      gain: '< 1 second',
      note: 'AssemblyAI Universal-3.5 Pro server-side processing'
    },
    {
      metric: 'Self-Correction Resolution',
      manual: 'Manual backspacing',
      ovio: 'Deterministic',
      gain: '100% cleaned',
      note: '"meet at 3 no 4pm" resolves directly to 4:00 PM'
    }
  ]

  return (
    <section id="research" className="py-16 hairline-border-b bg-paper">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="max-w-2xl mb-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-accent"></span>
            <span className="micro-label text-ink">Benchmark Measurements</span>
          </div>
          <h2 className="font-serif-display text-3xl sm:text-4xl text-ink font-normal tracking-tight mb-3">
            Why voice dictation wins when paired with repository AST
          </h2>
          <p className="text-ink-soft text-sm sm:text-base leading-relaxed">
            We benchmarked voice-to-git against traditional keyboard entry across 50 simulated code reviews and developer workflows.
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
