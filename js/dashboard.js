// =====================
// Aviation Intelligence Dashboard V6
// =====================

function clock() {
    document.getElementById("utcClock").innerHTML =
        new Date().toUTCString();
}
setInterval(clock, 1000);
clock();

var map = L.map('map', {
    zoomControl: false
}).setView([33,25],4);

const alertIcon = L.divIcon({
    html:"<div class='alert-marker'>🚨</div>",
    className:"",
    iconSize:[50,50]
});

L.control.zoom({
    position: 'bottomleft'
}).addTo(map);

L.tileLayer(
    'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
        maxZoom: 18
    }
).addTo(map);
let countriesLayer = null;
let intelMarker = null;
let airportsLayer = L.layerGroup().addTo(map);
let airportMarkers = [];

async function loadCountries() {
    try {

        const response = await fetch(
  './data/countries.geojson'
);
        const geojson = await response.json();

countriesLayer = L.geoJSON(geojson, {
  style: function(feature) {

    const country = feature.properties.name;
      
      
if (
    country.includes("Iran") ||
    country.includes("Iraq") ||
    country.includes("Syria") ||
    country.includes("Libya")
) {

}
  let color = "#d9d9d9";

if (
    window.activeCountries &&
    window.activeCountries[country]
) {
    color = "#ff0000";
}

return {
    color: "#666",
    weight: 1,
    fillColor: color,
    fillOpacity: 0.5
};
},

onEachFeature: function(feature, layer) {

    layer.on("click", function() {

        const country = feature.properties.name;

        showCountry(country);

    });

}

}).addTo(map);

    } catch(err) {
        console.error('Countries error:', err);
    }

    loadCZIBData();
    const airports = [

{
name:"Erbil",
icao:"ORER",
lat:36.237,
lon:43.963
},

{
name:"Bahrain",
icao:"OBBI",
lat:26.270,
lon:50.633
},

{
name:"Beirut",
icao:"OLBA",
lat:33.820,
lon:35.488
},

{
name:"Tehran",
icao:"OIII",
lat:35.689,
lon:51.313
},

{
name:"Dubai",
icao:"OMDB",
lat:25.253,
lon:55.365
},

{
name:"Cairo",
icao:"HECA",
lat:30.121,
lon:31.406
},

{
name:"Istanbul",
icao:"LTBA",
lat:40.976,
lon:28.814
},

{
name:"Larnaca",
icao:"LCLK",
lat:34.875,
lon:33.624
},

{
name:"Delhi",
icao:"VIDP",
lat:28.556,
lon:77.100
},

{
name:"Mumbai",
icao:"VABB",
lat:19.089,
lon:72.865
},

{
name:"Islamabad",
icao:"OPIS",
lat:33.549,
lon:72.825
},

{
name:"Lahore",
icao:"OPLA",
lat:31.521,
lon:74.403
},

{
name:"Karachi",
icao:"OPKC",
lat:24.906,
lon:67.161
},

{
name:"Kabul",
icao:"OAKB",
lat:34.565,
lon:69.212
},

{
name:"Kandahar",
icao:"OAKN",
lat:31.506,
lon:65.847
},

{
name:"Riyadh",
icao:"OERK",
lat:24.957,
lon:46.698
},

{
name:"Jeddah",
icao:"OEJN",
lat:21.670,
lon:39.152
},

{
name:"Dammam",
icao:"OEDF",
lat:26.471,
lon:49.798
},

{
name:"Amman",
icao:"OJAI",
lat:31.722,
lon:35.993
},

{
name:"Tel Aviv",
icao:"LLBG",
lat:32.011,
lon:34.886
},

{
name:"Baghdad",
icao:"ORBI",
lat:33.262,
lon:44.234
},

{
name:"Basra",
icao:"ORMM",
lat:30.549,
lon:47.662
},  

{
name:"Muscat",
icao:"OOMS",
lat:23.593,
lon:58.284
},

{
name:"Riyadh",
icao:"OERK",
lat:24.957,
lon:46.698
},

{
name:"Jeddah",
icao:"OEJN",
lat:21.670,
lon:39.152
},

{
name:"Alexandria",
icao:"HEBA",
lat:31.184,
lon:29.949
},

{
name:"Sharm El Sheikh",
icao:"HESH",
lat:27.977,
lon:34.394
},

{
name:"Luxor",
icao:"HELX",
lat:25.671,
lon:32.706
},

{
name:"Tripoli",
icao:"HLLM",
lat:32.664,
lon:13.159
},

{
name:"Benghazi",
icao:"HLLB",
lat:32.096,
lon:20.269
},

{
name:"Khartoum",
icao:"HSSS",
lat:15.590,
lon:32.553
},

{
name:"Aden",
icao:"OYAA",
lat:12.829,
lon:45.028
},
        
{
name:"Marrakech",
icao:"GMMX",
lat:31.607,
lon:-8.036
},

{
name:"Tunis",
icao:"DTTA",
lat:36.851,
lon:10.227
}      
];

airports.forEach(airport => {

    const marker = L.circleMarker(
        [airport.lat, airport.lon],
        {
            radius:10,
            color:"#2563eb",
            fillColor:"#2563eb",
            fillOpacity:1
        }
    );

    marker.bindPopup(
        "✈ " +
        airport.icao +
        " - " +
        airport.name
    );

    marker.addTo(airportsLayer);

    marker.bringToFront();

console.log(
    airport.icao,
    airport.lat,
    airport.lon
);

});

}   

