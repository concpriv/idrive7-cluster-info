'use strict';
/**
 * layout_race_dash.js - "Race dash": an aftermarket motorsport dash look. Two big yellow dials on carbon fibre, the
 * rev counter left and the speedometer right, each with a black centre disc, black numerals, a long red needle and
 * the red zone as a red sector; a two-row box at each dial's lower right (rpm and fuel, speed and gear); four
 * reading tiles down each side, each with its level bar, value, unit and name. No maker's logo.
 *
 * Every reading is a real one from the car (data.js). Where such dashes show what this car does not send (manifold
 * absolute pressure, throttle, injector duty, battery voltage, oil pressure), the tile shows the nearest reading the
 * car does send (boost, torque, oil temperature, gearbox temperature, fuel rail pressure) under its own name.
 *
 * Compositions, from the panel's usable areas (layout_common):
 *   the car's strip (default): 580 px dials either side of the camera's cowl, ending above the strip, the tiles in
 *     the outer columns below the slanted corners (the fuel shown in the rev counter's box, so no strip gauge);
 *   the full panel: 500 px dials, both left of the KOMBI's gear box and clear of an M car's first box (the
 *     speedometer left with an M car, the rev counter's face may pass under its second), the right tiles under
 *     its eDrive box;
 *   the map: the dials in the side columns (sideDials), four readings under the map;
 *   the stock middle: the dials either side of it, four tiles between it and the speedometer.
 */
const C = require('./layout_common');

const PALETTES = {
    comfort: {
        bg: '#0c0c0d', bgTop: '#141416', bgBottom: '#060607', face0: '#ffd31f', face1: '#f4b800', bezel: '#4c4c51', bezel2: '#141416',
        tick: '#121212', minor: '#2a2a2a', num: '#0d0d0d', red: '#e3161c', needle: '#d8161c', hub: '#151517', disc: '#0d0d0f', ring: '#e8b800',
        num2: '#ffffff', glow: '#000000', accent: '#e8b800', text: '#ffffff', value: '#ffd31f', dim: '#c9c9c9',
        tile0: '#1d1d20', tile1: '#0f0f11', tileEdge: '#4a4a50', box0: '#26262a', box1: '#0d0d0f', boxEdge: '#7a7a80', track: '#3a3a3e',
    },
};
PALETTES.sport = PALETTES.comfort;
PALETTES.efficient = PALETTES.comfort;
const pal = (lookId) => PALETTES[lookId] || PALETTES.comfort;
const dialColours = (t) => ({ face0: t.face0, face1: t.face1, bezel: t.bezel, bezel2: t.bezel2, tick: t.tick, minor: t.minor, num: t.num, red: t.red,
    needle: t.needle, hub: t.hub, accent: t.accent, glow: t.glow, disc: t.disc, ring: t.ring, num2: t.num2 });
const white = (t) => ({ color: [t.text, 1], glow: [t.glow, 0] });
const yellow = (t) => ({ color: [t.value, 1], glow: [t.value, 0.1] });
const small = (t) => ({ color: [t.dim, 1], glow: [t.glow, 0] });
const gearC = (t, d) => ({ color: [C.gearText(d) === 'R' ? t.red : t.text, 1], glow: [t.glow, 0] });
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const num = (v) => C.isNum(v);
const tempNum = (o, c) => (num(c) ? String(Math.round(C.tempIn(o, c))) : '--');
const tempUnit = (o) => (o.tempUnit === 'c' ? '°C' : '°F');

