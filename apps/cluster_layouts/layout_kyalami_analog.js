'use strict';
/**
 * layout_kyalami_analog.js - "Kyalami analog": two large, centred analog dials on black, satin metal bezels,
 * crisp white ticks and numerals, slim Kyalami Orange needles with a hairline orange arc to the reading, and a slim
 * centre column between them: the drive mode, the gear, the digital speed and, under a satin rule, oil, coolant
 * and boost (or the electric range), the time and the outside temperature. Orange is the accent only: the needles, the arcs, the red zone's
 * neighbour, the mode. An original design.
 *
 * Compositions, from the panel's usable areas (layout_common):
 *   the car's own strip (default): the dials 600 px either side of the centre column, ending above the strip;
 *     with the map or the stock middle, the two dials the same size in the side columns (sideDials);
 *   the full panel (Bottom strip: the layout's): the tach left of the KOMBI's gear box, the readings right of it,
 *     and with an M car the centre column narrowed clear of its first box (the dials' faces may pass under the
 *     boxes, as every dial layout's: test_engine M_ON_DIAL).
 */
const C = require('./layout_common');

/* Kyalami Orange (the M interior leather's): the accent; white for what is read; satin metal for the bezels */
const PALETTES = {
    comfort: {
        bg: '#000000', face0: '#0d0d0e', face1: '#030303', bezel: '#a8a5a0', bezel2: '#262524', tick: '#f4f1ec', minor: '#7a7672',
        num: '#f4f1ec', glow: '#e8701e', red: '#ff3b1f', needle: '#f07a26', hub: '#121212', accent: '#e8701e',
        text: '#f4f1ec', dim: '#8f8a84', track: '#1b1a19', ev: '#5ab8ff', rule: '#4a4743', card0: '#0b0b0b', card1: '#050505', cardEdge: '#2a2928',
    },
    sport: {
        bg: '#000000', face0: '#100c0a', face1: '#030202', bezel: '#b2aca6', bezel2: '#2a2624', tick: '#ffffff', minor: '#8a7466',
        num: '#ffffff', glow: '#ff6a14', red: '#ff2a14', needle: '#ff6a14', hub: '#141210', accent: '#ff6a14',
        text: '#ffffff', dim: '#a39488', track: '#21160f', ev: '#5ab8ff', rule: '#5a4436', card0: '#0d0a08', card1: '#050403', cardEdge: '#3a2a20',
    },
    efficient: {
        bg: '#000000', face0: '#0b0d0e', face1: '#030303', bezel: '#a6aaac', bezel2: '#26282a', tick: '#eef2f4', minor: '#6f7478',
        num: '#eef2f4', glow: '#d9782e', red: '#ff3b1f', needle: '#e8873a', hub: '#111213', accent: '#d9782e',
        text: '#eef2f4', dim: '#8c9196', track: '#18191a', ev: '#5ab8ff', rule: '#3f4245', card0: '#0a0b0c', card1: '#040505', cardEdge: '#28292b',
    },
};
const pal = (lookId) => PALETTES[lookId] || PALETTES.comfort;
const dialColours = (t) => ({ face0: t.face0, face1: t.face1, bezel: t.bezel, bezel2: t.bezel2, tick: t.tick, minor: t.minor, num: t.num, red: t.red, needle: t.needle, hub: t.hub, accent: t.accent, glow: t.glow });
const white = (t) => ({ color: [t.text, 1], glow: [t.glow, 0.12] });
const lbl = (t) => ({ color: [t.dim, 1], glow: [t.glow, 0] });
const orange = (t) => ({ color: [t.accent, 1], glow: [t.glow, 0.25] });
const gearC = (t, d) => ({ color: [C.gearText(d) === 'R' ? t.red : t.text, 1], glow: [t.glow, C.gearText(d) === '-' ? 0 : 0.18] });

