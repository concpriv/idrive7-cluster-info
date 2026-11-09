'use strict';
/**
 * test_textfit.js - every text of every layout fits its box as the car draws it (tools/textfit.js: font.js's own
 * arithmetic), over 24 geometries (centre, vehicle, M car, bottom strip) x 4 unit sets x data from empty to the
 * extremes (299 km/h, 8999 rpm, -40..150 deg C, -0.95..1.99 bar, 1099 Nm, the longest drive modes): nothing cut
 * at its box's edge, no character the atlas has not got, no line set closer than 90%, and no text's ink running
 * into another's.
 *   node tools/test_textfit.js
 */
const path = require('path');
const { sweep, fit, overlaps } = require('./textfit');
const C = require(path.join(__dirname, '..', 'apps', 'cluster_layouts', 'layout_common'));
const { LAYOUTS } = require(path.join(__dirname, '..', 'apps', 'cluster_layouts', 'layouts'));

let failures = 0;
const ok = (name, cond) => { console.log((cond ? 'ok   ' : 'FAIL ') + name); if (!cond) failures++; };
const show = (list) => list.slice(0, 8).forEach((x) => console.log(`       ${x.key} ${JSON.stringify(x.text)} in ${x.w}x${x.h}` +
    (x.fit ? ` (squeeze ${x.fit.squeeze.toFixed(2)}, over ${x.fit.overflowPx}px${x.fit.missing.length ? ', missing ' + x.fit.missing.join('') : ''})` : ' ' + x.error) +
    ` [${x.opts.centre} ${x.opts.vehicle} ${x.opts.cluster} ${x.opts.bottomStrip} ${x.opts.speedUnit} ${x.opts.pressUnit} ${x.data}]`));

// the layouts' own fit test agrees with the checker
ok('layout_common.fitsBox agrees with textfit.fit', ['0.82 bar', 'SPORT INDIVIDUAL', '-10.5°', '188'].every((s) => [[120, 24], [60, 40], [400, 30]].every(([w, h]) =>
    C.fitsBox(s, w, h) === (fit(s, w, h).need * C.FIT_SQUEEZE <= w / h + 1e-6))));

let total = 0;
LAYOUTS.forEach((L) => {
    const r = sweep(L);
    total += r.length;
    const errors = r.filter((x) => x.error), clipped = r.filter((x) => x.fit && x.fit.clipped), missing = r.filter((x) => x.fit && x.fit.missing.length);
    const tight = r.filter((x) => x.fit && !x.fit.clipped && x.fit.squeeze < C.FIT_SQUEEZE);
    ok(`${L.id}: ${r.length} texts, none cut at the box's edge`, clipped.length === 0); show(clipped);
    ok(`${L.id}: every character in the atlas`, missing.length === 0); show(missing);
    ok(`${L.id}: none set closer than ${C.FIT_SQUEEZE * 100}%`, tight.length === 0); show(tight);
    ok(`${L.id}: every piece's text evaluates`, errors.length === 0); show(errors);
});
console.log(`     ${total} distinct texts checked`);
// no text's ink runs into another's (where each line lands in its box, at the squeeze it gets)
LAYOUTS.forEach((L) => {
    const r = overlaps(L);
    ok(`${L.id}: no text runs into another`, r.length === 0);
    r.slice(0, 6).forEach((x) => console.log(`       ${x.a} ${JSON.stringify(x.ta)} x ${x.b} ${JSON.stringify(x.tb)}: ${x.px}x${x.py}px [${x.opts.centre} ${x.opts.vehicle} ${x.opts.cluster} ${x.opts.bottomStrip} ${x.data}]`));
});
console.log(failures ? failures + ' FAILED' : 'all ok');
process.exit(failures ? 1 : 0);
