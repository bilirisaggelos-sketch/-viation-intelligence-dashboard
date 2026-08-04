"""
Lightweight, dependency-free "same real-world incident?" matcher.

Two events are considered the same incident if their text is similar
enough AND they were published within a short time window of each other.
No ML/embeddings involved (matches this project's "stay lightweight, no
backend" principle) - just stemmed keyword overlap + timing. See
processors/dedup.py for how this is used to build verification badges.

Calibration note: this was tuned against real event pairs pulled from
data/live-intel.json - both genuine duplicates (two channels reporting
the same Houthi missile launch, worded completely differently) and
near-misses (two unrelated posts from a boilerplate-heavy channel that
shared several generic words purely because both were long). Plain
Jaccard couldn't separate those cases well since it penalizes longer
texts for their own length; the overlap coefficient (shared / smaller
side) below scored real duplicates around 0.55-0.65 and unrelated pairs
around 0.1-0.2 on the same data, which is what MIN_OVERLAP is set from.
This will reliably catch duplicates that share concrete nouns, numbers,
or places, but will still miss some heavily paraphrased reports with
close to zero lexical overlap - a proper fix for that would need
sentence embeddings, which is a reasonable future upgrade (could ride
along with the "AI-assisted summaries" roadmap item) but is out of scope
for this lightweight pass.
"""

import re
from datetime import datetime

STOPWORDS = {
    "the", "a", "an", "of", "in", "on", "at", "to", "for", "and", "or",
    "with", "is", "are", "was", "were", "by", "has", "have", "had",
    "that", "this", "it", "its", "as", "from", "into", "after", "before",
    "new", "breaking", "exclusive", "watch", "least", "reportedly", "amid",
    "said", "says", "according", "over", "than", "more", "been", "will",

    # Generic OSINT/military-reporting vocabulary. These show up across
    # almost every post in a conflict-monitoring feed regardless of which
    # specific incident it's about, so they don't help identify "is this
    # the SAME incident" - and on a small batch (tens of events, not
    # thousands), plain document-frequency isn't reliable enough on its
    # own to filter them out (see build_distinctive_wordset): a generic
    # word used in just 3-4 of 55 posts still looks statistically "rare"
    # even though it's not actually incident-specific. Found by testing:
    # "airbase"/"forces"/"armed"/"drone" alone were enough to falsely
    # match an Abha-airbase story with an unrelated Ukraine-ports story.
    "military", "forces", "force", "armed", "attack", "attacks",
    "attacked", "strike", "strikes", "struck", "war", "conflict",
    "region", "report", "reports", "reported", "unconfirmed", "targeted",
    "target", "targets", "drone", "drones", "missile", "missiles",
    "launched", "launch", "operation", "operations", "personnel",
    "officials", "sources", "footage", "video", "situation", "incident",
    "confirmed", "claims", "claimed", "impact", "impacted",
}

MIN_OVERLAP = 0.40
MIN_SHARED_WORDS = 3
DEFAULT_WINDOW_HOURS = 6


def _stem(word):

    for suffix in ("ies", "ing", "ed", "es", "s"):
        if word.endswith(suffix) and len(word) - len(suffix) >= 3:
            return word[: -len(suffix)]

    return word


def significant_words(text):

    if not text:
        return set()

    # Strip URLs first - several collectors (e.g. "Our Wars Today") embed
    # markdown links like "[headline](https://...)". Left in, the shared
    # boilerplate ("https", "www", domain fragments) was enough to falsely
    # match otherwise-unrelated headlines that just happened to both have
    # a link in them.
    text = re.sub(r"https?://\S+", " ", text)

    text = text.lower()
    text = re.sub(r"[^\w\s]", " ", text)

    return {
        _stem(w) for w in text.split()
        if len(w) > 2 and w not in STOPWORDS
    }


