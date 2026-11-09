'use strict';
/**
 * test_bottom.js - Settings > Bottom bar: keep clear (layouts.js clearBottom). For every layout, centre,
 * vehicle, cluster and frame setting: with it on, no layer reaches below y 640 and none is empty; pieces
 * wholly above it that aren't inside a scaled dial stay where they were; with it off, the layers are exactly
 * those without the option.
 *   node tools/test_bottom.js
 */
const { makeScene } = require('./scene');
const { LAYOUTS, BOTTOM } = require('../apps/cluster_layouts/layouts');

let failures = 0;
const ok = (name, cond) => { console.log((cond ? 'ok   ' : 'FAIL ') + name); if (!cond) failures++; };
const DATA = { speed: 50, rpm: 2500, gear: 'D', stage: 'D', oil: 90, coolant: 88, outside: 18, soc: 60, kw: 10, erange: 30, frange: 400,
    gearbox: 70, iat: 30, battTemp: 25, boostActual: 0.5, torque: 200, timing: 12, splitRear: 60, engineOn: true, fuelPct: 50 };

const quads = (layout, options) => {
    const s = makeScene({ layout, options, data: DATA });
    const q = s.scene().quads.map((x) => ({ x: x.x, y: x.y, w: x.w, h: x.h, fs: x.fs }));
    s.stop();
    return q;
};

let combos = 0, layersOn = 0, layersOff = 0;
const below = [], empty = [], changedOff = [];
LAYOUTS.forEach((L) => ['info', 'stock', 'map'].forEach((centre) => ['ice', 'phev'].forEach((vehicle) =>
    ['standard', 'm'].forEach((cluster) => [false, true].forEach((boxBezel) => {
        const base = { centre, vehicle, cluster, boxBezel, speedUnit: 'kmh', tempUnit: 'c' };
        const off = quads(L.id, base), plain = quads(L.id, Object.assign({}, base, { bottomClear: false }));
        const on = quads(L.id, Object.assign({}, base, { bottomClear: true }));
        const tag = `${L.id} ${centre} ${vehicle} ${cluster}${boxBezel ? ' frame' : ''}`;
        combos++; layersOn += on.length; layersOff += off.length;
        on.forEach((q) => {
            if (q.y + q.h > BOTTOM) below.push(`${tag}: [${q.x},${q.y} ${q.w}x${q.h}]`);
            if (!(q.w > 0 && q.h > 0)) empty.push(`${tag}: [${q.x},${q.y} ${q.w}x${q.h}]`);
        });
        if (JSON.stringify(off) !== JSON.stringify(plain)) changedOff.push(tag);
    })))));

console.log(`     ${combos} combinations; layers ${layersOff} as designed, ${layersOn} with the bottom bar kept clear`);
ok(`with the bottom bar kept clear, no layer reaches below y ${BOTTOM}`, below.length === 0);
below.slice(0, 10).forEach((b) => console.log('       ' + b));
ok('and no layer is empty', empty.length === 0);
empty.slice(0, 10).forEach((b) => console.log('       ' + b));
ok('with it off (or not set), the layers are exactly as designed', changedOff.length === 0);
changedOff.slice(0, 10).forEach((b) => console.log('       ' + b));

// keeping the bar clear moves nothing into the cowl, the gear box, the M boxes or the warning lights
const { clashes } = require('./clearance');
const clashList = (bottomClear) => {
    const out = [];
    LAYOUTS.forEach((L) => ['info', 'map', 'stock'].forEach((centre) => ['phev', 'ice'].forEach((vehicle) => ['standard', 'm'].forEach((cluster) => {
        const o = { speedUnit: 'mph', tempUnit: 'f', centre, redline: 7000, rpmMax: 8000, vehicle, cluster, bottomClear };
        L.pieces(o).forEach((p) => clashes(p, o).forEach((c) => out.push(`${L.id} ${centre} ${vehicle} ${cluster}: ${p.key} ${c}`)));
    }))));
    return out;
};
const before = clashList(false), after = clashList(true), added = after.filter((c) => before.indexOf(c) < 0);
ok(`no clearance clash added (${before.length} as designed, ${after.length} with the bar clear)`, added.length === 0);
added.slice(0, 10).forEach((c) => console.log('       ' + c));

// the layers above the bar that nothing scales stay put: the digital dash's tiles, for one
const tiles = (q) => q.filter((x) => x.y + x.h <= 560).map((x) => [x.x, x.y, x.w, x.h].join(',')).sort().join(';');
ok('digital dash: its tiles above the bar are untouched',
    tiles(quads('digital_dash', { centre: 'info', vehicle: 'ice' })) === tiles(quads('digital_dash', { centre: 'info', vehicle: 'ice', bottomClear: true })));

// a dial scaled to end at the bar keeps its shape (square stays square)
const dials = quads('digital_round', { centre: 'info', vehicle: 'ice', bottomClear: true }).filter((x) => x.w >= 300 && x.w === x.h);
ok('digital round: both big dials stay round (square quads) and end at or above the bar',
    dials.length >= 2 && dials.every((d) => d.y + d.h <= BOTTOM));

console.log(failures ? failures + ' FAILED' : 'all ok');
process.exit(failures ? 1 : 0);
