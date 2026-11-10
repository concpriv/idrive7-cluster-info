'use strict';
/**
 * test_geometry.js - the dial layouts' compositions, from the panel's usable areas (layout_common.sideDials):
 * above the car's own strip, in every centre (readings, map, stock), the speedometer and the tach are the same size,
 * mirrored about the panel's centre line, end above the strip and keep out of the slanted top corners; with the
 * map or the stock middle, they stay in the side columns and leave the centre to the car.
 *   node tools/test_geometry.js
 */
const path = require('path');
require('./scene');
const C = require(path.join(__dirname, '..', 'apps', 'cluster_layouts', 'layout_common'));
const { byId } = require(path.join(__dirname, '..', 'apps', 'cluster_layouts', 'layouts'));

let failures = 0;
const ok = (name, cond, more) => { console.log((cond ? 'ok   ' : 'FAIL ') + name + (cond || !more ? '' : '  (' + more + ')')); if (!cond) failures++; };

const DIALS = ['analog_sport', 'digital_round', 'retro', 'kyalami_analog'];
const CENTRES = { info: null, map: C.MAP, stock: C.STOCK_MIDDLE };
DIALS.forEach((id) => Object.keys(CENTRES).forEach((centre) => ['ice', 'phev'].forEach((vehicle) => {
    const o = { centre, vehicle, cluster: 'standard', bottomStrip: 'stock', speedUnit: 'kmh', tempUnit: 'c', redline: 7000, rpmMax: 8000 };
    const ps = byId(id).pieces(o);
    const sp = ps.find((p) => p.key === 'speed' && p.kind === 'dial'), rp = ps.find((p) => p.key === 'rpm' && p.kind === 'dial');
    const tag = `${id} ${centre} ${vehicle}`;
    if (!sp || !rp) return ok(`${tag}: both dials there`, false);
    const cxS = sp.x + sp.w / 2, cxR = rp.x + rp.w / 2;
    ok(`${tag}: the dials the same size (${sp.w}, ${rp.w})`, Math.abs(sp.w - rp.w) <= 1 && sp.w === sp.h && rp.w === rp.h);
    ok(`${tag}: mirrored about the centre line (${cxS}, ${cxR})`, Math.abs((cxS + cxR) / 2 - 960) <= 2 && Math.abs(sp.y - rp.y) <= 1);
    ok(`${tag}: above the car's strip (bottom ${sp.y + sp.h})`, sp.y + sp.h <= C.STRIP_Y && rp.y + rp.h <= C.STRIP_Y);
    const corner = (p) => [[0.15, 0.15], [0.85, 0.15], [0.5, 0]].some(([fx, fy]) => {
        const cx = p.x + p.w / 2, cy = p.y + p.h / 2, r = p.w / 2, a = Math.atan2(fy - 0.5, fx - 0.5);
        return C.inCorner(cx + r * 0.98 * Math.cos(a), cy + r * 0.98 * Math.sin(a));
    });
    ok(`${tag}: rims out of the slanted corners`, !corner(sp) && !corner(rp));
    const mid = CENTRES[centre];
    if (mid) {
        ok(`${tag}: the dials in the side columns, clear of the ${centre}`, sp.x + sp.w <= mid.x && rp.x >= mid.x + mid.w);
        const over = ps.filter((p) => p.kind !== 'flat' && !/^bg/.test(p.key) && p.x < mid.x + mid.w && p.x + p.w > mid.x && p.y < (centre === 'map' ? mid.y + mid.h : 720) && p.y + p.h > mid.y);
        ok(`${tag}: nothing over the ${centre}`, over.length === 0, over.map((p) => p.key).join(','));
        const heads = ps.filter((p) => p.kind === 'text' && p.y < sp.y);
        ok(`${tag}: readouts above the dials out of the corners`, heads.every((p) => p.y >= C.belowCorners(p.x, p.x + p.w)), heads.filter((p) => p.y < C.belowCorners(p.x, p.x + p.w)).map((p) => p.key).join(','));
    }
})));
console.log(failures ? failures + ' FAILED' : 'all ok');
process.exit(failures ? 1 : 0);
