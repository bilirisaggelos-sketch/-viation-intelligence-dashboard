import requests
from datetime import datetime, timedelta, timezone

PAGE_URL = "https://tfr.faa.gov/tfr3/export/json"
API_URL = "https://tfr.faa.gov/tfrapi/exportTfrList"

MAX_DAYS = 10


def collect():

    print("Downloading FAA TFR feed...")

    session = requests.Session()

    session.headers.update({
        "User-Agent": "Mozilla/5.0"
    })

    session.get(PAGE_URL, timeout=30)

    response = session.get(API_URL, timeout=30)

    response.raise_for_status()

    data = response.json()

    cutoff = datetime.now(timezone.utc) - timedelta(days=MAX_DAYS)

    events = []

    for item in data:

        if item.get("type") != "SECURITY":
            continue

        date = item.get("creation_date", "")

        try:
            event_date = datetime.strptime(
                date,
                "%m/%d/%Y"
            ).replace(tzinfo=timezone.utc)

        except Exception:
            continue

        if event_date < cutoff:
            continue

        facility = item.get("facility", "")
        state = item.get("state", "")
        description = item.get("description", "")

        text = (
            f"FAA SECURITY TFR\n"
            f"{description}\n"
            f"Facility: {facility}"
        )

        events.append({

            "title": "FAA SECURITY",

            "text": text,

            "source": "FAA",

            "source_type": "official",

            "publisher": "Federal Aviation Administration",

            "severity": "critical",

            "icon": "🚨",

            "timestamp": date,

            "location": f"{facility} {state}".strip(),

            "lat": None,

            "lon": None

        })

    print(f"FAA SECURITY events: {len(events)}")

    return events


if __name__ == "__main__":

    result = collect()

    print(result[:5])