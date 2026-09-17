const CACHE = "fiera-scan-v12";
// Base = cartella dove vive questo sw.js (es. "/" a radice, o "/fiera-scan/" su GitHub Pages
// project page) — calcolata dal proprio URL cosi' funziona a qualunque profondita', senza
// dover sapere in anticipo dove verra' pubblicata l'app.
const BASE = self.location.pathname.replace(/sw\.js$/, "");
const SHELL = [BASE, BASE + "index.html", BASE + "manifest.json",
  BASE + "icons/icon-192.png", BASE + "icons/icon-512.png", BASE + "icons/apple-touch-icon.png",
  BASE + "vendor/tesseract/tesseract.min.js", BASE + "vendor/tesseract/worker.min.js",
  BASE + "vendor/tesseract/tesseract-core-lstm.js", BASE + "vendor/tesseract/tesseract-core-lstm.wasm",
  BASE + "vendor/tesseract/eng.traineddata.gz"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// App shell (incl. runtime OCR Tesseract, ~5.7MB): cache-first, scaricato una volta e poi
// disponibile offline per sempre. L'app non fa altre chiamate di rete (nessun server/backend).
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== self.location.origin) return;
  if (!SHELL.includes(url.pathname)) return;
  e.respondWith(
    caches.match(e.request).then((cached) => {
      const fetchPromise = fetch(e.request)
        .then((res) => {
          if (res.ok) caches.open(CACHE).then((c) => c.put(e.request, res.clone()));
          return res;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