/* the readings the tiles can show: what the car sends (base units: deg C, bar gauge, Nm, bar) */
const READINGS = {
    boost: (o) => ({ name: 'BOOST', unit: C.boostUnitText(o), frac: C.boostFrac,
        value: (d) => (d.engineOn === false ? 'OFF' : num(d.boostActual) ? C.boostFit(o, d.boostActual) : '--') }),
    coolant: (o) => ({ name: 'COOLANT', unit: tempUnit(o), value: (d) => tempNum(o, d.coolant), frac: (d) => C.tempFrac(d.coolant) }),
    iat: (o) => ({ name: 'IAT', unit: tempUnit(o), value: (d) => tempNum(o, d.iat), frac: (d) => (num(d.iat) ? clamp01(d.iat / 80) : 0) }),
    oil: (o) => ({ name: 'OIL TEMP', unit: tempUnit(o), value: (d) => tempNum(o, d.oil), frac: (d) => C.tempFrac(d.oil) }),
    timing: () => ({ name: 'IGN ANGLE', unit: '°', value: (d) => (num(d.timing) ? [d.timing.toFixed(1), String(Math.round(d.timing))] : '--'),
        frac: (d) => (num(d.timing) ? clamp01(d.timing / 40) : 0) }),
    torque: (o) => ({ name: 'TORQUE', unit: C.torqueUnit(o), value: (d) => C.torqueFit(o, d.torque), frac: (d) => (num(d.torque) ? clamp01(d.torque / 700) : 0) }),
    gearbox: (o) => ({ name: 'GEARBOX', unit: tempUnit(o), value: (d) => tempNum(o, d.gearbox), frac: (d) => C.tempFrac(d.gearbox) }),
    rail: () => ({ name: 'FUEL RAIL', unit: 'bar', value: (d) => (d.engineOn === false || !num(d.hpfp) ? '--' : String(Math.round(d.hpfp))),
        frac: (d) => (d.engineOn === false || !num(d.hpfp) ? 0 : clamp01(d.hpfp / 350)) }),
    fuel: () => ({ name: 'FUEL', unit: '%', value: (d) => (num(d.fuelPct) ? String(Math.round(d.fuelPct)) : '--'), frac: (d) => (num(d.fuelPct) ? d.fuelPct / 100 : 0) }),
};
const LEFT = ['boost', 'coolant', 'iat', 'oil'], RIGHT = ['timing', 'torque', 'gearbox', 'rail'];

/**
 * A level bar: five stacked bars lit from the bottom (a band along a very large circle, so it runs straight up).
 */
function levelBar(key, x, y, w, h, frac) {
    const R = 3000, half = Math.asin(h / 2 / R) * 180 / Math.PI;
    return {
        key, kind: 'band', x, y, w, h,
        params: { u_geo: [w / 2 - R, h / 2, R, w - 4], u_span: [90 + half, 90 - half, 5, 0.42], u_marks: [0, 0, 0, 0], u_red: [2], u_soft: [1] },
        colors: (t) => ({ track: t.track, fill0: t.value, fill1: t.value, redc: t.red, tip: t.value, tick: t.dim, num: t.dim }),
        value: frac, max: 1, sweep: true,
    };
}
/** A reading tile, the level bar on the panel's outer side (side 'L' or 'R'). */
function tile(o, id, side, x, y, w, h) {
    const r = READINGS[id](o), L = side === 'L', k = 'tile_' + id, pad = 10, barW = 26, vw = w - barW - 2 * pad - 14;
    const vx = L ? x + pad + barW + 12 : x + pad, unitW = 64;
    return [
        { key: k, kind: 'panel', x, y, w, h, params: { u_box: [8, 1.5, 0.1, 1] }, colors: (t) => ({ top: t.tile0, bottom: t.tile1, border: t.tileEdge }) },
        levelBar(k + 'Bar', L ? x + pad : x + w - pad - barW, y + 10, barW, h - 20, r.frac),
        C.text(id, L ? vx : vx + unitW + 6, y + Math.round(h * 0.08), vw - unitW - 6, Math.round(h * 0.56), r.value, yellow, { align: L ? 0 : 1 }),
        C.text(id + 'Unit', L ? vx + vw - unitW : vx, y + Math.round(h * 0.38), unitW, Math.round(h * 0.2), r.unit, small, { align: L ? 1 : 0 }),
        C.text(id + 'Lbl', vx, y + Math.round(h * 0.7), vw, Math.round(h * 0.19), r.name, white, { align: L ? 0 : 1, tracking: 0.04 }),
    ];
}
/** A column of tiles from top to bottom. */
const column = (o, ids, side, x, w, top, bottom) => {
    const gap = 8, h = Math.floor((bottom - top - gap * (ids.length - 1)) / ids.length);
    return [].concat(...ids.map((id, i) => tile(o, id, side, x, top + i * (h + gap), w, h)));
};

/**
 * A dial, `size` across, centred at (cx, cy): the rev counter or the speedometer. Its scale starts past the bottom
 * on the right (shaders.js: a start below -180) and runs round the left and over the top. box: its two-row box at
 * the lower right (the rpm and fuel, or the speed and gear).
 */
