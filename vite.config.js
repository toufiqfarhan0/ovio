import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

dotenv.config()

function ovioApiPlugin() {
  return {
    name: 'ovio-api-plugin',
    configureServer(server) {
      // 1. API endpoint to fetch current local git context
      server.middlewares.use('/api/git-context', (req, res) => {
        if (req.method !== 'GET') {
          res.statusCode = 405
          return res.end('Method Not Allowed')
        }

        try {
          let branch = 'main'
          let statusStr = ''
          let diffStr = ''

          try {
            branch = execSync('git branch --show-current', { encoding: 'utf-8' }).trim() || 'main'
            statusStr = execSync('git status -s', { encoding: 'utf-8' })
            diffStr = execSync('git diff HEAD', { encoding: 'utf-8' })
          } catch {
            // fallback if not committed or no git
          }

          // Extract changed files
          const files = statusStr
            .split('\n')
            .filter(Boolean)
            .map(l => l.trim().split(/\s+/).pop())
            .filter(Boolean)

          // Extract symbol names from diff
          const symbols = Array.from(diffStr.matchAll(/@@.*@@\s*(function|class|const|def)?\s*([a-zA-Z0-9_]+)/g))
            .map(m => m[2])
            .filter(Boolean)

          const keyterms = Array.from(new Set([...files, ...symbols, 'ovio', 'DictationTranscriber', 'AssemblyAI', 'Universal-3.5-Pro'])).slice(0, 30)

          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({
            branch: branch || 'main',
            stagedFiles: files.length > 0 ? files : ['src/engine/dictation.ts', 'src/git/context.ts', 'cli/ovio.py'],
            keyterms: keyterms.length > 0 ? keyterms : ['DictationTranscriber', 'Universal-3.5-Pro', 'keyterms_prompt', 'llm_instruction', 'git_diff', 'ConventionalCommit'],
            hasLocalGit: true
          }))
        } catch (e) {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({
            branch: 'main',
            stagedFiles: ['src/engine/dictation.ts', 'src/git/context.ts', 'cli/ovio.py'],
            keyterms: ['DictationTranscriber', 'Universal-3.5-Pro', 'keyterms_prompt', 'llm_instruction', 'git_diff'],
            hasLocalGit: false
          }))
        }
      })

      // 2. Proxy to AssemblyAI Dictation API
      server.middlewares.use('/api/transcribe', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          return res.end('Method Not Allowed')
        }

        const apiKey = process.env.ASSEMBLYAI_API_KEY
        if (!apiKey) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          return res.end(JSON.stringify({ error: 'Missing ASSEMBLYAI_API_KEY in .env' }))
        }

        try {
          const chunks = []
          for await (const chunk of req) {
            chunks.push(chunk)
          }
          const bodyBuffer = Buffer.concat(chunks)

          const contentType = req.headers['content-type']

          const response = await fetch('https://dictation.assemblyai.com/v1/transcribe/live', {
            method: 'POST',
            headers: {
              'Authorization': apiKey,
              'Content-Type': contentType || 'multipart/form-data',
            },
            body: bodyBuffer
          })

          const data = await response.text()
          res.statusCode = response.status
          res.setHeader('Content-Type', 'application/json')
          res.end(data)
        } catch (err) {
          console.error('[API Proxy Error]:', err)
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: err.message }))
        }
      })
    }
  }
}

export default defineConfig({
  plugins: [react(), ovioApiPlugin()],
  server: {
    port: 3000,
    open: false
  }
})
