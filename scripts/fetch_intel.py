import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.append(str(PROJECT_ROOT))

from collectors.manager import collect_all, write_output


def main():

    events = collect_all()

    output_path = PROJECT_ROOT / "data" / "live-intel.json"

    write_output(events, output_path)

    print(f"{len(events)} event(s) written.")


if __name__ == "__main__":
    main()