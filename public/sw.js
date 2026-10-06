// Offline shell للصفحة الرئيسية فقط. لا تدخل في أي طلب آخر ولا نخزّن بيانات خاصة.
const C = 'baleeh-shell-v2'
self.addEventListener('install', (e) => e.waitUntil(caches.open(C).then((c) => c.add('/')).catch(() => {})))
self.addEventListener('activate', (e) => e.waitUntil(caches.keys().then((k) => Promise.all(k.filter((x) => x !== C).map((x) => caches.delete(x))))))
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url)
  if (e.request.mode !== 'navigate' || u.origin !== location.origin || u.pathname !== '/') return
  e.respondWith(fetch(e.request).catch(() => caches.match('/')))
})
