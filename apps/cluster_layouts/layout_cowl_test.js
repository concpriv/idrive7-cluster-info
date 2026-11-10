'use strict';
/**
 * layout_cowl_test.js - "Cowl test": a test card, not a layout to drive with. Coloured stripes 16 px high across
 * the top middle of the panel (x 480-1440, y 0-192), every other row numbered on the left with its y, the x of every
 * 80 px under the stripes; a photograph of the cluster with it up shows what of the top middle the glass and the
 * camera's cowl (layout_common.NOTCH, measured on a G05: x 730-1190 to y 128) really hide on this car.
 * The stripes are background pieces (clearance.js leaves those alone); the labels, the gear and the speed keep
 * clear of the cowl as every layout's readings do.
 */
const C = require('./layout_common');

const PAL = { bg: '#000000', text: '#ffffff', dim: '#9a9a9a', glow: '#000000', a: '#ffd000', b: '#00a0ff', red: '#ff3030', track: '#333333' };
const white = (t) => ({ color: [t.text, 1], glow: [t.glow, 0] });
const X0 = 480, X1 = 1440, ROW = 16, ROWS = 12;

module.exports = {
    id: 'cowl_test',
    title: 'Cowl test',
    palette: () => PAL,
    gearText: C.gearText,

    pieces(o) {
        const sp = C.speedScale(o), barC = (t) => ({ track: t.track, fill0: t.text, fill1: t.text, redc: t.red, tip: t.text, tick: t.dim, num: t.dim });
        const speedBar = (x, y, w) => C.bar('speedBar', x, y, w, 16, (d) => (C.isNum(d.speed) ? Math.min(1, C.speedIn(o, d.speed) / sp.max) : 0), barC, 0);
        const centre = o.centre || 'info';
        if (centre !== 'info') {
            // (use it with the readings centre: with the map or the stock middle, the speed and gear left of them)
            const bgs = centre === 'map' ? C.aroundMap().map((r, k) => C.flat('bg' + k, r.x, r.y, r.w, r.h, 'bg'))
                : [C.flat('bg', 0, 0, C.STOCK_MIDDLE.x, 720, 'bg'), C.flat('bgR', C.STOCK_MIDDLE.x + C.STOCK_MIDDLE.w, 0, 1920 - C.STOCK_MIDDLE.x - C.STOCK_MIDDLE.w, 720, 'bg')];
            return bgs.concat([C.text('speedDigits', 120, 300, 220, 80, (d) => C.speedText(o, d), white), speedBar(120, 390, 220),
                C.text('gear', 120, 420, 220, 80, C.gearText, white)]);
        }
        const out = [C.flat('bg', 0, 0, 1920, 720, 'bg')];
        for (let i = 0; i < ROWS; i++) {
            out.push(C.flat('bgRow' + i, X0, i * ROW, X1 - X0, ROW, i % 2 ? 'b' : 'a'));
            // every other row's y, left of the stripes (outside the cowl and the slanted corners)
            if (i % 2 === 0) out.push(C.text('rowY' + i, X0 - 70, i * ROW + 1, 62, ROW - 2, String(i * ROW), white, { align: 1 }));
        }
        // the x of every 80 px, under the stripes, each with a short mark above it
        for (let x = X0; x <= X1; x += 80) {
            out.push(C.flat('bgMark' + x, x - 1, ROWS * ROW, 2, 14, 'red'));
            out.push(C.text('colX' + x, x - 30, ROWS * ROW + 16, 60, 20, String(x), white));
        }
        out.push(C.text('note', 560, 236, 800, 26, 'COWL TEST - PHOTOGRAPH IT ALL', white, { tracking: 0.06 }));
        // the gear, the speed and its bar, as on every layout (below an M car's boxes)
        out.push(C.text('speedDigits', 760, 436, 400, 90, (d) => C.speedText(o, d), white));
        out.push(speedBar(760, 530, 400));
        out.push(C.text('gear', 760, 556, 400, 80, C.gearText, white));
        return out;
    },
};
