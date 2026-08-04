"""
Turns a cluster of same-incident events (from processors/dedup.py) into a
verification status - the "2nd/3rd source = verified" feature.

Previously this worked on Event *objects* (event.source) while every
real caller in the pipeline only ever had plain dicts, so calling this
as originally written would have raised AttributeError immediately. It
also was never actually wired into processors/pipeline.py at all -
dedup.py is what connects it now.
"""

OFFICIAL_SOURCES = {
    "EASA", "UKMTO", "FAA", "ICAO", "Eurocontrol",
    "NOAA Space Weather",
}


def verify_cluster(events):
    """
    events: list of event dicts that processors/matcher.py decided are
    reports of the same incident.

    Returns (status, confidence, distinct_sources):
        status      - "OFFICIAL" | "VERIFIED" | "PARTIALLY VERIFIED" | "UNVERIFIED"
        confidence  - 0-100
        distinct_sources - sorted list of publisher/source names in the cluster
    """

    names = set()

    for event in events:
        names.add(event.get("publisher") or event.get("source") or "Unknown")

    sources = {event.get("source", "") for event in events}

    if sources & OFFICIAL_SOURCES:
        status, confidence = "OFFICIAL", 100

    elif len(names) >= 3:
        status, confidence = "VERIFIED", 90

    elif len(names) == 2:
        status, confidence = "PARTIALLY VERIFIED", 65

    else:
        status, confidence = "UNVERIFIED", 30

    return status, confidence, sorted(names)
