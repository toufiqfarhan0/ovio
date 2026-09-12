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

    # Auto-stage tracked changes if nothing is staged yet
    if auto_stage and unstaged_files and not staged_files:
        try:
            subprocess.run(["git", "add", "-u"], check=True, stderr=subprocess.DEVNULL)
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

def record_audio_push_to_talk(output_wav="ovio_commit.wav", max_seconds=45) -> str:
    """
    Records 16kHz audio from microphone using push-to-talk (hold SPACEBAR).
    Falls back to Enter toggle if pynput listener is unavailable.
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

    def audio_callback(indata, frames, time_info, status):
        if recording_active.is_set():
            recorded_chunks.append(indata.copy())

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
                if start_time is None:
                    start_time = time.time()
                elapsed = time.time() - start_time
                frame = wave_frames[frame_idx % len(wave_frames)]
                sys.stdout.write(
                    f"\r  \033[31m●\033[0m \033[1mrecording\033[0m  "
                    f"\033[38;2;255;140;0m{frame}\033[0m  "
                    f"\033[2m{elapsed:.1f}s\033[0m   "
                )
                sys.stdout.flush()
                frame_idx += 1
            else:
                if start_time is not None:
                    break
            time.sleep(0.10)

        sys.stdout.write("\r" + " " * 70 + "\r")
        sys.stdout.flush()

    if not recorded_chunks:
        console.print("  [dim]no audio captured — falling back to synthetic clip[/dim]")
        return synthesize_demo_wav(output_wav)

    full_audio = np.concatenate(recorded_chunks, axis=0)
    wav.write(output_wav, fs, full_audio)
    return output_wav

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
# install-alias
# ─────────────────────────────────────────────────────────────

def install_git_aliases():
    """Registers 'git speak' as a global git alias pointing to this script."""
    script_path = Path(__file__).resolve()
    cmd1 = f'git config --global alias.speak "!python \\"{script_path}\\""'
    cmd2 = f'git config --global alias.commitspeak "!python \\"{script_path}\\""'
    try:
        subprocess.run(cmd1, shell=True, check=True)
        subprocess.run(cmd2, shell=True, check=True)
        console.print()
        print_rule()
        console.print("  [bold green]ok[/bold green]  git aliases registered")
        print_rule()
        console.print()
    except Exception as e:
        console.print(f"  [bold red]error:[/bold red] {e}")

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

# ─────────────────────────────────────────────────────────────
# main
# ─────────────────────────────────────────────────────────────

@app.callback(invoke_without_command=True)
def main(
    ctx: typer.Context,
    demo: bool = typer.Option(False, "--demo", "-d", help="Run with synthetic audio for dry-run verification"),
    push: bool = typer.Option(False, "--push", "-p", help="Automatically commit and push without confirmation"),
    file: Optional[str] = typer.Option(None, "--file", "-f", help="Path to existing WAV audio file"),
    verbose: bool = typer.Option(False, "--verbose", "-v", help="Display extracted AST symbols in header"),
    install_alias: bool = typer.Option(False, "--install-alias", help="Register 'git speak' and 'commitspeak' aliases")
):
    """
    ovio — Voice Git & Codebase Dictation Engine
    """
    if install_alias:
        install_git_aliases()
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
        try:
            audio_path = record_audio_push_to_talk()
        except Exception as e:
            console.print(f"  [dim]microphone unavailable ({e}) — switching to demo mode[/dim]")
            is_demo_mode = True
            audio_path = synthesize_demo_wav()

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
        subprocess.run(["git", "push"], check=True)
        console.print()
        print_rule()
        console.print("  [bold green]ok[/bold green]  committed and pushed")
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
                console.print("  [bold green]ok[/bold green]  committed — pushing to remote...")
                subprocess.run(["git", "push"])
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

