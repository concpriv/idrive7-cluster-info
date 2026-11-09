'use strict';
/**
 * preview_matrix.js - the screenshot regression matrix: every layout in the cases that change what it draws
 * (Bottom strip, centre, M car, vehicle, looks, units, low / high / missing readings, the drive mode and the M
 * Drive profile), each rendered as preview.js renders it (the layers' own GLSL in WebGL 1, headless Chromium),
 * one browser for all, then a contact sheet per layout with each case's name. SIMULATED: a preview, not the car.
 *
 *   node tools/preview_matrix.js [--out dir] [--layouts a,b] [--cases quick|full]
 * Writes <out>/<layout>/<case>.png and <out>/<layout>.png (the sheet), and prints any shader error.
 */
const fs = require('fs');
const path = require('path');
const { page, sceneOf, args } = require('./preview');
const { LAYOUTS } = require(path.join(__dirname, '..', 'apps', 'cluster_layouts', 'layouts'));
const C = require(path.join(__dirname, '..', 'apps', 'cluster_layouts', 'layout_common'));

/* the cases: preview.js arguments over its defaults (speed in the unit set, km/h with --kmh) */
const KMH = { kmh: true, celsius: true, press: 'bar' }, MPH = { press: 'psi' };
const CASES = {
    strip: Object.assign({ strip: true, engine: true, speed: 87, rpm: 2400, drive: 'COMFORT' }, KMH),
    full: Object.assign({ engine: true, look: 'sport', speed: 118, rpm: 5200, gear: 3, mode: 'S', drive: 'SPORT+' }, MPH),
    mcar: Object.assign({ engine: true, mcar: true, speed: 87, rpm: 3100, drive: 'SPORT' }, KMH),
    map: Object.assign({ strip: true, engine: true, centre: 'map', speed: 64, rpm: 1900, drive: 'COMFORT' }, KMH),
    stock: Object.assign({ strip: true, engine: true, centre: 'stock', speed: 64, rpm: 1900 }, KMH),
    high: Object.assign({ strip: true, engine: true, look: 'sport', speed: 299, rpm: 7900, gear: 8, mode: 'M', oil: 148, coolant: 118, boost: 1.95, drive: 'SPORT INDIVIDUAL', mprofile: 'M2' }, KMH),
    parked: Object.assign({ strip: true, engine: true, speed: 0, rpm: 0, gear: 0, stage: 'P', oil: 22, coolant: 21, boost: 0 }, KMH),
    missing: { strip: true, engine: true, kmh: true, celsius: true, missing: true },
    kpa: Object.assign({ strip: true, engine: true, press: 'kpa', kgm: true, speed: 87, rpm: 3000, boost: 1.2, drive: 'COMFORT INDIVIDUAL' }, { kmh: true, celsius: true }),
    phev: Object.assign({ strip: true, look: 'efficient', speed: 52, rpm: 0, soc: 64, kw: -12.4, drive: 'HYBRID ECO PRO' }, MPH),
};
const QUICK = ['strip', 'full', 'map', 'high', 'missing'];

/** A case's arguments as preview.js args() would give them. */
function caseArgs(layout, name) {
    const a = Object.assign(args([]), { layout }, CASES[name]);
    if (a.missing) {
        ['oil', 'coolant', 'outside', 'soc', 'kw', 'erange', 'frange', 'fuel', 'gearbox', 'iat', 'batt', 'boost', 'split'].forEach((k) => { a[k] = undefined; });
        a.speed = undefined; a.rpm = undefined; a.gear = undefined; a.stage = undefined;
    }
    a.speed = a.speed === undefined ? undefined : a.kmh ? a.speed : a.speed / 1.609344;   // preview.js takes mph without --kmh
    return a;
}

async function main() {
    const a = args(process.argv.slice(2));
    const out = path.resolve(a.out === 'preview.png' ? 'preview_matrix' : a.out);
    const layouts = a.layouts ? String(a.layouts).split(',') : LAYOUTS.map((L) => L.id);
    const cases = a.cases === 'quick' ? QUICK : Object.keys(CASES);
    const { chromium } = require('playwright');
    const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
    const failures = [];
    try {
        for (const id of layouts) {
            fs.mkdirSync(path.join(out, id), { recursive: true });
            const shots = [];
            for (const name of cases) {
                const ca = caseArgs(id, name);
                let scene;
                try { scene = sceneOf(ca); } catch (e) { failures.push(`${id}/${name}: ${e.message}`); continue; }
                const over = ca.mcar && !ca.strip ? C.M_BOXES : [];
                // a page of its own per case: setContent keeps the window, and with it the last case's __done
                const p = await browser.newPage({ viewport: { width: 1920, height: 720 }, deviceScaleFactor: 1 });
                await p.setContent(page(scene, ca.centre === 'map', over));
                await p.waitForFunction(() => window.__done === true, null, { timeout: 30000 });
                const errors = await p.evaluate(() => window.__errors);
                if (errors.length) failures.push(`${id}/${name}: ${errors.join('; ')}`);
                const file = path.join(out, id, name + '.png');
                await p.screenshot({ path: file, clip: { x: 0, y: 0, width: 1920, height: 720 } });
                await p.close();
                shots.push({ name, file, layers: scene.quads.length });
                process.stdout.write(`${id}/${name} (${scene.quads.length} layers)  `);
            }
            // the sheet: two columns, each case at half size with its name and the strip's line (y 646)
            const W = 960, H = 360;
            const cells = shots.map((s) => `<div class=c><img src="data:image/png;base64,${fs.readFileSync(s.file).toString('base64')}">` +
                `<i style="top:${Math.round(C.STRIP_Y / 2)}px"></i><b>${id} / ${s.name} · ${s.layers} layers · ${CASES[s.name].strip ? 'car\'s strip' : 'full panel'}</b></div>`).join('');
            const rows = Math.ceil(shots.length / 2);
            const sheet = await browser.newPage({ viewport: { width: W * 2 + 12, height: rows * (H + 6) + 6 }, deviceScaleFactor: 1 });
            await sheet.setContent(`<style>body{margin:0;background:#3a3a3a;display:flex;flex-wrap:wrap;gap:6px;padding:6px 0 0 6px}
                .c{position:relative;width:${W}px;height:${H}px}.c img{width:${W}px;height:${H}px;display:block}
                .c b{position:absolute;left:6px;top:4px;font:600 13px sans-serif;color:#ffd166;background:rgba(0,0,0,.6);padding:2px 6px}
                .c i{position:absolute;left:0;right:0;height:1px;background:rgba(255,0,255,.55)}</style>${cells}`);
            await sheet.waitForTimeout(150);
            await sheet.screenshot({ path: path.join(out, id + '.png'), fullPage: true });
            await sheet.close();
            console.log(`\n  sheet ${path.join(out, id + '.png')}`);
        }
    } finally { await browser.close(); }
    if (failures.length) { console.error('\nFAILED:\n' + failures.join('\n')); process.exit(1); }
    console.log('all rendered');
}

if (require.main === module) main().catch((e) => { console.error(e); process.exit(1); });
module.exports = { CASES, caseArgs };
