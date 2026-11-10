'use strict';
/**
 * layout_kyalami_digital.js - "Kyalami digital": a quiet, contemporary digital cluster. A wide, shallow
 * rev-counter arc (a "horizon") across the top of the glass, its numerals inside the curve; under it the speed,
 * very large, white on black, with its unit and the drive mode in Kyalami Orange; the gear on a charcoal tile
 * with a hairline orange edge; boost (or a plug-in hybrid's electric range) on a matching tile with its own bar;
 * the rest in one low charcoal row. Orange only for what moves or matters: the arc's fill, the mode, the tiles'
 * edges. An original design.
 *
 * Compositions, from the panel's usable areas (layout_common):
 *   readings centre, the car's strip: the arc 300-1620, the speed centred, the tiles either side, the row above
 *     the strip (the shared fuel and charge gauges either side of it: layouts.js);
 *   readings centre, the full panel: the same arc (its ends clear of the KOMBI's gear box and eDrive box), the
 *     speed and tiles left of the gear box, the extras right of it; with an M car the speed and gear move left of
 *     the M KOMBI's first box;
 *   the map: the speed and a small arc in the left column, the gear and readings in the right one (the full
 *     panel: clear of the gear box);
 *   the stock middle: the speed left of it, the arc, gear and readings right of it.
 */
const C = require('./layout_common');

const PALETTES = {
    comfort: {
        bg: '#000000', text: '#f4f1ec', dim: '#8f8a84', accent: '#e8701e', glow: '#e8701e', red: '#ff3b1f', ev: '#5ab8ff',
        tile0: '#151413', tile1: '#0c0b0b', tileEdge: '#2c2a28', gearEdge: '#8a4314', track: '#221f1c', fill0: '#6e3410', tip: '#ffb070',
        tick: '#6f6a64', num: '#bdb7b0', rule: '#3a3734',
    },
    sport: {
        bg: '#000000', text: '#ffffff', dim: '#a39488', accent: '#ff6a14', glow: '#ff6a14', red: '#ff2a14', ev: '#5ab8ff',
        tile0: '#1a1411', tile1: '#0e0a08', tileEdge: '#3a2a20', gearEdge: '#b4521a', track: '#2a1c14', fill0: '#8a3a0c', tip: '#ffc08a',
        tick: '#806a5c', num: '#d8cabe', rule: '#4a3a30',
    },
    efficient: {
        bg: '#000000', text: '#eef2f4', dim: '#8c9196', accent: '#d9782e', glow: '#d9782e', red: '#ff3b1f', ev: '#5ab8ff',
        tile0: '#131516', tile1: '#0b0c0d', tileEdge: '#2a2c2e', gearEdge: '#7a4420', track: '#1d1f20', fill0: '#5c3416', tip: '#f0b080',
        tick: '#686d72', num: '#b6bbc0', rule: '#36393c',
    },
};
const pal = (lookId) => PALETTES[lookId] || PALETTES.comfort;
const white = (t) => ({ color: [t.text, 1], glow: [t.glow, 0.1] });
const lbl = (t) => ({ color: [t.dim, 1], glow: [t.glow, 0] });
const orange = (t) => ({ color: [t.accent, 1], glow: [t.glow, 0.22] });
const evC = (t) => ({ color: [t.ev, 1], glow: [t.ev, 0.15] });
const gearC = (t, d) => ({ color: [C.gearText(d) === 'R' ? t.red : t.text, 1], glow: [t.glow, C.gearText(d) === '-' ? 0 : 0.16] });
const tileC = (edge) => (t) => ({ top: t.tile0, bottom: t.tile1, border: t[edge || 'tileEdge'] });
const tile = (key, x, y, w, h, edge) => ({ key, kind: 'panel', x, y, w, h, params: { u_box: [14, 1.5, 0.1, 1] }, colors: tileC(edge) });

