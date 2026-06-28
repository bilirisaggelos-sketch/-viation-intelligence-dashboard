// =====================
// Aviation Intelligence Dashboard V7
// =====================

const APP = {

    airports: [],

    countries: [],

    czib: [],

    security: [],

    activeCountries: {},

    settings: {
        showAirports: true,
        showFIR: true
    }

};

function clock() {
    document.getElementById("utcClock").innerHTML =
        new Date().toUTCString();
}
setInterval(clock, 1000);
clock();

const countryCoords = {
    Iraq:[33.3, 44.3],
    Iran:[32.4, 53.6],
    Israel:[31.0, 34.8],
    Libya:[26.3, 17.2],
    Sudan:[15.5, 32.5]
};

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

        APP.czib = data;
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
    APP.czib.find(
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

   if (!APP.czib.length) return;

    const found =
    APP.czib.find(
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
// =====================
// INITIALIZE
// =====================

loadAirports();

loadCountries()
.then(() => {
    return loadCZIBData();
});
