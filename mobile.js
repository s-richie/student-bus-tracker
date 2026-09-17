/*
    STUDENT BUS TRACKER
    VERSION 1

    Demo GPS simulation
*/


// ================================
// BUS DATA
// ================================

const buses = {

    "BUS-01": {

        number: "BUS-01",

        route: "Main Campus Route",

        stops: [

            {
                name: "Main Campus",
                lat: 15.4800,
                lng: 120.5900
            },

            {
                name: "City Hall",
                lat: 15.4825,
                lng: 120.5935
            },

            {
                name: "Public Market",
                lat: 15.4850,
                lng: 120.5970
            },

            {
                name: "Central Terminal",
                lat: 15.4880,
                lng: 120.6010
            },

            {
                name: "North Gate",
                lat: 15.4920,
                lng: 120.6040
            }

        ],

        position: 0

    },


    "BUS-02": {

        number: "BUS-02",

        route: "East Campus Route",

        stops: [

            {
                name: "East Gate",
                lat: 15.4750,
                lng: 120.5850
            },

            {
                name: "Barangay Hall",
                lat: 15.4780,
                lng: 120.5890
            },

            {
                name: "University Road",
                lat: 15.4810,
                lng: 120.5940
            },

            {
                name: "Student Village",
                lat: 15.4850,
                lng: 120.5980
            },

            {
                name: "East Terminal",
                lat: 15.4890,
                lng: 120.6020
            }

        ],

        position: 0

    }

};


// ================================
// VARIABLES
// ================================

let selectedBus = "BUS-01";

let busMarker;

let routeLine;

let stopMarkers = [];

let simulationTimer;

let busPosition = 0;


// ================================
// MAP
// ================================

const map = L.map("map").setView(
    [15.4800, 120.5900],
    14
);


L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        attribution:
            '&copy; OpenStreetMap contributors',

        maxZoom: 19
    }
).addTo(map);


// ================================
// BUS ICON
// ================================

const busIcon = L.divIcon({

    className: "custom-bus-icon",

    html: `
        <div style="
            width:42px;
            height:42px;
            background:#2563eb;
            border:4px solid white;
            border-radius:50%;
            display:flex;
            align-items:center;
            justify-content:center;
            font-size:21px;
            box-shadow:0 4px 12px rgba(0,0,0,.25);
        ">
            🚍
        </div>
    `,

    iconSize: [42, 42],

    iconAnchor: [21, 21]

});


// ================================
// LOAD BUS
// ================================

function loadBus(busId) {

    selectedBus = busId;

    const bus = buses[busId];

    document.getElementById("busNumber")
        .textContent = bus.number;


    // Reset position from local storage if available

    const savedPosition =
        localStorage.getItem(
            `busPosition_${busId}`
        );

    if (savedPosition !== null) {

        busPosition =
            parseFloat(savedPosition);

    } else {

        busPosition = 0;

    }


    bus.position = busPosition;


    drawRoute(bus);

    updateBus(bus);

    renderStops(bus);

}


// ================================
// DRAW ROUTE
// ================================

function drawRoute(bus) {

    // Remove previous route

    if (routeLine) {

        map.removeLayer(routeLine);

    }


    // Remove old stop markers

    stopMarkers.forEach(marker => {

        map.removeLayer(marker);

    });

    stopMarkers = [];


    const route = bus.stops.map(stop => [

        stop.lat,

        stop.lng

    ]);


    routeLine = L.polyline(
        route,
        {
            weight: 5,
            opacity: .75
        }
    ).addTo(map);


    // Add stops

    bus.stops.forEach((stop, index) => {

        const marker = L.marker(

            [stop.lat, stop.lng]

        ).addTo(map);


        marker.bindPopup(`

            <strong>${stop.name}</strong>

            <br>

            Bus Stop ${index + 1}

        `);


        stopMarkers.push(marker);

    });


    map.fitBounds(
        routeLine.getBounds(),
        {
            padding: [30, 30]
        }
    );

}


// ================================
// UPDATE BUS
// ================================

function updateBus(bus) {

    const position = getInterpolatedPosition(
        bus.stops,
        busPosition
    );


    // Create marker

    if (!busMarker) {

        busMarker = L.marker(
            [position.lat, position.lng],
            {
                icon: busIcon
            }
        ).addTo(map);

    } else {

        busMarker.setLatLng(
            [position.lat, position.lng]
        );

    }


    // Determine next stop

    const nextIndex =
        Math.min(
            Math.floor(busPosition) + 1,
            bus.stops.length - 1
        );


    const nextStop =
        bus.stops[nextIndex];


    document.getElementById("currentLocation")
        .textContent =
        position.description;


    document.getElementById("nextStop")
        .textContent =
        nextStop.name;


    // Calculate arrival

    const distance =
        calculateDistance(
            position.lat,
            position.lng,
            nextStop.lat,
            nextStop.lng
        );


    const estimatedMinutes =
        Math.max(
            1,
            Math.round(distance * 8)
        );


    document.getElementById("arrivalTime")
        .textContent =
        `${estimatedMinutes} min`;


    const now = new Date();


    document.getElementById("lastUpdated")
        .textContent =
        now.toLocaleTimeString();


    document.getElementById("mapStatus")
        .textContent =
        `Heading toward ${nextStop.name}`;


    // Save last known position

    localStorage.setItem(

        `busPosition_${selectedBus}`,

        busPosition

    );


    localStorage.setItem(

        `busLastUpdate_${selectedBus}`,

        now.toISOString()

    );


    // Status

    if (estimatedMinutes <= 2) {

        document.getElementById("busStatus")
            .textContent =
            "NEAR STOP";

        document.getElementById("busStatus")
            .className =
            "status near";

    } else {

        document.getElementById("busStatus")
            .textContent =
            "ON THE WAY";

        document.getElementById("busStatus")
            .className =
            "status active";

    }


    renderStops(bus);

}


