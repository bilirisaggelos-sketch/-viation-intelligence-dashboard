import json
from datetime import datetime, timezone

event = [
    {
        "title": "GitHub Collector Test",
        "text": "This event was generated automatically by GitHub Actions.",
        "source": "GitHub Collector",
        "severity": "info",
        "icon": "🛰️",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "location": "Athens",
        "lat": 37.9838,
        "lon": 23.7275
    }
]

with open("data/live-intel.json", "w", encoding="utf-8") as f:
    json.dump(event, f, indent=2)

print("live-intel.json updated")
