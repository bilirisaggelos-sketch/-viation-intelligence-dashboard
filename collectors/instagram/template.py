from datetime import datetime, timezone

from collectors.instagram.base import get_client


def collect_profile(
    username,
    publisher,
    severity="warning",
    icon="\U0001F4F8",
    location="Global",
    limit=15,
):
    """
    Collects the most recent posts (captions) from a public Instagram
    profile and normalizes them into the same event shape used by the
    Telegram/official collectors.

    Note: this reads *public* post captions via instaloader. It does not
    scrape Stories, DMs, or anything behind login-only visibility beyond
    what the logged-in account can already see on a public profile.
    """

    loader = get_client()

    events = []

    try:
        profile = instaloader_profile(loader, username)

        print(f"Connected to Instagram profile: {profile.username}")

        posts = profile.get_posts()

        for i, post in enumerate(posts):

            if i >= limit:
                break

            caption = post.caption or ""

            if not caption:
                continue

            events.append({
                "title": "Instagram",
                "publisher": publisher,
                "text": caption,
                "source": "Instagram",
                "source_type": "instagram",
                "severity": severity,
                "icon": icon,
                "timestamp": post.date_utc.replace(tzinfo=timezone.utc).isoformat(),
                "location": location,
                "lat": None,
                "lon": None,
            })

    except Exception as e:
        print(f"{publisher} (Instagram) error:", e)

    print(f"{publisher} (Instagram) events: {len(events)}")

    return events


def instaloader_profile(loader, username):
    import instaloader
    return instaloader.Profile.from_username(loader.context, username)