/**
 * The rev counter: a shallow arc whose band's centre line runs from (x0, y) to (x1, y) through its top, `sag`
 * pixels higher, in the middle (yTop: the band's outer edge there); quarter-thousand segments, the numerals inside
 * the curve (under it), the red zone from the redline.
 */
function rpmArc(o, x0, x1, yTop, sag, thick, numH) {
    const r = C.rpmScale(o), c = x1 - x0, R = (c * c / 4 + sag * sag) / (2 * sag), half = Math.asin(c / 2 / R) * 180 / Math.PI;
    const pad = Math.ceil(thick / 2) + 6, inside = Math.round(thick / 2 + 12 + numH * 0.75);
    const x = x0 - pad, y = yTop - 6, cy = 6 + thick / 2 + R;
    const h = Math.ceil(6 + thick + sag + inside + numH * 0.6 + 6);
    return {
        key: 'rpmArc', kind: 'band', x, y, w: c + 2 * pad, h,
        params: { u_geo: [c / 2 + pad, cy, R, thick], u_span: [-half, half, r.max * 4, 0.22], u_marks: [r.max, 1, numH, -inside], u_red: [r.red / r.max] },
        colors: (t) => ({ track: t.track, fill0: t.fill0, fill1: t.accent, redc: t.red, tip: t.tip, tick: t.tick, num: t.num }),
        value: (d) => (C.isNum(d.rpm) ? d.rpm / 1000 / r.max : 0), max: 1, sweep: true,
    };
}
/** The speed, h high, its unit under it. */
const speedBlock = (o, x, y, w, h) => [
    C.text('speedDigits', x, y, w, h, (d) => C.speedText(o, d), white),
    C.text('speedUnit', x, y + h + 6, w, Math.max(16, Math.round(h * 0.1)), C.speedUnit(o), lbl, { tracking: 0.2 }),
];
/** The gear on its tile, the hairline orange edge. */
const gearTile = (x, y, w, h) => [
    tile('gearTile', x, y, w, h, 'gearEdge'),
    C.text('gear', x + 10, y + Math.round(h * 0.1), w - 20, Math.round(h * 0.8), C.gearText, gearC),
];
/** A reading: its value, its name under it. */
const reading = (key, x, y, w, value, name, colours, vh) => [
    C.text(key, x, y, w, vh || 38, value, colours || white),
    C.text(key + 'Lbl', x, y + (vh || 38) + 5, w, 16, name, lbl, { tracking: 0.18 }),
];
/** Boost (the engine) or the electric range (a plug-in hybrid) and its bar, on a tile. */
function boostTile(o, x, y, w, h) {
    const eng = C.engineFocus(o), vh = Math.round(h * 0.34);
    const barC = (t, d) => ({ track: t.track, fill0: eng ? t.fill0 : t.ev, fill1: eng ? t.accent : t.ev, redc: t.red, tip: eng ? t.tip : t.ev, tick: t.dim, num: t.dim });
    return [
        tile('boostTile', x, y, w, h),
        C.text('boostLbl', x + 12, y + Math.round(h * 0.1), w - 24, 16, eng ? 'BOOST ' + C.boostUnitText(o).toUpperCase() : C.focus.rangeLabel(o), lbl, { tracking: 0.18 }),
        C.text('boost', x + 12, y + Math.round(h * 0.3), w - 24, vh, eng ? (d) => (d.engineOn === false ? 'OFF' : C.isNum(d.boostActual) ? C.boostFit(o, d.boostActual) : '--')
            : (d) => C.erangeText(o, d), eng ? white : evC),
        C.bar('boostBar', x + 14, y + h - Math.round(h * 0.22), w - 28, 14, C.focus.bar(o), barC, 12),
    ];
}
/** The low row: readings spread evenly across a tile (each [key, value, name, colours]). */
function row(x, y, w, h, items) {
    const step = w / items.length, vh = Math.round(h * 0.4);
    return [tile('rowTile', x, y, w, h)].concat(...items.map((it, i) => reading(it[0], Math.round(x + i * step + 8), y + Math.round(h * 0.14), Math.round(step - 16), it[1], it[2], it[3], vh)));
}
const temps = (o) => [
    ['oil', (d) => C.tempText(o, d.oil), 'OIL'],
    ['coolant', (d) => C.tempText(o, d.coolant), 'COOLANT'],
];
const power = (o) => ['power', C.focus.power(o), C.focus.powerLabel(o)];
const clockOut = (o) => [['clock', C.clock, 'TIME'], ['outside', (d) => C.outsideText(o, d.outside), 'OUTSIDE']];
const fuelBar = (key, x, y, w) => {
    const c = (t, d) => {
        const low = !!d && C.isNum(d.fuelPct) && d.fuelPct < 12.5;
        return { track: t.track, fill0: low ? t.red : t.text, fill1: low ? t.red : t.text, redc: t.red, tip: t.text, tick: t.dim, num: t.dim };
    };
    return [C.text(key + 'Lbl', x, y - 1, 60, 16, 'FUEL', lbl, { align: 0, tracking: 0.18 }),
        C.bar(key, x + 64, y, w - 64, 14, (d) => (C.isNum(d.fuelPct) ? d.fuelPct / 100 : 0), c, 16)];
};
const mode = (x, y, w, h) => C.text('mode', x, y, w, h || 24, C.modeText, orange, { tracking: 0.26 });

