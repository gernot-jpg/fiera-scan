const CACHE = "fiera-scan-v14";
// Base = cartella dove vive questo sw.js (es. "/" a radice, o "/fiera-scan/" su GitHub Pages
// project page) — calcolata dal proprio URL cosi' funziona a qualunque profondita', senza
// dover sapere in anticipo dove verra' pubblicata l'app.
const BASE = self.location.pathname.replace(/sw\.js$/, "");

// Runtime OCR (~5.7MB) e icone: pesanti, non cambiano quasi mai -> cache-first (velocita'
// offline). HTML/manifest: leggeri, cambiano spesso durante lo sviluppo -> network-first, cosi'
// un aggiornamento arriva SUBITO quando sei online, senza dover ricaricare due volte per
// scavalcare la cache (problema noto delle PWA su hosting statico come GitHub Pages).
const HEAVY = [BASE + "icons/icon-192.png", BASE + "icons/icon-512.png", BASE + "icons/apple-touch-icon.png",
  BASE + "vendor/tesseract/tesseract.min.js", BASE + "vendor/tesseract/worker.min.js",
  BASE + "vendor/tesseract/tesseract-core-lstm.js", BASE + "vendor/tesseract/tesseract-core-lstm.wasm",
  BASE + "vendor/tesseract/eng.traineddata.gz"];
const SHELL = [BASE, BASE + "index.html", BASE + "manifest.json"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll([...SHELL, ...HEAVY])));
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

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== self.location.origin) return;

  if (HEAVY.includes(url.pathname)) {
    e.respondWith(
      caches.match(e.request).then((cached) => cached || fetch(e.request).then((res) => {
        if (res.ok) caches.open(CACHE).then((c) => c.put(e.request, res.clone()));
        return res;
      }))
    );
    return;
  }
  if (SHELL.includes(url.pathname)) {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          if (res.ok) caches.open(CACHE).then((c) => c.put(e.request, res.clone()));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
  }
});