function dial(o, which, cx, cy, size, box) {
    const k = size / 640, r = size / 2, bw = Math.round(24 * k), R = r - 2 - bw, rpm = which === 'rpm';
    const s = rpm ? C.rpmScale(o) : C.speedScale(o), dense = !rpm && s.max / s.major > 9;
    const out = [{
        key: which, kind: 'dial', x: cx - r, y: cy - r, w: size, h: size,
        params: {
            u_scale: [s.max, s.major, s.minor, rpm ? s.red : s.max + 1],
            u_arc: [-175, 95, Math.round((rpm ? 66 : dense ? 40 : 48) * k), R * (rpm ? 0.69 : 0.71)],
            u_needle_dim: [R * 0.86, 0, 15 * k, 4 * k],
            u_look: [0, 0.55, 0, 0],
            u_look2: [bw, k, 0.5, 0.25],
            u_look3: [Math.round(R * 0.4), 1, 1, Math.max(2, 3 * k)],
        },
        colors: dialColours, max: s.max, sweep: true,
        value: rpm ? (d) => (num(d.rpm) ? d.rpm / 1000 : 0) : (d) => (num(d.speed) ? C.speedIn(o, d.speed) : 0),
    }];
    if (!box) return out;
    // the box: two rows, each a value, its name under it and its unit at the top right
    const bx = Math.round(cx + 0.1 * r), bwid = Math.round(0.7 * r), rh = Math.round(0.3 * r), y1 = Math.round(cy + 0.2 * r), y2 = y1 + rh + Math.round(0.03 * r);
    // (one panel for both rows: the renderer's 64 layers an app)
    const panel = { key: which + 'InfoBox', kind: 'panel', x: bx, y: y1, w: bwid, h: y2 + rh - y1, z: 5, params: { u_box: [6, 1.5, 0.15, 1] },
        colors: (t) => ({ top: t.box0, bottom: t.box1, border: t.boxEdge }) };
    const row = (key, y, value, name, unit, colours) => [
        C.text(key, bx + 12, y + Math.round(rh * 0.1), Math.round(bwid * 0.64), Math.round(rh * 0.52), value, colours || white, { align: 0 }),
        C.text(key + 'Lbl', bx + 12, y + Math.round(rh * 0.68), Math.round(bwid * 0.6), Math.round(rh * 0.2), name, white, { align: 0, tracking: 0.04 }),
    ].concat(unit ? [C.text(key + 'Unit', bx + Math.round(bwid * 0.62), y + Math.round(rh * 0.1), Math.round(bwid * 0.34), Math.round(rh * 0.19), unit, small, { align: 1 })] : []);
    return out.concat([panel], rpm
        ? row('rpmBox', y1, (d) => (num(d.rpm) ? String(Math.round(d.rpm)) : '--'), 'RPM', null).concat(
            row('fuelPct', y2, (d) => (num(d.fuelPct) ? d.fuelPct.toFixed(1) : '--'), 'FUEL', '%'))
        : row('speedBox', y1, (d) => C.speedText(o, d), 'SPEED', C.speedUnit(o)).concat(
            row('gearBox', y2, C.gearText, 'GEAR', null, gearC)));
}

/** A reading on one line under the map: its name, then its value and unit. */
const inline = (o, id, x, y, w) => {
    const r = READINGS[id](o);
    return [C.text(id + 'Lbl', x, y + 8, 120, 16, r.name, white, { align: 0, tracking: 0.04 }),
        C.text(id, x + 124, y, w - 124, 30, (d) => { const v = r.value(d); return (Array.isArray(v) ? v[v.length - 1] : v) + (v === '--' || v === 'OFF' ? '' : ' ' + r.unit); }, yellow, { align: 0 })];
};