module.exports = {
    id: 'kyalami_digital',
    title: 'Kyalami digital',
    palette: pal,
    gearText: C.gearText,
    needs: ['boostActual'],

    pieces(o) {
        const centre = o.centre || 'info', strip = C.strip(o), m = C.mCar(o);
        const bg = [C.flat('bg', 0, 0, 1920, 720, 'bg')];

        if (centre === 'map') {
            const top = C.MAP.y, bot = C.MAP.y + C.MAP.h, around = C.aroundMap().map((r, i) => C.flat('bg' + i, r.x, r.y, r.w, r.h, 'bg'));
            const heads = [
                C.text('clock', 520, top - 76, 200, 34, C.clock, white),
                C.text('outside', 1200, top - 76, 200, 34, (d) => C.outsideText(o, d.outside), white),
            ];
            // the left column: the speed, the arc under it, the temperatures
            const sy = C.belowCorners(40, 396, 6);
            const left = speedBlock(o, 40, sy, 356, 150).concat([rpmArc(o, 60, 356, sy + 196, 34, 16, 16)],
                reading('oil', 40, 470, 170, (d) => C.tempText(o, d.oil), 'OIL', white, 34),
                reading('coolant', 226, 470, 170, (d) => C.tempText(o, d.coolant), 'COOLANT', white, 34));
            if (strip) {
                // the right column, the car's strip: the gear, the mode, boost and the power
                const gy = C.belowCorners(1560, 1860, 6);
                return around.concat(heads, left, gearTile(1560, gy, 300, 190), [mode(1524, gy + 200, 376)],
                    boostTile(o, 1524, gy + 240, 180, 120), reading('power', 1720, gy + 262, 180, power(o)[1], power(o)[2], white, 34));
            }
            // the full panel: the right column right of the KOMBI's gear box (x 1662), under its eDrive box (y 265);
            // the fuel at the bottom left (no strip)
            return around.concat(heads, left, [mode(1520, 210, 240)], gearTile(1676, 280, 224, 170),
                boostTile(o, 1676, 470, 224, 124), reading('power', 1676, 612, 224, power(o)[1], power(o)[2], white, 32),
                reading('fuelRange', 40, 560, 356, (d) => C.distText(o, d.frange), 'FUEL RANGE', white, 34), fuelBar('fuelGauge', 60, 640, 320));
        }

        if (centre === 'stock') {
            const L = [C.flat('bg', 0, 0, C.STOCK_MIDDLE.x, 720, 'bg'), C.flat('bgR', C.STOCK_MIDDLE.x + C.STOCK_MIDDLE.w, 0, 1920 - C.STOCK_MIDDLE.x - C.STOCK_MIDDLE.w, 720, 'bg')];
            // left of the stock middle: the speed, the mode, the time and outside temperature
            const sy = C.belowCorners(70, 540, 10);
            const left = speedBlock(o, 60, sy, 480, 190).concat([mode(60, sy + 236, 480)],
                reading('clock', 80, sy + 292, 200, C.clock, 'TIME', white, 34), reading('outside', 320, sy + 292, 200, (d) => C.outsideText(o, d.outside), 'OUTSIDE', white, 34));
            if (strip) {
                // right of it: the arc, the gear tile in the middle, the readings either side
                return L.concat(left, [rpmArc(o, 1170, 1850, 200, 56, 22, 20)], gearTile(1400, 330, 220, 190),
                    reading('oil', 1130, 330, 240, (d) => C.tempText(o, d.oil), 'OIL'), reading('coolant', 1130, 430, 240, (d) => C.tempText(o, d.coolant), 'COOLANT'),
                    boostTile(o, 1650, 320, 230, 130), reading('power', 1650, 470, 230, power(o)[1], power(o)[2]));
            }
            // the full panel: the arc ends before the eDrive box (x 1770), the gear under the arc left of the KOMBI's
            // gear box and below an M car's second box, the readings right of the gear box, the fuel under them
            return L.concat(left, [rpmArc(o, 1150, 1740, 150, 46, 20, 18)], gearTile(1130, 440, 260, 190),
                reading('oil', 1676, 284, 224, (d) => C.tempText(o, d.oil), 'OIL', white, 34),
                reading('coolant', 1676, 360, 224, (d) => C.tempText(o, d.coolant), 'COOLANT', white, 34),
                boostTile(o, 1676, 440, 224, 120),
                reading('fuelRange', 1676, 574, 224, (d) => C.distText(o, d.frange), 'FUEL RANGE', white, 32),
                fuelBar('fuelGauge', 1430, 486, 230), reading('power', 1430, 520, 230, power(o)[1], power(o)[2], white, 34));
        }

        // the readings centre: the horizon arc (the cowl above its middle, its ends clear of the KOMBI's boxes)
        const arc = rpmArc(o, 300, 1620, 138, 60, 26, 20);
        if (strip) {
            // the car's strip: the speed centred, the tiles either side, the row above the strip, between the
            // shared fuel (left) and charge (right) gauges
            return bg.concat([arc], speedBlock(o, 660, 232, 600, 210), [mode(660, 488, 600)],
                boostTile(o, 420, 290, 210, 180), gearTile(1290, 290, 210, 180),
                row(380, 534, 1160, 100, temps(o).concat([power(o)], clockOut(o))));
        }
        if (m) {
            // the full panel with an M car: the speed and gear left of its first box (x 778), the mode under the
            // boxes, boost, power, the time and outside temperature in the row; the extras right of the gear box
            return bg.concat([arc], speedBlock(o, 120, 250, 440, 170), gearTile(576, 280, 190, 170), [mode(780, 440, 620)],
                boostTile(o, 1676, 290, 224, 130),
                reading('fuelRange', 1676, 446, 224, (d) => C.distText(o, d.frange), 'FUEL RANGE', white, 34), fuelBar('fuelGauge', 1676, 526, 224),
                row(120, 520, 1300, 112, temps(o).concat([power(o)], clockOut(o))));
        }
        // the full panel: the speed and tiles left of the KOMBI's gear box (x 1410), the extras right of it
        return bg.concat([arc], speedBlock(o, 600, 232, 560, 200), [mode(600, 474, 560)],
            boostTile(o, 370, 290, 210, 180), gearTile(1180, 290, 210, 180),
            reading('fuelRange', 1676, 300, 224, (d) => C.distText(o, d.frange), 'FUEL RANGE', white, 34), fuelBar('fuelGauge', 1676, 380, 224),
            row(140, 520, 1260, 112, temps(o).concat([power(o)], clockOut(o))));
    },
};
