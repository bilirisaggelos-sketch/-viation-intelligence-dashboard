// =====================
// CZIB
// =====================

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

        APP.czib = data;
window.czibData = data;

console.log("CZIB DATA:", data);
console.log("ACTIVE:", data.filter(item => item.status === "Active").length);
console.log(document.getElementById("activeCZIBCount"));

updateSecurityFeed();

document.getElementById("activeCZIBCount").textContent =
    data.filter(item => item.status === "Active").length;

if (countriesLayer) {
    countriesLayer.setStyle(countriesLayer.options.style);
}
    } catch (err) {

        console.error(err);

    }

}
