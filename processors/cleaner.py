import re


def clean_text(text):

    if not text:
        return ""

    # Remove Telegram markdown
    text = text.replace("**", "")
    text = text.replace("__", "")

    # Remove Telegram usernames
    text = re.sub(r"@\S+", "", text)

    # Remove duplicate blank lines
    text = re.sub(r"\n{2,}", "\n", text)

    # Remove extra spaces
    text = re.sub(r"[ \t]+", " ", text)

    return text.strip()