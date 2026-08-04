import asyncio

from collectors.telegram.middle_east import collect


async def main():

    events = await collect()

    print(f"\nCollected {len(events)} Telegram events\n")

    for event in events[:5]:

        print("=" * 60)
        print("Publisher :", event["publisher"])
        print("Time      :", event["timestamp"])
        print(event["text"][:300])
        print()

if __name__ == "__main__":
    asyncio.run(main())