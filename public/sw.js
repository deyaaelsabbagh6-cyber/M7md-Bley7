// Offline shell فقط: لا نخزّن أي بيانات خاصة أو استجابات API
const C='baleeh-shell-v1',SHELL=['/','/icon-192.png','/bg-mobile.jpg','/bg-desktop.jpg']
self.addEventListener('install',e=>e.waitUntil(caches.open(C).then(c=>c.addAll(SHELL))))
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x))))))
self.addEventListener('fetch',e=>{const u=new URL(e.request.url)
 if(e.request.method!=='GET'||u.origin!==location.origin||/^\/(api|owner|lawyer|client|scan|login)/.test(u.pathname))return
 e.respondWith(fetch(e.request).catch(()=>caches.match(e.request).then(r=>r||caches.match('/'))))})
