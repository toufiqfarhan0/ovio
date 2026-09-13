#!/usr/bin/env python3
"""
ovio — Voice Git & Codebase Dictation Engine
Powered by AssemblyAI Dictation API (Universal-3.5 Pro) + Rich + Typer + pynput
"""

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
from rich.console import Console
from rich.text import Text
from rich.prompt import Prompt

# Initialize Typer and Rich Console
app = typer.Typer(
    help="ovio — Voice Git & Codebase Dictation Engine powered by AssemblyAI",
    add_completion=False,
    invoke_without_command=True
)
console = Console(force_terminal=True, legacy_windows=False)

# ─────────────────────────────────────────────────────────────
# constants
# ─────────────────────────────────────────────────────────────

RULE_WIDTH = 68

BANNER = r"""
  ___   __      __  ___   ___  
 / _ \  \ \    / / |_ _| / _ \ 
| | | |  \ \  / /   | | | | | |
| |_| |   \ \/ /    | | | |_| |
 \___/     \__/    |___| \___/ 
"""

VERSION  = "1.0.0"
MODEL    = "Universal-3.5 Pro"
PROVIDER = "AssemblyAI Dictation API"

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
# helpers
# ─────────────────────────────────────────────────────────────

def rule(width: int = RULE_WIDTH) -> str:
    return "─" * width

def print_rule(width: int = RULE_WIDTH):
    console.print(f"[dim]{rule(width)}[/dim]")

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

# ─────────────────────────────────────────────────────────────
# git context & AST extraction
# ─────────────────────────────────────────────────────────────

