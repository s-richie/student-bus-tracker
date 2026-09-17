"use strict";

/* =========================================
   BUSRADAR PH
   ========================================= */

const STORAGE_KEY = "busradar_ph_bus_positions";
const LOCATION_KEY = "busradar_ph_user_location";

const DEFAULT_CENTER = [15.4800, 120.5950];
const DEFAULT_ZOOM = 13;
const UPDATE_INTERVAL = 5000;


/* =========================================
   DOM ELEMENTS
   ========================================= */

let busList = null;


/* =========================================
   APP STATE
   ========================================= */

let map = null;
let buses = [];
let userLocation = null;
let userMarker = null;
let busMarkers = {};

let selectedOperator = "ALL";
let sortMode = "distance";

let demoTimer = null;
let isUsingRealData = false;


/* =========================================
   DEMO BUSES
   ========================================= */

const DEMO_BUSES = [
    {
        id: "VIC-101",
        operator: "VICTORY",
        operatorName: "Victory Liner",
        route: "Tarlac → Manila",
        direction: "Southbound",
        lat: 15.4820,
        lng: 120.5960,
        speed: 42,
        updatedAt: Date.now(),
        demo: true
    },

    {
        id: "PAR-204",
        operator: "PARTAS",
        operatorName: "Partas",
        route: "Tarlac → Baguio",
        direction: "Northbound",
        lat: 15.4700,
        lng: 120.6030,
        speed: 38,
        updatedAt: Date.now(),
        demo: true
    },

    {
        id: "PIT-033",
        operator: "PITCO",
        operatorName: "PITCO",
        route: "Tarlac → Pangasinan",
        direction: "Northbound",
        lat: 15.4755,
        lng: 120.5900,
        speed: 35,
        updatedAt: Date.now(),
        demo: true
    },

    {
        id: "LUP-008",
        operator: "LUPA",
        operatorName: "Lupa Bus",
        route: "Tarlac Local Route",
        direction: "Eastbound",
        lat: 15.4880,
        lng: 120.6010,
        speed: 30,
        updatedAt: Date.now(),
        demo: true
    }
];


/* =========================================
   START APP
   ========================================= */

document.addEventListener("DOMContentLoaded", function () {

    console.log("BusRadar PH starting...");

    busList = document.getElementById("busList");

    setupButtons();

    loadLocation();

    loadBuses();

    updateConnectionStatus();

    initMap();

    renderAll();

    startDemoMovement();

    registerServiceWorker();

});


/* =========================================
   BUTTONS
   ========================================= */

function setupButtons() {

    const operatorButtons =
        document.querySelectorAll(".operator-btn");

    console.log(
        "Operator buttons found:",
        operatorButtons.length
    );


    operatorButtons.forEach(function (button) {

        button.addEventListener("click", function (event) {

            event.preventDefault();

            event.stopPropagation();

            const operator =
                this.dataset.operator;

            if (!operator) {
                return;
            }

            selectedOperator = operator;

            operatorButtons.forEach(function (btn) {
                btn.classList.remove("active");
            });

            this.classList.add("active");

            renderMap();

            renderList();

            updateBusCount();

        });

    });


    const locationButton =
        document.getElementById("locationBtn");

    if (locationButton) {

        locationButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                locateUser();

            }
        );

    }


    const overlayButton =
        document.getElementById("overlayLocationBtn");

    if (overlayButton) {

        overlayButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                locateUser();

            }
        );

    }


    const centerButton =
        document.getElementById("centerLocationBtn");

    if (centerButton) {

        centerButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                centerOnUser();

            }
        );

    }


    const refreshButton =
        document.getElementById("refreshBtn");

    if (refreshButton) {

        refreshButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                refreshBuses();

            }
        );

    }


    const sortSelect =
        document.getElementById("sortSelect");

    if (sortSelect) {

        sortSelect.addEventListener(
            "change",
            function () {

                sortMode = this.value;

                renderList();

            }
        );

    }


    window.addEventListener(
        "online",
        updateConnectionStatus
    );

    window.addEventListener(
        "offline",
        updateConnectionStatus
    );

}


/* =========================================
   CONNECTION
   ========================================= */

function updateConnectionStatus() {

    const status =
        document.getElementById(
            "connectionStatus"
        );

    const text =
        document.getElementById(
            "connectionText"
        );

    if (!status || !text) {
        return;
    }


    if (navigator.onLine) {

        status.classList.remove("offline");

        status.classList.add("online");

        text.textContent = "Online";

    } else {

        status.classList.remove("online");

        status.classList.add("offline");

        text.textContent = "Offline";

    }

}


