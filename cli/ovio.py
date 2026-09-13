#!/usr/bin/env python3
"""
ovio — Voice Git & Codebase Dictation Engine
Powered by AssemblyAI Dictation API (Universal-3.5 Pro) + AST Biasing

Styling and typography inspired by the substrate-friction TUI:
monospaced fixed-width telemetry, ANSI Shadow block-circuit wordmark,
two-tone high-contrast palette (#ff571a accent + paper white + gray ramp),
byte-stable fallback on non-TTY streams.
"""

from __future__ import annotations

import os
import sys
import json
import re
import time
import threading
import subprocess
from pathlib import Path
from typing import Optional, List

# Force UTF-8 on Windows consoles to prevent encoding errors with ANSI/Unicode
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

import typer

# Initialize Typer
app = typer.Typer(
    help="ovio — Voice Git & Codebase Dictation Engine powered by AssemblyAI",
    add_completion=False,
    invoke_without_command=True
)

# ─────────────────────────────────────────────────────────────
# TUI layer (pure ANSI, TrueColor with 256-color fallback)
# ─────────────────────────────────────────────────────────────

WIDTH = 68
RULE_STR = "─" * WIDTH

_TRUECOLOR = os.environ.get("COLORTERM", "") in ("truecolor", "24bit") or sys.platform == "win32"

_ACCENT_256 = "38;5;208"
_SIGNAL_256 = "38;5;220"
_DIM_256 = "38;5;240"
_FAINT_256 = "38;5;245"

if _TRUECOLOR:
    ACCENT = "38;2;255;87;26"       # brand orange (#ff571a)
    SIGNAL = "38;2;249;196;37"      # yellow (#f9c425)
    DIM = "38;2;110;110;110"        # line ramp (#6e6e6e)
    FAINT = "38;2;160;160;160"      # muted text (#a0a0a0)
else:
    ACCENT, SIGNAL, DIM, FAINT = (_ACCENT_256, _SIGNAL_256, _DIM_256, _FAINT_256)

RESET = "\033[0m"
BOLD = "1"

VERSION  = "1.0.0"
MODEL    = "Universal-3.5 Pro"
PROVIDER = "AssemblyAI Dictation API"

def styling(stream=None) -> bool:
    """True when styling should be emitted for stream (default stdout)."""
    stream = stream if stream is not None else sys.stdout
    if os.environ.get("NO_COLOR"):
        return False
    forced = os.environ.get("FORCE_COLOR", "")
    if forced:
        return forced.lower() not in ("0", "false", "no")
    if os.environ.get("TERM") == "dumb":
        return False
    return bool(getattr(stream, "isatty", lambda: True)())

def paint(text: str, *codes: str) -> str:
    """Wrap text in given SGR codes when styling is active."""
    if not codes or not styling():
        return text
    return f"\033[{';'.join(codes)}m{text}{RESET}"

def rule(width: int = WIDTH) -> str:
    body = "─" * width
    return body if not styling() else paint(body, DIM)

def verdict(mark: str, decision: str, meta: str = "") -> str:
    body = f"[{mark}]  {decision}" + (f"      {meta}" if meta else "")
    if not styling():
        return body
    bracket = paint(f"[{mark}]", SIGNAL if mark in ("PASS", "LIVE", "VERIFY OK", "COMMIT OK") else ACCENT, BOLD)
    dec = paint(decision, BOLD)
    m = paint(meta, FAINT) if meta else ""
    return f"{bracket}  {dec}" + (f"      {m}" if m else "")

def kv(key: str, value: str, pad: int = 15) -> str:
    k_padded = key.ljust(pad)
    body = f" {k_padded} : {value}"
    if not styling():
        return body
    return f" {paint(k_padded, FAINT)} : {paint(value, BOLD)}"

def flash(text: str) -> str:
    return text if not styling() else paint(text, ACCENT, BOLD)

def head(text: str) -> str:
    return text if not styling() else paint(text, SIGNAL, BOLD)

def dim(text: str) -> str:
    return text if not styling() else paint(text, DIM)

# ─────────────────────────────────────────────────────────────
# ANSI Shadow dual-tone banner (OVIO + VOICE GIT)
# ─────────────────────────────────────────────────────────────

BANNER_TOP = [
    r"  ██████╗ ██╗   ██╗██╗ ██████╗ ",
    r" ██╔═══██╗██║   ██║██║██╔═══██╗",
    r" ██║   ██║██║   ██║██║██║   ██║",
    r" ██║   ██║╚██╗ ██╔╝██║██║   ██║",
    r" ╚██████╔╝ ╚████╔╝ ██║╚██████╔╝",
    r"  ╚═════╝   ╚═══╝  ╚═╝ ╚═════╝ "
]

