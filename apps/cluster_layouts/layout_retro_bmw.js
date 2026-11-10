'use strict';
/**
 * layout_retro_bmw.js - "Retro BMW": the late-80s / early-90s analog cluster look. A matte charcoal housing with
 * slanted shoulders; a big speedometer and rev counter side by side, black faces, white bar ticks and numerals,
 * orange needles on dark hub caps; a small sub-dial in the bottom of each (torque, oil temperature); the fuel and
 * coolant gauges low at either side; a bar of three black windows along the bottom. No maker's marks, and no
 * warning lights (the KOMBI keeps its own, along the bottom).
 *
 * Every reading is a real one from the car (data.js): where the old cluster had an odometer, a trip counter, a fuel
 * economy gauge and a wideband air-fuel ratio, this one shows the time, the outside temperature, the engine torque
 * and the boost (with its bar).
 *
 * Built for the car's own bottom strip with the readings centre (the housing ends at the strip, its top under the
 * camera's cowl and inside the slanted corners); the map, the stock middle and the full panel get the two big dials
 * only, placed as the other dial layouts place them.
 */
const C = require('./layout_common');

const PALETTES = {
    comfort: {
        bg: '#000000', house0: '#55565b', house1: '#36373b', face0: '#0b0b0c', face1: '#050505', bezel: '#5c5c60', bezel2: '#101012',
        tick: '#f4f4f4', minor: '#e6e6e6', num: '#f6f6f6', red: '#e3140f', needle: '#f27c1c', hub: '#2c2c2f', glow: '#000000', accent: '#f27c1c',
        text: '#f6f6f6', dim: '#bdbdbd', win0: '#050505', win1: '#000000', winEdge: '#5a5a5e', bar: '#16b51c', track: '#0a2a0b',
        disc: '#000000', ring: '#000000', num2: '#ffffff',
    },
};
PALETTES.sport = PALETTES.comfort;
PALETTES.efficient = PALETTES.comfort;
const pal = (lookId) => PALETTES[lookId] || PALETTES.comfort;
const dialColours = (t) => ({ face0: t.face0, face1: t.face1, bezel: t.bezel, bezel2: t.bezel2, tick: t.tick, minor: t.minor, num: t.num, red: t.red,
    needle: t.needle, hub: t.hub, accent: t.accent, glow: t.glow, disc: t.disc, ring: t.ring, num2: t.num2 });
const white = (t) => ({ color: [t.text, 1], glow: [t.glow, 0] });
const small = (t) => ({ color: [t.dim, 1], glow: [t.glow, 0] });
const num = (v) => C.isNum(v);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/**
 * A round dial, `size` across, centred at (cx, cy): bar ticks, numerals inside them (numH px, 0: none), a long
 * orange needle with a short tail, a dark hub cap; red marks (no band) from s.red.
 */
function dial(key, cx, cy, size, s, arc, numH, value, extra) {
    const k = size / 640, r = size / 2, bw = Math.max(4, Math.round(10 * k)), R = r - 2 - bw;
    return Object.assign({
        key, kind: 'dial', x: Math.round(cx - r), y: Math.round(cy - r), w: size, h: size,
        params: {
            u_scale: [s.max, s.major, s.minor, s.red === undefined ? s.max + 1 : s.red],
            u_arc: [arc[0], arc[1], Math.round(numH), R * (s.numR || 0.7)],
            u_needle_dim: [R * (s.len || 0.9), R * 0.18, Math.max(5, 15 * k), Math.max(3, 8 * k)],
            u_look: [0, 0.4, 0, 0],
            u_look2: [bw, k, 0.45, 0.3],
            u_look3: [0, 2, 0, 0],
        },
        colors: dialColours, max: s.max, sweep: true, value,
    }, extra || {});
}
/**
 * A sub-dial in the bottom of a big dial: its pivot below the big dial's centre, its scale a U along the bottom (0 on
 * the left), cut to the big dial's face and drawn only below a line across it.
 */
