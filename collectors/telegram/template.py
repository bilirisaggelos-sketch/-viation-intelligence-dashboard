from collectors.telegram.base import get_client


async def collect_channel(
    channel,
    publisher,
    severity="warning",
    icon="📢",
    location="Global"
):

    client = get_client()

    await client.start()

    events = []

    try:

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

    await client.disconnect()

    print(f"{publisher} events: {len(events)}")

    return events