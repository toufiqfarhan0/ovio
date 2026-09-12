#!/usr/bin/env python3
"""Entry point for the ovio CLI package."""
import sys
from pathlib import Path

# Add cli directory to path
cli_dir = Path(__file__).resolve().parent / "cli"
sys.path.insert(0, str(cli_dir))

from ovio import app

def main():
    app()

if __name__ == "__main__":
    main()
