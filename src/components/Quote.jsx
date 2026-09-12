import React from 'react'

export default function Quote() {
  return (
    <section className="py-16 hairline-border-b bg-paper">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="relative pl-6 sm:pl-8 border-l-2 border-ink">
          <p className="font-serif-display text-2xl sm:text-3xl text-ink font-normal leading-snug mb-4">
            "Everyone is trying to make AI agents write the code. Nobody is fixing how developers give them intent. The friction was never typing velocity — it was the cognitive switch between the problem space and the commit message."
          </p>
          <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-muted">
            <span className="text-ink font-semibold">OVIO FOUNDING BRIEF</span>
            <span>•</span>
            <span>45s keyboard overhead reduced to 3.2s speech</span>
            <span>•</span>
            <span className="text-emerald-800">AssemblyAI Dictation API Beta</span>
          </div>
        </div>
      </div>
    </section>
  )
}
