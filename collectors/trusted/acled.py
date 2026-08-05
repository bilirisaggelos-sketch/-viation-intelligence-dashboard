"""
ACLED (Armed Conflict Location & Event Data Project).

ACLED migrated their API from static API keys to OAuth (email+password
-> short-lived access token) - the old key-based system was retired
after a transition window that ended in September 2025. This collector
uses the current OAuth flow.

Setup (free):
  1. Register at https://acleddata.com/register (an organizational email
     gets you better access limits than a personal one).
  2. Add to .env:
       ACLED_USERNAME=the_email_you_registered_with
       ACLED_PASSWORD=your_acled_password
  3. Enable it in config/sources.json.

No long-lived key to store - this collector requests a fresh access
token (valid 24h) on every run using your username/password, which is
ACLED's own documented approach for scripted/API access.
"""

import os
import requests
from datetime import datetime, timedelta, timezone

from dotenv import load_dotenv

load_dotenv()

TOKEN_URL = "https://acleddata.com/oauth/token"
DATA_URL = "https://acleddata.com/api/acled/read"

# Countries this dashboard already tracks via CZIB/conflict-zone data -
# keeps the ACLED query focused instead of pulling ACLED's entire global
# dataset (which is large and mostly not aviation-relevant).
COUNTRIES = [
    "Iraq", "Iran", "Israel", "Syria", "Lebanon", "Yemen", "Libya",
    "Sudan", "Pakistan", "Ukraine",
]


def get_access_token(username, password):

    response = requests.post(
        TOKEN_URL,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        data={
            "username": username,
            "password": password,
            "grant_type": "password",
            "client_id": "acled",
            "scope": "authenticated",
        },
        timeout=20,
    )

    response.raise_for_status()

    return response.json()["access_token"]


def collect():

    username = os.getenv("ACLED_USERNAME")
    password = os.getenv("ACLED_PASSWORD")

    if not username or not password:
        print("ACLED skipped: ACLED_USERNAME / ACLED_PASSWORD not set in .env")
        return []

    events = []

    try:

        token = get_access_token(username, password)

        since = (datetime.now(timezone.utc) - timedelta(days=3)).strftime("%Y-%m-%d")

        response = requests.get(
            DATA_URL,
            headers={"Authorization": f"Bearer {token}"},
            params={
                "event_date": since,
                "event_date_where": ">=",
                "country": "|".join(COUNTRIES),
                "country_where": "OR",
                "limit": 50,
            },
            timeout=30,
        )

        response.raise_for_status()

        data = response.json().get("data", [])

        for item in data:

            events.append({
                "title": item.get("event_type", "ACLED Event"),
                "text": item.get("notes", "") or item.get("event_type", ""),
                "source": "ACLED",
                "source_type": "osint",
                "publisher": "ACLED",
                "severity": "warning",
                "icon": "\U0001F4CD",
                "timestamp": item.get("event_date", ""),
                "location": f"{item.get('location', '')}, {item.get('country', '')}".strip(", "),
                "lat": float(item["latitude"]) if item.get("latitude") else None,
                "lon": float(item["longitude"]) if item.get("longitude") else None,
            })

    except Exception as e:
        print("ACLED error:", e)

    print(f"ACLED events: {len(events)}")

    return events
