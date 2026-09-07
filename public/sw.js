// Minimal offline app-shell cache for KlipBoard. Cache-first for the static
// shell (icons, manifest), network-first for everything else so notepad
// data is never served stale. Notepad PUT (save) requests get an extra
// offline queue: if the network is unavailable, the request body is
// stashed in IndexedDB and replayed via Background Sync (or the next
// successful PUT) instead of failing outright.
const SHELL_CACHE = "klipboard-shell-v1";
const SHELL_ASSETS = ["/", "/favicon.svg", "/manifest.webmanifest"];
const QUEUE_DB = "klipboard-offline-queue";
const QUEUE_STORE = "requests";
const SYNC_TAG = "sync-notepad-queue";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== SHELL_CACHE).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

function openQueueDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(QUEUE_DB, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(QUEUE_STORE, { keyPath: "id", autoIncrement: true });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function queueRequest(request) {
  const db = await openQueueDb();
  const body = await request.clone().text();
  const entry = {
    url: request.url,
    method: request.method,
    headers: Array.from(request.headers.entries()),
    body,
    queuedAt: Date.now(),
  };
  await new Promise((resolve, reject) => {
    const tx = db.transaction(QUEUE_STORE, "readwrite");
    tx.objectStore(QUEUE_STORE).add(entry);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

async function replayQueue() {
  const db = await openQueueDb();
  const entries = await new Promise((resolve, reject) => {
    const tx = db.transaction(QUEUE_STORE, "readonly");
    const req = tx.objectStore(QUEUE_STORE).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  for (const entry of entries) {
    try {
      await fetch(entry.url, { method: entry.method, headers: entry.headers, body: entry.body });
      const deleteDb = await openQueueDb();
      await new Promise((resolve, reject) => {
        const tx = deleteDb.transaction(QUEUE_STORE, "readwrite");
        tx.objectStore(QUEUE_STORE).delete(entry.id);
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      // Still offline / server down - leave queued, retry on next sync.
      break;
    }
  }
}

self.addEventListener("sync", (event) => {
  if (event.tag === SYNC_TAG) {
    event.waitUntil(replayQueue());
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Queue offline notepad saves instead of failing them.
  if (request.method === "PUT" && url.pathname.startsWith("/api/notepads/")) {
    event.respondWith(
      fetch(request.clone()).catch(async () => {
        await queueRequest(request);
        if (self.registration.sync) {
          self.registration.sync.register(SYNC_TAG).catch(() => {});
        }
        return new Response(JSON.stringify({ queued: true }), {
          status: 202,
          headers: { "Content-Type": "application/json", "X-Queued-Offline": "true" },
        });
      })
    );
    return;
  }

  if (request.method !== "GET") return;
  if (url.pathname.startsWith("/api")) return; // never cache API responses

  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches.open(SHELL_CACHE).then((cache) => cache.put(request, copy));
        return response;
      })
      .catch(() => caches.match(request))
  );
});