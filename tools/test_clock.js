'use strict';
/**
 * test_clock.js - the clock's zones and daylight-saving rules (shared/clock.js) against known changeovers.
 *   node tools/test_clock.js
 */
const path = require('path');
const clock = require(path.join(__dirname, '..', 'shared', 'clock'));

let failures = 0;
const ok = (name, cond) => { console.log((cond ? 'ok   ' : 'FAIL ') + name); if (!cond) failures++; };
const at = (iso) => Date.parse(iso);
const hm = (zone, iso) => { clock.setZone(zone); clock.setTwelve(false); return clock.hm(at(iso)); };

// Melbourne: AEST UTC+10, AEDT UTC+11; 2026: AEDT ends Sun 5 Apr 3:00 AEDT (16:00 UTC Sat 4 Apr),
// starts Sun 4 Oct 2:00 AEST (16:00 UTC Sat 3 Oct). 2027: ends Sun 4 Apr, starts Sun 3 Oct.
ok('Melbourne in November is AEDT (UTC+11)', hm('melbourne', '2026-11-09T00:15:00Z') === '11:15');
ok('Melbourne in January (across the new year) is AEDT', hm('melbourne', '2027-01-15T01:00:00Z') === '12:00');
ok('Melbourne in July is AEST (UTC+10)', hm('melbourne', '2026-07-01T02:30:00Z') === '12:30');
ok('Melbourne: one minute before AEDT ends, 2:59 AEDT', hm('melbourne', '2026-04-04T15:59:00Z') === '2:59');
ok('Melbourne: at the end of AEDT, 2:00 AEST', hm('melbourne', '2026-04-04T16:00:00Z') === '2:00');
ok('Melbourne: one minute before AEDT starts, 1:59 AEST', hm('melbourne', '2026-10-03T15:59:00Z') === '1:59');
ok('Melbourne: at the start of AEDT, 3:00 AEDT', hm('melbourne', '2026-10-03T16:00:00Z') === '3:00');
ok('Melbourne 2027: AEDT ends on Sunday 4 April', hm('melbourne', '2027-04-03T16:00:00Z') === '2:00');
ok('Melbourne 2027: AEDT starts on Sunday 3 October', hm('melbourne', '2027-10-02T16:00:00Z') === '3:00');
ok('Melbourne 12-hour: 1:15 pm reads 1:15', (() => { clock.setZone('melbourne'); clock.setTwelve(true); return clock.hm(at('2026-11-09T02:15:00Z')); })() === '1:15');

// the zones that were there keep their rules
ok('US Eastern in November after the change is EST', hm('eastern', '2026-11-09T17:00:00Z') === '12:00');
ok('US Eastern in July is EDT', hm('eastern', '2026-07-01T16:00:00Z') === '12:00');
ok('Central Europe in July is CEST', hm('cet', '2026-07-01T10:00:00Z') === '12:00');
ok('Central Europe in December is CET', hm('cet', '2026-12-01T11:00:00Z') === '12:00');
ok('an unknown zone falls back to US Eastern', hm('nowhere', '2026-07-01T16:00:00Z') === '12:00');

console.log(failures ? failures + ' FAILED' : 'all ok');
process.exit(failures ? 1 : 0);
