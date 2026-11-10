'use strict';
/**
 * textfit.js - does a text fit its box, as the engine will draw it? The same arithmetic as font.js line(): each
 * glyph's own advance from the baked atlas (in glyph heights), tracking dropped first, then the glyphs set
 * closer, down to 85% of their advance; past that the line is cut at the layer's edge. Characters the atlas has
 * not got draw as nothing.
 *
 *   fit(text, w, h, tracking, fam) -> { need, box, squeeze, clipped, overflowPx, missing }
 *     need      the line's width at full advance, no tracking (glyph heights)
 *     box       the layer's width (glyph heights)
 *     squeeze   how close the glyphs are set (1: as designed; 0.85: the most font.js does)
 *     clipped   true when even at 85% it is wider than the box: the car cuts it
 *     overflowPx  by how many pixels, at 85%
 *     missing   the characters the atlas has not got
 *
 * The matrix (tools/test_textfit.js): every layout, every geometry option, unit sets and data from empty to the
 * extremes, every text piece's text evaluated as the engine would (text(d, t)).
 */
require('./scene');   // maps ./kit/ to the kit's runtime
const path = require('path');
const font = require(path.join(__dirname, '..', 'apps', 'cluster_layouts', 'font'));

const MIN_SQUEEZE = 0.85;

function fit(s, w, h, tracking, fam) {
    const a = font.atlas(fam || 'bold'), chars = Array.from(String(s)).slice(0, 32);
    const codes = chars.map(font.codeOf);
    const missing = chars.filter((c, i) => codes[i] < 0 && c !== ' ');
    const advs = codes.map((c, i) => (c < 0 ? 0.3 : chars[i] === ' ' ? Math.max(a.adv[c], 0.32) : a.adv[c]));
    const need = advs.reduce((x, v) => x + v, 0), box = w / h;
    const squeeze = need > box && need > 0 ? Math.max(MIN_SQUEEZE, box / need) : 1;
    const clipped = need * MIN_SQUEEZE > box + 1e-6;
    return { need, box, squeeze, clipped, overflowPx: clipped ? Math.round((need * MIN_SQUEEZE - box) * h) : 0, missing,
        truncated: Array.from(String(s)).length > 32 };
}

/* ---------- the data the texts are tried with (base units: km/h, deg C, bar, Nm, km, kW) ---------- */
const now = { speed: 87, rpm: 2400, gear: 4, stage: 'D', oil: 96, coolant: 90, outside: 18, gearbox: 78, iat: 31, boostActual: 0.82, boostTarget: 0.9,
    torque: 312, timing: 14.5, hpfp: 205, frange: 520, erange: 29, soc: 64, kw: -12.4, splitRear: 62, fuelPct: 55, battTemp: 27, engineOn: true,
    driveMode: 'COMFORT', pdDrive: 62, pdClimate: 24, pdSeats: 14 };
const DATA = {
    typical: now,
    empty: {},
    parked: { speed: 0, rpm: 0, gear: null, stage: 'P', engineOn: false, oil: 22, coolant: 21, outside: 9 },
    high: Object.assign({}, now, { speed: 299, rpm: 8999, gear: 8, stage: 'D', mode: 'M', oil: 150, coolant: 130, gearbox: 150, iat: 80, outside: 55,
        boostActual: 1.99, torque: 1099, timing: 45.5, hpfp: 350, frange: 1999, erange: 99, soc: 100, kw: 250, splitRear: 100, fuelPct: 100,
        driveMode: 'COMFORT INDIVIDUAL', mProfile: null }),
    low: Object.assign({}, now, { speed: 0, rpm: 650, gear: null, stage: 'R', oil: -40, coolant: -40, gearbox: -40, iat: -40, outside: -40,
        boostActual: -0.95, torque: -199, timing: -10.5, frange: 0, erange: 0, soc: 0, kw: -120, splitRear: 0, fuelPct: 0, driveMode: 'ECO PRO INDIVIDUAL' }),
    sportPlus: Object.assign({}, now, { driveMode: 'SPORT INDIVIDUAL', speed: 188, rpm: 7100, gear: 3, mode: 'S' }),
    // a plug-in hybrid's longest (data.js modeOf adds XTRABOOST only off a petrol car)
    xtraboost: Object.assign({}, now, { driveMode: 'SPORT INDIVIDUAL XTRABOOST', phevOnly: true }),
    mProfile: Object.assign({}, now, { mProfile: 'M2', driveMode: 'SPORT+' }),
};

