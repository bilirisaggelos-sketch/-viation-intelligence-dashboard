// =====================
// Aviation Intelligence Dashboard
// =====================

const APP = {

    airports: [],
    countries: [],
    czib: [],
    security: [],

    activeCountries: {},
    selectedCountry: null,
    activeTab: "all",

    settings: {
        showAirports: true,
        showFIR: true
    }

};

// =====================
// CLOCK
// =====================

function clock() {

    const now = new Date();

    const utc = document.getElementById("utcClock");
    const dateEl = document.getElementById("utcDate");

    if (utc) {
        utc.textContent =
            now.toUTCString().split(" ")[4] + " UTC";
    }

    if (dateEl) {
        dateEl.textContent =
            now.toLocaleDateString("en-GB", {
                day: "2-digit", month: "short", year: "numeric"
            });
    }

    // "Page synced X ago" - proof the 25s poll loop is actually alive,
    // independent of whether the newest article itself is old (a source
    // simply not posting anything new isn't a polling failure). Worded
    // carefully: this is NOT "nothing has happened in the world" - it's
    // only "the browser successfully re-read the data file". The
    // underlying collectors only run every 15 minutes, so a real event
    // can take up to that long to even reach this file in the first
    // place, no matter how instantly the page re-checks it.
    const checkedEl = document.getElementById("feedCheckedAt");
    if (checkedEl && window.lastFeedCheckAt) {
        checkedEl.textContent =
            "Page synced " + (typeof timeAgo === "function" ? timeAgo(window.lastFeedCheckAt.toISOString()) : "recently");
        checkedEl.title = "This only means the page re-read the data file just now - not that nothing new has happened. " +
            "The collectors that gather new intelligence run every ~15 minutes, so a real event can take up to that long to appear here at all.";
    }

    // The real fact: when the collectors themselves last actually ran
    // (from the data file's own generated_at), as opposed to "the page
    // re-read whatever file currently exists" above.
    const collectedEl = document.getElementById("feedCollectedAt");
    if (collectedEl) {
        if (window.lastCollectionAt) {
            collectedEl.textContent =
                "Data collected " + (typeof timeAgo === "function" ? timeAgo(window.lastCollectionAt.toISOString()) : "recently");
        } else {
            collectedEl.textContent = "";
        }
    }

}

setInterval(clock, 1000);
clock();

// =====================
// SIDEBAR NAV
// =====================
// Each item jumps to / filters the relevant part of the dashboard.
// "Settings" and "About" don't have a dedicated screen yet, so they
// show a small toast rather than silently doing nothing.

function showToast(message) {

    let toast = document.getElementById("appToast");

    if (!toast) {
        toast = document.createElement("div");
        toast.id = "appToast";
        document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.remove("show"), 2600);

}

function setFeedTab(tabName) {

    const tabBtn = document.querySelector(`.tab[data-tab="${tabName}"]`);

    if (!tabBtn) return;

    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    tabBtn.classList.add("active");

    APP.activeTab = tabName;
    renderIntelFeed();

}

// Scrolls to (if needed) AND flashes a highlight ring around a panel.
// Plain scrollIntoView() alone did nothing visible on a normal desktop
// screen, where every panel is already on screen at once - clicking a
// sidebar item looked completely broken even though the click handler
// was firing correctly. The flash makes the effect visible regardless
// of screen size / scroll position.
function highlightPanel(id) {

    const el = document.getElementById(id);
    if (!el) return;

    el.scrollIntoView({ behavior: "smooth", block: "center" });

    el.classList.remove("navHighlight");
    // Force reflow so re-adding the class restarts the animation even
    // if the same panel is clicked twice in a row.
    void el.offsetWidth;
    el.classList.add("navHighlight");

    setTimeout(() => el.classList.remove("navHighlight"), 1100);

}

const NAV_ACTIONS = {

    dashboard: () => {
        setFeedTab("all");
        highlightPanel("mapPanel");
    },

    intelligence: () => {
        setFeedTab("all");
        highlightPanel("sidebar");
    },

    collectors: () => {
        highlightPanel("sourceStatusPanel");
    },

    czib: () => {
        highlightPanel("czibListPanel");
    },

    notam: () => {
        setFeedTab("official");
        highlightPanel("sidebar");
    },

    weather: () => {
        setFeedTab("weather");
        highlightPanel("sidebar");
    },

    settings: () => {
        showToast("Settings screen isn't built yet — nothing to configure here so far.");
    },

    about: () => {
        showToast("Aviation Intelligence Dashboard — internal build, Aegean Airlines Security Department.");
    }

};

document.querySelectorAll(".navItem").forEach(btn => {

    btn.addEventListener("click", function () {

        document.querySelectorAll(".navItem")
            .forEach(b => b.classList.remove("active"));

        this.classList.add("active");

        const action = NAV_ACTIONS[this.dataset.panel];

        if (action) action();

    });

});

