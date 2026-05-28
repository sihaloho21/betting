// Service Worker — Slot Notification Scheduler
const SLOTS = [
  { h: 0,  m: 1,  label: "00:01" },
  { h: 13, m: 0,  label: "13:00" },
  { h: 16, m: 0,  label: "16:00" },
  { h: 19, m: 0,  label: "19:00" },
  { h: 22, m: 0,  label: "22:00" },
  { h: 23, m: 0,  label: "23:00" },
];

let timers = [];
let enabled = false;

function clearAllTimers() {
  timers.forEach(t => clearTimeout(t));
  timers = [];
}

function scheduleNotifications() {
  clearAllTimers();
  if (!enabled) return;

  const now = new Date();
  let count = 0;

  SLOTS.forEach(slot => {
    const slotMs = (dt, h, m) => {
      const d = new Date(dt);
      d.setHours(h, m, 0, 0);
      return d.getTime();
    };

    const slotTime = slotMs(now, slot.h, slot.m);

    [15 * 60 * 1000, 5 * 60 * 1000].forEach(offset => {
      const notifTime = slotTime - offset;
      const delay = notifTime - now.getTime();
      if (delay > 0 && delay < 24 * 60 * 60 * 1000) {
        const label = offset === 15 * 60 * 1000 ? "15 menit" : "5 menit";
        const urgency = offset === 5 * 60 * 1000 ? "⚡ SEGERA" : "🔔 Siap-siap";
        timers.push(setTimeout(() => {
          self.registration.showNotification(`${urgency} Slot ${slot.label}!`, {
            body: `${urgency}: Slot ${slot.label} WIB dalam ${label}. Pasang taruhan sekarang!`,
            icon: "/favicon.svg",
            badge: "/favicon.svg",
            tag: `slot-${slot.label}-${offset}`,
            requireInteraction: offset === 5 * 60 * 1000,
          });
        }, delay));
        count++;
      }
    });
  });

  // Report back
  self.clients.matchAll().then(clients => {
    clients.forEach(c => c.postMessage({ type: "SCHEDULED", count }));
  });
}

self.addEventListener("message", event => {
  const { type, enabled: en } = event.data || {};

  if (type === "SCHEDULE") {
    enabled = en;
    if (enabled) {
      scheduleNotifications();
    } else {
      clearAllTimers();
      self.clients.matchAll().then(clients =>
        clients.forEach(c => c.postMessage({ type: "CANCELLED" }))
      );
    }
  }

  if (type === "PING") {
    // Keepalive — reschedule to ensure timers are fresh
    if (enabled) scheduleNotifications();
  }
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then(clients => {
      if (clients.length > 0) return clients[0].focus();
      return self.clients.openWindow("/");
    })
  );
});

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", event => event.waitUntil(self.clients.claim()));