function subDial(key, cx, cy, R, s, value) {
    const py = cy + 0.55 * R, Rs = 0.4 * R, size = Math.round(2 * Rs + 8), chord = cy + 0.6 * R;
    const d = dial(key, cx, py, size, Object.assign({ numR: 0.64, len: 0.92 }, s), [-142, -218], Math.round(R * 0.08), value);
    d.params.u_look2 = [0, size / 640 * 1.6, 0.3, 0];
    d.params.u_clip = [0, cy - py, R - 3, chord - py];
    d.z = 2;
    return d;
}
/** A black window with a light edge and its text right-aligned (the old odometer's). */
const window_ = (key, x, y, w, h, value) => [
    { key: key + 'Win', kind: 'panel', x, y, w, h, z: 5, params: { u_box: [3, 1.5, 0, 1] }, colors: (t) => ({ top: t.win0, bottom: t.win1, border: t.winEdge }) },
    C.text(key, x + 8, y + 3, w - 16, h - 6, value, white, { align: 1 }),
];

/** The gear and the digital speed (for the compositions without the window bar). */
const readout = (o, sx, sy, sw, sh, gx, gy, gw, gh) => [
    C.text('speedDigits', sx, sy, sw, Math.round(sh * 0.74), (d) => C.speedText(o, d), white),
    C.text('speedDigitsUnit', sx, sy + Math.round(sh * 0.76), sw, Math.max(12, Math.round(sh * 0.22)), C.speedUnit(o), small, { tracking: 0.1 }),
    C.text('gear', gx, gy, gw, gh, C.gearText, (t, d) => ({ color: [C.gearText(d) === 'R' ? t.red : t.text, 1], glow: [t.glow, 0] })),
];
/** The torque sub-dial's scale and the boost bar's, in the units set. */
const torqueScale = (o) => (C.torqueUnit(o) === 'kgm' ? { max: 80, major: 40, minor: 10 } : { max: 800, major: 400, minor: 100 });
const torqueIn = (o, nm) => (C.torqueUnit(o) === 'kgm' ? nm / 9.80665 : nm);
const oilScale = (o) => (o.tempUnit === 'c' ? { max: 150, major: 50, minor: 10, red: 130 } : { max: 300, major: 100, minor: 20, red: 260 });

/** The two big dials and their sub-dials and windows (the car's strip), or the two big dials alone (elsewhere). */
function bigDials(o, L, R_, cy, size, full) {
    const sp = C.speedScale(o), rp = C.rpmScale(o), r = size / 2, k = size / 640, R = r - 2 - Math.max(4, Math.round(10 * k));
    const out = [
        dial('speed', L, cy, size, { max: sp.max, major: sp.major, minor: sp.minor, numR: 0.71 }, [-128, 128], R * 0.125,
            (d) => (num(d.speed) ? C.speedIn(o, d.speed) : 0)),
        dial('rpm', R_, cy, size, { max: rp.max, major: rp.major, minor: rp.minor / 2, red: rp.red, numR: 0.7 }, [-130, 130], R * 0.155,
            (d) => (num(d.rpm) ? d.rpm / 1000 : 0)),
    ];
    if (!full) return out;
    // the needles a layer of their own above the windows and labels on the faces (the faces drawn without them)
    const needles = out.map((p) => Object.assign({}, p, { key: p.key + 'Needle', z: 30, params: Object.assign({}, p.params, { u_part: [2] }) }));
    out.forEach((p) => { p.params.u_part = [1]; });
    const lbl = (key, cx, y, w, h, s, colours) => C.text(key, cx - w / 2, Math.round(y), w, Math.round(h), s, colours || white);
    const ts = torqueScale(o), os = oilScale(o);
    return out.concat(
        lbl('speedUnit', L, cy - 0.4 * R, 160, R * 0.1, C.speedUnit(o)),
        window_('speedDigits', Math.round(L - 0.36 * R), Math.round(cy - 0.27 * R), Math.round(0.72 * R), Math.round(0.13 * R), (d) => C.speedText(o, d)),
        window_('clock', Math.round(L - 0.36 * R), Math.round(cy + 0.25 * R), Math.round(0.72 * R), Math.round(0.13 * R), C.clock),
        [subDial('torqueDial', L, cy, R, ts, (d) => (num(d.torque) ? clamp(torqueIn(o, d.torque), 0, ts.max) : 0)),
            lbl('torqueDialLbl', L, cy + 0.62 * R, 120, R * 0.07, C.torqueUnit(o), small),
            lbl('rpmUnit', R_, cy - 0.42 * R, 160, R * 0.09, '1/min'),
            lbl('rpmUnit2', R_, cy - 0.3 * R, 160, R * 0.09, 'x1000'),
            subDial('oilDial', R_, cy, R, os, (d) => (num(d.oil) ? clamp(C.tempIn(o, d.oil), 0, os.max) : 0)),
            { key: 'oilIcon', kind: 'icon', x: Math.round(R_ - 0.04 * R), y: Math.round(cy + 0.615 * R), w: Math.round(0.08 * R), h: Math.round(0.08 * R), z: 25,
                params: { u_icon: [1], u_line: [0] }, colors: (t) => ({ color: [t.dim, 1] }) }], needles);
}

