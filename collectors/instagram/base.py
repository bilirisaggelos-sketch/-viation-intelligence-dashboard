import os

from dotenv import load_dotenv
import instaloader

load_dotenv()

IG_USERNAME = os.getenv("INSTAGRAM_USERNAME")
IG_PASSWORD = os.getenv("INSTAGRAM_PASSWORD")

SESSION_FILE = "instagram_session"


def get_client():
    """
    Returns a logged-in instaloader.Instaloader instance.

    Credentials are read from the .env file:
        INSTAGRAM_USERNAME=...
        INSTAGRAM_PASSWORD=...

    A local session file is reused across runs so we don't log in on
    every collection cycle (Instagram rate-limits/blocks repeated logins).
    """

    loader = instaloader.Instaloader(
        download_pictures=False,
        download_videos=False,
        download_video_thumbnails=False,
        download_geotags=False,
        download_comments=False,
        save_metadata=False,
        compress_json=False,
        quiet=True,
    )

    if not IG_USERNAME or not IG_PASSWORD:
        raise RuntimeError(
            "INSTAGRAM_USERNAME / INSTAGRAM_PASSWORD are not set in .env"
        )

    try:
        loader.load_session_from_file(IG_USERNAME, filename=SESSION_FILE)
    except FileNotFoundError:
        loader.login(IG_USERNAME, IG_PASSWORD)
        loader.save_session_to_file(filename=SESSION_FILE)

    return loader
