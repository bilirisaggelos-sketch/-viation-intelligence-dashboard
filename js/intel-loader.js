// =====================
// INTELLIGENCE LOADER
// =====================

async function loadIntelFeed() {

    const source =
        INTEL_SOURCES.find(s => s.enabled);

    if (!source)
        return [];

    const response =
        await fetch(source.url);

    const data =
        await response.json();

    return data.map(normalizeIntelEvent);

}
