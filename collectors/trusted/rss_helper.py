"""
Shared helper for the simple RSS-based collectors (ISW, BBC World, Middle
East Eye, ...). Uses only the Python standard library (requests +
xml.etree) rather than adding a feedparser dependency, to stay in line
with this project's "stay lightweight" principle.
"""

import requests
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from xml.etree import ElementTree


def fetch_rss_items(url, limit=15, timeout=20):
    """
    Fetches an RSS 2.0 feed and returns a list of
    {title, link, description, published} dicts, most recent first
    (assumes the feed itself is already in that order, which is the RSS
    convention almost every publisher follows).
    """

    response = requests.get(
        url,
        timeout=timeout,
        headers={"User-Agent": "Mozilla/5.0 (compatible; AviationIntelBot/1.0)"}
    )
    response.raise_for_status()

    root = ElementTree.fromstring(response.content)

    items = []

    for item in root.findall(".//item")[:limit]:

        title = (item.findtext("title") or "").strip()
        link = (item.findtext("link") or "").strip()
        description = (item.findtext("description") or "").strip()
        pub_date_raw = item.findtext("pubDate")

        published = None

        if pub_date_raw:
            try:
                published = parsedate_to_datetime(pub_date_raw)
                if published.tzinfo is None:
                    published = published.replace(tzinfo=timezone.utc)
            except (ValueError, TypeError):
                published = None

        items.append({
            "title": title,
            "link": link,
            "description": description,
            "published": published or datetime.now(timezone.utc),
        })

    return items


def rss_to_events(url, publisher, source, severity="info", icon="\U0001F4F0",
                   location="Global", limit=15, source_type="osint"):
    """
    Fetches an RSS feed and normalizes it straight into this project's
    event dict shape, ready to be returned from a collector's collect().
    """

    events = []

    try:

        for item in fetch_rss_items(url, limit=limit):

            text = item["title"]
            if item["description"] and item["description"] != item["title"]:
                text = f"{item['title']}\n{item['description']}"

            events.append({
                "title": item["title"],
                "text": text,
                "source": source,
                "source_type": source_type,
                "publisher": publisher,
                "severity": severity,
                "icon": icon,
                "timestamp": item["published"].isoformat(),
                "location": location,
                "lat": None,
                "lon": None,
            })

    except Exception as e:
        print(f"{publisher} (RSS) error:", e)

    print(f"{publisher} (RSS) events: {len(events)}")

    return events
