"use strict";

/* =========================================================
   BUSRADAR PH
   MAIN JAVASCRIPT
   ========================================================= */


/* =========================================================
   CONFIG
   ========================================================= */

const STORAGE_KEY =
    "busradar_ph_bus_positions";

const LOCATION_KEY =
    "busradar_ph_user_location";

const API_URL =
    "/api/buses";

const DEFAULT_CENTER =
    [15.4800, 120.5950];

const DEFAULT_ZOOM =
    13;

const UPDATE_INTERVAL =
    5000;


/* =========================================================
   APP STATE
   ========================================================= */

let map = null;

let buses = [];

let userLocation = null;

let userMarker = null;

let busMarkers = {};

let selectedOperator = "ALL";

let sortMode = "distance";

let demoTimer = null;

let isUsingRealData = false;

let busList = null;


/* =========================================================
   DEMO BUS DATA
   ========================================================= */

const DEMO_BUSES = [

    {
        id: "VIC-101",

        operator: "VICTORY",

        operatorName:
            "Victory Liner",

        route:
            "Tarlac → Manila",

        direction:
            "Southbound",

        lat: 15.4820,

        lng: 120.5960,

        speed: 42,

        updatedAt:
            Date.now(),

        demo: true
    },


    {
        id: "PAR-204",

        operator: "PARTAS",

        operatorName:
            "Partas",

        route:
            "Tarlac → Baguio",

        direction:
            "Northbound",

        lat: 15.4700,

        lng: 120.6030,

        speed: 38,

        updatedAt:
            Date.now(),

        demo: true
    },


    {
        id: "PIT-033",

        operator: "PITCO",

        operatorName:
            "PITCO",

        route:
            "Tarlac → Pangasinan",

        direction:
            "Northbound",

        lat: 15.4755,

        lng: 120.5900,

        speed: 35,

        updatedAt:
            Date.now(),

        demo: true
    },


    {
        id: "LUP-008",

        operator: "LUPA",

        operatorName:
            "Lupa Bus",

        route:
            "Tarlac Local Route",

        direction:
            "Eastbound",

        lat: 15.4880,

        lng: 120.6010,

        speed: 30,

        updatedAt:
            Date.now(),

        demo: true
    }

];


/* =========================================================
   INITIALIZE
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log(
            "BusRadar PH starting..."
        );


        busList =
            document.getElementById(
                "busList"
            );


        loadLocation();


        loadBuses();


        updateConnectionStatus();


        setupButtons();


        initMap();


        renderAll();


        startDemoMovement();


        /*
           Try API, but don't allow
           API failure to break the app.
        */

        tryRealApi();

    }
);


/* =========================================================
   BUTTON SETUP
   ========================================================= */

function setupButtons() {


    /* -----------------------------------------
       OPERATOR FILTER BUTTONS
    ------------------------------------------ */

    const operatorButtons =
        document.querySelectorAll(
            ".operator-btn"
        );


    console.log(
        "Operator buttons:",
        operatorButtons.length
    );


    operatorButtons.forEach(
        function (button) {

            button.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    event.stopPropagation();


                    const operator =
                        button.getAttribute(
                            "data-operator"
                        );


                    if (!operator) {
                        return;
                    }


                    selectedOperator =
                        operator;


                    operatorButtons.forEach(
                        function (btn) {

                            btn.classList.remove(
                                "active"
                            );

                        }
                    );


                    button.classList.add(
                        "active"
                    );


                    renderMap();

                    renderList();

                    updateBusCount();

                }
            );

        }
    );


    /* -----------------------------------------
       LOCATION BUTTON
    ------------------------------------------ */

    const locationButton =
        document.getElementById(
            "locationBtn"
        );


    if (locationButton) {

        locationButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                locateUser();

            }
        );

    }


    /* -----------------------------------------
       OVERLAY LOCATION BUTTON
    ------------------------------------------ */

    const overlayButton =
        document.getElementById(
            "overlayLocationBtn"
        );


    if (overlayButton) {

        overlayButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                locateUser();

            }
        );

    }


    /* -----------------------------------------
       CENTER BUTTON
    ------------------------------------------ */

    const centerButton =
        document.getElementById(
            "centerLocationBtn"
        );


    if (centerButton) {

        centerButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                centerOnUser();

            }
        );

    }


    /* -----------------------------------------
       REFRESH BUTTON
    ------------------------------------------ */

    const refreshButton =
        document.getElementById(
            "refreshBtn"
        );


    if (refreshButton) {

        refreshButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                refreshBuses();

            }
        );

    }


    /* -----------------------------------------
       SORT
    ------------------------------------------ */

    const sortSelect =
        document.getElementById(
            "sortSelect"
        );


    if (sortSelect) {

        sortSelect.addEventListener(
            "change",
            function () {

                sortMode =
                    this.value;


                renderList();

            }
        );

    }


    /* -----------------------------------------
       CONNECTION
    ------------------------------------------ */

    window.addEventListener(
        "online",
        updateConnectionStatus
    );


    window.addEventListener(
        "offline",
        updateConnectionStatus
    );

}


