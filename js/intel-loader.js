// =====================
// INTELLIGENCE LOADER
// =====================

async function loadIntelFeed() {

    try {

        const response =
            await fetch("data/live-intel.json?_=" + Date.now());

        if (!response.ok)
            throw new Error("Unable to load live-intel.json");

        const raw =
            await response.json();

        // New format: {"generated_at": "...", "events": [...]}.
        // Still accepts the old plain-array format too, so this doesn't
        // break on a data file that hasn't been regenerated yet.
        const isWrapped = raw && !Array.isArray(raw) && Array.isArray(raw.events);

        const data = isWrapped ? raw.events : raw;

        window.lastCollectionAt = isWrapped && raw.generated_at
            ? new Date(raw.generated_at)
            : null;

        return data.map(normalizeIntelEvent);

    }

    catch(err){

        console.error(err);

        return [];

    }

}