import React, { useState, useEffect } from 'react'
import { Search, Terminal, Mic, GitCommit, FileCode, ArrowRight, X, ExternalLink } from 'lucide-react'
import { scrollToSection } from '../utils/navigation'

export default function CommandMenu({ isOpen, onClose, onSelectCommand }) {
  const [query, setQuery] = useState('')

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        onClose ? onClose(!isOpen) : null
      }
      if (e.key === 'Escape' && isOpen) {
        onClose(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const commands = [
    {
      category: 'Interactive Demo',
      items: [
        { id: 'console', title: 'Open Live Dictation Console', desc: 'Push-to-talk live audio dictation to conventional commit', icon: Mic, action: () => { scrollToSection('console'); onClose(false); } },
        { id: 'sample', title: 'Load Sample Voice Utterance', desc: 'Test speech with hesitation and self-corrections', icon: Terminal, action: () => { scrollToSection('console'); onClose(false); } },
      ]
    },
    {
      category: 'Documentation & Architecture',
      items: [
        { id: 'pipeline', title: 'The 5-Step Pipeline', desc: 'Speech → AST Biasing → Universal-3.5 Pro → Conventional Commit', icon: GitCommit, action: () => { scrollToSection('pipeline'); onClose(false); } },
        { id: 'biasing', title: 'AST Keyterms Biasing', desc: 'How ovio extracts symbols to eliminate misspellings', icon: FileCode, action: () => { scrollToSection('biasing'); onClose(false); } },
        { id: 'cli', title: 'CLI Quickstart (`ovio`)', desc: 'Install and configure the terminal tool in 30 seconds', icon: Terminal, action: () => { scrollToSection('cli'); onClose(false); } },
      ]
    },
    {
      category: 'External Resources',
      items: [
        { id: 'docs', title: 'AssemblyAI Dictation Docs', desc: 'Read official documentation on transcribe/live', icon: ExternalLink, action: () => { window.open('https://www.assemblyai.com/docs/dictation', '_blank'); onClose(false); } },
        { id: 'github', title: 'View Source on GitHub', desc: 'toufiqfarhan0/ovio repository', icon: ExternalLink, action: () => { window.open('https://github.com/toufiqfarhan0/ovio', '_blank'); onClose(false); } },
      ]
    }
  ]

  const filteredCommands = commands.map(group => ({
    ...group,
    items: group.items.filter(item => 
      item.title.toLowerCase().includes(query.toLowerCase()) || 
      item.desc.toLowerCase().includes(query.toLowerCase())
    )
  })).filter(group => group.items.length > 0)

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-ink/30 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-xl bg-paper-light hairline-border shadow-paper-lg rounded-xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search header */}
        <div className="flex items-center px-4 py-3 hairline-border-b bg-paper-card/50">
          <Search className="w-4 h-4 text-muted mr-3 shrink-0" />
          <input
            type="text"
            placeholder="Type a command or jump to section..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent border-none outline-none text-sm text-ink placeholder:text-muted font-sans"
          />
          <button 
            onClick={() => onClose(false)}
            className="p-1 text-muted hover:text-ink rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Command list */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-line/40">
          {filteredCommands.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted font-mono">
              No commands matching "{query}"
            </div>
          ) : (
            filteredCommands.map((group, gIdx) => (
              <div key={gIdx} className="py-2 first:pt-1 last:pb-1">
                <div className="px-3 py-1 text-[10px] micro-label text-muted">
                  {group.category}
                </div>
                {group.items.map((item) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.id}
                      onClick={item.action}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left hover:bg-paper-deep/50 transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-1.5 rounded-md bg-paper-deep text-ink-soft group-hover:text-ink">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <div className="text-xs font-medium text-ink group-hover:text-black">
                            {item.title}
                          </div>
                          <div className="text-[11px] text-muted truncate">
                            {item.desc}
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-muted group-hover:text-ink shrink-0 ml-2 group-hover:translate-x-0.5 transition-all" />
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 bg-paper-deep/40 hairline-border-t flex items-center justify-between text-[11px] font-mono text-muted">
          <span>Navigate: Up / Down</span>
          <span>Select: Enter</span>
          <span>Close: Esc</span>
        </div>
      </div>
    </div>
  )
}