module.exports = {
    id: 'retro_bmw',
    title: 'Retro BMW',
    palette: pal,
    gearText: C.gearText,
    needs: ['boostActual', 'iat', 'timing', 'gearbox'],
    // the fuel is the layout's own gauge, low on the left
    stripFuel: false,

    pieces(o) {
        const centre = o.centre || 'info', strip = C.strip(o);
        const bg = (x, y, w, h, key, extra) => ({ key: key || 'bg', kind: 'bg', x, y, w, h,
            params: Object.assign({ u_look: [0, 0, 0.35, 8] }, extra || {}), colors: (t) => ({ top: t.house0, bottom: t.house1, accent: t.accent }) });
        const plain = (x, y, w, h, key) => C.flat(key || 'bg', x, y, w, h, 'bg');

        if (centre === 'map') {
            const around = C.aroundMap().map((r, i) => plain(r.x, r.y, r.w, r.h, 'bg' + i));
            if (strip) {
                const g = C.sideDials(o, C.MAP, 120), hy = C.belowCorners(g.L - 100, g.L + 100, 4);
                return around.concat(bigDials(o, g.L, g.R, g.cy, g.size, false), readout(o, g.L - 100, hy, 200, g.top - 8 - hy, g.R - 80, hy, 160, g.top - 8 - hy));
            }
            const sp = C.speedScale(o), rp = C.rpmScale(o);
            return around.concat(
                dial('speed', 208, 360, 404, { max: sp.max, major: sp.major, minor: sp.minor, numR: 0.71 }, [-128, 128], 22, (d) => (num(d.speed) ? C.speedIn(o, d.speed) : 0)),
                dial('rpm', 1792, 500, 256, { max: rp.max, major: rp.major, minor: rp.minor / 2, red: rp.red }, [-130, 130], 18, (d) => (num(d.rpm) ? d.rpm / 1000 : 0)),
                readout(o, 88, 590, 240, 44, 1700, 284, 184, 80));
        }
        if (centre === 'stock') {
            const S = C.STOCK_MIDDLE, bgs = [plain(0, 0, S.x, 720), plain(S.x + S.w, 0, 1920 - S.x - S.w, 720, 'bgR')];
            if (strip) {
                const g = C.sideDials(o, S, 40), r = g.size / 2;
                return bgs.concat(bigDials(o, g.L, g.R, g.cy, g.size, false),
                    readout(o, g.L - 0.3 * r, g.cy + 0.3 * r, 0.6 * r, 0.14 * r, g.R - 0.2 * r, g.cy + 0.28 * r, 0.4 * r, 0.22 * r).map((p) => Object.assign(p, { x: Math.round(p.x), y: Math.round(p.y), w: Math.round(p.w), h: Math.round(p.h) })));
            }
            const sp = C.speedScale(o), rp = C.rpmScale(o);
            return bgs.concat(
                dial('speed', 290, 372, 520, { max: sp.max, major: sp.major, minor: sp.minor, numR: 0.71 }, [-128, 128], 28, (d) => (num(d.speed) ? C.speedIn(o, d.speed) : 0)),
                dial('rpm', 1256, 392, 296, { max: rp.max, major: rp.major, minor: rp.minor / 2, red: rp.red }, [-130, 130], 20, (d) => (num(d.rpm) ? d.rpm / 1000 : 0)),
                readout(o, 1676, 380, 236, 50, 1690, 280, 200, 90));
        }
        if (!strip) {
            // the full panel: the speedometer clear of an M car's first box, the rev counter ending at the KOMBI's gear
            // box (its face may pass under an M car's second box), the fuel and coolant gauges low at the sides
            const fuelS = { max: 100, major: 25, minor: 12.5, numR: 0.62, len: 0.78 };
            return [plain(0, 0, 1920, 720)].concat(bigDials(o, 520, 1160, 395, 500, false),
                dial('fuelDial', 150, 500, 220, fuelS, [-70, 70], 16, (d) => (num(d.fuelPct) ? d.fuelPct : 0)),
                dial('coolantDial', 1790, 540, 220, { max: 100, major: 25, minor: 12.5, red: 90, len: 0.78 }, [-70, 70], 0,
                    (d) => (num(d.coolant) ? clamp(d.coolant - 30, 0, 100) : 0)),
                // the gear and the speed between the dials, below an M car's boxes
                readout(o, 774, 540, 132, 40, 774, 440, 132, 90));
        }

        // the car's own strip: the old cluster's proportions (1.06x a 1290 px drawing of it), centred on the panel;
        // the big dials' tops just clear of the camera's cowl (x 730-1190 to y 128), the window bar ending at the strip
        const f = 1.06, cy = 325, X = (rx) => Math.round(960 + (rx - 645) * f), Y = (ry) => Math.round(cy + (ry - 183) * f);
        const size = Math.round(380 * f), L = X(440), R_ = X(850);
        const aux = Math.round(190 * f), fuelX = X(110), coolX = X(1180), auxY = Y(320), ar = aux / 2, aR = ar - 2 - Math.max(4, Math.round(10 * aux / 640));
        const coolS = { max: 100, major: 25, minor: 12.5, red: 90, len: 0.8 };
        // the coolant scale's numerals (30-130 deg C, or the same in deg F), the shader's own being 0-100
        const coolNums = [0, 1, 2, 3, 4].map((i) => {
            const a = (-70 + 35 * i) * Math.PI / 180, c = 30 + 25 * i, txt = String(Math.round(C.tempIn(o, c)));
            const x = coolX + 0.6 * aR * Math.sin(a), y = auxY - 0.6 * aR * Math.cos(a);
            return C.text('coolantN' + i, Math.round(x - 24), Math.round(y - 9), 48, 18, txt, (t) => ({ color: [i === 4 ? t.red : t.num, 1], glow: [t.glow, 0] }));
        });
        const bar = Y(410), barH = C.STRIP_Y - 4 - bar;
        const win = (key, rx0, rx1) => ({ key, kind: 'panel', x: X(rx0), y: bar, w: X(rx1) - X(rx0), h: barH, params: { u_box: [4, 1.5, 0, 1] },
            colors: (t) => ({ top: t.win0, bottom: t.win1, border: t.winEdge }) });
        const lx0 = X(42), lx1 = X(515), cx0 = X(538), cx1 = X(752), rx0 = X(775), rx1 = X(1248);
        const eng = C.engineFocus(o);
        const pair = (key, x, w, name, value) => [
            C.text(key + 'Lbl', x, bar + 10, w, 16, name, small, { align: 0, tracking: 0.08 }),
            C.text(key, x, bar + 30, w, barH - 38, value, white, { align: 0 }),
        ];
        // (the housing in brushed metal)
        return [bg(0, 0, 1920, 720, 'bg', { u_screen: [X(0), 0, X(1290), C.STRIP_Y], u_screen_r: [18], u_shoulder: [X(245), X(1045), Y(10), 0.83], u_brushed: [0.9, 160], u_look: [0, 0, 0.15, 8] })].concat(
            bigDials(o, L, R_, cy, size, true),
            dial('fuelDial', fuelX, auxY, aux, { max: 100, major: 25, minor: 12.5, numR: 0.6, len: 0.8 }, [-70, 70], Math.round(aR * 0.16),
                (d) => (num(d.fuelPct) ? d.fuelPct : 0)),
            { key: 'fuelIcon', kind: 'icon', x: Math.round(fuelX + 0.2 * aR), y: Math.round(auxY - 0.12 * aR), w: Math.round(0.24 * aR), h: Math.round(0.24 * aR), z: 25,
                params: { u_icon: [4], u_line: [0] }, colors: (t) => ({ color: [t.text, 1] }) },
            dial('coolantDial', coolX, auxY, aux, coolS, [-70, 70], 0, (d) => (num(d.coolant) ? clamp(d.coolant - 30, 0, 100) : 0)),
            { key: 'coolantIcon', kind: 'icon', x: Math.round(coolX + 0.2 * aR), y: Math.round(auxY - 0.12 * aR), w: Math.round(0.24 * aR), h: Math.round(0.24 * aR), z: 25,
                params: { u_icon: [0], u_line: [0] }, colors: (t) => ({ color: [t.text, 1] }) },
            coolNums,
            // the window bar: the drive mode and the gearbox temperature; boost with its bar (the old air-fuel
            // window); the intake air temperature and the ignition timing
            win('winL', 42, 515), win('winC', 538, 752), win('winR', 775, 1248),
            C.text('gear', lx0 + 12, bar + 6, 96, barH - 12, C.gearText, (t, d) => ({ color: [C.gearText(d) === 'R' ? t.red : t.text, 1], glow: [t.glow, 0] }), { align: 0 }),
            C.text('mode', lx0 + 116, bar + 22, Math.round((lx1 - lx0) * 0.44), barH - 40, C.modeText, white, { align: 0, tracking: 0.1 }),
            pair('outside', lx0 + Math.round((lx1 - lx0) * 0.7), Math.round((lx1 - lx0) * 0.27), 'OUTSIDE', (d) => C.outsideText(o, d.outside)),
            C.text('boostLbl', cx0 + 10, bar + 8, 90, 16, eng ? 'BOOST' : C.focus.rangeLabel(o), small, { align: 0, tracking: 0.06 }),
            C.text('boostUnit', cx0 + 100, bar + 8, 70, 16, eng ? C.boostUnitText(o) : '', small, { align: 0 }),
            C.text('boost', cx1 - 120, bar + 4, 110, 26, eng ? (d) => (d.engineOn === false ? 'OFF' : num(d.boostActual) ? C.boostFit(o, d.boostActual) : '--') : C.focus.range(o), white, { align: 1 }),
            C.bar('boostBar', cx0 + 8, bar + barH - 30, cx1 - cx0 - 16, 22, C.focus.bar(o), (t) => ({ track: t.track, fill0: t.bar, fill1: t.bar, redc: t.red, tip: t.bar, tick: t.dim, num: t.dim }), 0),
            pair('iat', rx0 + 20, Math.round((rx1 - rx0) * 0.28), 'IAT', (d) => C.tempText(o, d.iat)),
            pair('timing', rx0 + 20 + Math.round((rx1 - rx0) * 0.33), Math.round((rx1 - rx0) * 0.28), 'IGN ANGLE', C.timingFit),
            pair('gearbox', rx0 + 20 + Math.round((rx1 - rx0) * 0.66), Math.round((rx1 - rx0) * 0.3), 'GEARBOX', (d) => C.tempText(o, d.gearbox)),
        );
    },
};
