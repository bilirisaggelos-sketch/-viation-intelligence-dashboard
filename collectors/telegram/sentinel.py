from collectors.telegram.base import get_client

CHANNEL = "sentinelmonitor"


async def collect():

    client = get_client()

    await client.start()

    events = []

    try:

        entity = await client.get_entity(CHANNEL)

        print(f"Connected to: {entity.title}")

        async for message in client.iter_messages(entity, limit=20):

            if not message.text:
                continue

            events.append({

                "title": "Telegram",

                "publisher": "Sentinel",

                "text": message.text,

                "source": "Telegram",

                "source_type": "telegram",

                "severity": "warning",

                "icon": "📢",

                "timestamp": message.date.isoformat(),

                "location": "Global",

                "lat": None,

                "lon": None

            })

    except Exception as e:

        print("Sentinel error:", e)

    await client.disconnect()

    print(f"Sentinel events: {len(events)}")

    return events