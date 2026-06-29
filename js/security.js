// =====================
// SECURITY
// =====================

window.intelData = [];

function updateSecurityFeed() {

    const feed =
        document.getElementById("securityFeed");

    if (!feed || !window.czibData) return;

    const latest =
    window.czibData
    .filter(item => item.status === "Active")
    .sort(
        (a,b) =>
        new Date(b.issued) -
        new Date(a.issued)
    );

    feed.innerHTML =
    latest.slice(0,8).map(item => `

        <div class="card">
            <b>${item.country}</b><br>
            CZIB ${item.czib}<br>
            ${formatDate(item.issued)}
        </div>

    `).join("");

    loadIntelFeed()
.then(feedData => {

        window.intelData = feedData;
    const filteredFeed =
    feedData.filter(item =>
        isAviationRelevant(item.text)
    );

       document.getElementById("intelFeed").innerHTML =
filteredFeed.map((item,index) => `

        <div class="card feed-${item.severity}"
             onclick="showIntelEvent(${index})"
             style="cursor:pointer">

            ${item.icon} ${item.text}<br>

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
