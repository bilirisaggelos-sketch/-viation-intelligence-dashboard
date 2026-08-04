"""
Clusters events that look like reports of the same real-world incident
(processors/matcher.py) and stamps each event with a verification badge
(processors/verifier.py) based on how many independent sources are
reporting it - so an analyst can see "PARTIALLY VERIFIED · 2 sources"
right on the card instead of having to notice the same thing was posted
twice by two different channels.

This does NOT merge/collapse duplicate events into one - every event
from every source still shows up in the feed as its own card (that's
the "continuous stream" behavior that was asked for). It only adds
metadata to each event about what else corroborates it.
"""

from processors.matcher import is_same_incident, build_distinctive_wordset
from processors.verifier import verify_cluster


def cluster_events(events):
    """
    Groups events into same-incident clusters using complete-linkage: an
    event only joins an existing cluster if it matches EVERY member
    already in it, not just one. A naive "transitive" union (A matches B,
    B matches C, therefore A+B+C together) drifts badly on this kind of
    data - tested against the real feed, it chained a Black
    Sea/Ukraine-ports story into a completely unrelated Houthi-missile
    cluster through a couple of generic shared words, ending in one
    32-event blob that meant almost nothing. Requiring agreement with the
    whole cluster, not just its most recent member, keeps groups tight.

    Order-dependent but stable in practice since events are processed in
    the order the collectors returned them (roughly chronological per
    source); this is a heuristic, not an exact clustering algorithm.
    """

    clusters = []  # list of lists of events

    # Computed once per batch: words that are actually specific to a
    # handful of events rather than generic across the whole feed. See
    # build_distinctive_wordset() for why this matters.
    distinctive_words = build_distinctive_wordset(events)

    for event in events:

        # Official sources publish independently of each other and OSINT
        # chatter - don't let two unrelated FAA TFRs merge just because
        # they share boilerplate wording ("FAA SECURITY TFR", "Facility:").
        placed = False

        for cluster in clusters:

            if event.get("source_type") == "official" and \
               all(m.get("source_type") == "official" for m in cluster):
                continue

            if all(is_same_incident(event, member, distinctive_words=distinctive_words) for member in cluster):
                cluster.append(event)
                placed = True
                break

        if not placed:
            clusters.append([event])

    return clusters


def attach_verification(events):
    """
    Mutates and returns `events` with verification fields added to each
    event dict: verification_status, verification_confidence,
    verified_sources (list of names), verified_source_count.
    """

    if not events:
        return events

    for cluster in cluster_events(events):

        status, confidence, sources = verify_cluster(cluster)

        for event in cluster:
            event["verification_status"] = status
            event["verification_confidence"] = confidence
            event["verified_sources"] = sources
            event["verified_source_count"] = len(sources)

    return events
