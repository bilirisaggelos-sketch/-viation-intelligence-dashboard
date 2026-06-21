// =====================
// Aviation Intelligence Dashboard V6
// =====================

function clock() {
    document.getElementById("utcClock").innerHTML =
        new Date().toUTCString();
}
setInterval(clock, 1000);
clock();

var map = L.map('map').setView([33, 25], 4);

L.tileLayer(
    'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
        maxZoom: 18
    }
).addTo(map);
let countriesLayer = null;

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

}const countryCoords = {
    Iraq: [33.3, 44.3],
    Iran: [32.4, 53.6],
    Israel: [31.0, 34.8],
    Libya: [26.3, 17.2],
    Sudan: [15.5, 32.5]
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
        document.getElementById("lastUpdate").innerHTML =
            "Last Update: " + new Date().toUTCString();

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
        <b>${item.country}</b><br>
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

document.getElementById("searchBox")
.addEventListener("keyup", function() {

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

loadCZIBData();
loadCountries();
