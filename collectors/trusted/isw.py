"""
Institute for the Study of War (ISW). Confirmed working public RSS feed
(no registration needed): https://www.understandingwar.org/rss.xml
"""

from collectors.trusted.rss_helper import rss_to_events

RSS_URL = "https://www.understandingwar.org/rss.xml"


def collect():

    return rss_to_events(
        url=RSS_URL,
        publisher="Institute for the Study of War",
        source="ISW",
        severity="info",
        icon="\U0001F4CA",
        source_type="osint",
    )
