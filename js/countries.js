// =====================
// COUNTRIES
// =====================

const countryCoords = {

    Iraq:[33.3,44.3],

    Iran:[32.4,53.6],

    Israel:[31.0,34.8],

    Libya:[26.3,17.2],

    Sudan:[15.5,32.5],

    Lebanon:[33.9,35.9],

    Syria:[34.8,38.9],

    Yemen:[15.6,48.0],

    Pakistan:[30.4,69.3],

    "United Arab Emirates":[24.0,54.0],

    UAE:[24.0,54.0],

    Ukraine:[48.4,31.2],

    Egypt:[26.8,30.8]

};

async function loadCountries() {

    try {

        const response = await fetch('./data/countries.geojson');
        const geojson = await response.json();

        if (countriesLayer) {
            map.removeLayer(countriesLayer);
        }

        countriesLayer = L.geoJSON(geojson, {

            style: function(feature) {

                const country = feature.properties.name;

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
                    showCountry(feature.properties.name);
                });

            }

        }).addTo(map);

    } catch(err) {

        console.error("Countries error:", err);

    }

}
