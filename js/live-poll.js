// =====================
// LIVE POLLING + ALERTS
// =====================
// Keeps the dashboard current without manual refresh, and raises a
// browser notification + audible alert the moment a new critical/warning
// event shows up in the feed - this is the "read it first" piece.

const INTEL_POLL_MS = 25000;   // live-intel.json
const CZIB_POLL_MS = 5 * 60000; // czib-live.json (this one changes rarely)

let seenEventIds = new Set();
let firstPollDone = false;
let alertsEnabled = false;

// Persistent chronological log of every alert-worthy event that's shown
// up since the page was opened - newest first. Desktop notifications
// disappear in a few seconds, which is too fast to read and click before
// they're gone; this keeps them all visible in the dashboard itself so
// nothing gets missed, independent of whether desktop alerts are even
// enabled.
let alertHistory = [];
let unseenAlertCount = 0;
const MAX_ALERT_HISTORY = 60;

// -----------------------
// Audio alert (no external file - generated tone, so no asset/licensing
// to manage on a kiosk box)
// -----------------------

function playAlertTone(urgent) {

    try {

        const ctx = new (window.AudioContext || window.webkitAudioContext)();

        const ring = (freq, delay) => {

            setTimeout(() => {

                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.frequency.value = freq;
                gain.gain.setValueAtTime(0.0001, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.22, ctx.currentTime + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);

                osc.start();
                osc.stop(ctx.currentTime + 0.4);

            }, delay);

        };

        ring(880, 0);

        if (urgent) ring(880, 240);

    } catch (e) {
        console.warn("Alert tone failed:", e);
    }

}

// -----------------------
// Browser notification
// -----------------------

function revealEvent(eventId) {

    // The item that triggered this alert might be hidden right now by
    // whichever feed tab/filters the person happens to be on (e.g.
    // they're looking at "Official" and the alert came from Telegram) -
    // reset to "All" and jump straight to the card instead of leaving
    // them to hunt for something they can't find.
    if (typeof setFeedTab === "function") setFeedTab("all");

    ["filterCritical", "filterWarning", "filterInfo"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.checked = true;
    });

    document.querySelectorAll(".sourceFilter").forEach(cb => cb.checked = true);

    if (typeof renderIntelFeed === "function") renderIntelFeed();

    document.getElementById("alertHistoryPanel")?.classList.remove("open");

    setTimeout(() => {

        const card = document.querySelector(`[data-event-id="${eventId}"]`);

        if (card) {
            card.scrollIntoView({ behavior: "smooth", block: "center" });
            card.classList.remove("navHighlight");
            void card.offsetWidth;
            card.classList.add("navHighlight");
            setTimeout(() => card.classList.remove("navHighlight"), 1100);
        }

    }, 50);

}

function notifyNewEvent(item) {

    // Log it regardless of whether desktop notifications are enabled/
    // granted - the in-dashboard history is the reliable record; the OS
    // notification is just an optional extra ping on top of it.
    alertHistory.unshift(item);
    if (alertHistory.length > MAX_ALERT_HISTORY) alertHistory.length = MAX_ALERT_HISTORY;
    unseenAlertCount++;
    renderAlertHistory();

    if (!alertsEnabled || typeof Notification === "undefined") return;
    if (Notification.permission !== "granted") return;

    const isCritical = item.severity === "critical";

    const n = new Notification(
        `${isCritical ? "\u{1F6A8} CRITICAL" : "\u26A0\uFE0F New Intel"} \u2014 ${item.source}`,
        {
            body: (item.text || "").slice(0, 160),
            tag: item.id,
            requireInteraction: isCritical
        }
    );

    n.onclick = () => {
        window.focus();
        n.close();
        revealEvent(item.id);
    };

    playAlertTone(isCritical);

}

function renderAlertHistory() {

    const countEl = document.getElementById("alertHistoryCount");
    const emptyEl = document.getElementById("alertHistoryEmpty");
    const listEl = document.getElementById("alertHistoryList");

    if (countEl) {
        countEl.style.display = unseenAlertCount > 0 ? "inline-block" : "none";
        countEl.textContent = unseenAlertCount;
    }

    if (!listEl) return;

    if (emptyEl) emptyEl.style.display = alertHistory.length ? "none" : "inline-block";

    listEl.innerHTML = alertHistory.map(item => `
        <div class="alertHistoryRow hist-${item.severity}" onclick="revealEvent('${item.id}')">
            <div class="alertHistoryTop">
                <span>${item.icon || ""} ${item.source}</span>
                <span class="alertHistoryTime">${typeof timeAgo === "function" ? timeAgo(item.timestamp) : ""}</span>
            </div>
            <div class="alertHistoryText">${item.text}</div>
        </div>
    `).join("");

}

function initAlertHistoryButton() {

    const btn = document.getElementById("alertHistoryBtn");
    if (!btn) return;

    btn.addEventListener("click", () => {

        document.getElementById("layersPanel")?.classList.remove("open");
        document.getElementById("filtersPanel")?.classList.remove("open");

        document.getElementById("alertHistoryPanel")?.classList.toggle("open");

        unseenAlertCount = 0;
        renderAlertHistory();

    });

}

// -----------------------
// Enable Alerts button
// -----------------------

function setAlertButtonState() {

    const btn = document.getElementById("alertsBtn");
    if (!btn) return;

    if (typeof Notification === "undefined") {
        btn.textContent = "Alerts unsupported";
        btn.disabled = true;
        return;
    }

    if (alertsEnabled) {
        btn.classList.add("hbtnActive");
        btn.innerHTML = "\u{1F514} Alerts On";
    } else {
        btn.classList.remove("hbtnActive");
        btn.innerHTML = "\u{1F515} Enable Alerts";
    }

}

function initAlertsButton() {

    const btn = document.getElementById("alertsBtn");
    if (!btn) return;

    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        alertsEnabled = true;
    }

    setAlertButtonState();

    btn.addEventListener("click", async () => {

        if (typeof Notification === "undefined") return;

        if (Notification.permission === "granted") {
            alertsEnabled = !alertsEnabled;
            setAlertButtonState();
            return;
        }

        const perm = await Notification.requestPermission();
        alertsEnabled = perm === "granted";
        setAlertButtonState();

        if (alertsEnabled) {
            showToast("Alerts enabled - you'll get a notification + sound for new critical/warning intel.");
        }

    });

}

// -----------------------
// Diff feed data against what we've already seen and alert on new items
// -----------------------

function detectAndAlertNewEvents(feedData) {

    const newOnes = feedData.filter(item => !seenEventIds.has(item.id));

    feedData.forEach(item => seenEventIds.add(item.id));

    if (!firstPollDone) {
        // Don't blast notifications for the whole historical backlog on
        // first page load - only alert on things that arrive *after* now.
        firstPollDone = true;
        return;
    }

    newOnes
        .filter(item => item.severity === "critical" || item.severity === "warning")
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
        .forEach(notifyNewEvent);

}

// -----------------------
// Poll loops
// -----------------------

function startLivePolling() {

    initAlertsButton();
    initAlertHistoryButton();
    renderAlertHistory();

    setInterval(() => {
        updateSecurityFeed();
    }, INTEL_POLL_MS);

    setInterval(() => {
        loadCZIBData();
    }, CZIB_POLL_MS);

}

document.addEventListener("DOMContentLoaded", startLivePolling);
