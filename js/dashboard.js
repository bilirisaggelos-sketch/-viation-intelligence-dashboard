async function loadCZIBData() {

    try {

        const response = await fetch('./data/czib.json');
        const data = await response.json();

        console.log("CZIB DATA:", data);

    } catch (error) {

        console.error("Error loading CZIB data", error);

    }

}

loadCZIBData();