/* =========================================
   MAP
   ========================================= */

function initMap() {

    const mapElement =
        document.getElementById("map");

    if (!mapElement) {
        return;
    }


    if (typeof L === "undefined") {

        console.warn(
            "Leaflet is unavailable."
        );

        return;
    }


    try {

        map =
            L.map(
                mapElement
            ).setView(
                DEFAULT_CENTER,
                DEFAULT_ZOOM
            );


        L.tileLayer(
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            {
                maxZoom: 19,
                attribution:
                    "&copy; OpenStreetMap contributors"
            }
        ).addTo(map);


        setTimeout(function () {

            map.invalidateSize();

        }, 300);


    } catch (error) {

        console.error(
            "Map initialization failed:",
            error
        );

        map = null;

    }

}


/* =========================================
   LOAD BUSES
   ========================================= */

function loadBuses() {

    try {

        const saved =
            localStorage.getItem(
                STORAGE_KEY
            );


        if (saved) {

            const parsed =
                JSON.parse(saved);


            if (
                Array.isArray(parsed) &&
                parsed.length > 0
            ) {

                buses = parsed;

                return;

            }

        }

    } catch (error) {

        console.warn(
            "Could not load saved buses.",
            error
        );

    }


    buses = cloneDemoBuses();

    saveBuses();

}


/* =========================================
   SAVE BUSES
   ========================================= */

function saveBuses() {

    try {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(buses)
        );

    } catch (error) {

        console.warn(
            "Could not save buses.",
            error
        );

    }

}


/* =========================================
   CLONE DEMO
   ========================================= */

function cloneDemoBuses() {

    return DEMO_BUSES.map(function (bus) {

        return {
            ...bus,
            updatedAt: Date.now()
        };

    });

}


/* =========================================
   LOCATION
   ========================================= */

function loadLocation() {

    try {

        const saved =
            localStorage.getItem(
                LOCATION_KEY
            );

        if (!saved) {
            return;
        }

        const parsed =
            JSON.parse(saved);

        if (
            parsed &&
            typeof parsed.lat === "number" &&
            typeof parsed.lng === "number"
        ) {

            userLocation = parsed;

        }

    } catch (error) {

        console.warn(
            "Could not load location."
        );

    }

}


/* =========================================
   LOCATE USER
   ========================================= */

function locateUser() {

    if (!navigator.geolocation) {

        showLocationMessage(
            "Geolocation is not supported by this browser."
        );

        return;

    }


    const button =
        document.getElementById(
            "locationBtn"
        );


    if (button) {

        button.disabled = true;

        button.textContent =
            "📍 Finding...";

    }


    showLocationMessage(
        "Finding your location..."
    );


    navigator.geolocation.getCurrentPosition(

        function (position) {

            userLocation = {

                lat:
                    position.coords.latitude,

                lng:
                    position.coords.longitude,

                accuracy:
                    position.coords.accuracy,

                updatedAt:
                    Date.now()

            };


            try {

                localStorage.setItem(
                    LOCATION_KEY,
                    JSON.stringify(
                        userLocation
                    )
                );

            } catch (error) {

                console.warn(
                    "Could not save location."
                );

            }


            renderUserMarker();

            renderList();

            updateBusCount();


            if (map) {

                map.setView(
                    [
                        userLocation.lat,
                        userLocation.lng
                    ],
                    15
                );

            }


            hideMapOverlay();


            showLocationMessage(
                "Location found • Accuracy ±" +
                Math.round(
                    userLocation.accuracy
                ) +
                " m"
            );


            if (button) {

                button.disabled = false;

                button.textContent =
                    "📍 Update My Location";

            }

        },


        function (error) {

            console.warn(
                "Location error:",
                error
            );


            let message =
                "Unable to get your location.";


            if (error.code === 1) {

                message =
                    "Location permission was denied.";

            } else if (error.code === 2) {

                message =
                    "Your location could not be determined.";

            } else if (error.code === 3) {

                message =
                    "Location request timed out.";

            }


            showLocationMessage(
                message
            );


            if (button) {

                button.disabled = false;

                button.textContent =
                    "📍 Try Again";

            }

        },


        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 30000
        }

    );

}


/* =========================================
   USER MARKER
   ========================================= */

