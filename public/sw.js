/// <reference lib="webworker" />

const CACHE_NAME = "nexo-v2";
const STATIC_CACHE = "nexo-static-v2";
const DYNAMIC_CACHE = "nexo-dynamic-v2";

// Critical routes to precache
const PRECACHE_ROUTES = ["/home", "/shopping", "/calendar"];

// Static assets patterns
const STATIC_PATTERNS = [
  /\/_next\/static\/.*/,
  /\.(?:js|css|woff2?|ttf|otf)$/,
  /\/icon-.*\.svg$/,
  /\/manifest\.json$/,
];

// Install - precache critical routes
self.addEventListener("install", (event) => {
  event.waitUntil(
    Promise.all([
      // Precache routes
      caches.open(CACHE_NAME).then((cache) =>
        cache.addAll(PRECACHE_ROUTES).catch(() => {
          // Ignore failures for individual routes
          console.log("Some routes failed to precache");
        })
      ),
    ])
  );
  self.skipWaiting();
});

// Activate - clean old caches
self.addEventListener("activate", (event) => {
  const currentCaches = [CACHE_NAME, STATIC_CACHE, DYNAMIC_CACHE];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => !currentCaches.includes(name))
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Helper: is static asset?
function isStaticAsset(url) {
  return STATIC_PATTERNS.some((pattern) => pattern.test(url.pathname));
}

// Helper: stale-while-revalidate
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => cachedResponse);

  return cachedResponse || fetchPromise;
}

// Helper: network first with cache fallback
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response("Offline", { status: 503 });
  }
}

// Helper: cache first with network fallback
async function cacheFirst(request, cacheName) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) return cachedResponse;

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    return new Response("Offline", { status: 503 });
  }
}

// Fetch handler
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET
  if (request.method !== "GET") return;

  // Skip external requests
  if (url.origin !== self.location.origin) return;

  // Skip API routes - always network
  if (url.pathname.startsWith("/api/")) return;

  // Static assets - cache first (immutable)
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Navigation - stale-while-revalidate for fast loads
  if (request.mode === "navigate") {
    event.respondWith(staleWhileRevalidate(request, CACHE_NAME));
    return;
  }

  // Everything else - network first
  event.respondWith(networkFirst(request, DYNAMIC_CACHE));
});

// Listen for skip waiting message
self.addEventListener("message", (event) => {
  if (event.data === "skipWaiting") {
    self.skipWaiting();
  }
});
