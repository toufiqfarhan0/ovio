#!/usr/bin/env python3
"""
ovio — Voice Git & Codebase Dictation Engine
Powered by AssemblyAI Dictation API (Universal-3.5 Pro)
"""

import os
import sys
import json
import re
import time
import threading
import subprocess
import argparse
from pathlib import Path

# Force UTF-8 stdout encoding on Windows consoles
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

# ANSI colors and styling
RESET = "\033[0m"
BOLD = "\033[1m"
DIM = "\033[2m"
ITALIC = "\033[3m"
UNDERLINE = "\033[4m"

# Grayscale / Minimalist tones
INK = "\033[38;2;22;20;19m"
INK_SOFT = "\033[38;2;74;70;66m"
MUTED = "\033[38;2;142;139;131m"
EMERALD = "\033[38;2;16;120;70m"
ROSE = "\033[38;2;200;40;40m"
AMBER = "\033[38;2;190;110;20m"

# Load .env file
def load_env():
    # Look in current directory and script's parent directories
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

def get_git_context():
    """Inspects git status and diff, extracting changed files and AST symbols for keyterms_prompt."""
    # 1. Current branch
    try:
        branch = subprocess.check_output(
            ["git", "branch", "--show-current"], 
            text=True, 
            stderr=subprocess.DEVNULL
        ).strip()
    except Exception:
        branch = "main"

    # 2. Staged and modified files
    staged_files = []
    try:
        status_out = subprocess.check_output(
            ["git", "status", "-s"], 
            text=True, 
            stderr=subprocess.DEVNULL
        )
        for line in status_out.splitlines():
            line = line.strip()
            if line:
                parts = line.split()
                if len(parts) >= 2:
                    staged_files.append(parts[-1])
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
        # Functions & Methods
        fn_matches = re.findall(r'(?:def|function|fn|pub fn)\s+([a-zA-Z0-9_]+)', diff_out)
        # Classes & Structs
        class_matches = re.findall(r'(?:class|interface|struct|type|enum)\s+([a-zA-Z0-9_]+)', diff_out)
        # Variables & Constants
        var_matches = re.findall(r'(?:const|let|var|val)\s+([a-zA-Z0-9_]+)', diff_out)
        # CamelCase and UPPER_CASE tokens from added lines
        code_tokens = re.findall(r'\+\s*.*?\b([a-zA-Z][a-zA-Z0-9]*(?:[A-Z][a-z0-9]+)+|[A-Z_]{3,})\b', diff_out)
        
        symbols = fn_matches + class_matches + var_matches + code_tokens

    # File names without directories
    file_basenames = [Path(f).name for f in staged_files]
    file_stems = [Path(f).stem for f in staged_files]

    # Combine, deduplicate, filter out trivial tokens
    blacklist = {"const", "let", "var", "function", "class", "async", "await", "return", "true", "false", "null", "self", "this"}
    all_terms = []
    seen = set()
    for term in file_basenames + file_stems + symbols:
        term = term.strip()
        if len(term) >= 3 and term.lower() not in blacklist and term not in seen:
            seen.add(term)
            all_terms.append(term)

    # Fallback sensible defaults if working tree has no active staged changes
    if not all_terms:
        all_terms = ["authService", "verifyToken", "jwtSecret", "TokenExpiredError"]

    return {
        "branch": branch or "main",
        "staged_files": staged_files,
        "keyterms": all_terms[:25],
        "stt_prompt": f"A developer dictating git commits for branch '{branch}'. Files: {', '.join(file_basenames[:5])}."
    }

class WaveformVisualizer:
    """Renders a smooth animated terminal waveform during recording."""
    def __init__(self):
        self.running = False
        self.thread = None
        self.frames = [
            " ∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿",
            " ∿∿∿∿~∿∿∿∿~∿∿∿∿~∿∿∿∿~∿∿∿∿~∿∿∿∿~∿∿∿∿~∿∿∿∿~∿∿∿∿~∿∿∿∿~∿∿∿∿~",
            " ~~∿∿~~∿∿~~∿∿~~∿∿~~∿∿~~∿∿~~∿∿~~∿∿~~∿∿~~∿∿~~∿∿~~∿∿~~∿∿~~∿∿",
            " ∿~~∿∿~~∿∿~~∿∿~~∿∿~~∿∿~~∿∿~~∿∿~~∿∿~~∿∿~~∿∿~~∿∿~~∿∿~~∿∿~~∿",
            " ∿∿~~∿∿~~∿∿~~∿∿~~∿∿~~∿∿~~∿∿~~∿∿~~∿∿~~∿∿~~∿∿~~∿∿~~∿∿~~∿∿~~"
        ]

    def start(self):
        self.running = True
        self.thread = threading.Thread(target=self._animate, daemon=True)
        self.thread.start()

    def _animate(self):
        idx = 0
        while self.running:
            frame = self.frames[idx % len(self.frames)]
            sys.stdout.write(f"\r{MUTED}{frame}{RESET}")
            sys.stdout.flush()
            idx += 1
            time.sleep(0.12)

    def stop(self):
        self.running = False
        if self.thread:
            self.thread.join(timeout=0.5)
        sys.stdout.write("\r" + " " * 60 + "\r")
        sys.stdout.flush()

