import requests

URL = "https://services.swpc.noaa.gov/products/alerts.json"


def collect():

    print("Downloading NOAA alerts...")

    response = requests.get(URL, timeout=20)
    response.raise_for_status()

    data = response.json()

    events = []

    for item in data[:5]:

        events.append({

            "title": item.get("message", "").split("\n")[0],

            "text": item.get("message", ""),

            "source": "NOAA Space Weather",

            "source_type": "official",

            "publisher": "NOAA Space Weather Prediction Center",

            "severity": "warning",

            "icon": "🛰️",

            "timestamp": item.get("issue_datetime", ""),

            "location": "Global",

            "lat": None,

            "lon": None

        })

    print(f"NOAA events: {len(events)}")

    return events


if __name__ == "__main__":

    print(collect())