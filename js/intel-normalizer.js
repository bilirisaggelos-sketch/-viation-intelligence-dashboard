// =====================
// INTELLIGENCE NORMALIZER
// =====================

function normalizeIntelEvent(raw) {

    return {

        // Stable ID
        id: raw.id || crypto.randomUUID(),

        // Main text
        text: raw.text || raw.title || "",

        // Source
        source: raw.source || "Unknown",

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
