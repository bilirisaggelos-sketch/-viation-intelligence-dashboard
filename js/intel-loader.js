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

    let data =
        await response.json();

    // Fallback στο demo feed
    if (!data.length) {

        const backup =
            await fetch("data/security-feed.json");

        data =
            await backup.json();

    }

    return data.map(normalizeIntelEvent);

}
