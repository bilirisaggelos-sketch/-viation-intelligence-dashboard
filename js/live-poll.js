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

function notifyNewEvent(item) {

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
    };

    playAlertTone(isCritical);

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

    setInterval(() => {
        updateSecurityFeed();
    }, INTEL_POLL_MS);

    setInterval(() => {
        loadCZIBData();
    }, CZIB_POLL_MS);

}

document.addEventListener("DOMContentLoaded", startLivePolling);
