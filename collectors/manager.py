import json
import asyncio
import importlib
import traceback
from pathlib import Path

from processors.pipeline import process

# Project root, regardless of the current working directory the script is
# launched from. Previously this module opened "config/sources.json" and
# "data/live-intel.json" as plain relative paths, which only worked if you
# happened to run the script from the project's root folder — running
# `python scripts/fetch_intel.py` from anywhere else raised
# FileNotFoundError. Resolving everything against PROJECT_ROOT fixes that.
PROJECT_ROOT = Path(__file__).resolve().parent.parent


def load_sources():

    path = PROJECT_ROOT / "config" / "sources.json"

    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def _run_collector(category, module_path, module_name, is_async):
    """
    Runs a single collector and NEVER lets it take the rest of the batch
    down with it. Previously only ModuleNotFoundError was caught here —
    any other failure (a network timeout, an HTML layout change breaking
    a scraper, a bad API response) propagated all the way up and aborted
    collect_all() entirely, silently discarding every other source that
    would otherwise have collected fine in that same run. For a box meant
    to run unattended 24/7, one flaky source shouldn't blank the whole
    dashboard.
    """

    try:

        module = importlib.import_module(module_path)

        if is_async:
            return asyncio.run(module.collect())

        return module.collect()

    except ModuleNotFoundError:

        print(f"{category} collector missing: {module_name}")
        return []

    except Exception as e:

        print(f"{category} collector '{module_name}' failed: {e}")
        traceback.print_exc()
        return []


def collect_all():

    config = load_sources()

    events = []

    # -----------------------
    # OFFICIAL
    # -----------------------

    for source in config["official"]:

        if not source["enabled"]:
            continue

        module_name = source["name"].lower()

        events.extend(_run_collector(
            "Official", f"collectors.official.{module_name}", module_name, is_async=False
        ))

    # -----------------------
    # TRUSTED
    # -----------------------

    for source in config.get("trusted", []):

        if not source["enabled"]:
            continue

        module_name = source.get(
            "module",
            source["name"].lower().replace(" ", "_")
        )

        events.extend(_run_collector(
            "Trusted", f"collectors.trusted.{module_name}", module_name, is_async=False
        ))

    # -----------------------
    # TELEGRAM / OSINT
    # -----------------------

    for source in config.get("osint", []):

        if not source["enabled"]:
            continue

        module_name = source.get(
            "module",
            source["name"].lower().replace(" ", "_")
        )

        events.extend(_run_collector(
            "Telegram", f"collectors.telegram.{module_name}", module_name, is_async=True
        ))

    # -----------------------
    # INSTAGRAM
    # -----------------------

    for source in config.get("instagram", []):

        if not source["enabled"]:
            continue

        module_name = source.get(
            "module",
            source["name"].lower().replace(" ", "_")
        )

        # Instagram collectors are synchronous (instaloader has no async
        # API), unlike the Telegram ones above.
        events.extend(_run_collector(
            "Instagram", f"collectors.instagram.{module_name}", module_name, is_async=False
        ))

    return process(events)


def write_output(events, output_path):
    """
    Writes events to output_path wrapped with a generated_at timestamp,
    e.g. {"generated_at": "2026-08-05T10:00:00+00:00", "events": [...]}.

    This is what lets the dashboard show "data collected X ago" as a
    real fact about when the collectors actually ran, separate from
    "page synced X ago" (which only proves the browser re-read whatever
    file currently exists - it could be re-reading the exact same stale
    file over and over and still say "just now").
    """

    from datetime import datetime, timezone

    payload = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "events": events,
    }

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)