function renderUserMarker() {

    if (!map || !userLocation) {
        return;
    }


    const icon =
        L.divIcon({

            className: "",

            html:
                '<div class="user-marker"></div>',

            iconSize: [18,18],

            iconAnchor: [9,9]

        });


    if (userMarker) {

        userMarker.setLatLng(
            [
                userLocation.lat,
                userLocation.lng
            ]
        );

        userMarker.setIcon(icon);

        return;

    }


    userMarker =
        L.marker(
            [
                userLocation.lat,
                userLocation.lng
            ],
            {
                icon: icon,
                zIndexOffset: 1000
            }
        )
        .addTo(map)
        .bindPopup(
            "<strong>📍 Your Location</strong>"
        );

}


/* =========================================
   CENTER
   ========================================= */

function centerOnUser() {

    if (!userLocation) {

        locateUser();

        return;

    }


    if (!map) {
        return;
    }


    map.setView(
        [
            userLocation.lat,
            userLocation.lng
        ],
        15,
        {
            animate: true
        }
    );


    renderUserMarker();

}


/* =========================================
   FILTER
   ========================================= */

function getFilteredBuses() {

    if (selectedOperator === "ALL") {

        return buses.slice();

    }


    return buses.filter(function (bus) {

        return (
            bus.operator ===
            selectedOperator
        );

    });

}


/* =========================================
   SORT
   ========================================= */

function getSortedBuses() {

    const list =
        getFilteredBuses();


    if (sortMode === "operator") {

        return list.sort(function (a,b) {

            return (
                (
                    a.operatorName ||
                    a.operator ||
                    ""
                )
                .localeCompare(
                    b.operatorName ||
                    b.operator ||
                    ""
                )
            );

        });

    }


    if (sortMode === "speed") {

        return list.sort(function (a,b) {

            return (
                Number(b.speed || 0) -
                Number(a.speed || 0)
            );

        });

    }


    if (
        sortMode === "distance" &&
        userLocation
    ) {

        return list.sort(function (a,b) {

            const distanceA =
                distanceKm(
                    userLocation.lat,
                    userLocation.lng,
                    a.lat,
                    a.lng
                );


            const distanceB =
                distanceKm(
                    userLocation.lat,
                    userLocation.lng,
                    b.lat,
                    b.lng
                );


            return distanceA - distanceB;

        });

    }


    return list;

}


/* =========================================
   RENDER ALL
   ========================================= */

function renderAll() {

    renderMap();

    renderUserMarker();

    renderList();

    updateBusCount();

}


/* =========================================
   RENDER MAP
   ========================================= */

function renderMap() {

    if (!map) {
        return;
    }


    const visibleBuses =
        getFilteredBuses();


    const visibleIds = {};


    visibleBuses.forEach(function (bus) {

        visibleIds[bus.id] = true;


        const icon =
            createBusIcon(bus);


        if (busMarkers[bus.id]) {

            busMarkers[bus.id].setLatLng(
                [
                    bus.lat,
                    bus.lng
                ]
            );

            busMarkers[bus.id].setIcon(icon);

            busMarkers[bus.id]
                .setPopupContent(
                    createPopup(bus)
                );

        } else {

            const marker =
                L.marker(
                    [
                        bus.lat,
                        bus.lng
                    ],
                    {
                        icon: icon
                    }
                )
                .addTo(map);


            marker.bindPopup(
                createPopup(bus)
            );


            marker.on(
                "click",
                function () {

                    highlightBus(
                        bus.id
                    );

                }
            );


            busMarkers[bus.id] =
                marker;

        }

    });


    Object.keys(
        busMarkers
    ).forEach(function (id) {

        if (!visibleIds[id]) {

            map.removeLayer(
                busMarkers[id]
            );

            delete busMarkers[id];

        }

    });

}


/* =========================================
   BUS ICON
   ========================================= */

function createBusIcon(bus) {

    const className =
        bus.demo
            ? "bus-marker demo-marker"
            : "bus-marker";


    return L.divIcon({

        className: "",

        html:
            '<div class="' +
            className +
            '">🚌</div>',

        iconSize: [38,38],

        iconAnchor: [19,19],

        popupAnchor: [0,-20]

    });

}


/* =========================================
   POPUP
   ========================================= */

