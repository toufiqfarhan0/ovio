# ovio Technical Documentation & System Reference

**ovio** is a Voice Git & Codebase Dictation Engine powered by AssemblyAI's streaming Dictation API (Universal-3.5 Pro) with real-time local Abstract Syntax Tree (AST) vocabulary biasing.

---

## Table of Contents
1. [Overview & Problem Statement](#1-overview--problem-statement)
2. [Quickstart & Installation](#2-quickstart--installation)
3. [Architecture & The 5-Stage Pipeline](#3-architecture--the-5-stage-pipeline)
4. [AST Vocabulary Biasing Engine](#4-ast-vocabulary-biasing-engine)
5. [CLI Command Matrix & Flags](#5-cli-command-matrix--flags)
6. [Multilingual Voice Dictation](#6-multilingual-voice-dictation)
7. [Configuration & Environment Security](#7-configuration--environment-security)
8. [Diagnostics & Troubleshooting](#8-diagnostics--troubleshooting)

---

## 1. Overview & Problem Statement

### The Acoustic Gap in Developer Tooling
Conventional speech recognition models fail when software engineers speak codebase vocabulary. Technical identifiers like `jwtSecret`, `TokenExpiredError`, or `handleWebhookCallback` are acoustic out-of-vocabulary (OOV) tokens. Without code context, generic STT models hallucinate or segment these tokens into common English phrases (e.g., turning `jwtSecret` into *"J W T secret"* or `authService` into *"autumn service"*).

### The ovio Solution
ovio extracts modified function signatures, exported class names, variable identifiers, and staged file paths directly from your local `git diff --staged`. It injects these tokens as a dynamic `keyterms_prompt` into AssemblyAI's acoustic model during beam search, achieving zero-drift Conventional Commits in ~1.0s–1.5s live turnaround.

---

## 2. Quickstart & Installation

### Requirements
- Python 3.9+
- Git repository
- AssemblyAI API Key ([Get one free here](https://www.assemblyai.com))

### Step 1: Install ovio
```bash
pip install ovio
```

### Step 2: Configure API Key
```bash
# Option A: In current project .env (ensure .env is in .gitignore!)
echo "ASSEMBLYAI_API_KEY=your_assemblyai_api_key_here" > .env

# Option B: Global home directory (works across all repos securely)
echo "ASSEMBLYAI_API_KEY=your_assemblyai_api_key_here" > ~/.ovio.env

# Option C: Shell environment variable
export ASSEMBLYAI_API_KEY="your_assemblyai_api_key_here"
```

### Step 3: Run Environment Diagnostics
```bash
ovio verify
```

Expected diagnostic output:
```text
────────────────────────────────────────────────────────────────────
 ovio_verify   DIAGNOSTICS — environment audit
────────────────────────────────────────────────────────────────────
 git repository  : OK (work tree detected)
 audio backend   : OK (audio device(s) detected)
 api key         : OK (49db5e...9ace)
────────────────────────────────────────────────────────────────────
VERIFY OK: system fully operational; audio capture, AST biasing, and dictation ready.
```

---

## 3. Architecture & The 5-Stage Pipeline

```
[ Developer Speech ] (Spacebar Hold)
         │
         ▼
 1. Audio Capture (16kHz PCM WAV via sounddevice)
         │
 2. Local Git Diff AST Parser (Extracts modified symbols & identifiers)
         │
         ▼
 3. AssemblyAI Dictation API (Universal-3.5 Pro + keyterms_prompt biasing)
         │
         ▼
 4. Conventional Commit Synthesis (LLM instruction formatting: feat, fix, etc.)
         │
         ▼
 5. Terminal HUD Confirmation & Git Commit Execution (git commit -m "...")
```

### Benchmark & Measured Latency
- **Live AssemblyAI Turnaround**: ~1,003ms – 1,512ms (measured across checked-in fixtures)
- **Local Synthetic Dry-Run**: ~642ms
- **Diff Symbol Extraction**: < 5ms (regex scan on diff hunks)
- **Total Pipeline Execution**: 1.0s – 1.5s live turnaround

---

## 4. Diff Vocabulary Biasing Engine

### Symbol Extraction
When `ovio` or `ovio gate` is invoked:
1. `git diff --staged` is read into memory.
2. The diff symbol extractor extracts:
   - Staged filenames without extensions (e.g. `authService`, `paymentRouter`).
   - Function & method names defined in modified diff hunks.
   - Class, struct, and type definitions.
   - Key variables and constants.
3. Tokens are deduplicated, ranked by frequency/prominence, and capped at 25 symbols.
4. Symbols are transmitted to AssemblyAI as `keyterms_prompt`.

### Pre-flight Audit
Inspect the staged vocabulary before recording:
```bash
ovio gate --verbose
```

---

## 5. CLI Command Matrix & Flags

| Command | Flags / Alias | Purpose |
| :--- | :--- | :--- |
| `ovio` | None | **Voice Commit**: Interactive push-to-talk dictation with AST vocabulary biasing |
| `ovio gate` | `--verbose` (`-v`) | **AST Biasing Audit**: Pre-flight inspection of staged changes & extracted symbols |
| `ovio verify` | None | **Diagnostics**: Verifies Git work tree, audio input devices, and API credentials |
| `ovio --demo` | `-d` | **Dry-Run Simulation**: Instant turnaround test with synthetic developer audio |
| `ovio --lang <code>` | `-l` | **Multilingual Dictation**: Dictate in native language, generate English Conventional Commit |
| `ovio --file <path>` | `-f` | **Headless CI & Testing**: Transcribes an existing WAV fixture directly |
| `ovio --push` | `-p` | **Automated Push**: Directly commits and pushes to origin without secondary prompt |

---

## 6. Multilingual Voice Dictation

ovio supports dictation in multiple languages while enforcing standardized English Conventional Commits:

```bash
# French Dictation
ovio --lang fr
# Spoken: "ajouter la vérification de jeton dans le service d'authentification"
# Commit: feat(auth): add token verification to authService

# Spanish Dictation
ovio --lang es
# Spoken: "actualizar jwtSecret y corregir el manejo de errores"
# Commit: fix(auth): update jwtSecret and improve error handling

# Hindi Dictation
ovio --lang hi
# Spoken: "payment validation mein idempotency key add karo"
# Commit: feat(payment): add idempotencyKey to payment validation
```

### Supported Languages
| Code | Language | Commit Format |
| :--- | :--- | :--- |
| `en` | English | Conventional Commit (English) |
| `es` | Spanish | Conventional Commit (English) |
| `fr` | French | Conventional Commit (English) |
| `de` | German | Conventional Commit (English) |
| `hi` | Hindi | Conventional Commit (English) |
| `it` | Italian | Conventional Commit (English) |
| `pt` | Portuguese | Conventional Commit (English) |
| `nl` | Dutch | Conventional Commit (English) |
| `ja` | Japanese | Conventional Commit (English) |
| `zh` | Chinese | Conventional Commit (English) |

---

## 7. Configuration & Environment Security

### Resolution Hierarchy
1. `./.env` (Current repository root)
2. `~/.ovio.env` (User home directory)
3. `ASSEMBLYAI_API_KEY` (Shell environment variable)

### Security Best Practices
- **Never commit `.env` files**: Ensure `.env` is listed in your repository's `.gitignore`.
- **Use Global Home Config**: Saving your key to `~/.ovio.env` prevents any accidental git tracking while allowing ovio to work seamlessly across every local repository.

---

## 8. Diagnostics & Troubleshooting

| Symptom | Cause | Resolution |
| :--- | :--- | :--- |
| `ASSEMBLYAI_API_KEY not set` | Missing API key | Add key to `.env` or `~/.ovio.env`, or run `export ASSEMBLYAI_API_KEY="..."` |
| `No speech detected` | Spacebar released too quickly or mic muted | Hold Spacebar firmly while speaking, verify input levels in `ovio verify` |
| `No input audio devices` | Missing PortAudio drivers | macOS: grant Terminal mic permissions. Linux: install `libportaudio2` (`sudo apt-get install libportaudio2`) |
| `401 Unauthorized` | Invalid key or exhausted credits | Verify API key format and check AssemblyAI dashboard balance |
| `0 staged files` | Unstaged changes in working tree | Run `git add <files>` before running `ovio` or `ovio gate` |
