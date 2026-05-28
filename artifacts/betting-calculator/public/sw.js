// ── TTM4D Slot Alarm Service Worker ──────────────────────────────────────────
// Schedules browser notifications for slot times even when the tab is hidden.
// Runs as long as the browser process is open (even if the tab/window is minimized).

const VERSION = "ttm4d-sw-v2";
let scheduledTimers = [];

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));

// ── Helper: play sound data URI in notification (uses silent audio fallback)
function buildNotifOptions(title, body, tag, urgency) {
  return {
    body,
    icon: "/favicon.svg",
    badge: "/favicon.svg",
    tag,
    renotify: true,
    requireInteraction: urgency === "high",
    vibrate: urgency === "high" ? [300, 100, 300, 100, 300] : [200, 100, 200],
    data: { urgency, openUrl: "/" },
    silent: false,
  };
}

function clearAllTimers() {
  scheduledTimers.forEach(id => clearTimeout(id));
  scheduledTimers = [];
}

// ── Compute upcoming slot timestamps for today (and tomorrow for 00:01)
function getUpcomingSlots() {
  const TIME_SLOTS = [
    { h: 0,  m: 1,  label: "00:01" },
    { h: 13, m: 0,  label: "13:00" },
    { h: 16, m: 0,  label: "16:00" },
    { h: 19, m: 0,  label: "19:00" },
    { h: 22, m: 0,  label: "22:00" },
    { h: 23, m: 0,  label: "23:00" },
  ];

  const now = Date.now();
  const results = [];

  TIME_SLOTS.forEach(({ h, m, label }) => {
    const d = new Date();
    d.setHours(h, m, 0, 0);
    let slotMs = d.getTime();

    // If slot already passed today, schedule for tomorrow (only for 00:01)
    if (slotMs <= now && label === "00:01") {
      slotMs += 86400000;
    }

    if (slotMs > now) {
      results.push({ label, slotMs });
    }
  });

  return results;
}

// ── Handle messages from the main page
self.addEventListener("message", event => {
  const { type } = event.data || {};

  if (type === "SCHEDULE") {
    clearAllTimers();
    if (!event.data.enabled) {
      event.source?.postMessage({ type: "SCHEDULED", count: 0 });
      return;
    }

    const slots = getUpcomingSlots();
    const now = Date.now();
    let count = 0;

    slots.forEach(({ label, slotMs }) => {
      const delay15 = slotMs - 15 * 60 * 1000 - now;
      const delay5  = slotMs - 5 * 60 * 1000  - now;
      const delay0  = slotMs - now;

      if (delay15 > 0) {
        scheduledTimers.push(setTimeout(() => {
          self.registration.showNotification(
            `🔔 Persiapan Slot ${label} WIB`,
            buildNotifOptions(`🔔 Persiapan Slot ${label} WIB`, "15 menit lagi — siapkan nomor taruhan kamu!", `slot15-${label}`, "normal")
          );
        }, delay15));
        count++;
      }

      if (delay5 > 0) {
        scheduledTimers.push(setTimeout(() => {
          self.registration.showNotification(
            `⚡ SEGERA! Slot ${label} 5 Menit Lagi`,
            buildNotifOptions(`⚡ SEGERA! Slot ${label} 5 Menit Lagi`, "Tinggal 5 menit — pasang taruhan SEKARANG!", `slot5-${label}`, "high")
          );
        }, delay5));
        count++;
      }

      // Exact slot time alarm
      if (delay0 > 0 && delay0 < 60 * 60 * 1000) {
        scheduledTimers.push(setTimeout(() => {
          self.registration.showNotification(
            `🚨 BUKA SEKARANG! Slot ${label} WIB`,
            buildNotifOptions(`🚨 BUKA SEKARANG! Slot ${label} WIB`, "Pasaran sudah BUKA — jangan sampai ketinggalan!", `slot0-${label}`, "high")
          );
        }, delay0));
        count++;
      }
    });

    event.source?.postMessage({ type: "SCHEDULED", count });
  }

  if (type === "CANCEL") {
    clearAllTimers();
    event.source?.postMessage({ type: "CANCELLED" });
  }

  // Keepalive ping — prevents SW from being killed while timers are pending
  if (type === "PING") {
    event.source?.postMessage({ type: "PONG", timers: scheduledTimers.length });
  }
});

// ── Click on notification → open/focus the app
self.addEventListener("notificationclick", event => {
  event.notification.close();
  const targetUrl = self.location.origin + (event.notification.data?.openUrl || "/");
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
      const existing = list.find(c => c.url.startsWith(self.location.origin));
      if (existing) return existing.focus();
      return self.clients.openWindow(targetUrl);
    })
  );
});
