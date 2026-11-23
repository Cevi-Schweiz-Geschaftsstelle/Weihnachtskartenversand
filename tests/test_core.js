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

// Untergruppen: im Tool festgelegt → gilt vor Spalte „Zuständigkeit" und vor der Kategorie
assert.strictEqual(WB.groupKey('Fachgruppen', 'Fachgruppe Informatik'), WB.groupKey('Fachgruppen', 'Informatik'));
assert.strictEqual(WB.groupKey('Fachgruppen', 'Jugend und Sport'), WB.groupKey('Fachgruppen', 'Jugend+Sport'));
assert.strictEqual(WB.groupKey('Alpenblick', 'Alpenblick'), '');
const catsSub = cats.map(c => c.id === 'fachgruppen' ? { ...c, groups: { informatik: { name: 'Informatik', persons: ['XYZ', 'QRS'] } } } : c);
({ people } = WB.buildPeople(entries, { cats: catsSub, aliases: new Map(), codeNames: {} }));
assert.strictEqual(by('Mia Muster').owner, 'XYZ', 'Untergruppe gilt vor der Excel-Spalte');
assert.deepStrictEqual(by('Mia Muster').coSigners.map(c => c.owner), ['QRS'], 'weitere Personen der Untergruppe unterschreiben mit');
assert.strictEqual(by('Ben Beta').owner, 'GL', 'Kategorie-Priorität bleibt bei Doppelten');
assert.deepStrictEqual(by('Ben Beta').coSigners.map(c => c.owner).sort(), ['QRS', 'XYZ']);

// Kategorie-Erkennung: klares Stichwort schlägt enthaltenen Kategorienamen
assert.strictEqual(WB.detectCategory('PSA Cevi Schweiz', WB.DEFAULT_CATEGORIES).catId, 'kindeswohl');
assert.strictEqual(WB.detectCategory('Krisenmanagement Cevi Schweiz, nur Krisenteam Cevi CH', WB.DEFAULT_CATEGORIES).catId, 'krisen');
assert.strictEqual(WB.detectCategory('CCH', WB.DEFAULT_CATEGORIES).catId, 'cevi-schweiz');
assert.strictEqual(WB.DEFAULT_CATEGORIES.find(c => c.id === 'kindeswohl').name, 'PSA');
assert.strictEqual(WB.detectCategory('Kindeswohl', WB.DEFAULT_CATEGORIES).score, 10, 'Blatt „Kindeswohl" gehört sicher zu PSA');
assert.strictEqual(WB.detectCategory('PSA', WB.DEFAULT_CATEGORIES).catId, 'kindeswohl');
assert.strictEqual(WB.detectCategory('Fachgruppe Kindeswohl', WB.DEFAULT_CATEGORIES).catId, 'fachgruppen');

// Organisationen aus der DB (Adresse der Gruppe) + Zusammenführen mit Excel-Zeile gleicher Organisation/PLZ
const orgs = WB.entriesFromGroups([{ data: [{ id: '80', type: 'groups', attributes: { name: 'Cevi Region Test', address: 'Testweg 9', zip_code: '3000', town: 'Bern' } }] }], { label: 'Mitgliederorganisationen', catId: 'mio' });
assert.deepStrictEqual([orgs[0].org, orgs[0].street, orgs[0].nr, orgs[0].zip], ['Cevi Region Test', 'Testweg', '9', '3000']);
const mixed = [{ ...orgs[0], uid: 900, origin: 'db' }, { org: 'Cevi Region Test', first: 'z.Hd. Team', last: '', street: 'Testweg', nr: '9', zip: '3000', town: 'Bern', catId: 'mio', group: 'Regionalverbände', uid: 901, origin: 'excel' }];
assert.strictEqual(WB.buildPeople(mixed, { cats, aliases: new Map(), codeNames: {} }).people.length, 1, 'gleiche Organisation + PLZ = ein Brief');

// Verschachtelte Untergruppen: jede Ebene einzeln, Vererbung von der Obergruppe
{
  const t = WB.subgroupTree('Ausschüsse', ['1'], [
    { id: '2', name: 'Liegenschaften & Projekte', parentId: '1' }, { id: '3', name: 'Partner & Politik', parentId: '1' },
    { id: '4', name: 'SAJV', parentId: '3' }, { id: '5', name: 'Leitung', parentId: '2' }, { id: '6', name: 'Leitung', parentId: '3' }]);
  const by = Object.fromEntries(t.subs.map(x => [x.name, x]));
  assert.deepStrictEqual(t.subs.map(x => x.name), ['Liegenschaften & Projekte', 'Liegenschaften & Projekte › Leitung', 'Partner & Politik', 'Partner & Politik › Leitung', 'SAJV']);
  assert.strictEqual(by['SAJV'].parentGk, by['Partner & Politik'].gk);
  assert.strictEqual(by['SAJV'].depth, 1);
  assert.strictEqual(by['SAJV'].gk, WB.groupKey('Ausschüsse', 'SAJV'), 'passt zum Excel-Block „SAJV"');
  const ca = cats.map(c => c.id === 'ausschuesse' ? { ...c, groups: Object.fromEntries(t.subs.map(x => [x.gk, { name: x.name, persons: x.name === 'Partner & Politik' ? ['PPO'] : [], parentGk: x.parentGk }])) } : c);
  const es = [{ first: 'Sara', last: 'Sajv', zip: '3000', street: 'Weg', nr: '1', catId: 'ausschuesse', group: 'SAJV', owner: '', uid: 1, origin: 'db' }];
  let r = WB.buildPeople(es, { cats: ca, aliases: new Map(), codeNames: {} });
  assert.strictEqual(r.people[0].owner, 'PPO', 'SAJV erbt von Partner & Politik');
  ca.find(c => c.id === 'ausschuesse').groups[by['SAJV'].gk].persons = ['SJV'];
  r = WB.buildPeople(es, { cats: ca, aliases: new Map(), codeNames: {} });
  assert.strictEqual(r.people[0].owner, 'SJV', 'eigene Zuständigkeit geht vor');
}

// Kürzel-Regel: 1. Buchstabe Vorname + 1. und 2. Buchstabe Nachname
assert.strictEqual(WB.makeCode('Anna', 'Beispiel'), 'ABE');
assert.strictEqual(WB.makeCode('Lea Sophie', 'Müller'), 'LMÜ');
assert.strictEqual(WB.makeCode('Tim', 'de Graaf'), 'TDE');
assert.strictEqual(WB.makeCode('Tim', ''), '');
assert.deepStrictEqual(WB.codeVariants('Anna', 'Bern').slice(0, 3), ['ABE', 'ABR', 'ABN']);

console.log('OK – alle Tests bestanden');