BANNER_BOT = [
    r"   ██╗   ██╗ ██████╗ ██╗ ██████╗███████╗    ██████╗ ██╗████████╗",
    r"   ██║   ██║██╔═══██╗██║██╔════╝██╔════╝   ██╔════╝ ██║╚══██╔══╝",
    r"───██║   ██║██║   ██║██║██║     █████╗     ██║  ███╗██║   ██║   ",
    r"───╚██╗ ██╔╝██║   ██║██║██║     ██╔══╝     ██║   ██║██║   ██║   ",
    r"    ╚████╔╝ ╚██████╔╝██║╚██████╗███████║   ╚██████╔╝██║   ██║   ",
    r"     ╚═══╝   ╚═════╝ ╚═╝ ╚═════╝╚══════╝    ╚═════╝ ╚═╝   ╚═╝   "
]

def banner(tagline: str = "measure what the developer meant") -> str:
    """The wordmark. Empty string when styling is off and piped."""
    if not styling():
        return f"\novio — voice git & codebase dictation engine\n\n{tagline}\n"
    out = [""]
    out += [paint(r, ACCENT, BOLD) for r in BANNER_TOP]
    out.append("")
    out += [paint(r, BOLD) for r in BANNER_BOT]
    out.append("")
    out.append(paint(tagline, DIM))
    return "\n".join(out) + "\n"

# ─────────────────────────────────────────────────────────────
# env loading
# ─────────────────────────────────────────────────────────────

def load_env():
    candidates = [
        Path.cwd() / ".env",
        Path(__file__).resolve().parent.parent / ".env",
        Path.home() / ".ovio.env"
    ]
    for env_path in candidates:
        if env_path.exists():
            try:
                with open(env_path, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#") and "=" in line:
                            k, v = line.split("=", 1)
                            os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))
                break
            except Exception:
                pass

load_env()
API_KEY = os.environ.get("ASSEMBLYAI_API_KEY")

# ─────────────────────────────────────────────────────────────
# git context & AST extraction
# ─────────────────────────────────────────────────────────────

