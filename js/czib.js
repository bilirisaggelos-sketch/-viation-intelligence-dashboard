// =====================
// CZIB
// =====================

async function loadCZIBData() {

    try {

        const response = await fetch("./data/czib-live.json");
        const raw = await response.json();

        // -----------------------
        // Last Update
        // -----------------------

        const lastUpdate =
            document.getElementById("czibLastUpdate");

        if (lastUpdate) {

            lastUpdate.innerHTML =
                "Last EASA update: " +
                new Date(raw.generated_at).toUTCString();

        }

        // -----------------------
        // Parse CZIB
        // -----------------------

        const data =
            (raw.conflict_zones?.conflict_zones ||
             raw.conflict_zones)
            .map(item => ({

                country:
                    item.country.split(",")[0].trim(),

                czib:
                    item.Nid,

                issued:
                    item.issued_date,

                expires:
                    item.valid_until_date,

                risk:
                    item.status === "Active"
                    ? "HIGH"
                    : "NORMAL",

                status:
                    item.status

            }));

        // -----------------------
        // Active Countries
        // -----------------------

        const activeCountries = {};

        data.forEach(item => {

            if (item.status === "Active") {

                activeCountries[item.country] = "HIGH";

            }

        });

        window.activeCountries = activeCountries;


        APP.czib = data;
        window.czibData = data;

        // -----------------------
        // Active CZIB list panel
        // -----------------------

        renderCZIBList(data);

        // -----------------------
        // Active Counter
        // -----------------------

        const counter =
            document.getElementById("activeCZIBCount");

        if (counter) {

            counter.textContent =
                data.filter(
                    x => x.status === "Active"
                ).length;

        }

        // -----------------------
        // Update Feed
        // -----------------------

        updateSecurityFeed();

        if (countriesLayer) {

            countriesLayer.setStyle(
                countriesLayer.options.style
            );

        }

    }

    catch(err){

        console.error(err);

    }

}

// =====================
// ACTIVE CZIB LIST PANEL
// =====================

function renderCZIBList(data) {

    const list = document.getElementById("czibList");

    if (!list) return;

    const active = data
        .filter(x => x.status === "Active")
        .sort((a, b) => new Date(b.issued) - new Date(a.issued));

    list.innerHTML = active.map(item => `
        <div class="czibRow" onclick="showCountry('${item.country.replace(/'/g, "\\'")}')">
            <span class="flag">${countryFlag(item.country)}</span>
            <span class="country">${item.country}</span>
            <span class="ago">${timeAgo(item.issued)}</span>
        </div>
    `).join("") || "<div class='czibRow'><span class='country'>No active CZIB advisories</span></div>";

}

// =====================
// COUNTRY DETAILS
// =====================

function showCountry(countryName){

    const item =
        APP.czib.find(
            x => x.country === countryName
        );

    if(!item)
        return;

    APP.selectedCountry = countryName;

    document.querySelectorAll("#czibList .czibRow")
        .forEach(row => {
            row.classList.toggle(
                "selected",
                row.querySelector(".country")?.textContent === countryName
            );
        });

    const info =
        document.getElementById("info");

    if(info){

        info.innerHTML = `

<b>${countryFlag(item.country)} ${item.country}</b>

<br><br>

CZIB: ${item.czib}<br>

Issued: ${formatDate(item.issued)}<br>

Expires: ${formatDate(item.expires)}<br>

Risk: ${item.risk}<br>

Status: ${item.status}

`;

    }

    const coords =
        countryCoords[item.country];

    if(coords){

        map.setView(coords,6);

    }

}