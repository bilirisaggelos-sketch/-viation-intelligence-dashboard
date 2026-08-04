from processors.cleaner import clean_text
from processors.relevance import is_relevant
from processors.dedup import attach_verification


def process(events):

    processed = []

    for event in events:

        text = clean_text(event.get("text", ""))

        event["text"] = text

        source_type = event.get("source_type", "")

        if source_type != "official":

            if not is_relevant(text):
                continue

        processed.append(event)

    processed = attach_verification(processed)

    print(f"Pipeline output: {len(processed)} events")

    return processed