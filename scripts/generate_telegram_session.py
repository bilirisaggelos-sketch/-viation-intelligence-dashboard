"""
Run this ONCE, locally, to generate a Telethon StringSession you can save
as a GitHub Actions secret (TELEGRAM_SESSION). This lets the scheduled
"Update Intelligence" workflow log in to Telegram without a local session
file (which can't be committed to the repo).

Usage:
    python scripts/generate_telegram_session.py

It will ask for your phone number and the login code Telegram sends you,
then print a session string. Copy it into a repo secret named
TELEGRAM_SESSION (Settings -> Secrets and variables -> Actions).

Keep this string private — anyone who has it can act as your logged-in
Telegram account.
"""

import os
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent))

from dotenv import load_dotenv
from telethon.sync import TelegramClient
from telethon.sessions import StringSession

load_dotenv()

API_ID = int(os.getenv("TELEGRAM_API_ID"))
API_HASH = os.getenv("TELEGRAM_API_HASH")

with TelegramClient(StringSession(), API_ID, API_HASH) as client:
    print("\nYour TELEGRAM_SESSION string (copy everything below):\n")
    print(client.session.save())
