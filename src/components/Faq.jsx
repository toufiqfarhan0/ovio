import React, { useState } from 'react'
import { ChevronDown, ExternalLink } from 'lucide-react'
import { useSectionId } from '../utils/navigation'

export default function Faq() {
  const [openIndex, setOpenIndex] = useState(0)
  const sectionId = useSectionId('faq')

  const faqs = [
    {
      q: 'How does ovio know my exact variable and function names?',
      a: 'Before calling the Dictation API, ovio inspects your local git diff and extracts changed identifiers into the keyterms_prompt parameter (up to 30 terms). AssemblyAI biases its acoustic decoder toward these terms, preventing phonetic misspellings of custom identifiers like "useAuthStore" or "JWT_SECRET".'
    },
    {
      q: 'Why use the Dictation API instead of standard Speech-to-Text?',
      a: (
        <div className="space-y-2">
          <p>
            Standard speech-to-text transcribes filler words (&quot;ums&quot;, &quot;ahs&quot;) and retracted speech verbatim. The Dictation API applies an integrated LLM rewrite in the same sub-second call. You get both the verbatim transcript (<code>text</code>) and the send-ready artifact (<code>llm_response</code>) with zero external LLM roundtrip.
          </p>
          <div className="pt-1">
            <a
              href="https://www.assemblyai.com/docs/dictation#clinical-dictation"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-ink underline hover:opacity-80 transition-opacity font-mono"
            >
              <span>AssemblyAI Dictation API Documentation &amp; Examples</span>
              <ExternalLink className="w-3 h-3 text-muted" />
            </a>
          </div>
        </div>
      )
    },
    {
      q: 'Which spoken languages are supported?',
      a: (
        <div className="space-y-2">
          <p>
            ovio includes first-class multilingual support via the <code>--lang &lt;code&gt;</code> flag (e.g. <code>ovio --lang fr</code>, <code>ovio --lang es</code>, <code>ovio --lang de</code>, <code>ovio --lang hi</code>). The Dictation API runs on Universal-3.5 Pro across 19 languages: English, Spanish, French, German, Italian, Portuguese, Arabic, Danish, Dutch, Finnish, Hebrew, Hindi, Japanese, Mandarin (Chinese), Norwegian, Swedish, Turkish, and Vietnamese. Spoken speech is preserved verbatim in your native language in session telemetry, while the generated Conventional Commit message is automatically standardized into English.
          </p>
          <div className="pt-1 flex flex-wrap items-center gap-3 text-xs font-mono">
            <a
              href="https://www.assemblyai.com/docs/dictation"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-ink underline hover:opacity-80 transition-opacity"
            >
              <span>AssemblyAI Dictation Docs</span>
              <ExternalLink className="w-3 h-3 text-muted" />
            </a>
            <span className="text-muted">•</span>
            <a
              href="https://www.assemblyai.com/docs/concepts/supported-languages"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-ink underline hover:opacity-80 transition-opacity"
            >
              <span>Universal-3.5 Pro Supported Languages Table</span>
              <ExternalLink className="w-3 h-3 text-muted" />
            </a>
          </div>
        </div>
      )
    },
    {
      q: 'Can ovio accidentally commit unintended changes?',
      a: 'No. ovio is fail-safe: it formats and previews the commit on your screen and prompts for your explicit confirmation [Enter to commit / Esc to cancel] before executing any git command.'
    },
    {
      q: 'What happens if I pause or stay silent while holding Spacebar?',
      a: 'ovio includes real-time vocal energy metering. If you hold Spacebar for more than 2 seconds without speaking or pause mid-sentence, ovio dynamically prompts "(listening... please speak more)". If a recording is released in total silence, ovio intercepts it locally before making an API call, presenting contextual suggestions based on your staged symbols and offering a one-key [r] retry.'
    },
    {
      q: 'What do technical acronyms like ASR, AST, and RMS stand for?',
      a: (
        <div className="space-y-2">
          <p>
            Here is a quick reference for the core acronyms used across the ovio engine:
          </p>
          <ul className="space-y-1.5 list-disc pl-5 font-mono text-xs">
            <li>
              <strong className="text-ink">ASR (Automatic Speech Recognition)</strong>: The AI model that decodes acoustic speech audio into text strings.
            </li>
            <li>
              <strong className="text-ink">AST (Abstract Syntax Tree)</strong>: The tree representation of code syntax. ovio parses function, class, and variable names from your staged diff AST to bias speech recognition.
            </li>
            <li>
              <strong className="text-ink">RMS (Root Mean Square)</strong>: Live microphone energy calculation used for real-time silence detection and waveform visualization.
            </li>
            <li>
              <strong className="text-ink">STT (Speech-to-Text)</strong>: General automated voice transcription into written words.
            </li>
          </ul>
        </div>
      )
    }
  ]

  return (
    <section id={sectionId} className="py-16 hairline-border-b bg-paper-light">
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
