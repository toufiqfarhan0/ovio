import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen } from 'lucide-react'

export const GLOSSARY = {
  ASR: {
    term: 'ASR',
    fullName: 'Automatic Speech Recognition',
    category: 'SPEECH-TO-TEXT ENGINE',
    summary: 'The AI technology that transcribes spoken acoustic audio into text. Raw ASR models are trained on conversational prose and frequently fail on programming identifiers, turning camelCase variables like "jwtSecret" into "JSON secret".',
    ovioRole: 'ovio eliminates ASR misspellings by pre-loading your local git diff AST symbols directly into the speech model prompt.'
  },
  AST: {
    term: 'AST',
    fullName: 'Abstract Syntax Tree',
    category: 'COMPILER DATA STRUCTURE',
    summary: 'A hierarchical tree structure produced by compilers and parsers representing source code syntax. It extracts exact function, class, type, and variable names without runtime overhead.',
    ovioRole: 'ovio parses your staged git diff into AST keyterms before you speak, biasing speech decoding toward your codebase with 99% accuracy.'
  },
  RMS: {
    term: 'RMS',
    fullName: 'Root Mean Square (Audio Energy)',
    category: 'ACOUSTIC SIGNAL METER',
    summary: 'A continuous mathematical measurement of microphone audio amplitude and vocal power used to distinguish live voice from background silence.',
    ovioRole: 'ovio monitors RMS continuously on Spacebar press. If you hesitate for >2s, it prompts you to speak and intercepts dead air before making API calls.'
  },
  STT: {
    term: 'STT',
    fullName: 'Speech-to-Text',
    category: 'VOICE TRANSCRIPTION',
    summary: 'The general category of software systems that convert spoken human voice into computer-readable text strings.',
    ovioRole: 'ovio pairs code-aware STT with AssemblyAI Universal-3.5 Pro to format speech into Conventional Commits in <800ms.'
  },
  PTT: {
    term: 'PTT',
    fullName: 'Push-to-Talk',
    category: 'AUDIO CAPTURE METHOD',
    summary: 'A hardware or software audio control where the microphone records only while a specific key is pressed, preventing background office chatter from leaking into recordings.',
    ovioRole: 'Hold Spacebar in your terminal to dictate naturally, then release to commit.'
  }
}

export default function TechTooltip({
  term,
  children,
  position = 'top',
  align = 'center',
  className = '',
  underline = true
}) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)
  const timeoutRef = useRef(null)

  const entry = GLOSSARY[term.toUpperCase()] || {
    term,
    fullName: term,
    category: 'TECHNICAL TERMINOLOGY',
    summary: 'Technical concept utilized within the ovio voice-to-git architecture.',
    ovioRole: 'Optimizes speech transcription and git automation.'
  }

  // Handle outside clicks to close on mobile/touch
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [])

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setIsOpen(true)
  }

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false)
    }, 120)
  }

  const handleClick = (e) => {
    e.stopPropagation()
    setIsOpen(prev => !prev)
  }

  const isTop = position === 'top'

  return (
    <span
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
      onClick={handleClick}
      className={`relative inline-block group cursor-help ${className}`}
      role="button"
      tabIndex={0}
      aria-label={`${entry.term}: ${entry.fullName}`}
    >
      <span
        className={`transition-colors duration-150 ${
          underline
            ? 'underline decoration-dotted decoration-accent/60 underline-offset-4 group-hover:decoration-accent group-hover:text-accent'
            : 'group-hover:text-accent'
        }`}
      >
        {children || term}
      </span>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: isTop ? 6 : -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: isTop ? 4 : -4, scale: 0.97 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className={`absolute z-50 w-72 sm:w-80 max-w-[calc(100vw-2rem)] pointer-events-auto select-text ${
              isTop ? 'bottom-full mb-2' : 'top-full mt-2'
            } ${
              align === 'left'
                ? 'left-0'
                : align === 'right'
                ? 'right-0'
                : 'left-1/2 -translate-x-1/2'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative bg-[#161413] text-[#faf9f6] border border-white/20 shadow-2xl rounded-xl p-3.5 text-left font-sans antialiased backdrop-blur-md">

              {/* Micro-label header */}
              <div className="flex items-center justify-between text-[10px] font-mono tracking-wider text-accent font-semibold uppercase pb-1.5 border-b border-white/10">
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-3 h-3 text-accent" />
                  <span>{entry.category}</span>
                </span>
                <span className="text-white/40 text-[9px]">TOOLTIP</span>
              </div>

              {/* Title & Full name */}
              <div className="mt-2">
                <div className="font-mono text-sm font-bold text-white tracking-tight">
                  {entry.term}
                </div>
                <div className="text-xs font-medium text-amber-200/90 leading-tight mt-0.5">
                  {entry.fullName}
                </div>
              </div>

              {/* Description */}
              <p className="mt-2 text-xs text-[#deddd5] leading-relaxed font-normal">
                {entry.summary}
              </p>

              {/* Ovio contextual role */}
              <div className="mt-2.5 pt-2 border-t border-white/10 text-[11px] font-mono text-paper-deep/90 leading-normal flex items-start gap-1.5">
                <span className="text-accent font-bold shrink-0">In ovio:</span>
                <span>{entry.ovioRole}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  )
}