def _parse_time(value):

    if not value:
        return None

    for fmt in (None, "%m/%d/%Y"):
        try:
            return datetime.fromisoformat(value) if fmt is None \
                else datetime.strptime(value, fmt)
        except (ValueError, TypeError):
            continue

    return None


def text_similarity(text1, text2, distinctive_words=None):
    """
    Overlap coefficient (|shared| / min(|A|, |B|)) over stemmed
    significant words, 0.0-1.0, plus the raw shared-word count.

    Using the smaller set as the denominator (instead of plain Jaccard,
    which divides by the union) matters here because collectors don't
    all produce similarly-sized text: some post a one-line summary,
    others (e.g. "Our Wars Today") post a full scraped article body plus
    a repeated channel signature/footer. Against real data, Jaccard let
    two long, boilerplate-heavy, but topically unrelated posts from the
    same channel score as "similar" purely because a long text has more
    chances to accidentally share ~5 generic words with anything.

    `distinctive_words`, if given (see build_distinctive_wordset below),
    restricts what counts as a "shared" word to ones that aren't generic
    across the whole batch. Without it, two posts that are both simply
    about "Saudi Arabia" and "missiles" - true of a large fraction of a
    Middle-East-conflict OSINT feed on any given day - could rack up 4+
    shared words and look like a specific-incident match even when
    they're about entirely different events. Restricting to words that
    are actually rare in this batch (e.g. "Abha", "Khalid", "Hormuz")
    fixed a real false-positive found while testing against the feed.
    """

    w1, w2 = significant_words(text1), significant_words(text2)

    if not w1 or not w2:
        return 0.0, 0

    if distinctive_words is not None:
        w1 = w1 & distinctive_words
        w2 = w2 & distinctive_words

        if not w1 or not w2:
            return 0.0, 0

    shared = w1 & w2

    return len(shared) / min(len(w1), len(w2)), len(shared)


def build_distinctive_wordset(events, max_doc_freq_ratio=0.15):
    """
    Returns the set of stemmed words that appear in at most
    `max_doc_freq_ratio` of the given events - i.e. words specific
    enough to actually identify one incident rather than the general
    topic of the whole batch. Compute this once per collection run and
    pass it into text_similarity()/is_same_incident() for every pairwise
    comparison in that run.
    """

    if not events:
        return set()

    doc_count = {}

    for event in events:
        for word in significant_words(event.get("text", "")):
            doc_count[word] = doc_count.get(word, 0) + 1

    n = len(events)

    return {
        word for word, count in doc_count.items()
        if (count / n) <= max_doc_freq_ratio
    }


def is_same_incident(event1, event2, window_hours=DEFAULT_WINDOW_HOURS, distinctive_words=None):
    """
    True if event1/event2 are plausibly reports of the same real-world
    incident. Works on the plain dicts produced by the collectors (NOT
    Event objects - the earlier version of this function assumed
    Event-style attribute access and exact title equality, which broke
    two ways: manager.py has always passed plain dicts here, so
    event.title would have raised AttributeError immediately if this
    had ever actually been called; and even fixed to dict access, every
    Telegram collector hardcodes title="Telegram" for every message
    regardless of content, so exact-title matching would have grouped
    every Telegram message together instead of finding real duplicates.
    """

    jaccard, shared_count = text_similarity(
        event1.get("text", ""), event2.get("text", ""), distinctive_words
    )

    if jaccard < MIN_OVERLAP or shared_count < MIN_SHARED_WORDS:
        return False

    t1 = _parse_time(event1.get("timestamp"))
    t2 = _parse_time(event2.get("timestamp"))

    if t1 is None or t2 is None:
        # Can't confirm timing - be conservative and require the text
        # match to be a strong one on its own.
        return jaccard >= 0.55

    # Normalize both to naive UTC for a safe subtraction even if only one
    # side has a timezone offset.
    t1 = t1.replace(tzinfo=None)
    t2 = t2.replace(tzinfo=None)

    delta_hours = abs((t1 - t2).total_seconds()) / 3600

    return delta_hours <= window_hours
