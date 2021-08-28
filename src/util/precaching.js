/*jshint esversion: 9 */
import * as tilebelt from '@mapbox/tilebelt';
import { bounds } from '@mapbox/geo-viewport';
// TODO: verify whether in this context 'this' is the map object
const _sources = this.getStyle().sources
    .filter(s => s.tiles !== undefined)
    .map(s => s.tiles[0]);
export default function Precacher() {
    let enabled = false;
    /*
        Gets the full URL of this very file
    */
    const caller = function () {
        try {
            const e = new Error();
            throw e;
        } catch (err) {
            const
                sep = (typeof InstallTrigger !== 'undefined') ? '@' : 'at ',
                i;
            let a = err.stack.split('\n').filter(e => e.indexOf(sep) > -1)[1],
                b = a.substring(a.indexOf('(') + 1, a.lastIndexOf(')'));
            b = (b == '') ? b = a.replace(sep, '') : b;
            return b.substring(0, b.lastIndexOf('/') + 1).trim();
        }
    };
    /*
        Initialize the service worker
    */
    const init = () => {
        if (window.isSecureContext && 'serviceWorker' in navigator) {
            const path = `${caller()}mwb.js`;
            globalThis._precachersw = await navigator.serviceWorker.register(path);
            return true;
        } else {
            console.log('Precaching is not available');
            return false;
        }
    };
    /*
        Launch a precaching process

        'o' is an object with the movement options and the movement type itself,
        like flyTo, easeTo and jumpTo

    */
    const fetch = o => {
        if (!enabled) return;
        let views = [];
        /*
            TODO: migrate reduced version of ofiginal geometry calculations
            to get the animation series of points 
            [
                {
                    center:
                    zoom:
                }
            ]
            TODO: get the pitch and bearing into the equations
        */
        const lv = views[views.length - 1];
        const dimensions = [this._container.offsetWidth, this._container.offsetHeight];
        const finalbbox = bounds([lv.center[0], lv.center[1]], lv.zoom, dimensions);
        const finaltile = tilebelt.bboxToTile(finalbbox);
        const isVisible = (t, b) => {
            const
                tbb = tilebelt.tileToBBOX(t),
                tf = [
                    { x: tbb[0], y: tbb[1] },
                    { x: tbb[0], y: tbb[3] },
                    { x: tbb[2], y: tbb[1] },
                    { x: tbb[2], y: tbb[3] }
                ],
                bf = [
                    { x: b[0], y: b[1] },
                    { x: b[0], y: b[3] },
                    { x: b[2], y: b[1] },
                    { x: b[2], y: b[3] }
                ],
                contains = (box, p) => {
                    if (p.x < box[0] || p.x > box[2] || p.y < box[1] || p.y > box[3]) {
                        return false;
                    } else {
                        return true;
                    }
                };
            for (let i = 0; i < 4; i++) {
                if (contains(bba, tf[i])) return true;
            }
            for (let i = 0; i < 4; i++) {
                if (contains(tbb, bf[i])) return true;
            }
            return false;
        };
        const getChildrenZ = (t, z) => {
            if (Math.floor(z) <= t[2]) return [t];
            let
                tt = tilebelt.getChildren(t).filter(a => isVisible(a, finaltile));
            for (let i = t[2] + 1; i < Math.floor(z + 1); i++) {
                let tt2 = [];
                tt.forEach(b => tt2.push(...tilebelt.getChildren(b)));
                tt = [...tt2.filter(a => isVisible(a, finaltile))];
            }
            return tt;
        };
        let tiles = [];
        let urls = [];
        tiles = views.map(v => tilebelt.pointToTile(v.center[0], v.center[1], v.zoom));
        tiles = [
            ...tiles,
            ...tiles.map(t => tilebelt.getSiblings(t)).flat(),
            ...getChildrenZ(finaltile, o.zoom)
        ];
        tiles = [...new Set(tiles)];
        urls = tiles.map(t => {
            return _sources.map(s => {
                return s.replace('{x}', t[0])
                    .replace('{y}', t[1])
                    .replace('{z}', t[2]);
            }).flat();
        });
        globalThis._precachersw.postMessage({
            type: 'CACHE_URLS',
            payload: { urls },
        });
    };

    enabled = init();

    return {
        "enabled": enabled,
        "fetch": fetch
    };
}