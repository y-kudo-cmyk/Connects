importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');

self.addEventListener('notificationclick', function(event) {
  const url = event.notification?.data?.launchURL || event.notification?.data?.url;
  if (!url) return;
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (const client of clientList) {
        if (client.url && 'focus' in client && 'navigate' in client) {
          return client.navigate(url).then(function() { return client.focus(); });
        }
      }
      return clients.openWindow(url);
    })
  );
});