/* =========================================================
   CONNECTION STATUS
   ========================================================= */

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

        status.classList.remove(
            "offline"
        );

        status.classList.add(
            "online"
        );

        text.textContent =
            "Online";

    } else {

        status.classList.remove(
            "online"
        );

        status.classList.add(
            "offline"
        );

        text.textContent =
            "Offline";

    }

}


/* =========================================================
   MAP INITIALIZATION
   ========================================================= */

function initMap() {

    const mapElement =
        document.getElementById(
            "map"
        );


    if (!mapElement) {

        console.error(
            "Map element not found."
        );

        return;
    }


    if (
        typeof L === "undefined"
    ) {

        console.error(
            "Leaflet is not loaded."
        );

        return;
    }


    try {

        map =
            L.map(
                mapElement,
                {
                    zoomControl: true
                }
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


        setTimeout(
            function () {

                if (map) {

                    map.invalidateSize();

                }

            },
            250
        );


        console.log(
            "Map initialized."
        );

    } catch (error) {

        console.error(
            "Map initialization failed:",
            error
        );

        map = null;

    }

}


/* =========================================================
   LOAD BUSES
   ========================================================= */

function loadBuses() {

    try {

        const saved =
            localStorage.getItem(
                STORAGE_KEY
            );


        if (saved) {

            const parsed =
                JSON.parse(
                    saved
                );


            if (
                Array.isArray(parsed) &&
                parsed.length > 0
            ) {

                buses =
                    parsed;

                return;

            }

        }

    } catch (error) {

        console.warn(
            "Could not load saved buses.",
            error
        );

    }


    buses =
        cloneDemoBuses();


    saveBuses();

}


/* =========================================================
   SAVE BUSES
   ========================================================= */

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


/* =========================================================
   CLONE DEMO BUSES
   ========================================================= */

function cloneDemoBuses() {

    return DEMO_BUSES.map(
        function (bus) {

            return {
                ...bus,

                updatedAt:
                    Date.now()

            };

        }
    );

}


/* =========================================================
   LOAD LOCATION
   ========================================================= */

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
            JSON.parse(
                saved
            );


        if (
            parsed &&
            Number.isFinite(parsed.lat) &&
            Number.isFinite(parsed.lng)
        ) {

            userLocation =
                parsed;

        }

    } catch (error) {

        console.warn(
            "Could not load location.",
            error
        );

    }

}


/* =========================================================
   LOCATE USER
   ========================================================= */

