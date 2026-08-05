from collectors.telegram.template import collect_channel


async def collect():

    return await collect_channel(
        channel="faytuksnews",
        publisher="Faytuks News",
        severity="warning",
        icon="📰"
    )