const countryCoords = {
    Iraq:[33.3, 44.3],
    Iran:[32.4, 53.6],
    Israel:[31.0, 34.8],
    Libya:[26.3, 17.2],
    Sudan:[15.5, 32.5]
};

function formatDate(dateStr) {

    if (!dateStr) return "";

    if (dateStr.includes("/")) {

        const parts = dateStr.split("/");

        const d = new Date(
            parts[2],
            parts[1] - 1,
            parts[0]
        );

        return d.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    }

    const d = new Date(dateStr);

    return d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

async function loadCZIBData() {

    try {

        const response =
            await fetch('./data/czib-live.json');

        const raw =
    await response.json();
       document.getElementById("lastUpdate").innerHTML =
    "Last EASA Update: " +
    new Date(raw.generated_at).toUTCString(); 

const data = (raw.conflict_zones?.conflict_zones || raw.conflict_zones)
    .map(x => ({
        country: x.country.split(",")[0].trim(),
        czib: x.Nid,
        issued: x.issued_date,
        expires: x.valid_until_date,
        risk: x.status === "Active" ? "HIGH" : "NORMAL",
        status: x.status
    }));
const activeCountries = {};

data.forEach(item => {
    if (item.status === "Active") {
        activeCountries[item.country] = "HIGH";
    }
});

window.activeCountries = activeCountries;
      
        document.getElementById("tbl").innerHTML = "";

      data.forEach(item => {

            const coords =
                countryCoords[item.country];

            if (coords) {

                const color =
                    item.risk === "ELEVATED"
                    ? "orange"
                    : "red";
            }

            document.getElementById("tbl").innerHTML += `
            <tr onclick="showCountry('${item.country}')">
                <td>${item.country}</td>
                <td>${item.czib}</td>
                <td>${formatDate(item.issued)}</td>
                <td>${formatDate(item.expires)}</td>
                <td>${item.risk}</td>
                <td>${item.status}</td>
            </tr>
            `;

        });

        window.czibData = data;
        
        updateSecurityFeed();
        
if (countriesLayer) {
    countriesLayer.setStyle(countriesLayer.options.style);
}
    } catch (err) {

        console.error(err);

    }

}

function showCountry(countryName) {

    const item =
        window.czibData.find(
            x => x.country === countryName
        );

    if (!item) return;

    document.getElementById("info").innerHTML = `
       <b>${item.country || "Security Event"}</b><br><br>
        CZIB: ${item.czib}<br>
        Issued: ${formatDate(item.issued)}<br>
        Expires: ${formatDate(item.expires)}<br>
        Risk: ${item.risk}<br>
        Status: ${item.status}
    `;

    const coords =
        countryCoords[item.country];

    if (coords) {
        map.setView(coords, 6);
    }

}

document.getElementById("airportToggle")
.addEventListener("change", function () {

    console.log("Airport Toggle:", this.checked);

    if (this.checked) {

        map.addLayer(airportsLayer);

    } else {

        map.removeLayer(airportsLayer);

    }

});
document.getElementById("searchBox")
.addEventListener("keyup", function () {

    const value =
        this.value.trim().toLowerCase();

    if (!window.czibData) return;

    const found =
        window.czibData.find(
            x => x.country.toLowerCase() === value
        );

    if (found) {
        showCountry(found.country);
    }

});
    
function updateSecurityFeed() {

    const feed =
        document.getElementById("securityFeed");

    if (!feed || !window.czibData) return;

    const latest =
        window.czibData
        .slice()
        .sort(
            (a,b) =>
            new Date(b.issued) -
            new Date(a.issued)
        )
        .slice(0,10);

    feed.innerHTML =
        latest.map(item => `

        <div class="card">
            <b>${item.country}</b><br>
            CZIB ${item.czib}<br>
            ${formatDate(item.issued)}
        </div>

        `).join("");
fetch("data/security-feed.json")
.then(r => r.json())
.then(feedData => {

    window.intelData = feedData;

    document.getElementById("intelFeed").innerHTML =
   feedData.map((item,index) => `

     <div class="card feed-${item.severity}"
onclick="showIntelEvent(${index})"
style="cursor:pointer">
            ${item.icon} ${item.text}
            <br>
            <small>${item.time} | ${item.source}</small>
        </div>

        `).join("");

})
.catch(err => {

    console.error(err);

    document.getElementById("intelFeed").innerHTML =
        "<div class='card'>Feed unavailable</div>";

});

}
window.intelData = [];

function showIntelEvent(index){

    const item = window.intelData[index];
    if(item.lat && item.lon){

    map.setView(
        [item.lat, item.lon],
        8
    );

    if(intelMarker){
        map.removeLayer(intelMarker);
    }

    intelMarker = L.marker(
    [item.lat, item.lon],
    { icon: alertIcon }
).addTo(map);

    intelMarker.bindPopup(
    item.text,
    {
        offset:[0,-35]
    }
).openPopup();
}
   
    document.getElementById("info").innerHTML = `
        <b>${item.country}</b><br><br>

        <b>Event:</b><br>
        ${item.text}<br><br>

        <b>Source:</b><br>
        ${item.source}<br><br>

        <b>Time:</b><br>
        ${item.time}<br><br>

        <b>Severity:</b><br>
        ${item.severity}
    `;
}
document.getElementById("airportToggle")
.addEventListener("change", function () {

    if (this.checked) {

        map.addLayer(airportsLayer);

    } else {

        map.removeLayer(airportsLayer);

    }

});
loadCZIBData();
loadCountries();
