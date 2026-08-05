"""
Middle East Eye. Independent media bias checkers (Media Bias/Fact Check,
AllSides, Ground News) rate it Left/Left-Center leaning but "Mostly
Factual" to "High" factuality - i.e. a real editorial slant in framing
and story selection, but not generally considered fabricating events.

Left disabled by default in config/sources.json - the framing bias is
worth knowing about before you decide to include it, especially for
something feeding security decisions. Whether an event actually happened
is still useful signal regardless of how it's editorially framed, and it
adds another independent voice for the dedup/verification system to
cross-check against.
"""

from collectors.trusted.rss_helper import rss_to_events

RSS_URL = "https://www.middleeasteye.net/rss"


def collect():

    return rss_to_events(
        url=RSS_URL,
        publisher="Middle East Eye",
        source="Middle East Eye",
        severity="info",
        icon="\U0001F4F0",
        source_type="osint",
    )