def get_git_context(auto_stage: bool = True):
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
        # Automatically modernize legacy 'master' branch to 'main'
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
            # Try git add -u first for tracked modifications
            subprocess.run(["git", "add", "-u"], check=True, stderr=subprocess.DEVNULL)
            status_out = subprocess.check_output(["git", "status", "--porcelain"], text=True)
            staged_files = [line[3:].strip() for line in status_out.splitlines() if len(line) >= 3 and line[0] in ("M", "A", "D", "R")]
            # In a brand-new repo with 0 commits, tracked add -u stages nothing; stage with git add -A
            if not staged_files and unstaged_files:
                subprocess.run(["git", "add", "-A"], check=True, stderr=subprocess.DEVNULL)
                status_out = subprocess.check_output(["git", "status", "--porcelain"], text=True)
                staged_files = [line[3:].strip() for line in status_out.splitlines() if len(line) >= 3 and line[0] in ("M", "A", "D", "R")]
            if staged_files:
                console.print(f"  [dim]auto-staged {len(staged_files)} modified file(s) for diff inspection[/dim]")
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
    Detects voice activity in real time and prompts the user if silent for 2-3s.
    Returns (output_wav_path, has_speech_bool).
    """
    try:
        import sounddevice as sd
        import numpy as np
        import scipy.io.wavfile as wav
    except ImportError:
        console.print("  [bold red]error:[/bold red] audio dependencies missing.")
        console.print("  run: [cyan]pip install sounddevice scipy numpy[/cyan]")
        sys.exit(1)

    fs = 16000
    recorded_chunks = []
    recording_active = threading.Event()
    stop_session = threading.Event()

    # Real-time speech metering state
    speech_state = {
        "last_voice_time": None,
        "has_voice": False,
        "current_rms": 0.0,
        "max_peak": 0
    }

    # Speech threshold: 16-bit PCM values range -32768 to 32767.
    # Ambient noise in typical rooms is < 250 RMS.
    # Spoken voice within standard mic distance is typically 320 - 4000+ RMS.
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

    console.print()
    if use_pynput:
        console.print(f"  [bold white]hold[/bold white] [reverse] SPACEBAR [/reverse] [dim]to dictate — release when done[/dim]")
    else:
        console.print(f"  [bold white]press[/bold white] [reverse] ENTER [/reverse] [dim]to start, then ENTER again to stop[/dim]")

    wave_frames = ["▁▂▃▄▅▄▃▂", "▂▃▄▅▆▅▄▃", "▃▄▅▆▇▆▅▄", "▄▅▆▇█▇▆▅", "▃▄▅▆▇▆▅▄"]
    frame_idx = 0

    with stream:
        if not use_pynput:
            try:
                input()
            except Exception:
                pass
            recording_active.set()
            console.print("  [bold red]●[/bold red] [bold white]recording[/bold white]  [dim](ENTER to stop)[/dim]")

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

                # Silence calculation: how long has it been since speech was detected?
                last_voice = speech_state["last_voice_time"]
                silence_duration = (now - last_voice) if last_voice is not None else elapsed

                # Real-time prompt when silent for >= 2.2 seconds
                if silence_duration >= 2.2:
                    if not speech_state["has_voice"]:
                        hint = "\033[33m(listening... please speak more)\033[0m"
                    else:
                        hint = "\033[33m(pause detected — speak more or release)\033[0m"
                    waveform_str = "\033[33m·······\033[0m"
                else:
                    if speech_state["has_voice"]:
                        hint = "\033[32m(voice active)\033[0m"
                    else:
                        hint = ""
                    frame = wave_frames[frame_idx % len(wave_frames)]
                    waveform_str = f"\033[38;2;255;140;0m{frame}\033[0m"

                status_line = (
                    f"  \033[31m●\033[0m \033[1mrecording\033[0m  "
                    f"{waveform_str}  "
                    f"\033[2m{elapsed:.1f}s\033[0m  "
                    f"{hint}"
                )
                # Pad to overwrite previous text cleanly
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

# ─────────────────────────────────────────────────────────────
# demo audio synthesis
# ─────────────────────────────────────────────────────────────

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

def transcribe_with_assemblyai(audio_path: str, context: dict) -> dict:
    """
    Submits audio to AssemblyAI Dictation API Beta (Universal-3.5 Pro)
    using the official assemblyai SDK (DictationTranscriber, DictationConfig).
    """
    if not API_KEY:
        console.print()
        print_rule()
        console.print("  [bold red]error:[/bold red] ASSEMBLYAI_API_KEY not set")
        console.print("  [dim]add it:[/dim]  echo \"ASSEMBLYAI_API_KEY=your_key\" > .env")
        print_rule()
        sys.exit(1)

    start_time = time.time()
    try:
        import assemblyai as aai
        aai.settings.api_key = API_KEY

        config = aai.DictationConfig(
            sample_rate=16000,
            channels=1,
            stt_prompt=context["stt_prompt"],
            keyterms_prompt=context["keyterms"],
            llm_instruction=(
                "Remove filler words, false starts, and hesitation. "
                "Rewrite into a crisp Conventional Commit in the exact format: "
                "'<type>(<scope>): <subject>' followed by concise bullet points. "
                "Keep technical variable names, functions, and symbols verbatim."
            )
        )

        transcriber = aai.DictationTranscriber()
        response = transcriber.transcribe_live(audio_path, config=config)
        wall_time_ms = int((time.time() - start_time) * 1000)

        return {
            "text":         response.text or "",
            "llm_response": response.llm_response or response.text or "",
            "latency_ms":   int(round(float(response.request_time_ms or wall_time_ms)))
        }
    except Exception as e:
        import requests
        url = "https://dictation.assemblyai.com/v1/transcribe/live"
        headers = {"Authorization": API_KEY}

        config_data = {
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

        with open(audio_path, "rb") as f:
            audio_bytes = f.read()

        files = {
            "config": (None, json.dumps(config_data), "application/json"),
            "audio":  (Path(audio_path).name, audio_bytes, "audio/wav")
        }

        resp = requests.post(url, headers=headers, files=files, timeout=45)
        wall_time_ms = int((time.time() - start_time) * 1000)

        if not resp.ok:
            console.print(f"  [bold red]error ({resp.status_code}):[/bold red] {resp.text}")
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

def render_header(context: dict, mode: str = "live", verbose: bool = False):
    """Print the compact startup header block."""
    branch      = context["branch"]
    staged      = len(context["staged_files"])
    keyterms    = context["keyterms"]

    console.print()
    console.print(f"[bold white]{BANNER}[/bold white]", highlight=False)
    print_rule()
    console.print(f"  [dim white]version[/dim white]         [white]{VERSION}[/white]")
    console.print(f"  [dim white]model[/dim white]           [white]{MODEL}[/white]")
    console.print(f"  [dim white]provider[/dim white]        [white]{PROVIDER}[/white]")
    print_rule()
    console.print(f"  [dim white]branch[/dim white]          [bold cyan]{branch}[/bold cyan]")
    if staged > 0:
        console.print(f"  [dim white]staged files[/dim white]    [bold white]{staged}[/bold white]")
    else:
        console.print(f"  [dim white]staged files[/dim white]    [dim]0 (clean)[/dim]")

    if len(keyterms) > 0:
        console.print(f"  [dim white]symbols biased[/dim white]  [bold yellow]{len(keyterms)}[/bold yellow]")
        if verbose:
            terms_str = "  ".join(keyterms[:8])
            console.print(f"  [dim white]keyterms[/dim white]        [dim yellow]{terms_str}[/dim yellow]")
            if len(keyterms) > 8:
                console.print(f"  [dim]                  + {len(keyterms) - 8} more[/dim]")

    if mode == "demo":
        console.print(f"  [dim white]mode[/dim white]            [dim]demo — synthetic utterance[/dim]")
    print_rule()

def render_result(verbatim: str, clean_commit: str, latency_ms: int):
    """Print the transcription result block."""
    console.print()
    console.print(f"  [bold white]transcribed & formatted[/bold white]  [dim][{latency_ms}ms  {MODEL}][/dim]", highlight=False)
    print_rule()
    console.print(f"  [dim]verbatim[/dim]")
    console.print(f"  [italic dim white]{verbatim}[/italic dim white]")
    console.print()
    console.print(f"  [dim]conventional commit[/dim]")
    for i, line in enumerate(clean_commit.splitlines()):
        stripped = line.strip()
        if not stripped:
            continue
        if i == 0:
            console.print(f"  [bold #FF8C00]{stripped}[/bold #FF8C00]")
        else:
            console.print(f"  [#FF8C00]{stripped}[/#FF8C00]")
    print_rule()

def render_prompt():
    """Print the interactive action line."""
    console.print()
    console.print(
        "  [bold white][Enter][/bold white] commit & push  "
        "[dim]|[/dim]  "
        "[bold white]\\[c][/bold white] commit only  "
        "[dim]|[/dim]  "
        "[bold white]\\[e][/bold white] edit  "
        "[dim]|[/dim]  "
        "[bold red]\\[q][/bold red] cancel"
    )

def execute_git_push(branch: str = "main"):
    """Pushes committed changes to remote; outputs clean orange guidance if no remote is configured."""
    target_branch = "main" if branch in ("master", "") else branch
    push_res = subprocess.run(["git", "push"], capture_output=True, text=True)
    if push_res.returncode == 0:
        console.print("  [bold green]ok[/bold green]  committed and pushed to remote")
    else:
        err = (push_res.stderr or push_res.stdout or "").strip()
        if "No configured push destination" in err or "no upstream branch" in err or "fatal: 'origin'" in err or "has no upstream branch" in err:
            console.print("  [bold green]ok[/bold green]  committed locally")
            console.print()
            console.print("  [bold #FF8C00]notice:[/bold #FF8C00] [dim]no remote repository configured yet[/dim]")
            console.print("  [#FF8C00]to create and push to a remote repository:[/#FF8C00]")
            console.print("    [bold white]1.[/bold white] create a repository on github (e.g. at https://github.com/new)")
            console.print("    [bold white]2.[/bold white] link it: [cyan]git remote add origin https://github.com/<username>/<repo>.git[/cyan]")
            console.print(f"    [bold white]3.[/bold white] push:    [cyan]git push -u origin {target_branch}[/cyan]")
        else:
            console.print(f"  [bold yellow]push failed:[/bold yellow] [dim]{err}[/dim]")

# ─────────────────────────────────────────────────────────────
# main
# ─────────────────────────────────────────────────────────────

@app.callback(invoke_without_command=True)
def main(
    ctx: typer.Context,
    demo: bool = typer.Option(False, "--demo", "-d", help="Run with synthetic audio for dry-run verification"),
    push: bool = typer.Option(False, "--push", "-p", help="Automatically commit and push without confirmation"),
    file: Optional[str] = typer.Option(None, "--file", "-f", help="Path to existing WAV audio file"),
    verbose: bool = typer.Option(False, "--verbose", "-v", help="Display extracted AST symbols in header")
):
    """
    ovio — Voice Git & Codebase Dictation Engine
    """
    # Check if current directory is inside a Git repository
    if not is_git_repository() and not demo:
        console.print()
        console.print(f"[bold white]{BANNER}[/bold white]", highlight=False)
        print_rule()
        console.print("  [bold #FF8C00]notice:[/bold #FF8C00] [bold white]not a git repository[/bold white]")
        print_rule()
        console.print()
        console.print("  [#FF8C00]please initialize git before using ovio:[/#FF8C00]")
        console.print("    [bold white]git init[/bold white]")
        console.print()
        console.print("  [dim]tip: run 'git init', make your code edits, then run [cyan]ovio[/cyan].[/dim]")
        print_rule()
        return

    # 1. Gather git context and AST symbols
    context = get_git_context(auto_stage=True)

    # In demo mode, if there are no real diff keyterms, provide sample terms for the synthetic clip
    if demo and not context["keyterms"]:
        context["keyterms"] = ["authService", "verifyToken", "jwtSecret", "TokenExpiredError"]

    # 2. Render header
    mode = "demo" if demo else ("file" if file else "live")
    render_header(context, mode=mode, verbose=verbose)

    # Inform user if working tree is clean
    if not context["staged_files"] and not demo:
        console.print("  [dim]note: working tree is clean — no staged changes to commit[/dim]")

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
                console.print(f"  [bold red]microphone error:[/bold red] {e}")
                console.print("  [dim]please check your microphone connection and permissions.[/dim]")
                sys.exit(1)

            if has_speech:
                break

            # Handle silence / no speech detected
            console.print()
            console.print("  [bold yellow]notice:[/bold yellow] No speech detected in recording.")
            console.print("  [dim]suggestion: hold Spacebar and describe what you changed.[/dim]")
            if context.get("keyterms"):
                sample_terms = ", ".join(context["keyterms"][:3])
                console.print(f"  [dim]example: \"update {sample_terms} to fix error handling\"[/dim]")
            console.print()

            action = Prompt.ask(
                "  [bold white][r][/bold white] retry dictation  |  [bold white][q][/bold white] quit",
                default="r"
            ).strip().lower()

            if action == "q":
                console.print("  [dim]cancelled[/dim]")
                sys.exit(0)
            # action == "r" repeats recording loop

    # 4. Transcribe & Format
    if is_demo_mode:
        verbatim     = "uh so in auth service we added verifyToken to check the JWT_SECRET wait also handled expired token errors properly"
        clean_commit = "feat(auth): add verifyToken and handle expired token errors\n\n- Implement token verification against JWT_SECRET in authService\n- Add explicit error handling for expired and malformed tokens"
        latency      = 642
    else:
        with console.status("  [dim]streaming to assemblyai...[/dim]", spinner="dots"):
            res          = transcribe_with_assemblyai(audio_path, context)
            verbatim     = res["text"]
            clean_commit = res["llm_response"]
            latency      = res["latency_ms"]

        if not verbatim.strip():
            verbatim = "(no speech recognized)"
            clean_commit = f"chore({context['branch']}): update codebase"

    # Cleanup temporary wav
    if not file and Path(audio_path).exists():
        try:
            os.remove(audio_path)
        except Exception:
            pass

    # 5. Output Result
    render_result(verbatim, clean_commit, latency)

    if push:
        subprocess.run(["git", "commit", "-m", clean_commit], check=True)
        console.print()
        print_rule()
        execute_git_push(context["branch"])
        print_rule()
        return

    # 6. Interactive Decision Loop
    current_commit = clean_commit

    while True:
        render_prompt()

        try:
            user_choice = Prompt.ask("[dim]  >[/dim]", default="").strip().lower()
        except (KeyboardInterrupt, EOFError):
            user_choice = "q"

        if user_choice in ("", "y", "p"):
            res = subprocess.run(["git", "commit", "-m", current_commit])
            console.print()
            print_rule()
            if res.returncode == 0:
                execute_git_push(context["branch"])
            else:
                console.print("  [dim]nothing staged to commit (working tree clean)[/dim]")
            print_rule()
            break
        elif user_choice == "c":
            res = subprocess.run(["git", "commit", "-m", current_commit])
            console.print()
            print_rule()
            if res.returncode == 0:
                console.print("  [bold green]ok[/bold green]  committed locally")
            else:
                console.print("  [dim]nothing staged to commit (working tree clean)[/dim]")
            print_rule()
            break
        elif user_choice == "e":
            edited = Prompt.ask(
                "\n  [dim]edit commit message[/dim]",
                default=current_commit.splitlines()[0]
            ).strip()
            if edited:
                current_commit = edited
                console.print()
                print_rule()
                console.print("  [dim]updated commit[/dim]")
                console.print()
                for i, line in enumerate(current_commit.splitlines()):
                    stripped = line.strip()
                    if not stripped:
                        continue
                    if i == 0:
                        console.print(f"  [bold #FF8C00]{stripped}[/bold #FF8C00]")
                    else:
                        console.print(f"  [#FF8C00]{stripped}[/#FF8C00]")
                print_rule()
            continue
        else:
            console.print()
            print_rule()
            console.print("  [dim]cancelled — no changes made[/dim]")
            print_rule()
            break

    console.print()

if __name__ == "__main__":
    app()