// ================================
// INTERPOLATE POSITION
// ================================

function getInterpolatedPosition(
    stops,
    progress
) {

    const max =
        stops.length - 1;


    if (progress >= max) {

        const finalStop =
            stops[max];

        return {

            lat: finalStop.lat,

            lng: finalStop.lng,

            description:
                finalStop.name

        };

    }


    const index =
        Math.floor(progress);


    const fraction =
        progress - index;


    const current =
        stops[index];


    const next =
        stops[index + 1];


    const lat =
        current.lat +
        (next.lat - current.lat)
        * fraction;


    const lng =
        current.lng +
        (next.lng - current.lng)
        * fraction;


    return {

        lat,

        lng,

        description:
            `Between ${current.name} and ${next.name}`

    };

}


// ================================
// DISTANCE
// ================================

function calculateDistance(
    lat1,
    lon1,
    lat2,
    lon2
) {

    const R = 6371;

    const dLat =
        (lat2 - lat1)
        * Math.PI / 180;


    const dLon =
        (lon2 - lon1)
        * Math.PI / 180;


    const a =
        Math.sin(dLat / 2) *
        Math.sin(dLat / 2) +

        Math.cos(
            lat1 * Math.PI / 180
        ) *

        Math.cos(
            lat2 * Math.PI / 180
        ) *

        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);


    const c =
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );


    return R * c;

}


// ================================
// SIMULATION
// ================================

function startSimulation() {

    clearInterval(simulationTimer);


    simulationTimer =
        setInterval(() => {

            const bus =
                buses[selectedBus];


            busPosition += 0.025;


            const maxPosition =
                bus.stops.length - 1;


            if (
                busPosition >=
                maxPosition
            ) {

                busPosition = 0;

            }


            bus.position =
                busPosition;


            updateBus(bus);


        }, 2000);

}


// ================================
// STOPS UI
// ================================

function renderStops(bus) {

    const container =
        document.getElementById(
            "stopsList"
        );


    container.innerHTML = "";


    const currentIndex =
        Math.floor(busPosition);


    bus.stops.forEach(
        (stop, index) => {

            let status =
                "Upcoming";


            if (
                index < currentIndex
            ) {

                status = "Passed";

            }


            if (
                index === currentIndex
            ) {

                status = "Current";

            }


            const div =
                document.createElement(
                    "div"
                );


            div.className =
                "stop " +
                (
                    index === currentIndex
                    ? "active-stop"
                    : ""
                );


            div.innerHTML = `

                <div class="stop-marker">
                    ${index + 1}
                </div>

                <div>

                    <div class="stop-name">
                        ${stop.name}
                    </div>

                    <div class="stop-status">
                        ${status}
                    </div>

                </div>

            `;


            container.appendChild(div);

        }
    );

}


// ================================
// BUS SELECT
// ================================

document.getElementById(
    "busSelect"
).addEventListener(
    "change",
    function () {

        loadBus(this.value);

    }
);


// ================================
// ONLINE / OFFLINE
// ================================

function updateConnectionStatus() {

    const dot =
        document.getElementById(
            "connectionDot"
        );


    const text =
        document.getElementById(
            "connectionText"
        );


    const notice =
        document.getElementById(
            "offlineNotice"
        );


    if (navigator.onLine) {

        dot.style.background =
            "#22c55e";

        text.textContent =
            "Online";

        notice.classList.remove(
            "show"
        );

    } else {

        dot.style.background =
            "#f97316";

        text.textContent =
            "Offline";

        notice.classList.add(
            "show"
        );

    }

}


window.addEventListener(
    "online",
    updateConnectionStatus
);


window.addEventListener(
    "offline",
    updateConnectionStatus
);


// ================================
// SERVICE WORKER
// ================================

if (
    "serviceWorker"
    in navigator
) {

    window.addEventListener(
        "load",
        () => {

            navigator.serviceWorker
                .register("sw.js")
                .then(() => {

                    console.log(
                        "Service Worker registered."
                    );

                })
                .catch(error => {

                    console.error(
                        "Service Worker error:",
                        error
                    );

                });

        }
    );

}


// ================================
// START
// ================================

updateConnectionStatus();

loadBus("BUS-01");

startSimulation();