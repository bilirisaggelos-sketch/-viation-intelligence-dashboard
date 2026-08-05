from collectors.telegram.template import collect_channel


async def collect():

    return await collect_channel(
        channel="osinttechnical",
        publisher="OSINTtechnical",
        severity="warning",
        icon="🔎"
    )
