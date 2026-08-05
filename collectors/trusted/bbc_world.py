"""
BBC World News RSS - used as a substitute for "Reuters".

Reuters does not currently publish a reliable official public RSS feed
(their own RSS page just links to a generic explainer, and reuters.com
world-news RSS URLs that used to work have been discontinued/consolidated
away - see the various "unofficial Reuters RSS generator" services that
exist specifically because of this). Rather than hardcode a URL likely to
break, BBC World is used instead: a comparably reputable wire/broadcast
source with a confirmed, stable, official RSS feed.

If you get/find a working official Reuters feed later, just change
RSS_URL and PUBLISHER/SOURCE below - the rest of the collector is generic.
"""

from collectors.trusted.rss_helper import rss_to_events

RSS_URL = "https://feeds.bbci.co.uk/news/world/rss.xml"


def collect():

    return rss_to_events(
        url=RSS_URL,
        publisher="BBC World News",
        source="BBC",
        severity="info",
        icon="\U0001F4F0",
        source_type="osint",
    )
