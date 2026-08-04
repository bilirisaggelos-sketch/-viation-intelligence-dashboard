// =====================
// INTELLIGENCE FILTERS
// =====================

const aviationKeywords = [

    "missile",
    "rocket",
    "drone",
    "uav",
    "gps",
    "gnss",
    "jam",
    "jamming",
    "airspace",
    "notam",
    "airport",
    "runway",
    "military",
    "fighter",
    "surface-to-air",
    "sam",
    "closure",

    "iran",
    "iraq",
    "israel",
    "lebanon",
    "syria",
    "jordan",
    "egypt",
    "libya",
    "yemen",
    "gaza",
    "hamas",
    "hezbollah",
    "red sea",
    "persian gulf",
    "uae",
    "qatar",
    "oman"

];
function isAviationRelevant(text){

    if(!text) return false;

    const message = text.toLowerCase();

    return aviationKeywords.some(keyword =>
        message.includes(keyword)
    );

}
