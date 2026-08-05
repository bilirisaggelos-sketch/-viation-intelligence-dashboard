from collectors.telegram.base import get_client


async def collect_channel(
    channel,
    publisher,
    severity="warning",
    icon="📢",
    location="Global"
):

    client = get_client()

    events = []

    try:

        await client.start()

        entity = await client.get_entity(channel)

        print(f"Connected to: {entity.title}")

        async for message in client.iter_messages(entity, limit=20):

            if not message.text:
                continue

            events.append({

                "title": "Telegram",

                "publisher": publisher,

                "text": message.text,

                "source": "Telegram",

                "source_type": "telegram",

                "severity": severity,

                "icon": icon,

                "timestamp": message.date.isoformat(),

                "location": location,

                "lat": None,

                "lon": None

            })

    except Exception as e:

        print(f"{publisher} error:", e)

    finally:

        # Was previously outside the try block: if client.start() itself
        # failed (bad session, auth issue), disconnect() never ran and
        # the connection could be left half-open. In a one-shot script
        # this doesn't matter (the process exits right after), but
        # watch_intel.py runs this in a loop indefinitely, so a
        # persistently-failing channel could otherwise leak a connection
        # on every single cycle.
        await client.disconnect()

    print(f"{publisher} events: {len(events)}")

    return events