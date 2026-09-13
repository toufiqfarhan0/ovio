import React from 'react'
import { GitBranch, FileCode, Mic, Cpu, CheckCircle2, ArrowRight } from 'lucide-react'
import TechTooltip from './TechTooltip'
import { useSectionId } from '../utils/navigation'

export default function Pipeline() {
  const sectionId = useSectionId('pipeline')
  const steps = [
    {
      step: '01',
      title: 'Local Git Context',
      badge: 'LOCAL GIT DIFF',
      desc: 'Inspects staged changes and modified files via git status and git diff before the developer speaks.',
      icon: GitBranch,
      detail: 'Extracts file paths, modified lines, and active branch name.'
    },
    {
      step: '02',
      title: 'Diff Symbol Biasing',
      badge: 'DIFF REGEX EXTRACTOR',
      desc: 'Extracts function, class, and identifier declarations into keyterms_prompt for targeted acoustic biasing.',
      icon: FileCode,
      detail: (
        <>
          Eliminates phonetic <TechTooltip term="ASR" position="top">ASR</TechTooltip> typos like "jwtSecret" vs "JSON secret".
        </>
      )
    },
    {
      step: '03',
      title: 'Voice & Silence Meter',
      badge: 'PUSH-TO-TALK / RMS',
      desc: 'Captures 16kHz audio on Spacebar with real-time RMS metering, prompting user if silent for >2 seconds.',
      icon: Mic,
      detail: 'Intercepts dead air before API calls with repo-aware suggestions.'
    },
    {
      step: '04',
      title: 'Universal-3.5 Pro',
      badge: 'ASSEMBLYAI BETA',
      desc: 'Transcribes verbatim speech and formats Conventional Commits in a single rapid ~1.0s API round-trip (1,003ms–1,512ms measured).',
      icon: Cpu,
      detail: 'llm_instruction reshapes hesitation into feat(scope): subject.'
    },
    {
      step: '05',
      title: 'Safe Git Execution',
      badge: 'NATIVE COMMIT',
      desc: 'User reviews and confirms commit with one keypress (Enter), or commits and pushes directly with (p).',
      icon: CheckCircle2,
      detail: 'Safe, deterministic, developer-verified repository change.'
    }
  ]

  return (
    <section id={sectionId} className="py-16 hairline-border-b bg-paper">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="max-w-2xl mb-12">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-ink"></span>
            <span className="micro-label text-ink">Architecture Pipeline</span>
          </div>
          <h2 className="font-serif-display text-3xl sm:text-4xl text-ink font-normal tracking-tight mb-4">
            How ovio turns voice into load-bearing code changes
          </h2>
          <p className="text-ink-soft text-sm sm:text-base leading-relaxed">
            Conventional speech-to-text operates linearly without codebase awareness. ovio closes the loop by injecting repository <TechTooltip term="AST" position="bottom">diff symbol</TechTooltip> context into the transcription engine itself.
          </p>
        </div>

        {/* 5-Step Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {steps.map((item, idx) => {
            const Icon = item.icon
            return (
              <div 
                key={idx}
                className="paper-card p-5 bg-paper-light flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-xs font-semibold text-muted">
                      {item.step}
                    </span>
                    <div className="p-2 rounded-md bg-paper text-ink">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="micro-label text-[10px] text-accent mb-1">
                    {item.badge}
                  </div>
                  <h3 className="font-medium text-ink text-sm mb-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-ink-soft leading-relaxed mb-3">
                    {item.desc}
                  </p>
                </div>

                <div className="pt-3 hairline-border-t text-[11px] font-mono text-muted">
                  {item.detail}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