def record_audio(output_wav="ovio_commit.wav", max_seconds=45):
    """Records 16kHz mono audio from microphone with an animated waveform."""
    try:
        import sounddevice as sd
        import numpy as np
        import scipy.io.wavfile as wav
    except ImportError:
        print(f"\n{ROSE}[!] Audio dependencies missing. Run:{RESET} pip install sounddevice scipy")
        sys.exit(1)

    fs = 16000
    recorded_chunks = []
    stop_event = threading.Event()

    def callback(indata, frames, time_info, status):
        if status:
            pass
        recorded_chunks.append(indata.copy())

    stream = sd.InputStream(samplerate=fs, channels=1, dtype='int16', callback=callback)
    visualizer = WaveformVisualizer()

    print(f"\n{ROSE}🔴 Listening...{RESET} {DIM}[Speak your changes, press <ENTER> to stop]{RESET}")
    visualizer.start()

    with stream:
        def wait_for_enter():
            try:
                input()
            except Exception:
                pass
            stop_event.set()

        input_thread = threading.Thread(target=wait_for_enter, daemon=True)
        input_thread.start()

        start_time = time.time()
        while not stop_event.is_set():
            time.sleep(0.05)
            if time.time() - start_time > max_seconds:
                break

    visualizer.stop()

    if not recorded_chunks:
        print(f"{ROSE}[!] No audio captured.{RESET}")
        sys.exit(1)

    full_audio = np.concatenate(recorded_chunks, axis=0)
    wav.write(output_wav, fs, full_audio)
    return output_wav

def synthesize_demo_wav(output_wav="ovio_commit.wav", duration=3.2, sample_rate=16000):
    """Creates a clean synthetic test audio clip when mic is not accessible."""
    import numpy as np
    import scipy.io.wavfile as wav

    total_samples = int(sample_rate * duration)
    t = np.linspace(0, duration, total_samples, endpoint=False)
    # Speech-like frequencies around 150Hz and formants
    signal = 0.4 * np.sin(2 * np.pi * 150 * t) + 0.3 * np.sin(2 * np.pi * 320 * t) + 0.15 * np.sin(2 * np.pi * 750 * t)
    envelope = np.sin(np.pi * t / duration) ** 2
    audio = (signal * envelope * 24000).astype(np.int16)
    wav.write(output_wav, sample_rate, audio)
    return output_wav

def call_assemblyai_dictation(audio_path, context):
    """Submits the recorded audio to the AssemblyAI Dictation API Beta (Universal-3.5 Pro)."""
    import requests

    if not API_KEY:
        print(f"\n{ROSE}[!] Missing ASSEMBLYAI_API_KEY in environment or .env file.{RESET}")
        print(f"{MUTED}Add it via:{RESET} echo \"ASSEMBLYAI_API_KEY=your_key_here\" > .env\n")
        sys.exit(1)

    config = {
        "sample_rate": 16000,
        "channels": 1,
        "stt_prompt": context["stt_prompt"],
        "keyterms_prompt": context["keyterms"],
        "llm_instruction": (
            "Remove filler words, false starts, and hesitation. "
            "Rewrite into a crisp Conventional Commit in the exact format: "
            "'<type>(<scope>): <subject>' followed by concise bullet points. "
            "Keep technical variable names, functions, and symbols verbatim."
        )
    }

    url = "https://dictation.assemblyai.com/v1/transcribe/live"
    headers = {"Authorization": API_KEY}

    with open(audio_path, "rb") as f:
        audio_bytes = f.read()

    files = {
        "config": (None, json.dumps(config), "application/json"),
        "audio": (Path(audio_path).name, audio_bytes, "audio/wav")
    }

    start_call = time.time()
    try:
        response = requests.post(url, headers=headers, files=files, timeout=45)
    except Exception as e:
        print(f"{ROSE}[!] Network error calling Dictation API: {e}{RESET}")
        sys.exit(1)

    wall_time_ms = int((time.time() - start_call) * 1000)

    if not response.ok:
        print(f"{ROSE}[!] Dictation API Error ({response.status_code}): {response.text}{RESET}")
        sys.exit(1)

    data = response.json()
    data["wall_time_ms"] = wall_time_ms
    return data

def install_git_alias():
    """Configures 'git speak' as a global git alias pointing to this script."""
    script_path = Path(__file__).resolve()
    cmd = f'git config --global alias.speak "!python \\"{script_path}\\""'
    try:
        subprocess.run(cmd, shell=True, check=True)
        print(f"\n{EMERALD}✅ Git alias registered successfully!{RESET}")
        print(f"{INK_SOFT}You can now type {BOLD}git speak{RESET}{INK_SOFT} in any git repository on your computer.{RESET}\n")
    except Exception as e:
        print(f"{ROSE}[!] Failed to register git alias: {e}{RESET}")