/**
 * A dial, sized `size`, centred at (cx, cy): the speedometer or the tach, its unit under the hub. Everything in
 * proportion to a 640 px dial (k). The numerals smaller and further out on the km/h scale (14 of them, most of three
 * figures). A hairline orange arc from zero to the reading, just inside the ticks; slim needle, light shadow.
 */
function dial(o, which, cx, cy, size) {
    const k = size / 640, s = which === 'speed' ? C.speedScale(o) : C.rpmScale(o), red = which === 'speed' ? s.max + 1 : s.red;
    const dense = which === 'speed' && o.speedUnit === 'kmh';
    return [
        {
            key: which, kind: 'dial', x: cx - size / 2, y: cy - size / 2, w: size, h: size,
            params: {
                u_scale: [s.max, s.major, s.minor, red],
                u_arc: [-135, 135, Math.round((dense ? 30 : 40) * k + 2), (dense ? 226 : 214) * k],
                u_needle_dim: [272 * k, 44 * k, 13 * k, 3.5],
                u_look: [0.32, 0.8, 1, 7 * k],
                u_look2: [Math.round(12 * k), k, 0.6, 0.45],
            },
            colors: dialColours, max: s.max, sweep: true,
            value: which === 'speed' ? (d) => (C.isNum(d.speed) ? C.speedIn(o, d.speed) : 0) : (d) => (C.isNum(d.rpm) ? d.rpm / 1000 : 0),
        },
        C.text(which + 'Unit', cx - 110, cy + Math.round(58 * k), 220, Math.round(20 * k), which === 'speed' ? C.speedUnit(o) : 'x1000 rpm', lbl, { tracking: 0.14 }),
    ];
}

/** A reading on one line, its name then its value (the row under the map, above the car's strip). */
const inline = (key, x, y, w, name, value, colours) => [
    C.text(key + 'Lbl', x, y + 8, 110, 14, name, lbl, { align: 0, tracking: 0.16 }),
    C.text(key, x + 112, y, w - 112, 30, value, colours || white, { align: 0 }),
];
/** A small reading: its value, its name under it. */
const reading = (key, x, y, w, value, name, colours) => [
    C.text(key, x, y, w, 34, value, colours || white),
    C.text(key + 'Lbl', x, y + 38, w, 14, name, lbl, { tracking: 0.18 }),
];

/**
 * The centre column, from y top to bottom: the drive mode, the gear, the digital speed and its unit, a satin rule,
 * then oil, coolant and boost (or the electric range) side by side, the fuel gauge, the time and outside temperature.
 * Rows spread to the height; each row's place derived from the column's box.
 */