function locateUser() {

    if (
        !navigator.geolocation
    ) {

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

        button.disabled =
            true;

        button.textContent =
            "📍 Finding...";

    }


    showLocationMessage(
        "Finding your location..."
    );


    navigator.geolocation.getCurrentPosition(

        function (position) {

            const latitude =
                position.coords.latitude;

            const longitude =
                position.coords.longitude;

            const accuracy =
                position.coords.accuracy;


            userLocation = {

                lat:
                    latitude,

                lng:
                    longitude,

                accuracy:
                    accuracy,

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
                        latitude,
                        longitude
                    ],
                    15,
                    {
                        animate: true
                    }
                );

            }


            hideMapOverlay();


            showLocationMessage(
                "Location found • Accuracy ±" +
                Math.round(
                    accuracy
                ) +
                " m"
            );


            if (button) {

                button.disabled =
                    false;

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


            if (
                error.code ===
                1
            ) {

                message =
                    "Location permission was denied. Please allow location access.";

            } else if (
                error.code ===
                2
            ) {

                message =
                    "Your location could not be determined.";

            } else if (
                error.code ===
                3
            ) {

                message =
                    "Location request timed out.";

            }


            showLocationMessage(
                message
            );


            if (button) {

                button.disabled =
                    false;

                button.textContent =
                    "📍 Use My Location";

            }

        },

        {
            enableHighAccuracy: true,

            timeout: 15000,

            maximumAge: 60000

        }

    );

}


/* =========================================================
   CENTER ON USER
   ========================================================= */

