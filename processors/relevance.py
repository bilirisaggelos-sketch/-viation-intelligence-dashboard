AVIATION_KEYWORDS = {

    # Aviation
    "airspace": 30,
    "airport": 30,
    "runway": 30,
    "notam": 30,

    # Threats
    "missile": 40,
    "missiles": 40,
    "rocket": 40,
    "drone": 40,
    "uav": 40,
    "ballistic": 40,

    # EW
    "gps": 35,
    "gnss": 35,
    "jamming": 35,
    "jam": 35,

    # Air defence
    "fighter": 25,
    "sam": 25,
    "surface-to-air": 25,

    # Aviation impact
    "flight": 30,
    "airline": 30,
    "civil aviation": 40,
    "aviation": 30,
    "faa": 30,
    "easa": 30,

    # Geographic
    "iran": 10,
    "iraq": 10,
    "israel": 10,
    "syria": 10,
    "lebanon": 10,
    "jordan": 10,
    "gaza": 10,
    "yemen": 10,
    "red sea": 10,
    "persian gulf": 10,
    "strait of hormuz": 20

}


BLACKLIST = [

    "good morning",
    "good night",
    "follow me",
    "subscribe",
    "botting my posts",
    "thank you"

]


def relevance_score(text):

    if not text:
        return 0

    text = text.lower()

    for word in BLACKLIST:

        if word in text:
            return 0

    score = 0

    for keyword, value in AVIATION_KEYWORDS.items():

        if keyword in text:
            score += value

    return score


def is_relevant(text, minimum=35):

    return relevance_score(text) >= minimum