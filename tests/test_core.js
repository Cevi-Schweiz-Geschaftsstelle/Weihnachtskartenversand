// Schnelltest der Kernlogik mit erfundenen Daten (keine echten Personen).
// Aufruf: node tests/test_core.js
'use strict';
const assert = require('assert');
const WB = require('../src/core.js');

const H = ['Organisation', 'Vorname', 'Nachname', 'Email', 'Strasse', 'Nr.', 'PLZ', 'Ort', 'Zuständigkeit', 'Zus. Unterschriften', 'Erledigt'];
const E = Array(10).fill(null);
const sheets = [
  { name: 'Überblick', rows: [
    ['Kategorien', 'zu finden in…', 'Hauptzuständigkeit/Triage', 'Infos'],
    ['Cevi Schweiz', 'GL', 'GL', null],
    ['Alpenblick', null, 'Anna, Ben', null],
    ['Fachgruppen', 'DB', 'jeder seine', null],
  ] },
  { name: 'CCH', rows: [
    ['Zurück zur Übersicht'],
    ['Vorstand', ...E, 'Geschäftsstelle'],
    [...H, ...H],
    [null, 'Anna', 'Alpha', 'anna@example.org', 'Weg', 1, 3000, 'Bern', 'GL', null, false,
     null, 'Ben', 'Beta', 'ben@example.org', 'Gasse', 2, 8000, 'Zürich', 'GL', null, false],
  ] },
  { name: 'Fachgruppen', rows: [
    ['Zurück zur Übersicht'], ['Informatik'], H,
    [null, 'Mia', 'Muster', 'mia@example.org', 'Testweg', 5, 4000, 'Basel', 'abe', null, false],
    [null, 'Ben', 'Beta', 'ben@example.org', 'Gasse', 2, 8000, 'Zürich', 'ABE', null, false],
    H, // wiederholte Kopfzeile muss ignoriert werden
  ] },
  { name: 'Alpenblick', rows: [
    ['Zurück zur Übersicht'], ['Alpenblick'], H,
    [null, 'Lea', 'Lager', null, 'Bergweg', 9, 3800, 'Interlaken', null, null, true],
  ] },
];

const res = WB.parseWorkbookRows(sheets, 'Test.xlsx', WB.DEFAULT_CATEGORIES);
const cats = WB.applyOverview(WB.DEFAULT_CATEGORIES, res.overview);
assert.deepStrictEqual(res.sources.map(s => s.label), ['CCH › Vorstand', 'CCH › Geschäftsstelle', 'Fachgruppen › Informatik', 'Alpenblick']);
assert.deepStrictEqual(res.sources.map(s => s.catId), ['cevi-schweiz', 'cevi-schweiz', 'fachgruppen', 'alpenblick']);
assert.deepStrictEqual(cats.find(c => c.id === 'alpenblick').persons, ['Anna', 'Ben']);

let uid = 0;
const entries = res.sources.flatMap(s => s.entries.map(e => ({ ...e, uid: ++uid, origin: 'excel', sourceLabel: s.label })));
assert.strictEqual(entries.length, 5);
const build = (overrides) => WB.buildPeople(entries, { cats, aliases: new Map(), codeNames: {}, overrides });

let { people } = build({});
const by = (n) => people.find(p => p.displayName === n);
assert.strictEqual(people.length, 4, 'Ben ist doppelt und wird zusammengeführt');
assert.ok(by('Ben Beta').isDuplicate);
assert.strictEqual(by('Ben Beta').owner, 'GL', 'obere Kategorie (Cevi Schweiz) ist der Vorschlag');
assert.deepStrictEqual(by('Ben Beta').coSigners.map(c => c.owner), ['ABE']);
assert.strictEqual(by('Mia Muster').owner, 'ABE', 'Kürzel "abe" wird zu ABE');
assert.strictEqual(by('Lea Lager').owner, 'Anna', 'erste Person der Kategorie versendet');
assert.deepStrictEqual(by('Lea Lager').coSigners.map(c => c.owner), ['Ben'], 'weitere Personen der Kategorie unterschreiben mit');
assert.ok(by('Lea Lager').doneFromFile);

({ people } = build({ [by('Ben Beta').key]: 'ABE' }));
assert.strictEqual(by('Ben Beta').owner, 'ABE', 'manuelle Zuteilung gewinnt');
assert.deepStrictEqual(by('Ben Beta').coSigners.map(c => c.owner), ['GL']);

console.log('OK – alle Tests bestanden');
