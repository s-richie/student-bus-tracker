// ========================================
// BUSRADAR PH
// SERVICE WORKER
// ========================================

const CACHE_NAME = "busradar-ph-v1";


const FILES_TO_CACHE = [

    "./",

    "./index.html",

    "./style.css",

    "./app.js",

    "./manifest.json",

    "./icon.svg"

];


// ========================================
// INSTALL
// ========================================

self.addEventListener(
    "install",
    event => {

        console.log(
            "BusRadar Service Worker installing..."
        );


        event.waitUntil(

            caches
                .open(CACHE_NAME)
                .then(cache => {

                    return cache.addAll(
                        FILES_TO_CACHE
                    );

                })

        );


        self.skipWaiting();

    }
);


// ========================================
// ACTIVATE
// ========================================

self.addEventListener(
    "activate",
    event => {

        console.log(
            "BusRadar Service Worker activated."
        );


        event.waitUntil(

            caches
                .keys()
                .then(cacheNames => {

                    return Promise.all(

                        cacheNames
                            .filter(
                                cacheName =>
                                    cacheName !==
                                    CACHE_NAME
                            )
                            .map(
                                cacheName =>
                                    caches.delete(
                                        cacheName
                                    )
                            )

                    );

                })

        );


        self.clients.claim();

    }
);


// ========================================
// FETCH
// ========================================

self.addEventListener(
    "fetch",
    event => {

        /*
            IMPORTANT:

            OpenStreetMap map tiles and
            Leaflet CDN files are NOT
            cached here.

            This means the actual map
            may not be visible when
            completely offline.

            The app itself and cached
            bus information can still
            work offline.
        */


        const request =
            event.request;


        // Ignore external map/CDN requests

        if (

            request.url.includes(
                "tile.openstreetmap.org"
            )

            ||

            request.url.includes(
                "unpkg.com"
            )

        ) {

            return;

        }


        // Cache first

        event.respondWith(

            caches
                .match(request)
                .then(cachedResponse => {

                    if (
                        cachedResponse
                    ) {

                        return cachedResponse;

                    }


                    // If not cached,
                    // try internet

                    return fetch(request)

                        .then(
                            networkResponse => {

                                return networkResponse;

                            }
                        )

                        .catch(() => {

                            /*
                                If internet is
                                unavailable,
                                return index.html
                                for navigation.
                            */

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

    }
);