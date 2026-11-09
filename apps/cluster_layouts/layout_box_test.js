'use strict';
/**
 * layout_box_test.js - "Box test": a test card, not a layout to drive with. The whole panel in one flat,
 * bright colour, so anything the KOMBI draws over it (its dark boxes, a bracket) stands out at once, and one
 * line of text naming the bottom line in force. With Settings > Bottom bar set, the fill stops at that line
 * like every layout (layouts.js clearBottom); with "down to the bottom edge" it covers the whole panel.
 * Settings > Look picks the colour: Comfort blue, Sport red, Efficient green. The black-background setting
 * doesn't darken it (its colour is its own key, not bg).
 */
const C = require('./layout_common');

const FILLS = { comfort: '#2f6fd6', sport: '#c8322b', efficient: '#2a9d5c' };
const pal = (lookId) => ({ fill: FILLS[lookId] || FILLS.comfort, text: '#ffffff', dim: '#e8eef8', glow: '#ffffff' });
const line = (o) => {
    const v = o && o.bottomClear;
    return v === true || v === 'clear' ? 'y 640' : v === 'bar' ? 'y 662' : 'none (to the bottom edge)';
};

module.exports = {
    id: 'box_test',
    title: 'Box test',
    testCard: true,   // no readings: test_engine.js checks it as a test card
    palette: pal,
    gearText: C.gearText,
    pieces(o) {
        return [
            // a backdrop (key bg...): cut at the bottom line when one is set, never moved or scaled
            C.flat('bgFill', 0, 0, 1920, 720, 'fill'),
            C.text('label', 80, 290, 560, 36, () => 'BOX TEST  ·  BOTTOM LINE ' + line(o).toUpperCase(),
                (t) => ({ color: [t.text, 1], glow: [t.glow, 0] }), { align: 0 }),
        ];
    },
};
