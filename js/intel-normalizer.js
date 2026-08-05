// =====================
// INTELLIGENCE NORMALIZER
// =====================

function normalizeIntelEvent(raw) {

    return {

        // Stable ID. Collectors generally don't set raw.id, so we derive
        // one deterministically from content that doesn't change between
        // polls (source + timestamp + start of text). This matters a lot
        // for live polling: crypto.randomUUID() would mint a *new* id for
        // the same event on every refresh, making every event look "new"
        // and firing a notification for the entire feed every 25s.
        id: raw.id || stableEventId(raw),

        // Main text
        text: raw.text || raw.title || "",

        // Source
        source: raw.source || "Unknown",

        // Source category: official | telegram | instagram | weather ...
        // Used to drive feed tabs and badge colors in the UI.
        source_type: raw.source_type || "osint",

        // Publisher
        publisher: raw.publisher || raw.channel || "",

        // Severity
        severity: raw.severity || "info",

        // Icon
        icon: raw.icon || "ℹ️",

        // Time
        timestamp: raw.timestamp || raw.time || "",

        // Location
        location: raw.location || raw.country || "",

        // Coordinates
        lat: raw.lat || null,
        lon: raw.lon || null,

        // Original event
        raw: raw

    };

}

// Small deterministic string hash (djb2). Not cryptographic - just needs
// to be stable and cheap so the same source+timestamp+text always maps
// to the same id across polls.
function stableEventId(raw) {

    const basis =
        (raw.source || "") + "|" +
        (raw.timestamp || raw.time || "") + "|" +
        (raw.text || raw.title || "").slice(0, 80);

    let hash = 5381;

    for (let i = 0; i < basis.length; i++) {
        hash = ((hash << 5) + hash) + basis.charCodeAt(i);
        hash = hash & hash; // keep it 32-bit
    }

    return "e" + Math.abs(hash);

}
