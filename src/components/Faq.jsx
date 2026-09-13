import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'

export default function Faq() {
  const [openIndex, setOpenIndex] = useState(0)

  const faqs = [
    {
      q: 'How does ovio know my exact variable and function names?',
      a: 'Before calling the Dictation API, ovio inspects your local git diff and extracts changed identifiers into the keyterms_prompt parameter (up to 30 terms). AssemblyAI biases its acoustic decoder toward these terms, preventing phonetic misspellings of custom identifiers like "useAuthStore" or "JWT_SECRET".'
    },
    {
      q: 'Why use the Dictation API instead of standard Speech-to-Text?',
      a: 'Standard speech-to-text transcribes filler words ("ums", "ahs") and retracted speech verbatim. The Dictation API applies an integrated LLM rewrite in the same sub-second call. You get both the verbatim transcript (text) and the send-ready artifact (llm_response) with zero external LLM roundtrip.'
    },
    {
      q: 'Which spoken languages are supported?',
      a: 'The Dictation API supports 19 languages on Universal-3.5 Pro: English, Spanish, German, French, Italian, Portuguese, Turkish, Dutch, Swedish, Norwegian, Danish, Finnish, Hindi, Vietnamese, Arabic, Hebrew, Japanese, Urdu, and Chinese.'
    },
    {
      q: 'Can ovio accidentally commit unintended changes?',
      a: 'No. ovio is fail-safe: it formats and previews the commit on your screen and prompts for your explicit confirmation [Enter to commit / Esc to cancel] before executing any git command.'
    },
    {
      q: 'What happens if I pause or stay silent while holding Spacebar?',
      a: 'ovio includes real-time vocal energy metering. If you hold Spacebar for more than 2 seconds without speaking or pause mid-sentence, ovio dynamically prompts "(listening... please speak more)". If a recording is released in total silence, ovio intercepts it locally before making an API call, presenting contextual suggestions based on your staged symbols and offering a one-key [r] retry.'
    }
  ]

  return (
    <section className="py-16 hairline-border-b bg-paper-light">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="mb-10 text-center">
          <span className="micro-label text-muted">FREQUENTLY ASKED QUESTIONS</span>
          <h2 className="font-serif-display text-3xl sm:text-4xl text-ink font-normal tracking-tight mt-1">
            Understanding the Voice-to-Git Engine
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx
            return (
              <div 
                key={idx}
                className="paper-card overflow-hidden bg-paper transition-all"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? -1 : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4"
                >
                  <span className="font-medium text-sm text-ink">
                    {faq.q}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-muted shrink-0 transition-transform duration-200 ${
                    isOpen ? 'rotate-180 text-ink' : ''
                  }`} />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-ink-soft leading-relaxed hairline-border-t bg-paper-light/50">
                    {faq.a}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
