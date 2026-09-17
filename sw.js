const CACHE_NAME = "busradar-ph-v2";

const FILES_TO_CACHE = [
    "./",
    "./index.html",
    "./style.css",
    "./app.js",
    "./manifest.json",
    "./icon.svg"
];


/* =========================================
   INSTALL
   ========================================= */

self.addEventListener("install", function (event) {

    console.log(
        "BusRadar PH Service Worker installing..."
    );


    event.waitUntil(

        caches
            .open(CACHE_NAME)
            .then(function (cache) {

                return cache.addAll(
                    FILES_TO_CACHE
                );

            })

    );


    self.skipWaiting();

});


/* =========================================
   ACTIVATE
   ========================================= */

self.addEventListener("activate", function (event) {

    console.log(
        "BusRadar PH Service Worker activated."
    );


    event.waitUntil(

        caches
            .keys()
            .then(function (cacheNames) {

                return Promise.all(

                    cacheNames
                        .filter(function (cacheName) {

                            return (
                                cacheName !==
                                CACHE_NAME
                            );

                        })
                        .map(function (cacheName) {

                            return caches.delete(
                                cacheName
                            );

                        })

                );

            })
            .then(function () {

                return self.clients.claim();

            })

    );

});


/* =========================================
   FETCH
   ========================================= */

self.addEventListener("fetch", function (event) {

    const request =
        event.request;


    /*
       Do not interfere with
       external Leaflet and map requests.
    */

    if (
        request.url.includes(
            "unpkg.com"
        ) ||
        request.url.includes(
            "openstreetmap.org"
        )
    ) {

        return;

    }


    /*
       App files:
       Network first, then cache.
    */

    event.respondWith(

        fetch(request)
            .then(function (response) {

                if (
                    response &&
                    response.status === 200
                ) {

                    const responseClone =
                        response.clone();


                    caches
                        .open(CACHE_NAME)
                        .then(function (cache) {

                            cache.put(
                                request,
                                responseClone
                            );

                        });

                }


                return response;

            })
            .catch(function () {

                return caches
                    .match(request)
                    .then(function (cached) {

                        if (cached) {
                            return cached;
                        }


                        if (
                            request.mode ===
                            "navigate"
                        ) {

                            return caches.match(
                                "./index.html"
                            );

                        }

                    });

            })

    );

});