module.exports = {
    id: 'race_dash',
    title: 'Race dash',
    palette: pal,
    gearText: C.gearText,
    needs: ['boostActual', 'iat', 'timing', 'hpfp', 'gearbox'],
    // the fuel is in the rev counter's box (or a tile), not the shared strip gauge
    stripFuel: false,

    pieces(o) {
        const centre = o.centre || 'info', strip = C.strip(o), m = C.mCar(o);
        const bg = (x, y, w, h, key) => ({ key: key || 'bg', kind: 'bg', x, y, w, h, params: { u_look: [0, 0, 0.5, 8], u_weave: [0.55, 7] },
            colors: (t) => ({ top: t.bgTop, bottom: t.bgBottom, accent: t.accent }) });

        if (centre === 'map') {
            const around = C.aroundMap().map((r, i) => bg(r.x, r.y, r.w, r.h, 'bg' + i));
            if (strip) {
                const g = C.sideDials(o, C.MAP, 120);
                return around.concat(dial(o, 'rpm', g.L, g.cy, g.size, true), dial(o, 'speed', g.R, g.cy, g.size, true),
                    inline(o, 'boost', 440, 606, 250), inline(o, 'coolant', 700, 606, 250), inline(o, 'oil', 960, 606, 250), inline(o, 'iat', 1220, 606, 250));
            }
            // the full panel: the speedometer left of the map, a small rev counter right of it clear of the KOMBI's
            // gear box, the readings under the map and the speed and gear above the rev counter
            return around.concat(dial(o, 'speed', 208, 360, 404, true), dial(o, 'rpm', 1792, 500, 256, false),
                inline(o, 'boost', 440, 610, 250), inline(o, 'coolant', 700, 610, 250), inline(o, 'oil', 960, 610, 250),
                tile(o, 'fuel', 'R', 1676, 280, 236, 90));
        }
        if (centre === 'stock') {
            const S = C.STOCK_MIDDLE, gx = S.x + S.w + 8;
            const bgs = [bg(0, 0, S.x, 720), bg(S.x + S.w, 0, 1920 - S.x - S.w, 720, 'bgR')];
            if (strip) {
                const g = C.sideDials(o, S, 40), gw = g.R - g.size / 2 - 8 - gx;
                return bgs.concat(dial(o, 'rpm', g.L, g.cy, g.size, true), dial(o, 'speed', g.R, g.cy, g.size, true),
                    column(o, ['boost', 'coolant', 'oil', 'iat'], 'L', gx, gw, Math.max(C.NOTCH.y + C.NOTCH.h + 8, C.belowCorners(gx, gx + gw, 6)), C.STRIP_Y - 6));
            }
            // the full panel: the speedometer left, a small rev counter between the middle and the KOMBI's gear box
            // (no box: an M car's second box), the tiles right of the gear box under its eDrive box
            return bgs.concat(dial(o, 'speed', 290, 372, 520, true), dial(o, 'rpm', 1256, 392, 296, false),
                column(o, ['boost', 'coolant', 'oil', 'fuel'], 'R', 1676, 236, 272, 700));
        }
        const all = [bg(0, 0, 1920, 720)];
        if (strip) {
            // the car's strip (default): the dials either side of the camera's cowl (x 730-1190 to y 128), their
            // bottoms above the strip; the tiles in the outer columns below the slanted top corners
            const S = 580, cy = C.STRIP_Y - 6 - S / 2;
            return all.concat(dial(o, 'rpm', 545, cy, S, true), dial(o, 'speed', 1375, cy, S, true),
                column(o, LEFT, 'L', 8, 230, C.belowCorners(8, 238, 4), C.STRIP_Y - 4),
                // (a plug-in hybrid: the shared charge gauge under them, above the strip's electric range)
                column(o, RIGHT, 'R', 1682, 230, C.belowCorners(1682, 1912, 4), o.vehicle === 'ice' ? C.STRIP_Y - 4 : 590));
        }
        // the full panel: both dials left of the KOMBI's gear box (x 1410), the left one clear of an M car's first box
        // (x 778; with an M car the speedometer goes left, so only the rev counter's face passes under its second
        // box), the right tiles under its eDrive box (y 265)
        const left = m ? 'speed' : 'rpm', right = m ? 'rpm' : 'speed';
        return all.concat(dial(o, left, 520, 395, 500, true), dial(o, right, 1160, 395, 500, !m),
            column(o, LEFT, 'L', 8, 230, C.belowCorners(8, 238, 4), 700),
            column(o, m ? ['timing', 'torque', 'gearbox', 'fuel'] : RIGHT, 'R', 1682, 230, 272, 700));
    },
};
