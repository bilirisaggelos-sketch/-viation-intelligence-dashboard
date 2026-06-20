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
            'https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson'
        );

        const geojson = await response.json();

        countriesLayer = L.geoJSON(geojson, {
            style: {
                color: '#666',
                weight: 1,
                fillOpacity: 0
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

const data =
    raw.conflict_zones
       .map(x => ({
            country: x.country.split(",")[0].trim(),
            czib: x.Nid,
            issued: x.issued_date,
            expires: x.valid_until_date,
            risk: x.status === "Active" ? "HIGH" : "NORMAL",
            status: x.status
       }));

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

                L.circle(coords, {
                    color: color,
                    fillColor: color,
                    fillOpacity: 0.4,
                    radius: 250000
                })
                .addTo(map)
                .bindPopup(
                    `<b>${item.country}</b><br>
                     ${item.czib}<br>
                     Risk: ${item.risk}`
                );

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

// loadCountries();