// =====================
// HEADER POPOVERS (Layers / Filters)
// =====================

function togglePopover(id) {

    const panel = document.getElementById(id);
    const allIds = ["layersPanel", "filtersPanel", "alertHistoryPanel"];
    const otherIds = allIds.filter(x => x !== id);

    otherIds.forEach(other => {
        document.getElementById(other).classList.remove("open");
    });

    panel.classList.toggle("open");

}

document.getElementById("layersBtn")
    .addEventListener("click", () => togglePopover("layersPanel"));

document.getElementById("filtersBtn")
    .addEventListener("click", () => togglePopover("filtersPanel"));

document.addEventListener("click", function (e) {

    const isInside =
        e.target.closest(".popover") ||
        e.target.closest("#layersBtn") ||
        e.target.closest("#filtersBtn") ||
        e.target.closest("#alertHistoryBtn");

    if (!isInside) {
        document.getElementById("layersPanel").classList.remove("open");
        document.getElementById("filtersPanel").classList.remove("open");
        document.getElementById("alertHistoryPanel").classList.remove("open");
    }

});

document.getElementById("czibBtn")
    .addEventListener("click", () => highlightPanel("czibListPanel"));

document.getElementById("refreshBtn")
    .addEventListener("click", () => {
        loadCZIBData();
        updateSecurityFeed();
    });

// =====================
// FEED TABS
// =====================

document.querySelectorAll(".tab").forEach(tab => {

    tab.addEventListener("click", function () {

        document.querySelectorAll(".tab")
            .forEach(t => t.classList.remove("active"));

        this.classList.add("active");

        APP.activeTab = this.dataset.tab;

        renderIntelFeed();

    });

});

// =====================
// AIRPORT LAYER
// =====================

const airportToggle =
    document.getElementById("airportToggle");

if (airportToggle) {

    airportToggle.addEventListener("change", function () {

        if (this.checked) {
            map.addLayer(airportsLayer);
        } else {
            map.removeLayer(airportsLayer);
        }

    });

}

// Note: the "FIR boundaries" toggle is intentionally disabled in the UI.
// There is currently no FIR geometry/data source wired into the app, so
// the checkbox is left visibly disabled ("soon") rather than pretending
// to do something.

// =====================
// COUNTRY / EVENT SEARCH
// =====================

const searchBox =
    document.getElementById("searchBox");

if (searchBox) {

    searchBox.addEventListener("input", function () {

        const value = this.value.trim().toLowerCase();

        if (!value || !APP.czib.length) return;

        const found =
            APP.czib.find(c => c.country.toLowerCase().startsWith(value)) ||
            APP.czib.find(c => c.country.toLowerCase().includes(value));

        if (found) {
            showCountry(found.country);
        }

    });

}

// =====================
// MAP FULLSCREEN TOGGLE
// =====================

const mapExpand = document.getElementById("mapExpand");

if (mapExpand) {

    mapExpand.addEventListener("click", function () {

        const panel = document.getElementById("mapPanel");

        if (!document.fullscreenElement) {
            panel.requestFullscreen?.();
        } else {
            document.exitFullscreen?.();
        }

        setTimeout(() => map.invalidateSize(), 250);

    });

}

// =====================
// "VIEW ALL" BUTTONS
// =====================
// These three had no click handler at all - completely dead, same class
// of bug as the sidebar nav items earlier. There's no separate "full
// list" page built for any of them, so each gets the most honest useful
// behavior available right now rather than doing nothing.

let czibShowAll = false;

document.getElementById("viewAllCZIB")?.addEventListener("click", function () {

    czibShowAll = !czibShowAll;

    this.textContent = czibShowAll ? "‹ Show Active Only" : "View All CZIB ›";

    if (window.czibData) renderCZIBList(window.czibData, czibShowAll);

});

document.getElementById("viewAllIntel")?.addEventListener("click", () => {

    setFeedTab("all");

    ["filterCritical", "filterWarning", "filterInfo"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.checked = true;
    });

    document.querySelectorAll(".sourceFilter").forEach(cb => cb.checked = true);

    renderIntelFeed();
    highlightPanel("sidebar");

});

document.getElementById("viewAllSources")?.addEventListener("click", () => {

    // Nothing is hidden/truncated in this list today - every source seen
    // in the current feed is already shown - so there's no extra state
    // to reveal. Flash it so the click still visibly does something
    // instead of silently doing nothing.
    highlightPanel("sourceStatusPanel");

});

// =====================
// INITIALIZE
// =====================

async function initializeDashboard() {

    try {

        await loadAirports();
        await loadCountries();
        await loadCZIBData();

        console.log("Dashboard initialized.");

    } catch (err) {

        console.error("Dashboard initialization failed:", err);

    }

}

initializeDashboard();
