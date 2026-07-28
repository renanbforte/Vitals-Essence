// Custom service worker additions for push notifications
// This file is imported by the generated service worker

self.addEventListener('push', function(event) {
  if (!event.data) return;
  
  try {
    const data = event.data.json();
    const options = {
      body: data.body || '',
      icon: data.icon || '/pwa-192x192.png',
      badge: data.badge || '/pwa-192x192.png',
      vibrate: [200, 100, 200],
      data: data.data || {},
      actions: [],
      tag: data.data?.module || 'general',
      renotify: true,
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Vitalis Essence', options)
    );
  } catch (e) {
    // Fallback for plain text
    event.waitUntil(
      self.registration.showNotification('Vitalis Essence', {
        body: event.data.text(),
        icon: '/pwa-192x192.png',
      })
    );
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  const module = event.notification.data?.module;
  let url = '/';
  
  if (module === 'medicacao' || module === 'hidratacao' || module === 'refeicoes' || module === 'treino') {
    url = '/saude';
  } else if (module === 'financeiro') {
    url = '/financeiro';
  } else if (module === 'ciclo') {
    url = '/feminino';
  } else if (module === 'tarefas') {
    url = '/tarefas';
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