function createPopup(bus) {

    let distance =
        "Location not set";


    if (userLocation) {

        distance =
            formatDistance(
                distanceKm(
                    userLocation.lat,
                    userLocation.lng,
                    bus.lat,
                    bus.lng
                )
            );

    }


    return `
        <div style="
            min-width:200px;
            font-family:Arial,sans-serif;
        ">

            <strong>
                🚌 ${escapeHtml(bus.id)}
            </strong>

            <div style="
                margin-top:5px;
                color:#555;
                font-size:12px;
            ">
                ${escapeHtml(
                    bus.operatorName ||
                    bus.operator
                )}
            </div>

            <hr>

            <div>
                <strong>Route:</strong>
                ${escapeHtml(
                    bus.route
                )}
            </div>

            <div>
                <strong>Direction:</strong>
                ${escapeHtml(
                    bus.direction
                )}
            </div>

            <div>
                <strong>Speed:</strong>
                ${Number(
                    bus.speed || 0
                )} km/h
            </div>

            <div>
                <strong>Distance:</strong>
                ${distance}
            </div>

            <div style="
                margin-top:8px;
                font-size:10px;
                font-weight:bold;
            ">
                ${bus.demo
                    ? "DEMO POSITION"
                    : "LIVE GPS"}
            </div>

        </div>
    `;

}


/* =========================================
   BUS LIST
   ========================================= */

function renderList() {

    if (!busList) {

        console.warn(
            "busList element not found."
        );

        return;

    }


    const list =
        getSortedBuses();


    if (list.length === 0) {

        busList.innerHTML = `
            <div class="empty-state">

                <div class="empty-icon">
                    🔎
                </div>

                <h4>
                    No buses found
                </h4>

                <p>
                    There are no buses available
                    for this operator.
                </p>

            </div>
        `;

        return;

    }


    busList.innerHTML =
        list.map(function (bus,index) {

            return createBusCard(
                bus,
                index
            );

        }).join("");


    document
        .querySelectorAll(".bus-card")
        .forEach(function (card) {

            card.addEventListener(
                "click",
                function () {

                    focusBus(
                        this.dataset.busId
                    );

                }
            );

        });

}


/* =========================================
   BUS CARD
   ========================================= */

function createBusCard(bus,index) {

    let distance = "—";


    if (userLocation) {

        distance =
            formatDistance(
                distanceKm(
                    userLocation.lat,
                    userLocation.lng,
                    bus.lat,
                    bus.lng
                )
            );

    }


    return `
        <article
            class="bus-card"
            data-bus-id="${escapeHtml(bus.id)}"
        >

            <div class="bus-card-top">

                <div class="bus-main">

                    <div class="bus-card-icon">
                        🚌
                    </div>

                    <div>

                        <h4>
                            ${escapeHtml(
                                bus.id
                            )}
                        </h4>

                        <div class="bus-operator">
                            ${escapeHtml(
                                bus.operatorName ||
                                bus.operator
                            )}
                        </div>

                    </div>

                </div>

                ${
                    bus.demo
                    ? '<span class="demo-badge">DEMO</span>'
                    : '<span class="live-badge">LIVE</span>'
                }

            </div>


            <div class="bus-details">

                <div class="detail-item">

                    <span>
                        Distance
                    </span>

                    <strong>
                        ${distance}
                    </strong>

                </div>


                <div class="detail-item">

                    <span>
                        Speed
                    </span>

                    <strong>
                        ${Number(
                            bus.speed || 0
                        )} km/h
                    </strong>

                </div>


                <div class="detail-item">

                    <span>
                        Direction
                    </span>

                    <strong>
                        ${escapeHtml(
                            bus.direction || "—"
                        )}
                    </strong>

                </div>

            </div>

        </article>
    `;

}


/* =========================================
   FOCUS BUS
   ========================================= */

function focusBus(id) {

    const bus =
        buses.find(function (item) {

            return item.id === id;

        });


    if (!bus || !map) {
        return;
    }


    map.setView(
        [
            bus.lat,
            bus.lng
        ],
        16,
        {
            animate: true
        }
    );


    const marker =
        busMarkers[id];


    if (marker) {

        marker.openPopup();

    }

}


/* =========================================
   HIGHLIGHT
   ========================================= */

function highlightBus(id) {

    document
        .querySelectorAll(".bus-card")
        .forEach(function (card) {

            card.style.outline =
                "none";

            if (
                card.dataset.busId === id
            ) {

                card.style.outline =
                    "2px solid rgba(49,136,255,.6)";

            }

        });

}


/* =========================================
   COUNT
   ========================================= */

function updateBusCount() {

    const element =
        document.getElementById(
            "busCount"
        );


    if (!element) {
        return;
    }


    const count =
        getFilteredBuses().length;


    element.textContent =
        count +
        (
            count === 1
                ? " bus"
                : " buses"
        );

}


