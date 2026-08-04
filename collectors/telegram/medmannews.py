from collectors.telegram.template import collect_channel


async def collect():

    return await collect_channel(
        channel="medmannews",
        publisher="Mediterranean Man"
    )