/* the unit sets (Settings: speed, temperature, boost, torque) */
const UNITS = [
    { speedUnit: 'kmh', tempUnit: 'c', pressUnit: 'bar', torqueUnit: 'nm' },
    { speedUnit: 'mph', tempUnit: 'f', pressUnit: 'psi', torqueUnit: 'nm' },
    { speedUnit: 'kmh', tempUnit: 'c', pressUnit: 'kpa', torqueUnit: 'kgm' },
    { speedUnit: 'mph', tempUnit: 'f', pressUnit: 'kpa', torqueUnit: 'kgm' },
];
/* the geometry options (each changes where pieces go) */
const GEOMETRY = [];
['info', 'map', 'stock'].forEach((centre) => ['ice', 'phev'].forEach((vehicle) => ['standard', 'm'].forEach((cluster) =>
    ['stock', 'layout'].forEach((bottomStrip) => GEOMETRY.push({ centre, vehicle, cluster, bottomStrip })))));

/**
 * Every text of a layout over the matrix: [{ layout, key, opts, data, text, fit }], one per distinct
 * (layout, key, box, text). opts: extra options merged into each combination.
 */
function sweep(L, extra) {
    const seen = new Set(), out = [];
    GEOMETRY.forEach((g) => UNITS.forEach((u) => {
        const o = Object.assign({ redline: 7000, rpmMax: 8000 }, g, u, extra || {});
        let pieces;
        try { pieces = L.pieces(o) || []; } catch (e) { out.push({ layout: L.id, key: '(pieces threw)', opts: o, error: String(e) }); return; }
        const t = L.palette('comfort');
        pieces.filter((p) => p.kind === 'text').forEach((p) => Object.keys(DATA).forEach((dk) => {
            let s;
            if (DATA[dk].phevOnly && o.vehicle === 'ice') return;
            try { s = typeof p.text === 'function' ? String(p.text(DATA[dk], t, p)) : String(p.text); } catch (e) { s = '(threw ' + e.message + ')'; }
            const id = [L.id, p.key, p.w, p.h, p.tracking || 0, s].join('|');
            if (seen.has(id)) return;
            seen.add(id);
            out.push({ layout: L.id, key: p.key, opts: o, data: dk, text: s, w: p.w, h: p.h, fit: fit(s, p.w, p.h, p.tracking, L.font) });
        }));
    }));
    return out;
}

module.exports = { fit, sweep, DATA, UNITS, GEOMETRY, MIN_SQUEEZE };

/**
 * Where a text's ink lands: { x0, x1, y0, y1 } in panel pixels (its line's width at the squeeze it gets, placed
 * by its align in its box; the box's height).
 */
function inkRect(p, s) {
    const f = fit(s, p.w, p.h, p.tracking, p.fam);
    const gaps = Math.max(0, Array.from(String(s)).length - 1), box = p.w / p.h;
    let tr = p.tracking || 0;
    if (f.need + tr * gaps > box) tr = Math.max(0, (box - f.need) / Math.max(1, gaps));
    const width = Math.min(box, f.need * f.squeeze + tr * gaps) * p.h;
    const align = p.align === undefined ? 0.5 : p.align, x0 = p.x + (p.w - width) * align;
    return { x0, x1: x0 + width, y0: p.y, y1: p.y + p.h };
}
/**
 * Texts whose ink runs into another text's ink, for a layout over the matrix: [{ layout, a, b, ta, tb, opts, data, px }]
 * (px: the overlap's width). Only texts that draw something; one pair once per (a, b, texts).
 */
function overlaps(L, extra) {
    const seen = new Set(), out = [];
    GEOMETRY.forEach((g) => UNITS.forEach((u) => {
        const o = Object.assign({ redline: 7000, rpmMax: 8000 }, g, u, extra || {});
        const pieces = (L.pieces(o) || []).filter((p) => p.kind === 'text' && !p.group), t = L.palette('comfort');
        Object.keys(DATA).forEach((dk) => {
            if (DATA[dk].phevOnly && o.vehicle === 'ice') return;
            const inks = pieces.map((p) => {
                let s;
                try { s = typeof p.text === 'function' ? String(p.text(DATA[dk], t, p)) : String(p.text); } catch (e) { s = ''; }
                return s.trim() ? { p, s, r: inkRect(Object.assign({}, p, { fam: L.font }), s) } : null;
            }).filter(Boolean);
            for (let i = 0; i < inks.length; i++) for (let j = i + 1; j < inks.length; j++) {
                const a = inks[i].r, b = inks[j].r;
                const ox = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0), oy = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
                if (ox > 2 && oy > 2) {
                    const id = [inks[i].p.key, inks[j].p.key, inks[i].s, inks[j].s].join('|');
                    if (seen.has(id)) continue;
                    seen.add(id);
                    out.push({ layout: L.id, a: inks[i].p.key, b: inks[j].p.key, ta: inks[i].s, tb: inks[j].s, opts: o, data: dk, px: Math.round(ox), py: Math.round(oy) });
                }
            }
        });
    }));
    return out;
}
module.exports.inkRect = inkRect;
module.exports.overlaps = overlaps;
