#!/usr/bin/env python3
"""
ovio / commitspeak — Voice Git & Codebase Dictation Engine
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
from rich.panel import Panel
from rich.table import Table
from rich.live import Live
from rich.text import Text
from rich.prompt import Prompt

# Initialize Typer and Rich Console
app = typer.Typer(
    help="ovio — Voice Git & Codebase Dictation Engine powered by AssemblyAI",
    add_completion=False,
    invoke_without_command=True
)
console = Console(force_terminal=True, legacy_windows=False)

# Load .env file
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
            # Re-read status
            status_out = subprocess.check_output(["git", "status", "--porcelain"], text=True)
            staged_files = [line[3:].strip() for line in status_out.splitlines() if len(line) >= 3 and line[0] in ("M", "A", "D", "R")]
            if staged_files:
                console.print(f"[dim]📁 Auto-staged {len(staged_files)} modified file(s) for diff inspection.[/dim]")
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
        # CamelCase and UPPER_CASE identifiers from additions
        code_tokens = re.findall(r'\+\s*.*?\b([a-zA-Z][a-zA-Z0-9]*(?:[A-Z][a-z0-9]+)+|[A-Z_]{3,})\b', diff_out)
        
        symbols = fn_matches + class_matches + var_matches + code_tokens

    # File names without directories
    file_basenames = [Path(f).name for f in staged_files or unstaged_files]
    file_stems = [Path(f).stem for f in staged_files or unstaged_files]

    # Combine, deduplicate, filter out trivial keywords
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

    # Fallback sensible defaults if working tree has no active changes
    if not all_terms:
        all_terms = ["authService", "verifyToken", "jwtSecret", "TokenExpiredError"]

    return {
        "branch": branch or "main",
        "staged_files": staged_files or unstaged_files or ["src/index.js"],
        "keyterms": all_terms[:25],
        "stt_prompt": f"A developer dictating git commits for branch '{branch}'. Files: {', '.join(file_basenames[:5])}."
    }

def record_audio_push_to_talk(output_wav="ovio_commit.wav", max_seconds=45) -> str:
    """
    Records 16kHz audio from microphone using push-to-talk (hold SPACEBAR).
    Displays a glowing pulsing spinner while recording.
    Falls back to <Enter> toggle if pynput listener is unavailable.
    """
    try:
        import sounddevice as sd
        import numpy as np
        import scipy.io.wavfile as wav
    except ImportError:
        console.print("[bold red][!] Audio dependencies missing.[/bold red] Run: [cyan]pip install sounddevice scipy numpy[/cyan]")
        sys.exit(1)

    fs = 16000
    recorded_chunks = []
    recording_active = threading.Event()
    stop_session = threading.Event()

    def audio_callback(indata, frames, time_info, status):
        if recording_active.is_set():
            recorded_chunks.append(indata.copy())

    # Try setting up pynput push-to-talk listener
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
                    return False  # Stop listener

        listener = keyboard.Listener(on_press=on_press, on_release=on_release)
        listener.start()
        use_pynput = True
    except Exception:
        use_pynput = False

    stream = sd.InputStream(samplerate=fs, channels=1, dtype='int16', callback=audio_callback)

    if use_pynput:
        console.print("[bold white]🎙️  Hold [black on white] SPACEBAR [/black on white] to dictate...[/bold white] [dim](release when finished)[/dim]")
    else:
        console.print("[bold white]🎙️  Press [black on white] ENTER [/black on white] to start dictating...[/bold white]")

    # Glowing terminal spinner animation loop
    spinner_frames = ["∿∿∿∿∿", "∿~∿~∿", "~~∿~~", "~∿~∿~", "∿∿~~∿"]
    frame_idx = 0

    with stream:
        if not use_pynput:
            # Fallback: Enter to start, Enter to stop
            try:
                input()
            except Exception:
                pass
            recording_active.set()
            console.print("[bold red]🔴 RECORDING...[/bold red] [dim](press <ENTER> when done)[/dim]")
            
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
                frame = spinner_frames[frame_idx % len(spinner_frames)]
                frame_idx += 1
                sys.stdout.write(f"\r\033[38;2;255;87;26m🔴 RECORDING LIVE AUDIO\033[0m  \033[38;2;16;120;70m{frame}\033[0m \033[2m({elapsed:.1f}s)\033[0m   ")
                sys.stdout.flush()
            else:
                if start_time is not None:
                    break
            time.sleep(0.08)

        sys.stdout.write("\r" + " " * 70 + "\r")
        sys.stdout.flush()

    if not recorded_chunks:
        console.print("[yellow][!] No audio recorded. Falling back to synthetic demonstration clip...[/yellow]")
        return synthesize_demo_wav(output_wav)

    full_audio = np.concatenate(recorded_chunks, axis=0)
    wav.write(output_wav, fs, full_audio)
    return output_wav

def synthesize_demo_wav(output_wav="ovio_commit.wav", duration=3.2, sample_rate=16000) -> str:
    """Creates a clean synthetic test audio clip when mic is unavailable or in demo mode."""
    import numpy as np
    import scipy.io.wavfile as wav

    total_samples = int(sample_rate * duration)
    t = np.linspace(0, duration, total_samples, endpoint=False)
    signal = 0.4 * np.sin(2 * np.pi * 150 * t) + 0.3 * np.sin(2 * np.pi * 320 * t) + 0.15 * np.sin(2 * np.pi * 750 * t)
    envelope = np.sin(np.pi * t / duration) ** 2
    audio = (signal * envelope * 24000).astype(np.int16)
    wav.write(output_wav, sample_rate, audio)
    return output_wav

def transcribe_with_assemblyai(audio_path: str, context: dict) -> dict:
    """
    Submits audio to AssemblyAI Dictation API Beta (Universal-3.5 Pro)
    using the official assemblyai SDK (DictationTranscriber, DictationConfig).
    """
    if not API_KEY:
        console.print("\n[bold red][!] Missing ASSEMBLYAI_API_KEY in environment or .env file.[/bold red]")
        console.print("[dim]Add it via:[/dim] echo \"ASSEMBLYAI_API_KEY=your_key_here\" > .env\n")
        sys.exit(1)

    # 1. Try official AssemblyAI Python SDK
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
            "text": response.text or "",
            "llm_response": response.llm_response or response.text or "",
            "latency_ms": int(round(float(response.request_time_ms or wall_time_ms)))
        }
    except Exception as e:
        # 2. Fallback to direct HTTP multipart live endpoint
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
            "audio": (Path(audio_path).name, audio_bytes, "audio/wav")
        }

        resp = requests.post(url, headers=headers, files=files, timeout=45)
        wall_time_ms = int((time.time() - start_time) * 1000)

        if not resp.ok:
            console.print(f"[bold red][!] Dictation API Error ({resp.status_code}): {resp.text}[/bold red]")
            sys.exit(1)

        data = resp.json()
        return {
            "text": data.get("text", "").strip(),
            "llm_response": data.get("llm_response") or data.get("text", ""),
            "latency_ms": int(round(float(data.get("request_time_ms") or wall_time_ms)))
        }

def install_git_aliases():
    """Configures both 'git speak' and 'commitspeak' global git aliases."""
    script_path = Path(__file__).resolve()
    cmd1 = f'git config --global alias.speak "!python \\"{script_path}\\""'
    cmd2 = f'git config --global alias.commitspeak "!python \\"{script_path}\\""'
    try:
        subprocess.run(cmd1, shell=True, check=True)
        subprocess.run(cmd2, shell=True, check=True)
        console.print(Panel.fit(
            "[bold green]✅ Git Aliases Registered Successfully![/bold green]\n\n"
            "You can now run either command from any git repository on your system:\n"
            "  • [bold cyan]git speak[/bold cyan]\n"
            "  • [bold cyan]git commitspeak[/bold cyan]",
            title="ovio / commitspeak",
            border_style="green"
        ))
    except Exception as e:
        console.print(f"[bold red][!] Failed to register git aliases: {e}[/bold red]")

@app.callback(invoke_without_command=True)
def main(
    ctx: typer.Context,
    demo: bool = typer.Option(False, "--demo", "-d", help="Run with synthetic audio for dry-run verification"),
    push: bool = typer.Option(False, "--push", "-p", help="Automatically commit and push without confirmation"),
    file: Optional[str] = typer.Option(None, "--file", "-f", help="Path to existing WAV audio file"),
    install_alias: bool = typer.Option(False, "--install-alias", help="Register 'git speak' and 'commitspeak' aliases")
):
    """
    ovio / commitspeak — Voice Git & Codebase Dictation Engine
    """
    if install_alias:
        install_git_aliases()
        return

    # 1. Gather git context and AST symbols
    context = get_git_context(auto_stage=True)
    staged_count = len(context["staged_files"])
    keyterms_preview = ", ".join(context["keyterms"][:6])
    if len(context["keyterms"]) > 6:
        keyterms_preview += f", +{len(context['keyterms'])-6} more"

    # 2. Render Rich Banner
    banner_text = Text()
    banner_text.append(f"🌿 Branch: ", style="bold white")
    banner_text.append(f"{context['branch']}\n", style="bold cyan")
    banner_text.append(f"📁 Staged: ", style="bold white")
    banner_text.append(f"{staged_count} file(s) staged\n", style="bold green")
    banner_text.append(f"🎯 Biased Keyterms: ", style="bold white")
    banner_text.append(f"[{keyterms_preview}]", style="bold yellow")

    console.print(Panel(
        banner_text,
        title="[bold white on #161413] 🎙️  ovio — Voice Git & Codebase Assistant [/bold white on #161413]",
        subtitle="[dim]Powered by AssemblyAI Universal-3.5 Pro[/dim]",
        border_style="bright_black",
        padding=(1, 2)
    ))

    # 3. Audio Recording / Sourcing
    is_demo_mode = demo
    if file:
        audio_path = file
    elif is_demo_mode:
        console.print("[dim][Running in demo simulation mode with synthetic developer utterance][/dim]")
        audio_path = synthesize_demo_wav()
    else:
        try:
            audio_path = record_audio_push_to_talk()
        except Exception as e:
            console.print(f"[yellow][!] Microphone unavailable ({e}). Falling back to demo mode...[/yellow]")
            is_demo_mode = True
            audio_path = synthesize_demo_wav()

    # 4. Transcribe & Format
    if is_demo_mode:
        verbatim = "uh so in auth service we added verifyToken to check the JWT_SECRET wait also handled expired token errors properly"
        clean_commit = "feat(auth): add verifyToken and handle expired token errors\n\n- Implement token verification against JWT_SECRET in authService\n- Add explicit error handling for expired and malformed tokens"
        latency = 642
    else:
        with console.status("[bold green]⚡ Streaming to AssemblyAI Dictation API...[/bold green]", spinner="dots"):
            res = transcribe_with_assemblyai(audio_path, context)
            verbatim = res["text"]
            clean_commit = res["llm_response"]
            latency = res["latency_ms"]

    # Cleanup temporary wav
    if not file and Path(audio_path).exists():
        try:
            os.remove(audio_path)
        except Exception:
            pass

    # 5. Output Result Panel
    console.print(f"\n[bold green]⚡ Transcribed & Formatted in {latency}ms (Universal-3.5 Pro)[/bold green]\n")

    result_text = Text()
    result_text.append("🗣️  What you said (Verbatim):\n", style="bold white")
    result_text.append(f'"{verbatim}"\n\n', style="italic dim white")
    result_text.append("✨ Generated Conventional Commit:\n", style="bold white")
    result_text.append(f"{clean_commit}", style="bold green")

    console.print(Panel(
        result_text,
        border_style="green",
        padding=(1, 2)
    ))

    if push:
        subprocess.run(["git", "commit", "-m", clean_commit], check=True)
        subprocess.run(["git", "push"], check=True)
        console.print("[bold green]✅ Committed and pushed successfully![/bold green]")
        return

    # 6. Interactive Decision Loop
    current_commit = clean_commit

    while True:
        prompt_str = (
            "[bold green][Enter][/bold green] Commit & Push  |  "
            "[bold cyan]\\[c][/bold cyan] Commit only  |  "
            "[bold yellow]\\[e][/bold yellow] Edit text  |  "
            "[bold red]\\[q][/bold red] Cancel"
        )
        console.print(prompt_str)

        try:
            user_choice = Prompt.ask("[bold cyan]>[/bold cyan]", default="").strip().lower()
        except (KeyboardInterrupt, EOFError):
            user_choice = "q"

        if user_choice in ("", "y", "p"):
            res = subprocess.run(["git", "commit", "-m", current_commit])
            if res.returncode == 0:
                console.print("[bold green]✅ Committed successfully! Pushing to remote...[/bold green]")
                subprocess.run(["git", "push"])
            else:
                console.print("[yellow]ℹ️ Note: Nothing staged to commit (working tree clean).[/yellow]")
            break
        elif user_choice == "c":
            res = subprocess.run(["git", "commit", "-m", current_commit])
            if res.returncode == 0:
                console.print("[bold green]✅ Committed locally![/bold green]")
            else:
                console.print("[yellow]ℹ️ Note: Nothing staged to commit (working tree clean).[/yellow]")
            break
        elif user_choice == "e":
            edited = Prompt.ask("\n[bold yellow]Edit commit message[/bold yellow]", default=current_commit.splitlines()[0]).strip()
            if edited:
                current_commit = edited
                console.print("\n[bold cyan]📝 Updated Commit Preview:[/bold cyan]")
                console.print(Panel(
                    Text(current_commit, style="bold green"),
                    title="[bold white]✨ Updated Conventional Commit[/bold white]",
                    border_style="cyan",
                    padding=(1, 2)
                ))
            continue
        else:
            console.print("[dim]❌ Commit cancelled.[/dim]")
            break

if __name__ == "__main__":
    app()