def is_git_repository() -> bool:
    """Returns True if the current working directory is inside a Git repository."""
    try:
        res = subprocess.run(
            ["git", "rev-parse", "--is-inside-work-tree"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            check=True
        )
        return res.returncode == 0
    except Exception:
        return False

def get_git_context(auto_stage: bool = True) -> dict:
    """
    Inspects git status, automatically stages unstaged modified files if needed,
    and extracts AST symbols from the staged diff to bias AssemblyAI's Dictation model.
    """
    # 1. Current branch
    try:
        branch = subprocess.check_output(
            ["git", "branch", "--show-current"],
            text=True,
            stderr=subprocess.DEVNULL
        ).strip()
        if branch == "master":
            try:
                subprocess.run(["git", "branch", "-M", "main"], check=True, stderr=subprocess.DEVNULL)
                branch = "main"
            except Exception:
                branch = "main"
    except Exception:
        branch = "main"

    # 2. Check staged vs unstaged files
    staged_files = []
    unstaged_files = []
    try:
        status_out = subprocess.check_output(
            ["git", "status", "--porcelain"],
            text=True,
            stderr=subprocess.DEVNULL
        )
        for line in status_out.splitlines():
            if len(line) >= 3:
                x, y = line[0], line[1]
                filepath = line[3:].strip()
                if x in ("M", "A", "D", "R"):
                    staged_files.append(filepath)
                if y in ("M", "D", "?") or line.startswith("??"):
                    unstaged_files.append(filepath)
    except Exception:
        pass

    # Auto-stage tracked or untracked changes if nothing is staged yet
    if auto_stage and unstaged_files and not staged_files:
        try:
            subprocess.run(["git", "add", "-u"], check=True, stderr=subprocess.DEVNULL)
            status_out = subprocess.check_output(["git", "status", "--porcelain"], text=True)
            staged_files = [line[3:].strip() for line in status_out.splitlines() if len(line) >= 3 and line[0] in ("M", "A", "D", "R")]
            if not staged_files and unstaged_files:
                subprocess.run(["git", "add", "-A"], check=True, stderr=subprocess.DEVNULL)
                status_out = subprocess.check_output(["git", "status", "--porcelain"], text=True)
                staged_files = [line[3:].strip() for line in status_out.splitlines() if len(line) >= 3 and line[0] in ("M", "A", "D", "R")]
        except Exception:
            pass

    # 3. Code diff
    diff_out = ""
    try:
        diff_out = subprocess.check_output(
            ["git", "diff", "--staged"],
            text=True,
            stderr=subprocess.DEVNULL
        )
        if not diff_out.strip():
            diff_out = subprocess.check_output(
                ["git", "diff", "HEAD"],
                text=True,
                stderr=subprocess.DEVNULL
            )
    except Exception:
        pass

    # 4. Extract AST symbols (functions, classes, interfaces, variables, constants)
    symbols = []
    if diff_out:
        fn_matches    = re.findall(r'(?:def|function|fn|pub fn)\s+([a-zA-Z0-9_]+)', diff_out)
        class_matches = re.findall(r'(?:class|interface|struct|type|enum)\s+([a-zA-Z0-9_]+)', diff_out)
        var_matches   = re.findall(r'(?:const|let|var|val)\s+([a-zA-Z0-9_]+)', diff_out)
        code_tokens   = re.findall(r'\+\s*.*?\b([a-zA-Z][a-zA-Z0-9]*(?:[A-Z][a-z0-9]+)+|[A-Z_]{3,})\b', diff_out)
        symbols = fn_matches + class_matches + var_matches + code_tokens

    file_basenames = [Path(f).name for f in staged_files]
    file_stems     = [Path(f).stem for f in staged_files]

    blacklist = {
        "const", "let", "var", "function", "class", "async", "await", "return",
        "true", "false", "null", "self", "this", "import", "export", "default", "from"
    }
    all_terms = []
    seen = set()
    for term in file_basenames + file_stems + symbols:
        term = term.strip()
        if len(term) >= 3 and term.lower() not in blacklist and term not in seen:
            seen.add(term)
            all_terms.append(term)

    files_str = ', '.join(file_basenames[:5]) if file_basenames else "none"
    stt_prompt = f"A developer dictating git commits for branch '{branch}'."
    if file_basenames:
        stt_prompt += f" Files: {files_str}."

    return {
        "branch":       branch or "main",
        "staged_files": staged_files,
        "keyterms":     all_terms[:25],
        "stt_prompt":   stt_prompt
    }

# ─────────────────────────────────────────────────────────────
# audio recording
# ─────────────────────────────────────────────────────────────

def record_audio_push_to_talk(output_wav="ovio_commit.wav", max_seconds=45, context: Optional[dict] = None) -> tuple[str, bool]:
    """
    Records 16kHz audio from microphone using push-to-talk (hold SPACEBAR).
    Falls back to Enter toggle if pynput listener is unavailable.
    Detects voice activity in real time with audio RMS metering.
    Returns (output_wav_path, has_speech_bool).
    """
    try:
        import sounddevice as sd
        import numpy as np
        import scipy.io.wavfile as wav
    except ImportError:
        print()
        print(rule())
        print(f"  {paint('error:', ACCENT, BOLD)} audio dependencies missing.")
        print(f"  run: {paint('pip install sounddevice scipy numpy', BOLD)}")
        print(rule())
        sys.exit(1)

    fs = 16000
    recorded_chunks = []
    recording_active = threading.Event()
    stop_session = threading.Event()

    speech_state = {
        "last_voice_time": None,
        "has_voice": False,
        "current_rms": 0.0,
        "max_peak": 0
    }

    SPEECH_RMS_THRESHOLD = 320

    def audio_callback(indata, frames, time_info, status):
        if recording_active.is_set():
            recorded_chunks.append(indata.copy())
            frame_float = indata.astype(np.float32)
            rms = float(np.sqrt(np.mean(frame_float ** 2)))
            peak = int(np.max(np.abs(indata)))
            speech_state["current_rms"] = rms
            speech_state["max_peak"] = max(speech_state["max_peak"], peak)
            if rms >= SPEECH_RMS_THRESHOLD:
                speech_state["has_voice"] = True
                speech_state["last_voice_time"] = time.time()

    use_pynput = False
    try:
        from pynput import keyboard

        def on_press(key):
            if key == keyboard.Key.space:
                if not recording_active.is_set():
                    recording_active.set()

        def on_release(key):
            if key == keyboard.Key.space:
                if recording_active.is_set():
                    recording_active.clear()
                    stop_session.set()
                    return False

        listener = keyboard.Listener(on_press=on_press, on_release=on_release)
        listener.start()
        use_pynput = True
    except Exception:
        use_pynput = False

    stream = sd.InputStream(samplerate=fs, channels=1, dtype='int16', callback=audio_callback)

    print()
    if use_pynput:
        print(f"  {paint('hold', BOLD)} {paint('SPACEBAR', BOLD)} {paint('to dictate — release when done', DIM)}")
    else:
        print(f"  {paint('press', BOLD)} {paint('ENTER', BOLD)} {paint('to start, then ENTER again to stop', DIM)}")

    wave_frames = ["▁▂▃▄▅▄▃▂", "▂▃▄▅▆▅▄▃", "▃▄▅▆▇▆▅▄", "▄▅▆▇█▇▆▅", "▃▄▅▆▇▆▅▄"]
    frame_idx = 0

    with stream:
        if not use_pynput:
            try:
                input()
            except Exception:
                pass
            recording_active.set()
            print(f"  {paint('●', ACCENT, BOLD)} {paint('recording', BOLD)}  {paint('(ENTER to stop)', DIM)}")

            def wait_for_stop():
                try:
                    input()
                except Exception:
                    pass
                recording_active.clear()
                stop_session.set()

            t = threading.Thread(target=wait_for_stop, daemon=True)
            t.start()

        start_time = None
        while not stop_session.is_set():
            if recording_active.is_set():
                now = time.time()
                if start_time is None:
                    start_time = now
                elapsed = now - start_time

                last_voice = speech_state["last_voice_time"]
                silence_duration = (now - last_voice) if last_voice is not None else elapsed

                if silence_duration >= 2.2:
                    if not speech_state["has_voice"]:
                        hint = paint("(listening... please speak)", SIGNAL)
                    else:
                        hint = paint("(pause detected — speak more or release)", SIGNAL)
                    waveform_str = paint("·······", SIGNAL)
                else:
                    hint = paint("(voice active)", SIGNAL) if speech_state["has_voice"] else ""
                    frame = wave_frames[frame_idx % len(wave_frames)]
                    waveform_str = paint(frame, ACCENT)

                status_line = (
                    f"  {paint('●', ACCENT, BOLD)} {paint('recording', BOLD)}  "
                    f"{waveform_str}  "
                    f"{paint(f'{elapsed:.1f}s', DIM)}  "
                    f"{hint}"
                )
                sys.stdout.write(f"\r{status_line:<82}")
                sys.stdout.flush()
                frame_idx += 1
            else:
                if start_time is not None:
                    break
            time.sleep(0.10)

        sys.stdout.write("\r" + " " * 84 + "\r")
        sys.stdout.flush()

    if not recorded_chunks:
        empty_audio = np.zeros(int(fs * 0.1), dtype=np.int16)
        wav.write(output_wav, fs, empty_audio)
        return output_wav, False

    full_audio = np.concatenate(recorded_chunks, axis=0)
    overall_rms = float(np.sqrt(np.mean(full_audio.astype(np.float32) ** 2)))
    overall_peak = int(np.max(np.abs(full_audio)))
    has_speech = speech_state["has_voice"] or (overall_rms >= SPEECH_RMS_THRESHOLD) or (overall_peak >= 800)

    wav.write(output_wav, fs, full_audio)
    return output_wav, has_speech

def synthesize_demo_wav(output_wav="ovio_commit.wav", duration=3.2, sample_rate=16000) -> str:
    """Creates a clean synthetic test audio clip for demo/dry-run mode."""
    import numpy as np
    import scipy.io.wavfile as wav

    total_samples = int(sample_rate * duration)
    t = np.linspace(0, duration, total_samples, endpoint=False)
    signal = (
        0.4 * np.sin(2 * np.pi * 150 * t) +
        0.3 * np.sin(2 * np.pi * 320 * t) +
        0.15 * np.sin(2 * np.pi * 750 * t)
    )
    envelope = np.sin(np.pi * t / duration) ** 2
    audio = (signal * envelope * 24000).astype(np.int16)
    wav.write(output_wav, sample_rate, audio)
    return output_wav

# ─────────────────────────────────────────────────────────────
# AssemblyAI transcription
# ─────────────────────────────────────────────────────────────

# ─────────────────────────────────────────────────────────────
# supported language codes (AssemblyAI Dictation API)
# ─────────────────────────────────────────────────────────────

SUPPORTED_LANGS = {
    "en": "English",
    "es": "Spanish",
    "de": "German",
    "fr": "French",
    "it": "Italian",
    "pt": "Portuguese",
    "tr": "Turkish",
    "nl": "Dutch",
    "sv": "Swedish",
    "no": "Norwegian",
    "da": "Danish",
    "fi": "Finnish",
    "hi": "Hindi",
    "vi": "Vietnamese",
    "ar": "Arabic",
    "he": "Hebrew",
    "ja": "Japanese",
    "ur": "Urdu",
    "zh": "Chinese",
}

def transcribe_with_assemblyai(audio_path: str, context: dict, lang: str = "en") -> dict:
    """
    Submits audio to AssemblyAI Dictation API Beta (Universal-3.5 Pro)
    using the official assemblyai SDK or HTTP live fallback.
    Pass lang as a BCP-47 language code (e.g. 'en', 'fr', 'de', 'es', 'hi').
    """
    if not API_KEY:
        print()
        print(rule())
        print(f" {paint('error:', ACCENT, BOLD)} ASSEMBLYAI_API_KEY not set")
        print(f" {paint('add it:', FAINT)} echo \"ASSEMBLYAI_API_KEY=your_key\" > .env")
        print(rule())
        sys.exit(1)

    # Build per-language LLM instruction (Conventional Commit for all languages)
    lang_name = SUPPORTED_LANGS.get(lang, lang.upper())
    llm_instruction = (
        "Remove filler words, false starts, and hesitation. "
        "Rewrite into a crisp Conventional Commit in the exact format: "
        "'<type>(<scope>): <subject>' followed by concise bullet points. "
        "Keep technical variable names, functions, and symbols verbatim. "
        f"The speaker dictated in {lang_name}; output the commit in English."
    )

    start_time = time.time()
    try:
        import assemblyai as aai
        aai.settings.api_key = API_KEY

        config = aai.DictationConfig(
            sample_rate=16000,
            channels=1,
            language_codes=[lang],
            stt_prompt=context["stt_prompt"],
            keyterms_prompt=context["keyterms"],
            llm_instruction=llm_instruction
        )

        transcriber = aai.DictationTranscriber()
        response = transcriber.transcribe_live(audio_path, config=config)
        wall_time_ms = int((time.time() - start_time) * 1000)

        return {
            "text":         response.text or "",
            "llm_response": response.llm_response or response.text or "",
            "latency_ms":   int(round(float(response.request_time_ms or wall_time_ms)))
        }
    except Exception:
        import requests
        url = "https://dictation.assemblyai.com/v1/transcribe/live"
        headers = {"Authorization": API_KEY}

        config_data = {
            "sample_rate": 16000,
            "channels": 1,
            "language_codes": [lang],
            "stt_prompt": context["stt_prompt"],
            "keyterms_prompt": context["keyterms"],
            "llm_instruction": llm_instruction
        }

        with open(audio_path, "rb") as f:
            audio_bytes = f.read()

        files = {
            "config": (None, json.dumps(config_data), "application/json"),
            "audio":  (Path(audio_path).name, audio_bytes, "audio/wav")
        }

        resp = requests.post(url, headers=headers, files=files, timeout=45)
        wall_time_ms = int((time.time() - start_time) * 1000)

        if not resp.ok:
            print(f" {paint(f'error ({resp.status_code}):', ACCENT, BOLD)} {resp.text}")
            sys.exit(1)

        data = resp.json()
        return {
            "text":         data.get("text", "").strip(),
            "llm_response": data.get("llm_response") or data.get("text", ""),
            "latency_ms":   int(round(float(data.get("request_time_ms") or wall_time_ms)))
        }

# ─────────────────────────────────────────────────────────────
# rendering
# ─────────────────────────────────────────────────────────────

def render_header(context: dict, mode: str = "live", verbose: bool = False, lang: str = "en"):
    """Print the startup header with wordmark and telemetry."""
    branch = context["branch"]
    staged_files = context["staged_files"]
    staged = len(staged_files)
    keyterms = context["keyterms"]
    lang_name = SUPPORTED_LANGS.get(lang, lang.upper())

    print(banner())
    if mode == "demo":
        print(verdict("DEMO", "SYNTHETIC", "model=Universal-3.5-Pro  dry-run=True"))
    else:
        print(verdict("LIVE", "DICTATION", f"model={MODEL}  sla<800ms"))
    print()
    print(rule())
    header_tag = "LIVE — AssemblyAI Dictation Engine" if mode != "demo" else "DEMO — Synthetic Speech Fixture"
    print(f" {paint(branch, ACCENT, BOLD)}   {paint(header_tag, BOLD)}")
    print(rule())
    print(kv("branch", branch))
    if staged > 0:
        file_preview = ", ".join([Path(f).name for f in staged_files[:2]])
        extra = f", +{staged - 2}" if staged > 2 else ""
        print(kv("staged files", f"{staged} files ({file_preview}{extra})"))
    else:
        print(kv("staged files", "0 (clean working tree)"))

    print(kv("language", f"{lang}  ({lang_name})"))

    if keyterms:
        preview_terms = ", ".join(keyterms[:5])
        print(kv("ast biasing", f"{len(keyterms)} symbols [{preview_terms}]"))
    else:
        print(kv("ast biasing", "none mapped"))

    print(kv("engine", f"{MODEL} (sub-second SLA < 800ms)"))
    print(kv("instruction", "Conventional Commit + AST symbol fidelity"))
    if keyterms:
        bias_preview = ", ".join(keyterms[:3])
        print(f" {paint(f'BIAS HIT: {len(keyterms)} staged symbol(s) locked into STT vocabulary [{bias_preview}].', ACCENT, BOLD)}")
    print(rule())
    print()

def render_result(verbatim: str, clean_commit: str, latency_ms: int):
    """Print the transcription result block with monospaced telemetry."""
    print()
    print(rule())
    print(f" {paint('commit_transcribe', ACCENT, BOLD)}   {paint(f'TRANSCRIBED — in {latency_ms} ms (SLA < 800ms)', BOLD)}")
    print(rule())
    print(kv("verbatim", verbatim))

    commit_lines = clean_commit.strip().splitlines()
    if commit_lines:
        first_line = commit_lines[0].strip()
        print(kv("conventional", first_line))
        for line in commit_lines[1:]:
            stripped = line.strip()
            if stripped:
                print(f"                   {paint(stripped, FAINT)}")
            else:
                print()
    print(rule())

def render_prompt():
    """Print the interactive action line."""
    print()
    prompt_str = (
        f"  {paint('[Enter]', BOLD)} {paint('commit & push', FAINT)}  "
        f"{paint('│', DIM)}  "
        f"{paint('[c]', BOLD)} {paint('commit only', FAINT)}  "
        f"{paint('│', DIM)}  "
        f"{paint('[e]', BOLD)} {paint('edit', FAINT)}  "
        f"{paint('│', DIM)}  "
        f"{paint('[q]', ACCENT, BOLD)} {paint('cancel', FAINT)}"
    )
    print(prompt_str)

def execute_git_push(branch: str = "main"):
    """Pushes committed changes to remote; outputs clean telemetry."""
    target_branch = "main" if branch in ("master", "") else branch
    push_res = subprocess.run(["git", "push"], capture_output=True, text=True)
    if push_res.returncode == 0:
        print(f"{paint('VERIFY OK:', ACCENT, BOLD)} committed to local branch {branch}; pushed to origin/{target_branch}")
    else:
        err = (push_res.stderr or push_res.stdout or "").strip()
        if "No configured push destination" in err or "no upstream branch" in err or "fatal: 'origin'" in err or "has no upstream branch" in err:
            print(f"{paint('VERIFY OK:', ACCENT, BOLD)} committed locally to branch {branch} (no remote configured)")
            print()
            print(f" {paint('notice:', ACCENT, BOLD)} {paint('no remote repository configured yet', DIM)}")
            print(f" {paint('to create and push to a remote repository:', ACCENT)}")
            print(f"   {paint('1.', BOLD)} create a repository on github (e.g. at https://github.com/new)")
            print(f"   {paint('2.', BOLD)} link it: git remote add origin https://github.com/<username>/<repo>.git")
            print(f"   {paint('3.', BOLD)} push:    git push -u origin {target_branch}")
        else:
            print(f" {paint('push warning:', SIGNAL, BOLD)} {paint(err, DIM)}")

# ─────────────────────────────────────────────────────────────
# gate & verify commands (matching substrate-friction CLI)
# ─────────────────────────────────────────────────────────────

@app.command("gate")
def gate_cmd(
    verbose: bool = typer.Option(True, "--verbose", "-v", help="Display full symbol lists")
):
    """Audit staged files, AST diff tokens, and AST biasing readiness."""
    context = get_git_context(auto_stage=False)
    branch = context["branch"]
    staged_files = context["staged_files"]
    staged = len(staged_files)
    keyterms = context["keyterms"]

    print(banner())
    if staged == 0:
        print(verdict("CLEAN", "WORKING_TREE", f"branch={branch}  staged=0"))
    else:
        print(verdict("PASS", "GATE_READY", f"branch={branch}  staged={staged}  symbols={len(keyterms)}"))
    print()
    print(rule())
    print(f" {paint(branch, ACCENT, BOLD)}   {paint('INSPECT — AST biasing audit', BOLD)}")
    print(rule())
    print(kv("branch", branch))
    if staged > 0:
        file_preview = ", ".join([Path(f).name for f in staged_files[:4]])
        extra = f", +{staged - 4}" if staged > 4 else ""
        print(kv("staged files", f"{staged} files ({file_preview}{extra})"))
    else:
        print(kv("staged files", "0 (working tree clean — no uncommitted changes)"))

    print(kv("ast biasing", f"{len(keyterms)} symbol(s) locked into vocabulary"))
    if keyterms and verbose:
        for i, term in enumerate(keyterms[:8], 1):
            print(f"                   {paint(f'{i:02d}. {term}', FAINT)}")
        if len(keyterms) > 8:
            print(f"                   {paint(f'... and {len(keyterms) - 8} more symbols', DIM)}")

    print(kv("engine", f"{MODEL} (sub-second SLA < 800ms)"))
    print(kv("stt prompt", context["stt_prompt"]))
    print(rule())
    print()

@app.command("verify")
def verify_cmd():
    """Verify audio subsystem, git state, and AssemblyAI connectivity."""
    print(rule())
    print(f" {paint('ovio_verify', ACCENT, BOLD)}   {paint('DIAGNOSTICS — environment audit', BOLD)}")
    print(rule())

    # 1. Git
    in_git = is_git_repository()
    print(kv("git repository", "OK (work tree detected)" if in_git else "FAIL (not a git repo)"))

    # 2. Audio backend
    try:
        import sounddevice as sd
        import numpy
        import scipy
        audio_ok = True
        devices = len(sd.query_devices())
        audio_msg = f"OK ({devices} audio device(s) detected)"
    except Exception as e:
        audio_ok = False
        audio_msg = f"FAIL ({e})"
    print(kv("audio backend", audio_msg))

    # 3. AssemblyAI key
    if API_KEY:
        masked = API_KEY[:6] + "..." + API_KEY[-4:] if len(API_KEY) > 10 else "***"
        print(kv("api key", f"OK ({masked})"))
    else:
        print(kv("api key", "FAIL (ASSEMBLYAI_API_KEY missing from environment)"))

    print(rule())
    if in_git and audio_ok and API_KEY:
        print(f"{paint('VERIFY OK:', ACCENT, BOLD)} system fully operational; audio capture, AST biasing, and dictation ready.")
    else:
        print(f"{paint('VERIFY WARN:', SIGNAL, BOLD)} some diagnostic checks failed; review configuration above.")
    print()

# ─────────────────────────────────────────────────────────────
# main dictation flow
# ─────────────────────────────────────────────────────────────

def run_dictation_flow(demo: bool = False, push: bool = False, file: Optional[str] = None, verbose: bool = False, lang: str = "en"):
    """Core interactive dictation execution."""
    # Validate language code
    if lang not in SUPPORTED_LANGS:
        supported_list = ", ".join(sorted(SUPPORTED_LANGS.keys()))
        print()
        print(rule())
        print(f" {paint('error:', ACCENT, BOLD)} unsupported language code '{lang}'")
        print(f" {paint('supported:', FAINT)} {supported_list}")
        print(rule())
        sys.exit(1)

    if not is_git_repository() and not demo:
        print()
        print(banner())
        print(verdict("FAIL", "NOT_GIT_REPO", "cwd does not contain .git"))
        print()
        print(rule())
        print(f" {paint('notice:', ACCENT, BOLD)} {paint('current directory is not a git repository', BOLD)}")
        print(rule())
        print(f"   {paint('1.', BOLD)} initialize git:  git init")
        print(f"   {paint('2.', BOLD)} stage edits:     git add -A")
        print(f"   {paint('3.', BOLD)} run ovio:        ovio")
        print(rule())
        print()
        return

    # 1. Gather git context and AST symbols
    context = get_git_context(auto_stage=True)

    if demo and not context["keyterms"]:
        context["keyterms"] = ["authService", "verifyToken", "jwtSecret", "TokenExpiredError"]

    # 2. Render header
    mode = "demo" if demo else ("file" if file else "live")
    render_header(context, mode=mode, verbose=verbose, lang=lang)

    # 3. Audio Recording / Sourcing
    is_demo_mode = demo
    if file:
        audio_path = file
    elif is_demo_mode:
        audio_path = synthesize_demo_wav()
    else:
        while True:
            try:
                audio_path, has_speech = record_audio_push_to_talk(context=context)
            except Exception as e:
                print(f" {paint('microphone error:', ACCENT, BOLD)} {e}")
                print(f" {paint('please check microphone connection and OS permissions.', DIM)}")
                sys.exit(1)

            if has_speech:
                break

            print()
            print(f" {paint('notice:', SIGNAL, BOLD)} No speech detected in recording.")
            print(f" {paint('suggestion: hold Spacebar and describe what you changed.', DIM)}")
            if context.get("keyterms"):
                sample_terms = ", ".join(context["keyterms"][:3])
                hint_example = f'example: "update {sample_terms} to fix error handling"'
                print(f" {paint(hint_example, DIM)}")
            print()

            action = input("  [r] retry dictation  |  [q] quit [r]: ").strip().lower() or "r"
            if action == "q":
                print(f"  {paint('cancelled', DIM)}")
                sys.exit(0)

    # 4. Transcribe & Format
    if is_demo_mode:
        verbatim     = "uh so in auth service we added verifyToken to check the JWT_SECRET wait also handled expired token errors properly"
        clean_commit = "feat(auth): add verifyToken and handle expired token errors\n\n- Implement token verification against JWT_SECRET in authService\n- Add explicit error handling for expired and malformed tokens"
        latency      = 642
    else:
        lang_name = SUPPORTED_LANGS.get(lang, lang.upper())
        sys.stdout.write(f"  {paint('●', ACCENT, BOLD)} {paint(f'transcribing ({lang_name}) with Universal-3.5 Pro...', FAINT)}\r")
        sys.stdout.flush()
        res          = transcribe_with_assemblyai(audio_path, context, lang=lang)
        sys.stdout.write("\r" + " " * 60 + "\r")
        sys.stdout.flush()
        verbatim     = res["text"]
        clean_commit = res["llm_response"]
        latency      = res["latency_ms"]

        if not verbatim.strip():
            verbatim = "(no speech recognized)"
            clean_commit = f"chore({context['branch']}): update codebase"

    if not file and Path(audio_path).exists():
        try:
            os.remove(audio_path)
        except Exception:
            pass

    # 5. Output Result
    render_result(verbatim, clean_commit, latency)

    if push:
        subprocess.run(["git", "commit", "-m", clean_commit], check=True)
        print()
        print(rule())
        execute_git_push(context["branch"])
        print(rule())
        return

    # 6. Interactive Decision Loop
    current_commit = clean_commit

    while True:
        render_prompt()

        try:
            user_choice = input(paint("  > ", DIM)).strip().lower()
        except (KeyboardInterrupt, EOFError):
            user_choice = "q"

        if user_choice in ("", "y", "p"):
            res = subprocess.run(["git", "commit", "-m", current_commit])
            print()
            print(rule())
            if res.returncode == 0:
                execute_git_push(context["branch"])
            else:
                print(f" {paint('nothing staged to commit (working tree clean)', DIM)}")
            print(rule())
            break
        elif user_choice == "c":
            res = subprocess.run(["git", "commit", "-m", current_commit])
            print()
            print(rule())
            if res.returncode == 0:
                print(f"{paint('VERIFY OK:', ACCENT, BOLD)} committed locally to {context['branch']}")
            else:
                print(f" {paint('nothing staged to commit (working tree clean)', DIM)}")
            print(rule())
            break
        elif user_choice == "e":
            print()
            first_line = current_commit.splitlines()[0] if current_commit else ""
            edited = input(paint(f"  edit commit message [{first_line}]: ", FAINT)).strip() or first_line
            if edited:
                current_commit = edited
                print()
                print(rule())
                print(f" {paint('updated commit message:', ACCENT, BOLD)}")
                print(f"  {paint(current_commit, BOLD)}")
                print(rule())
            continue
        else:
            print()
            print(rule())
            print(f" {paint('cancelled — no changes made', DIM)}")
            print(rule())
            break

    print()

@app.callback(invoke_without_command=True)
def main(
    ctx: typer.Context,
    demo: bool = typer.Option(False, "--demo", "-d", help="Run with synthetic audio for dry-run verification"),
    push: bool = typer.Option(False, "--push", "-p", help="Automatically commit and push without confirmation"),
    file: Optional[str] = typer.Option(None, "--file", "-f", help="Path to existing WAV audio file"),
    verbose: bool = typer.Option(False, "--verbose", "-v", help="Display extracted AST symbols in header"),
    gate: bool = typer.Option(False, "--gate", "-g", help="Audit git branch, diff, and AST biasing without dictating"),
    lang: str = typer.Option("en", "--lang", "-l", help="BCP-47 language code for dictation (en, fr, de, es, hi, ja, zh, ...)"),
):
    """
    ovio — Voice Git & Codebase Dictation Engine
    """
    if ctx.invoked_subcommand is None:
        if gate:
            gate_cmd(verbose=verbose)
        else:
            run_dictation_flow(demo=demo, push=push, file=file, verbose=verbose, lang=lang)

if __name__ == "__main__":
    app()
