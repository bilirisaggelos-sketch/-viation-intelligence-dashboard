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