function column(o, X, W, top, bottom, fuel) {
    const H = bottom - top, f = H / 490, mid = X + W / 2, narrow = W < 240, third = Math.floor(W / (narrow ? 2 : 3));
    const y = (v) => top + Math.round(v * f);
    const fuelC = (t, d) => {
        const low = !!d && C.isNum(d.fuelPct) && d.fuelPct < 12.5;
        return { track: t.track, fill0: low ? t.red : t.text, fill1: low ? t.red : t.text, redc: t.red, tip: t.accent, tick: t.dim, num: t.dim };
    };
    return [
        { key: 'card', kind: 'panel', x: X, y: top, w: W, h: H, params: { u_box: [22, 1.5, 0.15, 1] }, colors: (t) => ({ top: t.card0, bottom: t.card1, border: t.cardEdge }) },
        C.text('mode', X + 12, y(18), W - 24, 22, C.modeText, orange, { tracking: 0.28 }),
        C.text('gear', X, y(52), W, Math.round(148 * f), C.gearText, gearC),
        C.text('speedDigits', X, y(206), W, Math.round(64 * f), (d) => C.speedText(o, d), white),
        C.text('speedDigitsUnit', X, y(274), W, 18, C.speedUnit(o), lbl, { tracking: 0.16 }),
        C.flat('rule', mid - 60, y(308), 120, 2, 'rule'),
        ...reading('oil', X + 6, y(326), third - 6, (d) => C.tempText(o, d.oil), 'OIL'),
        ...reading('coolant', X + third, y(326), narrow ? W - third - 6 : third, (d) => C.tempText(o, d.coolant), 'COOLANT'),
        // (a narrow column, beside an M car's first box: oil and coolant only; the boost goes right of the gear box)
        ...(narrow ? [] : reading('boost', X + 2 * third, y(326), W - 2 * third - 6, C.engineFocus(o) ? (d) => (d.engineOn === false ? 'OFF' : C.isNum(d.boostActual) ? C.boostFit(o, d.boostActual) : '--')
            : C.focus.range(o), C.engineFocus(o) ? 'BOOST ' + C.boostUnitText(o).toUpperCase() : C.focus.rangeLabel(o), C.engineFocus(o) ? white : (t) => ({ color: [t.ev, 1], glow: [t.ev, 0.15] }))),
    ].concat(fuel ? [
        C.text('fuelLbl2', X + 20, y(400), 60, 14, 'FUEL', lbl, { align: 0, tracking: 0.18 }),
        C.bar('fuelGauge', X + 84, y(400), W - 104, 12, (d) => (C.isNum(d.fuelPct) ? d.fuelPct / 100 : 0), fuelC, 8),
    ] : []).concat([
        C.text('clock', X + 20, y(fuel ? 436 : 418), W / 2 - 24, 28, C.clock, white, { align: 0 }),
        C.text('outside', X + W / 2 + 4, y(fuel ? 436 : 418), W / 2 - 24, 28, (d) => C.outsideText(o, d.outside), white, { align: 1 }),
    ]);
}

