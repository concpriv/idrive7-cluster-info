'use strict';
/**
 * test_mode.js - the drive mode line: what the car names, never a guess. The M Drive profile decoder
 * (data.js mProfileOf) on value shapes a car might send (none verified on a car: the signal's layout is not in
 * any catalogue these apps have), the mode line's order (M profile, else the driving mode, else nothing), and
 * the Auto colours.
 *   node tools/test_mode.js
 */
const path = require('path');
require('./scene');   // maps ./kit/ to the kit's runtime
const { mProfileOf, modeOf } = require(path.join(__dirname, '..', 'shared', 'data'));
const C = require(path.join(__dirname, '..', 'apps', 'cluster_layouts', 'layout_common'));
const { lookNow } = require(path.join(__dirname, '..', 'shared', 'themes'));

let failures = 0;
const ok = (name, cond) => { console.log((cond ? 'ok   ' : 'FAIL ') + name); if (!cond) failures++; };

// --- the profile from enum names
ok('an enum naming M1', mProfileOf({ statusMSystem: 'M1' }) === 'M1');
ok('an enum naming M2 with a prefix (MODUS_M2)', mProfileOf({ modus: 'MODUS_M2' }) === 'M2');
ok('M_DRIVE_1 style', mProfileOf({ value: 'M_DRIVE_1_ACTIVE' }) === 'M1');
ok('nested', mProfileOf({ a: { b: { mode: 'M2' } } }) === 'M2');
ok('a profile said to be off is none', mProfileOf({ m: 'M1_INACTIVE' }) === null);
ok('NOT_ACTIVE is none', mProfileOf({ m: 'M2_NOT_ACTIVE' }) === null);
ok('the gearbox programme (M_MINUS_PROGRAMM) is never a profile', mProfileOf({ dataDisplayGearbox: 'M_MINUS_PROGRAMM' }) === null);
ok('an invalid value is none', mProfileOf({ m: 'SIGNALWERT_UNGUELTIG' }) === null);
// --- the profile from field names
ok('a field named for M1, true', mProfileOf({ statusM1: true, statusM2: false }) === 'M1');
ok('a field named for M2, ACTIVE', mProfileOf({ mDrive2Status: 'ACTIVE', mDrive1Status: 'INACTIVE' }) === 'M2');
ok('a status field 1 for M2', mProfileOf({ statusM2Active: 1 }) === 'M2');
// --- never from numbers alone, never two at once
ok('a bare number is not mapped', mProfileOf({ statusMSystem: 1 }) === null && mProfileOf(2) === null);
ok('both named at once: none', mProfileOf({ statusM1: true, statusM2: true }) === null);
ok('nothing at all: none', mProfileOf(undefined) === null && mProfileOf({}) === null);

// --- the mode line
const pal = { mode: 'COMFORT' };
ok('M profile first', C.modeText({ mProfile: 'M2', driveMode: 'SPORT' }, pal) === 'M2');
ok('else the driving mode as the car names it', C.modeText({ driveMode: 'SPORT+' }, pal) === 'SPORT+');
ok('else nothing: never the palette\'s word', C.modeText({}, pal) === '' && C.modeText(null, pal) === '');
ok('the gearbox S / M programme is not a drive mode', C.modeText({ mode: 'S' }, pal) === '' && C.modeText({ mode: 'M' }, pal) === '');
ok('the driving mode decoder is unchanged: COMFORT, SPORT_EXPERT', modeOf({ m: 'COMFORT' }, true) === 'COMFORT' && modeOf({ m: 'SPORT_EXPERT' }, true) === 'SPORT+');

// --- Auto colours
ok('Auto: an M profile is sport', lookNow('auto', { mProfile: 'M1' }) === 'sport');
ok('Auto: comfort with nothing known', lookNow('auto', {}) === 'comfort');
ok('a set look wins', lookNow('efficient', { mProfile: 'M1' }) === 'efficient');

console.log(failures ? failures + ' FAILED' : 'all ok');
process.exit(failures ? 1 : 0);
