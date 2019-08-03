## Setup Progressive Web Application

### setup manifest.json and link it into html

./manifest.json

```json
{
  "name": "Food Ninja",
  "short_name": "FoodNinja", // name under the app icon
  "start_url": "/index.html", // page that loads up when user tap the app icon
  "display": "standalone", // standalone : app will look like native mobile apps browser : will open up in browser
  "background_color": "#FFE9D2",
  "theme_color": "#FFE1C4",
  "orientation": "portrait-primary",
  "icons": [
    // depending on what device user install it will using different icons
    {
      "src": "/img/icons/icon-72x72.png",
      "type": "image/png",
      "sizes": "72x72"
    },
    {
      "src": "/img/icons/icon-96x96.png",
      "type": "image/png",
      "sizes": "96x96"
    },
    {
      "src": "/img/icons/icon-128x128.png",
      "type": "image/png",
      "sizes": "128x128"
    },
    {
      "src": "/img/icons/icon-144x144.png",
      "type": "image/png",
      "sizes": "144x144"
    },
    {
      "src": "/img/icons/icon-152x152.png",
      "type": "image/png",
      "sizes": "152x152"
    },
    {
      "src": "/img/icons/icon-192x192.png",
      "type": "image/png",
      "sizes": "192x192"
    },
    {
      "src": "/img/icons/icon-384x384.png",
      "type": "image/png",
      "sizes": "384x384"
    },
    {
      "src": "/img/icons/icon-512x512.png",
      "type": "image/png",
      "sizes": "512x512"
    }
  ]
}
```

```html
<link rel="manifest" href="/manifest.json" />
```

### Adding ios icon and theme color support

```html
<!-- ios support -->
<link rel="apple-touch-icon" href="/img/icons/icon-72x72.png" />
<link rel="apple-touch-icon" href="/img/icons/icon-96x96.png" />
<link rel="apple-touch-icon" href="/img/icons/icon-128x128.png" />
<link rel="apple-touch-icon" href="/img/icons/icon-144x144.png" />
<link rel="apple-touch-icon" href="/img/icons/icon-152x152.png" />
<link rel="apple-touch-icon" href="/img/icons/icon-192x192.png" />
<link rel="apple-touch-icon" href="/img/icons/icon-384x384.png" />
<link rel="apple-touch-icon" href="/img/icons/icon-512x512.png" />
<meta name="apple-mobile-web-app-status-bar" content="#FFE1C4" />
<!-- set an address bar theme color -->
<meta name="theme-color" content="#FFE1C4" />
```

### Register and listen for events at serviceWorker

- service worker should placed into root of project
- service worker just work on https and localhost

./sw.js

```javascript
// listen for install event
self.addEventListener("install", ev => {
  console.log("service worker has been installed");
});
// listen for activate event --- will activate when all instance closed
self.addEvent("activate", ev => {
  console.log("service worker has been activated");
});
// listen for fetch events --- invoke whenever a fetch req occur
self.addEventListener("fetch", ev => {
  console.log("fetch event", ev);
});
```

./js/app.js

```javascript
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/sw.js")
    .then(reg => {
      console.log("service worker registered", reg);
    })
    .catch(err => {
      console.log("service worker not registered", err);
    });
}
```

### pre-caching and getting Assets

./sw.js

```javascript
const staticCacheName = "site-static-v1";
const assets = [
  "/",
  "/index.html",
  "/js/app.js",
  "/js/ui.js",
  "/js/materialize.min.js",
  "/css/styles.css",
  "/css/materialize.min.css",
  "/img/dish.png",
  "https://fonts.googleapis.com/icon?family=Material+Icons",
  "https://fonts.gstatic.com/s/materialicons/v47/flUhRq6tzZclQEJ-Vdg-IuiaDsNcIhQ8tQ.woff2"
];

// install event
self.addEventListener("install", evt => {
  //console.log('service worker installed');
  evt.waitUntil(
    caches.open(staticCacheName).then(cache => {
      console.log("caching shell assets");
      cache.addAll(assets);
    })
  );
});

// fetch event
self.addEventListener("fetch", evt => {
  //console.log('fetch event', evt);
  evt.respondWith(
    caches.match(evt.request).then(cacheRes => {
      return cacheRes || fetch(evt.request);
    })
  );
});
```

## Versioning caches and delete old versions

```javascript
self.addEventListener("activate", () => {
  caches.keys().then(keys => {
    return Promise.all(
      keys
        .filter(key => key !== staticCacheName && key !== dynamicCacheName)
        .map(key => caches.delete(key))
    );
  });
});
```

### dynamic caching

```javascript
self.addEventListener("fetch", evt => {
  caches.match(evt.request).then(cachesRes => {
    return (
      cachesRes ||
      fetch(evt.request).then(fetchRes => {
        caches.open(dynamicCacheName).then(cache => {
          cache.put(evt.request.url, fetchRes.clone);
          return fetchRes;
        });
      })
    );
  });
});
```

### offline fallback page

```javascript
const assets = ["/pages/fallback.html"];

self.addEventListener("fetch", evt => {
  evt.respondWith(
    caches.match(evt.request).then(cacheRes => {
      return (
        cacheRes ||
        fetch(evt.request)
          .then(fetchRes => {
            return caches.open(dynamicCacheName).then(cache => {
              cache.put(evt.request.url, fetchRes.clone());
              return fetchRes;
            });
          })
          .catch(() => {
            //not working in my case
            if (evt.request.url.indexof(".html") > -1)
              return caches.match("/pages/fallback.html");
          })
      );
      s;
    })
  );
});
```

### limiting cache size

```javascript
// limit cache size
const limitCatchSize = (name, size) => {
  caches.open(name).then(cache =>
    cache.keys().then(keys => {
      if (keys.length > size)
        cache.delete(keys[0]).then(() => limitCatchSize(name, size));
    })
  );
};
limitCatchSize(dynamicCacheName, 15);
```

## interacting with firebase fireStore

