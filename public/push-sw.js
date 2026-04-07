/**
 * Parsli web push service worker.
 *
 * Receives extraction-ready push notifications and decides whether to render
 * the OS notification or suppress it in favor of the in-app UI:
 *
 *   - If a tab is currently focused on the document URL, postMessage the
 *     active client (so it can show an in-app toast) and skip the notification.
 *   - Otherwise, render a notification tagged with the `nid` so duplicate
 *     pushes for the same extraction collapse instead of stacking.
 *
 * On click: focus an existing tab on the target URL if one exists, otherwise
 * navigate an open Parsli tab, otherwise open a new window.
 */

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting())
})

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener("push", (event) => {
  if (!event.data) return

  let payload
  try {
    payload = event.data.json()
  } catch (e) {
    return
  }

  const { nid, title, body, url, documentId } = payload || {}
  if (!title || !body || !url) return

  event.waitUntil(handlePush({ nid, title, body, url, documentId }))
})

async function handlePush({ nid, title, body, url, documentId }) {
  const allClients = await self.clients.matchAll({
    type: "window",
    includeUncontrolled: true,
  })

  // Suppress the OS notification if the user is already focused on this
  // document — the in-app UI updates in real time via Supabase Realtime
  // so re-showing the result is redundant.
  const focusedOnDoc = allClients.some((c) => {
    if (!c.url || !c.url.includes(`/documents/${documentId}`)) return false
    if (c.focused === true) return true
    if (c.visibilityState === "visible") return true
    return false
  })

  if (focusedOnDoc) {
    for (const c of allClients) {
      try {
        c.postMessage({
          type: "extraction_ready",
          nid,
          documentId,
          url,
        })
      } catch (e) {
        // ignore postMessage failures (e.g. closed clients)
      }
    }
    return
  }

  await self.registration.showNotification(title, {
    body,
    icon: "/parsli-icon.png",
    badge: "/parsli-icon.png",
    tag: nid, // collapses duplicate pushes for the same nid
    renotify: false,
    requireInteraction: false,
    data: { url, nid, documentId },
  })
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const data = event.notification.data || {}
  const url = data.url
  if (!url) return

  event.waitUntil(focusOrOpen(url))
})

async function focusOrOpen(url) {
  const allClients = await self.clients.matchAll({
    type: "window",
    includeUncontrolled: true,
  })

  let targetPath
  try {
    targetPath = new URL(url).pathname
  } catch (e) {
    targetPath = url
  }

  // 1. If any tab is already on this exact path, focus it
  for (const c of allClients) {
    try {
      if (new URL(c.url).pathname === targetPath && "focus" in c) {
        return c.focus()
      }
    } catch (e) {
      // ignore parse errors
    }
  }

  // 2. Otherwise, try to navigate an open Parsli tab to the target URL
  for (const c of allClients) {
    if ("navigate" in c) {
      try {
        const navigated = await c.navigate(url)
        if (navigated && "focus" in navigated) return navigated.focus()
      } catch (e) {
        // navigate may fail on cross-origin or uncontrolled clients
      }
    }
  }

  // 3. No suitable tab — open a new window
  if (self.clients.openWindow) {
    return self.clients.openWindow(url)
  }
}
