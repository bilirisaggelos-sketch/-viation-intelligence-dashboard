// =====================
// INTELLIGENCE NORMALIZER
// =====================

function normalizeIntelEvent(raw){

    return {

        id: crypto.randomUUID(),

        title: raw.text,

        source: raw.source,

        severity: raw.severity,

        icon: raw.icon,

        timestamp: raw.time,

        location: raw.country || "",

        lat: raw.lat,

        lon: raw.lon

    };

}