/* =========================================
   REFRESH
   ========================================= */

async function refreshBuses() {

    const button =
        document.getElementById(
            "refreshBtn"
        );


    if (button) {

        button.disabled = true;

        button.textContent =
            "↻ Updating...";

    }


    await new Promise(function (resolve) {

        setTimeout(resolve, 500);

    });


    if (!isUsingRealData) {

        buses =
            buses.map(function (bus) {

                if (!bus.demo) {
                    return bus;
                }

                return {
                    ...bus,
                    updatedAt: Date.now()
                };

            });

        saveBuses();

    }


    renderAll();


    if (button) {

        button.disabled = false;

        button.textContent =
            "↻ Refresh";

    }

}


/* =========================================
   DEMO MOVEMENT
   ========================================= */

function startDemoMovement() {

    stopDemoMovement();


    demoTimer =
        setInterval(function () {

            if (isUsingRealData) {
                return;
            }


            if (!navigator.onLine) {
                return;
            }


            buses =
                buses.map(function (bus) {

                    if (!bus.demo) {
                        return bus;
                    }


                    const movement =
                        0.00008;


                    return {
                        ...bus,

                        lat:
                            bus.lat +
                            (
                                Math.random() -
                                .5
                            ) *
                            movement,

                        lng:
                            bus.lng +
                            (
                                Math.random() -
                                .5
                            ) *
                            movement,

                        speed:
                            Math.max(
                                0,
                                Math.round(
                                    bus.speed +
                                    (
                                        Math.random() -
                                        .5
                                    ) *
                                    4
                                )
                            ),

                        updatedAt:
                            Date.now(),

                        demo: true

                    };

                });


            saveBuses();

            renderMap();

            renderList();

            updateBusCount();

        }, UPDATE_INTERVAL);

}


/* =========================================
   STOP MOVEMENT
   ========================================= */

function stopDemoMovement() {

    if (demoTimer) {

        clearInterval(
            demoTimer
        );

        demoTimer = null;

    }

}


/* =========================================
   DISTANCE
   ========================================= */

function distanceKm(
    lat1,
    lng1,
    lat2,
    lng2
) {

    const radius = 6371;


    const dLat =
        toRadians(
            lat2 - lat1
        );


    const dLng =
        toRadians(
            lng2 - lng1
        );


    const a =
        Math.sin(dLat / 2) ** 2 +

        Math.cos(
            toRadians(lat1)
        ) *

        Math.cos(
            toRadians(lat2)
        ) *

        Math.sin(dLng / 2) ** 2;


    const c =
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );


    return radius * c;

}


/* =========================================
   RADIANS
   ========================================= */

function toRadians(value) {

    return value *
        Math.PI /
        180;

}


/* =========================================
   FORMAT DISTANCE
   ========================================= */

function formatDistance(km) {

    if (!Number.isFinite(km)) {
        return "—";
    }


    if (km < 1) {

        return Math.round(
            km * 1000
        ) + " m";

    }


    return km.toFixed(1) +
        " km";

}


/* =========================================
   LOCATION MESSAGE
   ========================================= */

function showLocationMessage(message) {

    const element =
        document.getElementById(
            "locationMessage"
        );


    if (element) {

        element.textContent =
            message;

    }

}


/* =========================================
   MAP OVERLAY
   ========================================= */

function hideMapOverlay() {

    const overlay =
        document.getElementById(
            "mapOverlay"
        );


    if (overlay) {

        overlay.classList.add(
            "hidden"
        );

    }

}


/* =========================================
   ESCAPE HTML
   ========================================= */

function escapeHtml(value) {

    return String(value)
        .replaceAll("&","&amp;")
        .replaceAll("<","&lt;")
        .replaceAll(">","&gt;")
        .replaceAll('"',"&quot;")
        .replaceAll("'","&#039;");

}


/* =========================================
   SERVICE WORKER
   ========================================= */

function registerServiceWorker() {

    if (
        !"serviceWorker" in navigator
    ) {
        return;
    }


    window.addEventListener(
        "load",
        function () {

            navigator.serviceWorker
                .register("./sw.js")
                .then(function (registration) {

                    console.log(
                        "Service Worker registered:",
                        registration.scope
                    );

                })
                .catch(function (error) {

                    console.warn(
                        "Service Worker error:",
                        error
                    );

                });

        }
    );

}