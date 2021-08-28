/*jshint esversion: 9 */
import { uuid } from './util';
import { PrecacheController } from 'workbox-precaching';
import { ExpirationPlugin } from 'workbox-expiration';

const
    cachename = `maplibre-${uuid()}`,
    expconfig = {
        maxEntries: 500,
        maxAgeSeconds: 86400
    },
    pruner = new ExpirationPlugin(expconfig),
    precacheController = new PrecacheController(cachename, [pruner]);

self.addEventListener('install', (event) => {
    event.waitUntil(precacheController.install(event));
});

self.addEventListener('activate', (event) => {
    event.waitUntil(precacheController.activate(event));
});

self.addEventListener('message', (event) => {
    if (event.data.type === 'CACHE_URLS') {
        const tocache = event.data.payload.urls;
        precacheController.addToCacheList(tocache);
    }
});