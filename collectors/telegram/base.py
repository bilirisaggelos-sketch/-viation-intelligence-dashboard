import os

from dotenv import load_dotenv
from telethon import TelegramClient
from telethon.sessions import StringSession
from telethon.network.connection.tcpfull import ConnectionTcpFull

load_dotenv()

API_ID = int(os.getenv("TELEGRAM_API_ID"))
API_HASH = os.getenv("TELEGRAM_API_HASH")

# Local/manual runs (e.g. on your own machine): a session *file* next to
# the project is fine, and is what telegram_session.session (gitignored)
# is. But that file can't live in the repo, so a scheduled GitHub Action
# has nothing to log in with and would otherwise hang waiting for an
# interactive login prompt.
#
# For CI, set a TELEGRAM_SESSION repo secret containing a Telethon
# StringSession (generate it once locally — see README) and it's used
# instead of the file.
SESSION_FILE = "telegram_session"
SESSION_STRING = os.getenv("TELEGRAM_SESSION")


def get_client():

    session = StringSession(SESSION_STRING) if SESSION_STRING else SESSION_FILE

    return TelegramClient(
        session,
        API_ID,
        API_HASH,
        connection=ConnectionTcpFull,
        use_ipv6=False
    )