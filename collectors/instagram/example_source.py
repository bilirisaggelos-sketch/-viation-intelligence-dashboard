from collectors.instagram.template import collect_profile


def collect():
    """
    Example Instagram collector.

    Rename this file / duplicate it for each aviation-security account you
    want to track, the same way collectors/telegram/*.py works — one file
    per source, each just calling collect_profile() with a different
    username and publisher label. Then add an entry for it under
    "instagram" in config/sources.json.
    """

    return collect_profile(
        username="aviation_safety_intel",   # <-- replace with a real, public IG handle
        publisher="Aviation Safety Intel",
        severity="warning",
        icon="\U0001F4F8",
    )
