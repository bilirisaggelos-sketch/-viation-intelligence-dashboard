function formatDate(dateStr) {

    if (!dateStr) return "";

    if (dateStr.includes("/")) {

        const parts = dateStr.split("/");

        const d = new Date(
            parts[2],
            parts[1] - 1,
            parts[0]
        );

        return d.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    }

    const d = new Date(dateStr);

    return d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });

}

// =====================
// COUNTRY FLAGS
// =====================

// name -> ISO 3166-1 alpha-2, for the countries that actually show up in
// this dataset (CZIB / conflict zones / airport list). Falls back to a
// generic globe if a country isn't in the table rather than guessing.
const COUNTRY_ISO = {
    "Iraq": "IQ",
    "Iran": "IR",
    "Israel": "IL",
    "Libya": "LY",
    "Sudan": "SD",
    "Lebanon": "LB",
    "Syria": "SY",
    "Yemen": "YE",
    "Pakistan": "PK",
    "United Arab Emirates": "AE",
    "UAE": "AE",
    "Ukraine": "UA",
    "Egypt": "EG",
    "Jordan": "JO",
    "Saudi Arabia": "SA",
    "Qatar": "QA",
    "Oman": "OM",
    "Bahrain": "BH",
    "Kuwait": "KW",
    "Afghanistan": "AF",
    "Somalia": "SO",
    "Ethiopia": "ET",
    "Mali": "ML",
    "Niger": "NE",
    "Chad": "TD",
    "Tunisia": "TN",
    "Algeria": "DZ",
    "Morocco": "MA",
    "Turkey": "TR",
    "India": "IN",
    "Nigeria": "NG",
    "Myanmar": "MM",
    "North Korea": "KP",
    "Russia": "RU",
    "Belarus": "BY"
};

function countryFlag(countryName) {

    if (!countryName) return "\u{1F310}"; // globe fallback (a normal single emoji, renders fine everywhere)

    const iso = COUNTRY_ISO[countryName];

    if (!iso) return "\u{1F310}";

    // Windows deliberately does NOT render the two-letter "regional
    // indicator" emoji sequence as a flag picture (it shows the raw
    // letters, e.g. "SD", instead) - only macOS/iOS/Android do. To look
    // the same on every OS we use small real flag images instead of the
    // emoji flag characters.
    const code = iso.toLowerCase();

    return `<img class="flagIcon" src="https://flagcdn.com/24x18/${code}.png" `
        + `srcset="https://flagcdn.com/48x36/${code}.png 2x" `
        + `width="20" height="15" alt="${countryName}" loading="lazy">`;

}

// =====================
// TIME AGO
// =====================

function timeAgo(timestamp) {

    if (!timestamp) return "";

    const now = new Date();
    const then = new Date(timestamp);

    if (isNaN(then)) return timestamp;

    const seconds =
        Math.floor((now - then) / 1000);

    if (seconds < 60)
        return "🟢 Just now";

    const minutes =
        Math.floor(seconds / 60);

    if (minutes < 60)
        return `🟡 ${minutes} min ago`;

    const hours =
        Math.floor(minutes / 60);

    if (hours < 24)
        return `🟠 ${hours} hour${hours > 1 ? "s" : ""} ago`;

    const days =
        Math.floor(hours / 24);

    if (days === 1)
        return "⚫ Yesterday";

 return `⚫ ${days} days ago`;

}
