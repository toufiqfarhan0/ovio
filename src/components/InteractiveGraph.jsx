import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileCode, GitCommit, Check, X, ArrowRight, Zap, ShieldAlert, Cpu, Sparkles, Layers } from 'lucide-react'
import TechTooltip from './TechTooltip'
import { useSectionId } from '../utils/navigation'

export const CODE_SAMPLES = {
  typescript: {
    name: 'src/auth/jwt.ts',
    lang: 'TypeScript',
    diff: [
      { type: 'context', line: 12, text: 'export async function generateAuthSession(user: User) {' },
      { type: 'remove', line: 13, text: '-  const token = jwt.sign({ id: user.id }, secret);' },
      { type: 'add', line: 13, text: '+  const token = jwt.sign({ id: user.id }, jwtSecret, { expiresIn });' },
      { type: 'add', line: 14, text: '+  return await authService.saveSession(token);' },
      { type: 'context', line: 15, text: '}' },
      { type: 'context', line: 24, text: 'export function verifyToken(rawToken: string): TokenPayload {' },
      { type: 'add', line: 25, text: '+  try {' },
      { type: 'add', line: 26, text: '+    return jwt.verify(rawToken, jwtSecret) as TokenPayload;' },
      { type: 'add', line: 27, text: '+  } catch (err) {' },
      { type: 'add', line: 28, text: '+    if (err instanceof TokenExpiredError) throw new Http401();' },
      { type: 'add', line: 29, text: '+  }' }
    ],
    symbols: [
      { name: 'verifyToken', type: 'Function', confidenceBiased: 0.99, confidenceUnbiased: 0.48, biased: 'verifyToken', unbiased: 'verify token' },
      { name: 'jwtSecret', type: 'Identifier', confidenceBiased: 0.98, confidenceUnbiased: 0.39, biased: 'jwtSecret', unbiased: 'J W T secret' },
      { name: 'TokenExpiredError', type: 'Class', confidenceBiased: 0.99, confidenceUnbiased: 0.41, biased: 'TokenExpiredError', unbiased: 'token expired error' },
      { name: 'authService', type: 'Service', confidenceBiased: 0.97, confidenceUnbiased: 0.52, biased: 'authService', unbiased: 'auth service' },
      { name: 'expiresIn', type: 'Property', confidenceBiased: 0.96, confidenceUnbiased: 0.60, biased: 'expiresIn', unbiased: 'expires in' }
    ]
  },
  python: {
    name: 'services/billing_engine.py',
    lang: 'Python',
    diff: [
      { type: 'context', line: 45, text: 'class StripeWebhookHandler:' },
      { type: 'remove', line: 46, text: '-    def process_charge(self, event):' },
      { type: 'add', line: 46, text: '+    def process_invoice_payment(self, stripe_event: Event):' },
      { type: 'add', line: 47, text: '+        customer_id = stripe_event.data.object.customer' },
      { type: 'add', line: 48, text: '+        ledger_entry = self.billing_ledger.record_settlement(' },
      { type: 'add', line: 49, text: '+            customer_id=customer_id, currency="USD"' },
      { type: 'add', line: 50, text: '+        )' }
    ],
    symbols: [
      { name: 'process_invoice_payment', type: 'Method', confidenceBiased: 0.99, confidenceUnbiased: 0.44, biased: 'process_invoice_payment', unbiased: 'process invoice payment' },
      { name: 'billing_ledger', type: 'Attribute', confidenceBiased: 0.98, confidenceUnbiased: 0.51, biased: 'billing_ledger', unbiased: 'billing ledger' },
      { name: 'record_settlement', type: 'Method', confidenceBiased: 0.99, confidenceUnbiased: 0.58, biased: 'record_settlement', unbiased: 'record settlement' },
      { name: 'customer_id', type: 'Variable', confidenceBiased: 0.97, confidenceUnbiased: 0.49, biased: 'customer_id', unbiased: 'customer ID' }
    ]
  }
}