function centerOnUser() {

    if (
        !map
    ) {

        return;

    }


    if (
        !userLocation
    ) {

        showLocationMessage(
            "Use My Location first."
        );

        locateUser();

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

}


/* =========================================================
   RENDER EVERYTHING
   ========================================================= */

function renderAll() {

    renderMap();

    renderUserMarker();

    renderList();

    updateBusCount();

}


/* =========================================================
   FILTER BUSES
   ========================================================= */

function getFilteredBuses() {

    if (
        selectedOperator ===
        "ALL"
    ) {

        return [
            ...buses
        ];

    }


    return buses.filter(
        function (bus) {

            return (
                String(
                    bus.operator
                ).toUpperCase() ===
                selectedOperator
            );

        }
    );

}


/* =========================================================
   SORT BUSES
   ========================================================= */

function getSortedBuses() {

    const list =
        getFilteredBuses();


    if (
        sortMode ===
        "operator"
    ) {

        return list.sort(
            function (a, b) {

                return String(
                    a.operatorName ||
                    a.operator
                ).localeCompare(
                    String(
                        b.operatorName ||
                        b.operator
                    )
                );

            }
        );

    }


    if (
        sortMode ===
        "speed"
    ) {

        return list.sort(
            function (a, b) {

                return (
                    Number(b.speed || 0) -
                    Number(a.speed || 0)
                );

            }
        );

    }


    /*
       Default:
       nearest first
    */

    if (userLocation) {

        return list.sort(
            function (a, b) {

                return (
                    distanceKm(
                        userLocation.lat,
                        userLocation.lng,
                        a.lat,
                        a.lng
                    )
                    -
                    distanceKm(
                        userLocation.lat,
                        userLocation.lng,
                        b.lat,
                        b.lng
                    )
                );

            }
        );

    }


    return list;

}


/* =========================================================
   RENDER MAP
   ========================================================= */

function renderMap() {

    if (
        !map
    ) {

        return;

    }


    const visibleBuses =
        getFilteredBuses();


    const visibleIds = {};


    visibleBuses.forEach(
        function (bus) {

            visibleIds[
                bus.id
            ] = true;


            const icon =
                createBusIcon(
                    bus
                );


            if (
                busMarkers[
                    bus.id
                ]
            ) {

                busMarkers[
                    bus.id
                ].setLatLng(
                    [
                        bus.lat,
                        bus.lng
                    ]
                );


                busMarkers[
                    bus.id
                ].setIcon(
                    icon
                );


                busMarkers[
                    bus.id
                ].setPopupContent(
                    createPopup(
                        bus
                    )
                );

            } else {

                const marker =
                    L.marker(
                        [
                            bus.lat,
                            bus.lng
                        ],
                        {
                            icon:
                                icon
                        }
                    ).addTo(
                        map
                    );


                marker.bindPopup(
                    createPopup(
                        bus
                    )
                );


                marker.on(
                    "click",
                    function () {

                        highlightBus(
                            bus.id
                        );

                    }
                );


                busMarkers[
                    bus.id
                ] =
                    marker;

            }

        }
    );


    /*
       Remove old markers
    */

    Object.keys(
        busMarkers
    ).forEach(
        function (id) {

            if (
                !visibleIds[id]
            ) {

                map.removeLayer(
                    busMarkers[id]
                );

                delete busMarkers[id];

            }

        }
    );

}


/* =========================================================
   USER MARKER
   ========================================================= */

function renderUserMarker() {

    if (
        !map
    ) {

        return;

    }


    if (
        userMarker
    ) {

        map.removeLayer(
            userMarker
        );

        userMarker =
            null;

    }


    if (
        !userLocation
    ) {

        return;

    }


    const icon =
        L.divIcon({

            className:
                "",

            html:
                '<div class="user-marker"></div>',

            iconSize:
                [22, 22],

            iconAnchor:
                [11, 11]

        });


    userMarker =
        L.marker(
            [
                userLocation.lat,
                userLocation.lng
            ],
            {
                icon:
                    icon,

                interactive:
                    false
            }
        ).addTo(
            map
        );

}


/* =========================================================
   BUS ICON
   ========================================================= */

function createBusIcon(
    bus
) {

    const className =
        bus.demo
            ? "bus-marker demo-marker"
            : "bus-marker";


    return L.divIcon({

        className:
            "",

        html:
            '<div class="' +
            className +
            '">🚌</div>',

        iconSize:
            [38, 38],

        iconAnchor:
            [19, 19],

        popupAnchor:
            [0, -20]

    });

}


/* =========================================================
   POPUP
   ========================================================= */

function createPopup(
    bus
) {

    let distance =
        "Location not set";


    if (
        userLocation
    ) {

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


    const mode =
        bus.demo
            ? "DEMO POSITION"
            : "LIVE GPS";


    return `
        <div
            style="
                min-width:210px;
                font-family:Arial,sans-serif;
            "
        >

            <strong
                style="
                    font-size:15px;
                "
            >
                🚌 ${escapeHtml(bus.id)}
            </strong>


            <div
                style="
                    margin-top:5px;
                    color:#555;
                    font-size:12px;
                "
            >
                ${escapeHtml(
                    bus.operatorName ||
                    bus.operator ||
                    "Unknown Operator"
                )}
            </div>


            <hr
                style="
                    border:0;
                    border-top:1px solid #ddd;
                    margin:9px 0;
                "
            >


            <div
                style="
                    font-size:12px;
                    margin-bottom:4px;
                "
            >
                <strong>Route:</strong>
                ${escapeHtml(
                    bus.route ||
                    "Unknown"
                )}
            </div>


            <div
                style="
                    font-size:12px;
                    margin-bottom:4px;
                "
            >
                <strong>Direction:</strong>
                ${escapeHtml(
                    bus.direction ||
                    "Unknown"
                )}
            </div>


            <div
                style="
                    font-size:12px;
                    margin-bottom:4px;
                "
            >
                <strong>Speed:</strong>
                ${Number(
                    bus.speed || 0
                )} km/h
            </div>


            <div
                style="
                    font-size:12px;
                "
            >
                <strong>Distance:</strong>
                ${distance}
            </div>


            <div
                style="
                    margin-top:8px;
                    font-size:10px;
                    font-weight:bold;
                    color:#777;
                "
            >
                ${mode}
            </div>

        </div>
    `;

}


/* =========================================================
   RENDER BUS LIST
   ========================================================= */

function renderList() {

    if (
        !busList
    ) {

        busList =
            document.getElementById(
                "busList"
            );

    }


    if (
        !busList
    ) {

        return;

    }


    const list =
        getSortedBuses();


    if (
        list.length === 0
    ) {

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
        list.map(
            function (
                bus,
                index
            ) {

                return createBusCard(
                    bus,
                    index
                );

            }
        ).join("");


    /*
       Make cards clickable
    */

    document
        .querySelectorAll(
            ".bus-card"
        )
        .forEach(
            function (card) {

                card.addEventListener(
                    "click",
                    function () {

                        focusBus(
                            this.dataset.busId
                        );

                    }
                );

            }
        );

}


/* =========================================================
   BUS CARD
   ========================================================= */

function createBusCard(
    bus,
    index
) {

    let distance =
        "—";


    if (
        userLocation
    ) {

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


    const badge =
        bus.demo

            ? `
                <span class="demo-badge">
                    DEMO
                </span>
              `

            : `
                <span class="live-badge">
                    LIVE
                </span>
              `;


    return `

        <article
            class="bus-card"
            data-bus-id="${escapeHtml(bus.id)}"
            style="
                animation-delay:
                ${index * 0.04}s
            "
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
                                bus.operator ||
                                "Unknown Operator"
                            )}

                        </div>

                    </div>


                </div>


                ${badge}


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
                            bus.direction ||
                            "—"
                        )}
                    </strong>

                </div>


            </div>


            <div
                style="
                    margin-top:12px;
                    color:#70819a;
                    font-size:9px;
                "
            >

                📡 Updated
                ${formatUpdatedTime(
                    bus.updatedAt
                )}

            </div>


        </article>

    `;

}


/* =========================================================
   FOCUS BUS
   ========================================================= */

function focusBus(
    id
) {

    const bus =
        buses.find(
            function (item) {

                return (
                    item.id === id
                );

            }
        );


    if (
        !bus ||
        !map
    ) {

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


    if (
        marker
    ) {

        setTimeout(
            function () {

                marker.openPopup();

            },
            250
        );

    }


    highlightBus(
        id
    );

}


/* =========================================================
   HIGHLIGHT BUS
   ========================================================= */

function highlightBus(
    id
) {

    document
        .querySelectorAll(
            ".bus-card"
        )
        .forEach(
            function (card) {

                card.style.outline =
                    "none";

            }
        );


    const card =
        document.querySelector(
            '.bus-card[data-bus-id="' +
            CSS.escape(id) +
            '"]'
        );


    if (
        card
    ) {

        card.style.outline =
            "2px solid rgba(49,136,255,.6)";

        card.scrollIntoView(
            {
                behavior: "smooth",

                block: "nearest"
            }
        );

    }

}


/* =========================================================
   BUS COUNT
   ========================================================= */

function updateBusCount() {

    const countElement =
        document.getElementById(
            "busCount"
        );


    if (
        !countElement
    ) {

        return;

    }


    const count =
        getFilteredBuses().length;


    countElement.textContent =
        count +
        (
            count === 1
                ? " bus"
                : " buses"
        );

}


/* =========================================================
   REFRESH
   ========================================================= */

async function refreshBuses() {

    const button =
        document.getElementById(
            "refreshBtn"
        );


    if (
        button
    ) {

        button.disabled =
            true;

        button.textContent =
            "↻ Updating...";

    }


    try {

        const success =
            await tryRealApi();


        if (
            !success
        ) {

            /*
               Refresh demo data slightly
               instead of destroying it.
            */

            buses =
                buses.map(
                    function (bus) {

                        return {
                            ...bus,

                            updatedAt:
                                Date.now()
                        };

                    }
                );


            saveBuses();


            renderAll();

        }


    } catch (error) {

        console.error(
            "Refresh failed:",
            error
        );

    }


    if (
        button
    ) {

        button.disabled =
            false;

        button.textContent =
            "↻ Refresh";

    }

}


/* =========================================================
   REAL API
   ========================================================= */

async function tryRealApi() {

    if (
        !navigator.onLine
    ) {

        setDataStatus(
            "Offline mode",

            "Using cached bus positions saved on this device.",

            "CACHED"
        );

        return false;

    }


    try {

        const response =
            await fetch(
                API_URL,
                {
                    method:
                        "GET",

                    headers:
                        {
                            "Accept":
                                "application/json"
                        },

                    cache:
                        "no-store"
                }
            );


        if (
            !response.ok
        ) {

            throw new Error(
                "API unavailable"
            );

        }


        const data =
            await response.json();


        if (
            !Array.isArray(data) ||
            data.length === 0
        ) {

            throw new Error(
                "No bus data"
            );

        }


        const normalized =
            normalizeApiData(
                data
            );


        if (
            normalized.length === 0
        ) {

            throw new Error(
                "Invalid bus data"
            );

        }


        buses =
            normalized;


        isUsingRealData =
            true;


        saveBuses();


        renderAll();


        setDataStatus(
            "Live GPS data",

            "Bus positions are coming from the configured API.",

            "LIVE"
        );


        return true;

    } catch (error) {

        console.log(
            "Real API unavailable. Demo mode active."
        );


        isUsingRealData =
            false;


        setDataStatus(
            "Demo tracking mode",

            "The buses currently shown use simulated positions for development and testing.",

            "DEMO"
        );


        return false;

    }

}


/* =========================================================
   NORMALIZE API DATA
   ========================================================= */

function normalizeApiData(
    data
) {

    return data
        .map(
            function (item) {

                const lat =
                    Number(
                        item.lat
                    );


                const lng =
                    Number(
                        item.lng
                    );


                if (
                    !Number.isFinite(lat) ||
                    !Number.isFinite(lng)
                ) {

                    return null;

                }


                return {

                    id:
                        String(
                            item.id ||
                            "UNKNOWN"
                        ),

                    operator:
                        String(
                            item.operator ||
                            "UNKNOWN"
                        ).toUpperCase(),

                    operatorName:
                        String(
                            item.operatorName ||
                            item.operator ||
                            "Unknown Operator"
                        ),

                    route:
                        String(
                            item.route ||
                            "Unknown Route"
                        ),

                    direction:
                        String(
                            item.direction ||
                            "Unknown"
                        ),

                    lat:
                        lat,

                    lng:
                        lng,

                    speed:
                        Number(
                            item.speed || 0
                        ),

                    updatedAt:
                        Number(
                            item.updatedAt ||
                            Date.now()
                        ),

                    demo:
                        item.demo === true

                };

            }
        )
        .filter(
            Boolean
        );

}


/* =========================================================
   DATA STATUS
   ========================================================= */

function setDataStatus(
    title,
    message,
    badge
) {

    const titleElement =
        document.getElementById(
            "dataStatusTitle"
        );


    const textElement =
        document.getElementById(
            "dataStatusText"
        );


    const badgeElement =
        document.getElementById(
            "dataBadge"
        );


    if (
        titleElement
    ) {

        titleElement.textContent =
            title;

    }


    if (
        textElement
    ) {

        textElement.textContent =
            message;

    }


    if (
        badgeElement
    ) {

        badgeElement.textContent =
            badge;


        if (
            badge === "LIVE"
        ) {

            badgeElement.style.background =
                "rgba(54,217,139,.1)";

            badgeElement.style.color =
                "#36d98b";

        } else if (
            badge === "CACHED"
        ) {

            badgeElement.style.background =
                "rgba(49,136,255,.1)";

            badgeElement.style.color =
                "#7fb5ff";

        } else {

            badgeElement.style.background =
                "rgba(255,191,77,.1)";

            badgeElement.style.color =
                "#ffbf4d";

        }

    }

}


/* =========================================================
   DEMO MOVEMENT
   ========================================================= */

function startDemoMovement() {

    stopDemoMovement();


    demoTimer =
        setInterval(
            function () {

                if (
                    isUsingRealData
                ) {

                    return;

                }


                if (
                    !navigator.onLine
                ) {

                    return;

                }


                if (
                    buses.length === 0
                ) {

                    return;

                }


                buses =
                    buses.map(
                        function (bus) {

                            if (
                                !bus.demo
                            ) {

                                return bus;

                            }


                            /*
                               Small movement so
                               demo buses appear alive.
                            */

                            const movement =
                                0.00008;


                            const latChange =
                                (
                                    Math.random() -
                                    0.5
                                ) *
                                movement;


                            const lngChange =
                                (
                                    Math.random() -
                                    0.5
                                ) *
                                movement;


                            const speedChange =
                                (
                                    Math.random() -
                                    0.5
                                ) *
                                4;


                            return {

                                ...bus,

                                lat:
                                    bus.lat +
                                    latChange,

                                lng:
                                    bus.lng +
                                    lngChange,

                                speed:
                                    Math.max(
                                        0,
                                        Math.round(
                                            Number(
                                                bus.speed || 0
                                            ) +
                                            speedChange
                                        )
                                    ),

                                updatedAt:
                                    Date.now(),

                                demo:
                                    true

                            };

                        }
                    );


                saveBuses();


                renderMap();

                renderList();

                updateBusCount();

            },

            UPDATE_INTERVAL
        );

}


/* =========================================================
   STOP DEMO MOVEMENT
   ========================================================= */

function stopDemoMovement() {

    if (
        demoTimer
    ) {

        clearInterval(
            demoTimer
        );

        demoTimer =
            null;

    }

}


/* =========================================================
   DISTANCE
   ========================================================= */

function distanceKm(
    lat1,
    lng1,
    lat2,
    lng2
) {

    const radius =
        6371;


    const dLat =
        toRadians(
            lat2 - lat1
        );


    const dLng =
        toRadians(
            lng2 - lng1
        );


    const a =
        Math.sin(
            dLat / 2
        ) *
        Math.sin(
            dLat / 2
        ) +

        Math.cos(
            toRadians(lat1)
        ) *

        Math.cos(
            toRadians(lat2)
        ) *

        Math.sin(
            dLng / 2
        ) *

        Math.sin(
            dLng / 2
        );


    const c =
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );


    return (
        radius * c
    );

}


/* =========================================================
   RADIANS
   ========================================================= */

function toRadians(
    value
) {

    return (
        value *
        Math.PI /
        180
    );

}


/* =========================================================
   FORMAT DISTANCE
   ========================================================= */

function formatDistance(
    km
) {

    if (
        !Number.isFinite(km)
    ) {

        return "—";

    }


    if (
        km < 1
    ) {

        return (
            Math.round(
                km * 1000
            ) +
            " m"
        );

    }


    return (
        km.toFixed(1) +
        " km"
    );

}


/* =========================================================
   FORMAT TIME
   ========================================================= */

function formatUpdatedTime(
    timestamp
) {

    if (
        !timestamp
    ) {

        return "unknown";

    }


    const seconds =
        Math.max(
            0,

            Math.floor(
                (
                    Date.now() -
                    Number(timestamp)
                ) /
                1000
            )
        );


    if (
        seconds < 5
    ) {

        return "just now";

    }


    if (
        seconds < 60
    ) {

        return (
            seconds +
            "s ago"
        );

    }


    const minutes =
        Math.floor(
            seconds / 60
        );


    if (
        minutes < 60
    ) {

        return (
            minutes +
            "m ago"
        );

    }


    const hours =
        Math.floor(
            minutes / 60
        );


    return (
        hours +
        "h ago"
    );

}


/* =========================================================
   LOCATION MESSAGE
   ========================================================= */

function showLocationMessage(
    message
) {

    const element =
        document.getElementById(
            "locationMessage"
        );


    if (
        element
    ) {

        element.textContent =
            message;

    }

}


/* =========================================================
   MAP OVERLAY
   ========================================================= */

function hideMapOverlay() {

    const overlay =
        document.getElementById(
            "mapOverlay"
        );


    if (
        overlay
    ) {

        overlay.classList.add(
            "hidden"
        );

    }

}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHtml(
    value
) {

    return String(
        value ?? ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}


/* =========================================================
   SERVICE WORKER
   ========================================================= */

if (
    "serviceWorker" in navigator
) {

    window.addEventListener(
        "load",
        function () {

            navigator.serviceWorker
                .register(
                    "./sw.js"
                )
                .then(
                    function (
                        registration
                    ) {

                        console.log(
                            "Service Worker registered:",
                            registration.scope
                        );

                    }
                )
                .catch(
                    function (
                        error
                    ) {

                        console.warn(
                            "Service Worker error:",
                            error
                        );

                    }
                );

        }
    );

}