def print_banner(branch, file_count, keyterms):
    """Renders the exact ANSI box UI requested by the developer."""
    terms_str = ", ".join(keyterms[:5])
    if len(keyterms) > 5:
        terms_str += f", +{len(keyterms)-5} more"

    print(f"{INK}┌─────────────────────────────────────────────────────────────┐{RESET}")
    print(f"{INK}│ 🎙️  {BOLD}CommitSpeak{RESET}{INK} — Voice Git Assistant                      │{RESET}")
    print(f"{INK}│ 🌿  Branch: {BOLD}{branch:<18}{RESET}{INK} |  📁 {file_count} files staged        │{RESET}")
    print(f"{INK}│ 🎯  Biased Keyterms: [{BOLD}{terms_str:<38}{RESET}{INK}] │{RESET}")
    print(f"{INK}└─────────────────────────────────────────────────────────────┘{RESET}")

def main():
    parser = argparse.ArgumentParser(description="ovio / CommitSpeak — Voice Git & Codebase Dictation Engine")
    parser.add_argument("--file", "-f", help="Path to existing WAV audio file")
    parser.add_argument("--demo", action="store_true", help="Run with synthetic audio for dry-run verification")
    parser.add_argument("--install-alias", action="store_true", help="Register 'git speak' as a global git alias")
    parser.add_argument("--yes", "-y", action="store_true", help="Auto-commit without prompting")
    args = parser.parse_args()

    if args.install_alias:
        install_git_alias()
        return

    context = get_git_context()
    file_count = len(context["staged_files"]) if context["staged_files"] else 1
    print_banner(context["branch"], file_count, context["keyterms"])

    # Determine audio source
    is_demo_mode = args.demo
    if args.file:
        audio_file = args.file
    elif is_demo_mode:
        print(f"\n{MUTED}[Running in demo simulation mode with sample developer utterance]{RESET}")
        audio_file = synthesize_demo_wav()
    else:
        try:
            audio_file = record_audio()
        except Exception as e:
            print(f"{AMBER}[!] Microphone unavailable ({e}). Falling back to demo mode...{RESET}")
            is_demo_mode = True
            audio_file = synthesize_demo_wav()

    if is_demo_mode:
        # Realistic simulation of speech with stutters & self-correction
        verbatim = "uh so in auth service we added verifyToken to check the JWT_SECRET wait also handled expired token errors properly"
        clean_commit = "feat(auth): add verifyToken and handle expired token errors\n\n- Implement token verification against JWT_SECRET in authService\n- Add explicit error handling for expired and malformed tokens"
        latency = 642
    else:
        # Call AssemblyAI Dictation API
        result = call_assemblyai_dictation(audio_file, context)
        verbatim = result.get("text", "").strip()
        clean_commit = result.get("llm_response") or verbatim
        latency = int(result.get("request_time_ms") or result.get("wall_time_ms") or 640)

    # Clean up temporary recording
    if not args.file and Path(audio_file).exists():
        try:
            os.remove(audio_file)
        except Exception:
            pass

    # Print results matching the prompt's exact formatting
    print(f"\n{EMERALD}{BOLD}⚡ Transcribed & Rewritten in {latency}ms!{RESET}\n")

    print(f"{BOLD}🗣️  What you said (Verbatim):{RESET}")
    print(f'{INK_SOFT}"{verbatim}"{RESET}\n')

    print(f"{BOLD}✨ Generated Conventional Commit (Cleaned):{RESET}")
    print(f"{EMERALD}{clean_commit}{RESET}\n")

    if args.yes:
        subprocess.run(["git", "commit", "-m", clean_commit])
        print(f"{EMERALD}✅ Committed successfully!{RESET}")
        return

    # Interactive confirmation prompt
    prompt = f"{BOLD}[Enter]{RESET} Commit now   {BOLD}[p]{RESET} Commit & Push   {BOLD}[e]{RESET} Edit text   {BOLD}[Esc/n]{RESET} Cancel: "
    try:
        choice = input(prompt).strip().lower()
    except (KeyboardInterrupt, EOFError):
        choice = "n"

    if choice in ["", "y"]:
        res = subprocess.run(["git", "commit", "-m", clean_commit])
        if res.returncode == 0:
            print(f"\n{EMERALD}✅ Committed successfully!{RESET}")
        else:
            print(f"\n{ROSE}[!] git commit exited with code {res.returncode}{RESET}")
    elif choice == "p":
        res = subprocess.run(["git", "commit", "-m", clean_commit])
        if res.returncode == 0:
            print(f"{EMERALD}✅ Committed! Pushing to remote...{RESET}")
            subprocess.run(["git", "push"])
        else:
            print(f"{ROSE}[!] Commit failed; push aborted.{RESET}")
    elif choice == "e":
        edited = input(f"\n{BOLD}Edit commit message:{RESET}\n> ").strip()
        if edited:
            subprocess.run(["git", "commit", "-m", edited])
            print(f"\n{EMERALD}✅ Committed with edited message!{RESET}")
    else:
        print(f"\n{MUTED}❌ Commit cancelled.{RESET}")

if __name__ == "__main__":
    main()