export default function InteractiveGraph() {
  const [activeLang, setActiveLang] = useState('typescript')
  const [selectedSymbol, setSelectedSymbol] = useState('verifyToken')
  const sample = CODE_SAMPLES[activeLang]
  const sectionId = useSectionId('biasing')

  return (
    <section id={sectionId} className="py-16 hairline-border-b bg-paper">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-ink"></span>
              <span className="micro-label text-ink">The Decoding Gap</span>
              <span className="text-xs font-mono text-muted">•</span>
              <span className="text-xs font-mono text-ink-soft">
                <TechTooltip term="AST" position="bottom" align="left">Diff Symbol</TechTooltip> Biasing Inspector
              </span>
            </div>
            <h2 className="font-serif-display text-3xl sm:text-4xl text-ink font-normal tracking-tight">
              Why raw <TechTooltip term="ASR" position="bottom" align="left">ASR</TechTooltip> fails on code — and how ovio fixes it
            </h2>
          </div>

          {/* Language / File Toggle */}
          <div className="flex items-center gap-2 bg-paper-light p-1 rounded-lg hairline-border text-xs font-mono">
            <span className="text-muted px-2">Sample <TechTooltip term="AST" position="bottom" align="right">Diff</TechTooltip>:</span>
            {Object.keys(CODE_SAMPLES).map((langKey) => (
              <button
                key={langKey}
                onClick={() => {
                  setActiveLang(langKey)
                  setSelectedSymbol(CODE_SAMPLES[langKey].symbols[0].name)
                }}
                className={`px-2.5 py-1 rounded transition-all capitalize ${
                  activeLang === langKey
                    ? 'bg-paper text-ink font-medium shadow-sm hairline-border'
                    : 'text-ink-soft hover:text-ink'
                }`}
              >
                {CODE_SAMPLES[langKey].lang}
              </button>
            ))}
          </div>
        </div>

        {/* The 3-Column Visualizer */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          {/* Column 1: Local Git Diff Hunk (5 cols) */}
          <div className="lg:col-span-5 paper-card bg-paper-light p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 hairline-border-b mb-3">
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-ink-soft" />
                  <span className="text-xs font-mono font-medium text-ink">{sample.name}</span>
                </div>
                <span className="text-[10px] micro-label text-muted">STAGED GIT DIFF</span>
              </div>

              {/* Code diff lines */}
              <div className="font-mono text-[11px] leading-relaxed overflow-x-auto bg-paper rounded p-3 hairline-border space-y-1">
                {sample.diff.map((line, idx) => (
                  <div 
                    key={idx}
                    className={`flex items-start px-1 rounded ${
                      line.type === 'add' 
                        ? 'bg-emerald-100/60 text-emerald-900' 
                        : line.type === 'remove' 
                        ? 'bg-rose-100/60 text-rose-900 line-through' 
                        : 'text-muted'
                    }`}
                  >
                    <span className="w-6 shrink-0 select-none text-[10px] text-muted/60">{line.line}</span>
                    <span className="whitespace-pre">{line.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 hairline-border-t flex items-center justify-between text-xs font-mono text-muted">
              <span><TechTooltip term="AST" position="top">Diff</TechTooltip> symbols harvested: {sample.symbols.length}</span>
              <span className="text-ink font-semibold">Diff Regex Extractor</span>
            </div>
          </div>

          {/* Column 2: Harvested Symbol Reservoir (3 cols) */}
          <div className="lg:col-span-3 paper-card bg-paper p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 hairline-border-b mb-3">
                <span className="micro-label text-ink">KEYTERMS_PROMPT</span>
                <span className="text-[10px] font-mono text-muted">BIAS RESERVOIR</span>
              </div>

              <p className="text-xs text-ink-soft mb-3 leading-relaxed">
                Click a symbol to inspect decoding fidelity:
              </p>

              {/* Symbol Badges */}
              <div className="space-y-2">
                {sample.symbols.map((sym, idx) => {
                  const isSelected = selectedSymbol === sym.name
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedSymbol(sym.name)}
                      className={`w-full p-2.5 rounded-lg text-left font-mono text-xs transition-all flex items-center justify-between ${
                        isSelected 
                          ? 'bg-paper-light border border-ink text-ink font-semibold shadow-sm' 
                          : 'bg-paper-deep/60 hover:bg-paper-deep text-ink-soft hairline-border'
                      }`}
                    >
                      <div className="truncate">
                        <div className="truncate">{sym.name}</div>
                        <div className="text-[10px] text-muted font-normal">{sym.type}</div>
                      </div>
                      <span className="text-[10px] text-emerald-700 font-mono font-semibold px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200">
                        EXACT
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="mt-4 pt-3 hairline-border-t text-[11px] font-mono text-muted">
              Injected into AssemblyAI Dictation API
            </div>
          </div>

          {/* Column 3: Acoustic Decoder Comparison (4 cols) */}
          <div className="lg:col-span-4 paper-card bg-paper-light p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 hairline-border-b mb-4">
                <span className="micro-label text-ink">DECODER COMPARISON</span>
                <span className="text-[10px] font-mono text-emerald-800 font-medium">FIDELITY AUDIT</span>
              </div>

              {(() => {
                const current = sample.symbols.find(s => s.name === selectedSymbol) || sample.symbols[0]
                return (
                  <div className="space-y-4">
                    {/* Arm A: Standard STT */}
                    <div className="p-3.5 rounded-lg bg-rose-50/70 border border-rose-200">
                      <div className="flex items-center justify-between mb-1.5 text-xs font-mono">
                        <span className="text-rose-900 font-medium flex items-center gap-1">
                          <X className="w-3.5 h-3.5" />
                          <span>Standard <TechTooltip term="STT" position="top">STT</TechTooltip> (Unbiased)</span>
                        </span>
                        <span className="text-rose-700 font-bold">
                          Phonetic decay
                        </span>
                      </div>
                      <div className="font-mono text-sm text-rose-950 bg-white/80 p-2 rounded border border-rose-100">
                        "{current.unbiased}"
                      </div>
                      <p className="text-[11px] text-rose-800/80 mt-1.5 leading-snug">
                        Decays to plain English words. Breaks variable casing and invalidates code context.
                      </p>
                    </div>

                    {/* Arm B: ovio with Diff Symbol Biasing */}
                    <div className="p-3.5 rounded-lg bg-emerald-50/70 border border-emerald-200">
                      <div className="flex items-center justify-between mb-1.5 text-xs font-mono">
                        <span className="text-emerald-950 font-medium flex items-center gap-1">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>ovio Universal-3.5 Pro</span>
                        </span>
                        <span className="text-emerald-800 font-bold">
                          Biased exact match
                        </span>
                      </div>
                      <div className="font-mono text-sm text-emerald-950 bg-white/80 p-2 rounded border border-emerald-100 font-semibold">
                        "{current.biased}"
                      </div>
                      <p className="text-[11px] text-emerald-800/80 mt-1.5 leading-snug">
                        Exact code symbol preserved verbatim in commit message bullet points.
                      </p>
                    </div>
                  </div>
                )
              })()}
            </div>

            <div className="mt-4 pt-3 hairline-border-t flex items-center justify-between text-xs font-mono text-muted">
              <span>Identifier Biasing</span>
              <span className="text-emerald-800 font-bold">Exact Match on Tested Fixtures</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