module.exports = {
    id: 'kyalami_analog',
    title: 'Kyalami analog',
    palette: pal,
    gearText: C.gearText,
    needs: ['boostActual'],

    pieces(o) {
        const centre = o.centre || 'info', strip = C.strip(o);
        const bg = [C.flat('bg', 0, 0, 1920, 720, 'bg')];
        if (centre === 'map') {
            const top = C.MAP.y, bot = C.MAP.y + C.MAP.h, around = C.aroundMap().map((r, i) => C.flat('bg' + i, r.x, r.y, r.w, r.h, 'bg'));
            const heads = (L, R, hy, hh) => [
                C.text('clock', 520, top - 76, 200, 34, C.clock, white),
                C.text('outside', 1200, top - 76, 200, 34, (d) => C.outsideText(o, d.outside), white),
                C.text('speedDigits', L - 80, hy, 160, hh - 24, (d) => C.speedText(o, d), white),
                C.text('speedDigitsUnit', L - 80, hy + hh - 22, 160, 20, C.speedUnit(o), lbl, { tracking: 0.14 }),
                C.text('mode', R - 90, hy, 180, 20, C.modeText, orange, { tracking: 0.24 }),
                C.text('gear', R - 80, hy + 22, 160, hh - 22, C.gearText, gearC),
            ];
            if (strip) {
                // the car's own strip: the dials the same size either side of the map, mirrored (sideDials)
                const g = C.sideDials(o, C.MAP), hy = C.belowCorners(g.L - 90, g.L + 90, 4);
                return around.concat(dial(o, 'speed', g.L, g.cy, g.size), dial(o, 'rpm', g.R, g.cy, g.size), heads(g.L, g.R, hy, g.top - 6 - hy),
                    inline('oil', 470, bot + 8, 250, 'OIL', (d) => C.tempText(o, d.oil)),
                    inline('coolant', 840, bot + 8, 250, 'COOLANT', (d) => C.tempText(o, d.coolant)),
                    inline('boost', 1210, bot + 8, 290, C.engineFocus(o) ? 'BOOST ' + C.boostUnitText(o).toUpperCase() : C.focus.rangeLabel(o),
                        C.engineFocus(o) ? (d) => (d.engineOn === false ? 'OFF' : C.isNum(d.boostActual) ? C.boostFit(o, d.boostActual) : '--') : C.focus.range(o)));
            }
            // the full panel: the speedometer left of the map, a small tach right of it clear of the KOMBI's gear box
            return around.concat(dial(o, 'speed', 208, 360, 404), dial(o, 'rpm', 1792, 500, 256), heads(208, 1635, 130, 98).filter((p) => !/^speedDigits/.test(p.key)),
                [C.text('speedDigits', 1520, 232, 230, 30, (d) => C.speedText(o, d) + ' ' + C.speedUnit(o), white)]);
        }
        if (centre === 'stock') {
            if (strip) {
                // the stock cluster's middle (x 566-1104) left showing: the dials the same size either side of it
                const g = C.sideDials(o, C.STOCK_MIDDLE, 40), gx = C.STOCK_MIDDLE.x + C.STOCK_MIDDLE.w + 16, gw = g.R - g.size / 2 - 16 - gx;
                return [C.flat('bg', 0, 0, C.STOCK_MIDDLE.x, 720, 'bg'), C.flat('bgR', gx - 16, 0, 1920 - gx + 16, 720, 'bg')].concat(
                    dial(o, 'speed', g.L, g.cy, g.size), dial(o, 'rpm', g.R, g.cy, g.size),
                    [C.text('mode', gx, g.cy - 150, gw, 20, C.modeText, orange, { tracking: 0.22 }), C.text('gear', gx, g.cy - 120, gw, 110, C.gearText, gearC)],
                    reading('boost', gx, g.cy + 20, gw, C.focus.range(o), C.focus.rangeLabel(o)));
            }
            // the full panel: the speedometer left, the tach between the stock middle and the KOMBI's gear box
            return [C.flat('bg', 0, 0, 566, 720, 'bg'), C.flat('bgR', 1104, 0, 816, 720, 'bg')].concat(
                dial(o, 'speed', 290, 372, 520), dial(o, 'rpm', 1256, 392, 296),
                reading('oilR', 1680, 300, 210, (d) => C.tempText(o, d.oil), 'OIL'), reading('coolantR', 1680, 400, 210, (d) => C.tempText(o, d.coolant), 'COOLANT'),
                reading('boostR', 1680, 500, 210, C.focus.range(o), C.focus.rangeLabel(o)));
        }
        if (strip) {
            // the car's own strip (default): 600 px dials either side of the centre column, centred on the panel,
            // ending above the strip (layout_common.STRIP_Y); the column below the camera's cowl
            const S = 600, cy = C.STRIP_Y - 8 - S / 2, X = 790, W = 340;
            // (the fuel gauge, and a plug-in hybrid's charge, the shared ones above the strip's ranges: layouts.js)
            return bg.concat(dial(o, 'speed', 450, cy, S), dial(o, 'rpm', 1470, cy, S), column(o, X, W, 140, C.STRIP_Y - 10, false));
        }
        // the full panel: the speedometer left, the tach left of the KOMBI's gear box (x 1410-1662), the column
        // between them (narrowed clear of an M car's first box), the readings' extras right of the box
        const m = C.mCar(o), X = 586, W = m ? 186 : 262;
        // (520 px at y 392: the dials' tops clear of the camera's cowl, x 730-1190 to y 128)
        const list = bg.concat(dial(o, 'speed', 300, 392, 520), dial(o, 'rpm', 1120, 392, 520), column(o, X, W, 140, 640, true));
        return list.concat(
            reading('fuelR', 1680, 300, 210, (d) => C.distText(o, d.frange), 'FUEL RANGE'),
            reading('powerR', 1680, 410, 210, C.focus.power(o), C.focus.powerLabel(o)),
            m ? reading('boostR', 1680, 520, 210, C.focus.range(o), C.focus.rangeLabel(o)) : [],
        );
    },
};
