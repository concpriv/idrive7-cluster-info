'use strict';
/**
 * test_units.js - Settings > Boost unit (Cluster Layouts): the conversions (1 bar = 14.5037738 psi = 100 kPa),
 * the decimals, Auto keeping the old rule (bar with km/h, psi with mph), and every layout that shows boost
 * showing it in the unit chosen.
 *   node tools/test_units.js
 */
const path = require('path');
const { makeScene } = require('./scene');
const C = require(path.join(__dirname, '..', 'apps', 'cluster_layouts', 'layout_common'));
const { LAYOUTS } = require(path.join(__dirname, '..', 'apps', 'cluster_layouts', 'layouts'));

let failures = 0;
const ok = (name, cond, more) => { console.log((cond ? 'ok   ' : 'FAIL ') + name + (cond || !more ? '' : '  (' + more + ')')); if (!cond) failures++; };

ok('1 bar = 14.5037738 psi', Math.abs(C.boostIn({ pressUnit: 'psi' }, 1) - 14.5037738) < 1e-9);
ok('1 bar = 100 kPa', C.boostIn({ pressUnit: 'kpa' }, 1) === 100);
ok('bar to a hundredth, psi to a tenth, kPa whole', C.boostNum({ pressUnit: 'bar' }, 0.823) === '0.82' &&
    C.boostNum({ pressUnit: 'psi' }, 0.823) === '11.9' && C.boostNum({ pressUnit: 'kpa' }, 0.823) === '82');
ok('vacuum is negative', C.boostNum({ pressUnit: 'bar' }, -0.41) === '-0.41' && C.boostNum({ pressUnit: 'kpa' }, -0.41) === '-41');
ok('never "-0"', C.boostNum({ pressUnit: 'bar' }, -0.001) === '0.00' && C.boostNum({ pressUnit: 'kpa' }, -0.004) === '0' &&
    C.boostNum({ pressUnit: 'psi' }, -0.002) === '0.0');
ok('no reading: --', C.boostNum({ pressUnit: 'bar' }, undefined) === '--');
ok('Auto: bar with km/h, psi with mph (the old rule)', C.pressUnit({ speedUnit: 'kmh' }) === 'bar' && C.pressUnit({ speedUnit: 'mph' }) === 'psi' &&
    C.pressUnit({ speedUnit: 'kmh', pressUnit: 'auto' }) === 'bar');
ok('a unit set wins over the speed unit', C.pressUnit({ speedUnit: 'kmh', pressUnit: 'psi' }) === 'psi' && C.pressUnit({ speedUnit: 'mph', pressUnit: 'kpa' }) === 'kpa');
ok('boostText: number and unit; OFF with the engine off', C.boostText({ pressUnit: 'kpa' }, { boostActual: 1.2 }) === '120 kPa' &&
    C.boostText({ pressUnit: 'bar' }, { engineOn: false, boostActual: 1 }) === 'OFF');

// every layout, engine readings (Vehicle: petrol), each unit: the boost reading in that unit, no other unit's
const DATA = { speed: 80, rpm: 3500, gear: 4, stage: 'D', oil: 100, coolant: 90, boostActual: 0.82, timing: 14.5, torque: 400, engineOn: true, frange: 400, outside: 15, iat: 30 };
const texts = (layout, o) => {
    const s = makeScene({ layout, options: o, data: DATA });
    s.engine._tick();
    const t = s.engine._pieces().filter((p) => p.text !== null).map((p) => String(p.text));
    s.stop();
    return t;
};
const WANT = { psi: { n: '11.9', u: /psi/i }, bar: { n: '0.82', u: /bar/i }, kpa: { n: '82', u: /kpa/i } };
let shown = 0;
LAYOUTS.forEach((L) => {
    const base = { centre: 'info', vehicle: 'ice', speedUnit: 'kmh', tempUnit: 'c', bottomStrip: 'layout' };
    const bar = texts(L.id, Object.assign({ pressUnit: 'bar' }, base));
    if (!bar.some((t) => /0\.82/.test(t))) return;   // this layout shows no boost number in this mode
    shown++;
    ['psi', 'bar', 'kpa'].forEach((u) => {
        const t = texts(L.id, Object.assign({ pressUnit: u }, base)), all = t.join(' | ');
        const numOk = t.some((x) => x.indexOf(WANT[u].n) >= 0);
        const others = ['psi', 'bar', 'kpa'].filter((v) => v !== u).filter((v) => t.some((x) => WANT[v].u.test(x) && /boost|\d/i.test(x) && !/rail/i.test(x)));
        ok(`${L.id}, ${u}: boost ${WANT[u].n} and no other unit`, numOk && others.length === 0, all.slice(0, 200));
    });
});
ok('boost shown by at least four layouts (the checks above ran)', shown >= 4, String(shown));

console.log(failures ? failures + ' FAILED' : 'all ok');
process.exit(failures ? 1 : 0);
