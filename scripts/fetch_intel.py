import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.append(str(PROJECT_ROOT))

import json

from collectors.manager import collect_all


def main():

    events = collect_all()

    output_path = PROJECT_ROOT / "data" / "live-intel.json"

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(events, f, indent=2)

    print(f"{len(events)} event(s) written.")


if __name__ == "__main__":
    main()