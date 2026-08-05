// =====================
// SECURITY / INTELLIGENCE FEED
// =====================

window.intelData = [];
window.intelDataAll = [];

const SOURCE_BADGE = {
    official: "badge-official",
    telegram: "badge-telegram",
    osint: "badge-osint",
    instagram: "badge-instagram",
    weather: "badge-weather"
};

function badgeClassFor(item) {

    if ((item.source || "").toLowerCase().includes("weather")) {
        return "badge-weather";
    }

    return SOURCE_BADGE[item.source_type] || "badge-osint";

}

function badgeLabelFor(item) {

    if ((item.source || "").toLowerCase().includes("weather")) {
        return "WEATHER";
    }

    const labels = {
        official: "OFFICIAL",
        telegram: "OSINT",
        osint: "OSINT",
        instagram: "INSTAGRAM"
    };

    return labels[item.source_type] || (item.source_type || "").toUpperCase();

}

function verificationBadge(item) {

    const status = item.verification_status;

    // "OFFICIAL" status is redundant with the existing source badge
    // (badgeLabelFor already shows "OFFICIAL" for FAA/NOAA/etc. items),
    // so only show this badge for cross-source OSINT corroboration.
    if (!status || status === "UNVERIFIED" || status === "OFFICIAL") return "";

    const styles = {
        "VERIFIED": { cls: "verify-verified", label: `\u2714 VERIFIED \u00B7 ${item.verified_source_count} sources` },
        "PARTIALLY VERIFIED": { cls: "verify-partial", label: "\u2713 2 SOURCES" }
    };

    const s = styles[status];
    if (!s) return "";

    const sourcesTitle = item.verified_sources?.length
        ? `Reported by: ${item.verified_sources.join(", ")}`
        : "";

    return `<span class="verifyBadge ${s.cls}" title="${sourcesTitle}">${s.label}</span>`;

}

function matchesTab(item, tab) {

    if (tab === "all") return true;

    if (tab === "critical") return item.severity === "critical";

    if (tab === "weather") {
        return (item.source || "").toLowerCase().includes("weather");
    }

    if (tab === "official") return item.source_type === "official"
        && !(item.source || "").toLowerCase().includes("weather");

    if (tab === "telegram") return item.source_type === "telegram" || item.source_type === "osint";

    if (tab === "instagram") return item.source_type === "instagram";

    return true;

}

// =====================
// INTEL FEED REFRESH
// =====================

function updateSecurityFeed() {

    loadIntelFeed()

        .then(feedData => {

            window.intelDataAll = feedData;

            if (typeof detectAndAlertNewEvents === "function") {
                detectAndAlertNewEvents(feedData);
            }

            buildSourceFilters(feedData);
            updateRiskOverview();
            renderIntelFeed();
            renderSourceStatus(feedData);

        })

        .catch(err => {

            console.error(err);

            document.getElementById("intelFeed").innerHTML =
                "<div class='card'>Feed unavailable</div>";

        });

}

// =====================
// SOURCE FILTER CHECKBOXES (Filters popover)
// =====================

function buildSourceFilters(feedData) {

    const filtersDiv = document.getElementById("sourceFilters");

    if (!filtersDiv) return;

    // Preserve whatever the user already (un)checked before we rebuild -
    // otherwise every 25s poll would silently re-check boxes the analyst
    // had turned off.
    const previousState = {};
    filtersDiv.querySelectorAll(".sourceFilter").forEach(cb => {
        previousState[cb.value] = cb.checked;
    });

    const names = [...new Set(feedData.map(e => e.publisher || e.source))].sort();

    // No change in the set of sources -> nothing to rebuild, avoids
    // needless DOM churn (and losing focus/scroll) on every poll.
    const currentNames = Object.keys(previousState).sort();
    if (currentNames.length === names.length && currentNames.every((n, i) => n === names[i])) {
        return;
    }

    filtersDiv.innerHTML = "";

    names.forEach(name => {

        const checked = name in previousState ? previousState[name] : true;

        filtersDiv.innerHTML += `
<label>
<input type="checkbox" class="sourceFilter" value="${name}" ${checked ? "checked" : ""}>
${name}
</label>
`;

    });

    filtersDiv.querySelectorAll(".sourceFilter")
        .forEach(cb => cb.addEventListener("change", renderIntelFeed));

}

// =====================
// RENDER FEED (severity + source + tab filtered)
// =====================

function renderIntelFeed() {

    const feedData = window.intelDataAll || [];

    const showCritical = document.getElementById("filterCritical")?.checked ?? true;
    const showWarning = document.getElementById("filterWarning")?.checked ?? true;
    const showInfo = document.getElementById("filterInfo")?.checked ?? true;

    const enabledSources =
        Array.from(document.querySelectorAll(".sourceFilter"))
            .filter(cb => cb.checked)
            .map(cb => cb.value);

    const filteredFeed = feedData.filter(item => {

        const publisher = item.publisher || item.source;

        if (enabledSources.length && !enabledSources.includes(publisher)) return false;

        if (item.severity === "critical" && !showCritical) return false;
        if (item.severity === "warning" && !showWarning) return false;
        if (item.severity === "info" && !showInfo) return false;

        if (!matchesTab(item, APP.activeTab)) return false;

        return true;

    });

    filteredFeed.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    window.intelData = filteredFeed;

    const newCountEl = document.getElementById("feedNewCount");
    if (newCountEl) {
        newCountEl.textContent =
            filteredFeed.filter(i => (Date.now() - new Date(i.timestamp)) < 3600000).length + " New";
    }

    document.getElementById("intelFeed").innerHTML =
        filteredFeed.map((item, index) => `

        <div class="card feed-${item.severity}" onclick="showIntelEvent(${index})">

            <div class="cardTopRow">
                <div class="cardSource">${item.icon || ""} ${item.source}</div>
                <span class="badge ${badgeClassFor(item)}">${badgeLabelFor(item)}</span>
            </div>

            <div class="cardPublisher">${item.publisher || ""}</div>

            <div class="cardText">${item.text}</div>

            <div class="cardBottomRow">
                <div class="cardTime">🕒 ${timeAgo(item.timestamp)}</div>
                ${verificationBadge(item)}
            </div>

        </div>

    `).join("") || "<div class='card'>No intelligence matches the current filters.</div>";

    updateIntelStatus();

}

