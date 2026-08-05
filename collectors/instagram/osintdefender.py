from collectors.instagram.template import collect_profile


def collect():

    return collect_profile(
        username="osintdefender",
        publisher="OSINT Defender",
        severity="warning",
        icon="\U0001F50E"
    )
