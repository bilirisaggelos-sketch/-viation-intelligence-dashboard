"""
Continuous collector loop for the mini PC deployment.

Unlike scripts/fetch_intel.py (one-shot, meant for GitHub Actions), this
loops forever, re-running all collectors every INTERVAL_SECONDS and
overwriting data/live-intel.json each time. Runs identically on
Windows/Linux/macOS - it's plain Python, no cron/systemd required.

Usage:
    python scripts/watch_intel.py
    python scripts/watch_intel.py --interval 60

Leave this running in a terminal (or wrap it as a background service /
systemd unit / Windows Task Scheduler entry once you've picked an OS).
The dashboard's frontend polls data/live-intel.json on its own schedule
(see js/live-poll.js), so it will pick up each new write automatically -
you don't need to refresh the browser.
"""

import argparse
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.append(str(PROJECT_ROOT))

from collectors.manager import collect_all, write_output


def run_once():

    started = time.time()

    try:
        events = collect_all()
    except Exception as e:
        print(f"[{datetime.now(timezone.utc).isoformat()}] Collection failed: {e}")
        return

    output_path = PROJECT_ROOT / "data" / "live-intel.json"

    write_output(events, output_path)

    took = time.time() - started

    print(
        f"[{datetime.now(timezone.utc).isoformat()}] "
        f"{len(events)} event(s) written ({took:.1f}s)"
    )


def main():

    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--interval", type=int, default=60,
        help="Seconds between collection runs (default: 60)"
    )
    args = parser.parse_args()

    print(f"Watching intelligence sources every {args.interval}s. Ctrl+C to stop.")

    while True:

        run_once()

        try:
            time.sleep(args.interval)
        except KeyboardInterrupt:
            print("\nStopped.")
            break


if __name__ == "__main__":
    main()