// =====================
// EVENT DETAIL
// =====================

function showIntelEvent(index) {

    const item = window.intelData[index];
    if (!item) return;

    if (item.lat && item.lon) {

        map.setView([item.lat, item.lon], 8);

        if (intelMarker) map.removeLayer(intelMarker);

        intelMarker = L.marker([item.lat, item.lon], { icon: alertIcon }).addTo(map);
        intelMarker.bindPopup(item.text).openPopup();

    }

    const verificationLine =
        (item.verification_status && item.verification_status !== "UNVERIFIED" && item.verification_status !== "OFFICIAL")
            ? `<br><b>Verification</b><br>${item.verification_status} \u00B7 reported by ${item.verified_sources.join(", ")}<br><br>`
            : "<br>";

    document.getElementById("info").innerHTML = `

        <h3>${item.icon || ""} ${item.source}</h3>
        <b>${item.publisher || ""}</b>
        <hr>
        <b>Location</b><br>
        ${item.location || "Unknown"}<br><br>
        <b>Event</b><br>
        ${item.text}<br>
        ${verificationLine}
        <b>Time</b><br>
        ${timeAgo(item.timestamp)}

    `;

}

// =====================
// LIVE STATUS INDICATOR
// =====================

function updateIntelStatus() {

    const lastUpdate = document.getElementById("lastUpdate");

    if (!lastUpdate) return;

    if (!window.intelData.length) {
        lastUpdate.textContent = "No recent intelligence";
        return;
    }

    const latest = window.intelData[0];

    lastUpdate.textContent =
        `Last Intelligence Update: ${timeAgo(latest.timestamp)}`;

}

// =====================
// RISK OVERVIEW GAUGE
// =====================

function updateRiskOverview() {

    const active = (window.czibData || []).filter(x => x.status === "Active");
    const weatherAlerts = (window.intelDataAll || [])
        .filter(i => (i.source || "").toLowerCase().includes("weather"));
    const tfrs = (window.intelDataAll || [])
        .filter(i => (i.source || "").toLowerCase().includes("faa"));
    const other = (window.intelDataAll || [])
        .filter(i => i.source_type === "instagram" || i.source_type === "osint" || i.source_type === "telegram");

    document.getElementById("rbConflict").textContent = active.length;
    document.getElementById("rbWeather").textContent = weatherAlerts.length;
    document.getElementById("rbTfr").textContent = tfrs.length;
    document.getElementById("rbOther").textContent = other.length;

    // Simple weighted risk score: active conflict zones dominate, then
    // critical intelligence volume, then general alert volume.
    const criticalCount = (window.intelDataAll || []).filter(i => i.severity === "critical").length;

    const raw =
        active.length * 12 +
        criticalCount * 4 +
        weatherAlerts.length * 2;

    const percent = Math.max(0, Math.min(100, raw));

    const circumference = 2 * Math.PI * 52;
    const offset = circumference - (percent / 100) * circumference;

    const gaugeValue = document.getElementById("gaugeValue");
    const riskPercent = document.getElementById("riskPercent");
    const riskLabel = document.getElementById("riskLevelLabel");

    if (gaugeValue) gaugeValue.style.strokeDashoffset = offset;
    if (riskPercent) riskPercent.textContent = percent + "%";

    let level = "LOW RISK", color = "var(--green)";

    if (percent >= 70) { level = "HIGH RISK"; color = "var(--red)"; }
    else if (percent >= 35) { level = "ELEVATED RISK"; color = "var(--amber)"; }

    if (riskLabel) { riskLabel.textContent = level; riskLabel.style.color = color; }
    if (gaugeValue) gaugeValue.style.stroke = color;

}

// =====================
// SOURCE STATUS LIST
// =====================

function renderSourceStatus(feedData) {

    const list = document.getElementById("sourceStatusList");
    if (!list) return;

    const bySource = {};

    feedData.forEach(item => {
        const key = item.source || "Unknown";
        if (!bySource[key] || new Date(item.timestamp) > new Date(bySource[key].timestamp)) {
            bySource[key] = item;
        }
    });

    const rows = Object.keys(bySource).sort();

    list.innerHTML = rows.map(name => `
        <div class="sourceRow">
            <span class="dot dotGreen"></span>
            <span class="sName">${name}</span>
            <span class="sStatus">Operational</span>
        </div>
    `).join("") || "<div class='sourceRow'><span class='sName'>No sources reporting yet</span></div>";

}
