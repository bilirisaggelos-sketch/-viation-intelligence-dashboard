// =====================
// MAP
// =====================

var map = L.map('map', {
    zoomControl: false
}).setView([33,25],4);

const alertIcon = L.divIcon({
    html:"<div class='alert-marker'>🚨</div>",
    className:"",
    iconSize:[90,90]
});

L.control.zoom({
    position:'bottomleft'
}).addTo(map);

L.tileLayer(
    'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
        maxZoom:18
    }
).addTo(map);

let countriesLayer = null;
let intelMarker = null;
let airportsLayer = L.layerGroup().addTo(map);
let airportMarkers = [];
