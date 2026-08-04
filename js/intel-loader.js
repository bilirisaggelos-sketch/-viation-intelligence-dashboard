// =====================
// INTELLIGENCE LOADER
// =====================

async function loadIntelFeed() {

    try {

        const response =
            await fetch("data/live-intel.json?_=" + Date.now());

        if (!response.ok)
            throw new Error("Unable to load live-intel.json");

        const data =
            await response.json();

        return data.map(normalizeIntelEvent);

    }

    catch(err){

        console.error(err);

        return [];

    }

}