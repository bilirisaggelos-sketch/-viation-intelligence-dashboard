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

    // "Feed checked X ago" - proof the 25s poll loop is actually alive,
    // independent of whether the newest article itself is old (a source
    // simply not posting anything new isn't a polling failure).
    const checkedEl = document.getElementById("feedCheckedAt");
    if (checkedEl && window.lastFeedCheckAt) {
        checkedEl.textContent =
            "Checked " + (typeof timeAgo === "function" ? timeAgo(window.lastFeedCheckAt.toISOString()) : "recently");
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
