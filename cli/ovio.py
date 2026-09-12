#!/usr/bin/env python3
"""
ovio — Voice Git & Codebase Dictation Engine
Powered by AssemblyAI Dictation API (Universal-3.5 Pro)
"""

import os
import sys
import json
import re
import subprocess
import argparse
from pathlib import Path

# Load .env if present
def load_env():
    env_path = Path(".env")
    if not env_path.exists():
        env_path = Path(__file__).resolve().parent.parent / ".env"
    if env_path.exists():
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))

load_env()
API_KEY = os.environ.get("ASSEMBLYAI_API_KEY")

def get_git_context():
    """Extracts branch, changed files, and code symbols for keyterms_prompt biasing."""
    try:
        branch = subprocess.check_output(["git", "branch", "--show-current"], text=True, stderr=subprocess.DEVNULL).strip()
    except Exception:
        branch = "main"

    try:
        status_out = subprocess.check_output(["git", "status", "-s"], text=True, stderr=subprocess.DEVNULL)
        staged_files = [line.strip().split()[-1] for line in status_out.splitlines() if line.strip()]
    except Exception:
        staged_files = []

    try:
        diff_out = subprocess.check_output(["git", "diff", "--staged"], text=True, stderr=subprocess.DEVNULL)
        if not diff_out:
            diff_out = subprocess.check_output(["git", "diff", "HEAD"], text=True, stderr=subprocess.DEVNULL)
    except Exception:
        diff_out = ""

    # Extract function, class, variable declarations from git diff
    symbols = re.findall(r'(?:def|class|function|const|let|var)\s+([a-zA-Z0-9_]+)', diff_out)
    files_clean = [Path(f).name for f in staged_files]
    
    keyterms = list(dict.fromkeys(files_clean + symbols + ["ovio", "DictationTranscriber"]))[:30]
    
    return {
        "branch": branch or "main",
        "staged_files": staged_files,
        "keyterms": keyterms or ["ovio", "ConventionalCommit"],
        "stt_prompt": f"A developer dictating git commits for branch '{branch}'. Changed files: {', '.join(files_clean[:5])}."
    }

def record_microphone(duration=10, sample_rate=16000, output_path="ovio_input.wav"):
    """Records PCM audio from default microphone using sounddevice."""
    try:
        import sounddevice as sd
        import scipy.io.wavfile as wav
    except ImportError:
        print("\n[!] Recording dependencies missing. Install via:")
        print("    pip install sounddevice scipy\n")
        sys.exit(1)

    print("\n" + "═" * 56)
    print(" 🎙️  OVIO LISTENING (Speak your changes naturally)")
    print(f"    Press Ctrl+C when finished (or auto-stops at {duration}s)...")
    print("═" * 56)

    try:
        audio = sd.rec(int(duration * sample_rate), samplerate=sample_rate, channels=1, dtype='int16')
        sd.wait()
    except KeyboardInterrupt:
        sd.stop()
        print("\n  [✓] Audio capture completed.")

    wav.write(output_path, sample_rate, audio)
    return output_path

def transcribe_with_dictation_api(audio_path, context):
    """Calls AssemblyAI Dictation API with context-biasing and Conventional Commit rewrite."""
    import requests

    if not API_KEY:
        print("[!] Error: ASSEMBLYAI_API_KEY is not set in environment or .env file.")
        sys.exit(1)

    config = {
        "sample_rate": 16000,
        "channels": 1,
        "stt_prompt": context["stt_prompt"],
        "keyterms_prompt": context["keyterms"],
        "llm_instruction": (
            "Remove filler words, false starts, and hesitation. "
            "Rewrite into a crisp Conventional Commit in the exact format: "
            "'<type>(<scope>): <subject>' followed by 1-3 bullet points describing changes. "
            "Keep technical symbols and variable names verbatim."
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

    print("\n⚡ Uploading to AssemblyAI Dictation API (Universal-3.5 Pro)...")
    response = requests.post(url, headers=headers, files=files, timeout=45)
    
    if not response.ok:
        print(f"[!] API Error {response.status_code}: {response.text}")
        sys.exit(1)

    return response.json()

def main():
    parser = argparse.ArgumentParser(description="ovio — Voice Git & Codebase Dictation Engine")
    parser.add_argument("--file", "-f", help="Path to existing WAV audio file (optional)")
    parser.add_argument("--auto-commit", "-y", action="store_true", help="Automatically commit without confirmation")
    args = parser.parse_args()

    print("\n┌────────────────────────────────────────────────────────┐")
    print("│  OVIO — Voice Git & Codebase Dictation Engine          │")
    print("│  Universal-3.5 Pro · Sub-second Latency                │")
    print("└────────────────────────────────────────────────────────┘")

    context = get_git_context()
    print(f"\n[git] Branch: {context['branch']}")
    print(f"[git] Keyterms biased ({len(context['keyterms'])}): {', '.join(context['keyterms'][:6])}...")

    if args.file and Path(args.file).exists():
        audio_file = args.file
    else:
        audio_file = record_microphone()

    result = transcribe_with_dictation_api(audio_file, context)

    verbatim = result.get("text", "")
    commit_msg = result.get("llm_response") or verbatim
    latency = result.get("request_time_ms", 0)

    print("\n" + "─" * 56)
    print(f"⚡ Turnaround: {latency}ms")
    print("─" * 56)
    print("🗣️  VERBATIM INPUT:")
    print(f'   "{verbatim}"')
    print("\n✨ GENERATED CONVENTIONAL COMMIT:")
    print("   " + "\n   ".join(commit_msg.splitlines()))
    print("─" * 56)

    if args.auto_commit:
        subprocess.run(["git", "commit", "-m", commit_msg])
        print("✅ Git commit created successfully.")
    else:
        choice = input("\n[Enter: Commit | p: Commit & Push | e: Edit | Esc/n: Cancel]: ").strip().lower()
        if choice in ["", "y"]:
            subprocess.run(["git", "commit", "-m", commit_msg])
            print("✅ Git commit created successfully.")
        elif choice == "p":
            subprocess.run(["git", "commit", "-m", commit_msg])
            subprocess.run(["git", "push"])
            print("🚀 Committed and pushed to remote!")
        else:
            print("❌ Aborted.")

if __name__ == "__main__":
    main()
