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

// Gemeinsamer Stand: gleichzeitige Änderungen zusammenführen
{
  const base = { staff: [{ id: 'a', code: 'AAA' }], done: {}, decisions: {}, order: ['x', 'y'], cats: [{ id: 'k', name: 'K', persons: [] }] };
  const mine = JSON.parse(JSON.stringify(base)); mine.staff.push({ id: 'z', code: 'ZZE' }); mine.done.p1 = true;
  const theirs = JSON.parse(JSON.stringify(base)); theirs.decisions.q = 'different'; theirs.cats[0].persons = ['AAA']; theirs.done.p2 = true;
  const m = WB.merge3(base, mine, theirs);
  assert.deepStrictEqual(m.staff.map(x => x.id), ['a', 'z'], 'neue Person von mir bleibt');
  assert.deepStrictEqual(m.done, { p1: true, p2: true }, 'Häkchen beider bleiben');
  assert.strictEqual(m.decisions.q, 'different', 'Entscheid der anderen bleibt');
  assert.deepStrictEqual(m.cats[0].persons, ['AAA'], 'Zuordnung der anderen bleibt');
  // gelöscht bei mir, unverändert bei den anderen → bleibt gelöscht
  const del = JSON.parse(JSON.stringify(base)); del.staff = [];
  assert.deepStrictEqual(WB.merge3(base, del, base).staff, []);
  // gelöscht bei den anderen, von mir unverändert → bleibt gelöscht; von mir geändert → bleibt
  assert.deepStrictEqual(WB.merge3(base, base, del).staff, []);
  const chg = JSON.parse(JSON.stringify(base)); chg.staff[0].code = 'BBB';
  assert.deepStrictEqual(WB.merge3(base, chg, del).staff.map(x => x.code), ['BBB']);
  // derselbe Wert verschieden geändert → eigene Änderung gilt
  const a1 = { done: { p: true } }, b1 = { done: { p: false } };
  assert.strictEqual(WB.merge3({ done: {} }, a1, b1).done.p, true);
}

// Kürzel-Regel: 1. Buchstabe Vorname + 1. und 2. Buchstabe Nachname
assert.strictEqual(WB.makeCode('Anna', 'Beispiel'), 'ABE');
assert.strictEqual(WB.makeCode('Lea Sophie', 'Müller'), 'LMÜ');
assert.strictEqual(WB.makeCode('Tim', 'de Graaf'), 'TDE');
assert.strictEqual(WB.makeCode('Tim', ''), '');
assert.deepStrictEqual(WB.codeVariants('Anna', 'Bern').slice(0, 3), ['ABE', 'ABR', 'ABN']);

// Spalte „Name" (ganzer Name in einer Spalte, z.B. Spenderliste aus der Buchhaltung) – erfundene Daten
{
  const sheets = [{ name: 'Spender ab 400', rows: [
    ['Kunden-Nr', 'Name', 'Adresse', 'PLZ', 'Ort', 'E-Mail'],
    [1, 'Beispiel Anna', 'Musterweg 12', '3000', 'Bern', ''],
    [2, 'Probe-Muster Hans & Lea', 'Testgasse 3a', '8000', 'Zürich', ''],
    [3, 'Stiftung Sonnenschein', 'Hauptstrasse 1', '4000', 'Basel', ''],
    [4, 'Familie Demo', 'Seeweg 7', '6000', 'Luzern', ''],
  ] }, { name: 'Einzelspenden', rows: [['Datum', 'Beleg-Nr', 'Kunden-Nr', 'Kurzname', 'Spende (CHF)'], ['2026-01-05', 11, 1, 'BEISPIEL', 50]] }];
  const r = WB.parseWorkbookRows(sheets, 'Spender.xlsx', WB.DEFAULT_CATEGORIES);
  assert.strictEqual(r.sources.length, 1, 'nur das Blatt mit Adressen');
  assert.ok(r.notes.some(n => /Einzelspenden/.test(n) && /keine Adressliste/.test(n)));
  const e = r.sources[0].entries;
  assert.strictEqual(e.length, 4);
  assert.deepStrictEqual([e[0].first, e[0].last, e[0].street, e[0].nr], ['Anna', 'Beispiel', 'Musterweg', '12']);
  assert.deepStrictEqual([e[1].first, e[1].last], ['Hans & Lea', 'Probe-Muster']);
  assert.strictEqual(e[2].org, 'Stiftung Sonnenschein');
  assert.deepStrictEqual([e[3].first, e[3].last], ['Familie', 'Demo']);
  // Reihenfolge „Vorname Nachname" wird erkannt
  const k = new Set(['anna', 'hans', 'lea']);
  assert.strictEqual(WB.guessNameOrder(['Anna Beispiel', 'Hans Probe', 'Lea Test'], k), 'firstLast');
  assert.deepStrictEqual(WB.splitFullName('Peter van der Berg', 'firstLast', k), { first: 'Peter', last: 'van der Berg' });
  // „Vorname" + „Name" → „Name" ist der Nachname
  const r2 = WB.parseWorkbookRows([{ name: 'Liste', rows: [['Vorname', 'Name', 'PLZ', 'Ort'], ['Anna', 'Beispiel', '3000', 'Bern']] }], 'x.xlsx', WB.DEFAULT_CATEGORIES);
  assert.deepStrictEqual([r2.sources[0].entries[0].first, r2.sources[0].entries[0].last], ['Anna', 'Beispiel']);
}

// Viele Excel-Formate – nur Name, Vorname, Strasse, PLZ, Ort zählen (erfundene Daten)
{
  const one = (rows, name = 'Liste') => { const r = WB.parseWorkbookRows([{ name, rows }], 'Format.xlsx', WB.DEFAULT_CATEGORIES); return { e: (r.sources[0] || { entries: [] }).entries, notes: r.notes }; };
  const pick = (e) => [e.first, e.last, e.org, e.street, e.nr, e.zip, e.town].map(x => x || '').join('|');
  const want = 'Anna|Beispiel||Musterweg|12|3000|Bern';
  // hitobito-Export (Vorname links von „Firmenname"; „Firma" = ja/nein)
  let t = one([['Vorname', 'Nachname', 'Übername', 'Firmenname', 'Firma', 'Haupt-E-Mail', 'Adresse', 'PLZ', 'Ort', 'Land'], ['Anna', 'Beispiel', 'Ani', '', 'nein', 'anna@example.org', 'Musterweg 12', '3000', 'Bern', 'CH']]);
  assert.strictEqual(pick(t.e[0]), want, 'hitobito');
  // Abacus: Name 1 / Name 2 / PLZ/Ort
  t = one([['Name 1', 'Name 2', 'Strasse', 'PLZ/Ort'], ['Beispiel Anna', 'z.Hd. Buchhaltung', 'Musterweg 12', '3000 Bern']]);
  assert.strictEqual(pick(t.e[0]), want, 'Abacus'); assert.strictEqual(t.e[0].careOf, 'z.Hd. Buchhaltung');
  // Outlook (englisch)
  t = one([['Title', 'First Name', 'Last Name', 'Home Street', 'Home City', 'Home Postal Code', 'Mobile Phone'], ['', 'Anna', 'Beispiel', 'Musterweg 12', 'Bern', '3000', '079 000 00 00']]);
  assert.strictEqual(pick(t.e[0]), want, 'Outlook');
  // französisch / italienisch
  assert.strictEqual(pick(one([['Prénom', 'Nom', 'Rue', 'NPA', 'Localité'], ['Anna', 'Beispiel', 'Musterweg 12', 3000, 'Bern']]).e[0]), want, 'französisch');
  assert.strictEqual(pick(one([['Nome', 'Cognome', 'Via', 'CAP', 'Località'], ['Anna', 'Beispiel', 'Musterweg 12', '3000', 'Bern']]).e[0]), want, 'italienisch');
  // Kopfzeile erst weiter unten, Titelzeilen davor
  const titled = [['Adressliste Weihnachten'], ['Stand 2026'], ...Array(15).fill([]), ['Nachname', 'Vorname', 'Strasse und Hausnummer', 'PLZ', 'Ort'], ['Beispiel', 'Anna', 'Musterweg 12', '3000', 'Bern']];
  assert.strictEqual(pick(one(titled).e[0]), want, 'Kopfzeile in Zeile 18');
  // zweizeilige Kopfzeile
  assert.strictEqual(pick(one([['Name', 'Vorname', 'Adresse', null, null], [null, null, 'Strasse', 'PLZ', 'Ort'], ['Beispiel', 'Anna', 'Musterweg 12', '3000', 'Bern']]).e[0]), want, 'zweizeilig');
  // „Name, Vorname" mit Komma, „PLZ Ort" zusammen, Länderkürzel
  assert.strictEqual(pick(one([['Name', 'Strasse', 'PLZ Ort'], ['Beispiel, Anna', 'Musterweg 12', 'CH-3000 Bern']]).e[0]), want, 'Komma + PLZ Ort');
  // ganze Adresse in der Spalte „Adresse"
  assert.strictEqual(pick(one([['Name', 'Adresse'], ['Anna Beispiel', 'Musterweg 12, 3000 Bern']]).e[0]), want, 'Adresse in einer Zelle');
  // Etiketten-Liste: alles mehrzeilig in einer Zelle
  t = one([['Empfänger'], ['Anna Beispiel\nMusterweg 12\n3000 Bern'], ['Hans Probe\nTestgasse 3\n8000 Zürich']]);
  assert.strictEqual(pick(t.e[0]), want, 'Etikett'); assert.strictEqual(t.e.length, 2);
  // ganz ohne Kopfzeile: Spalten am Inhalt erkannt
  t = one([['Anna', 'Beispiel', 'Musterweg 12', '3000', 'Bern'], ['Hans', 'Probe', 'Testgasse 3', '8000', 'Zürich'], ['Lea', 'Demo', 'Seeweg 7', '6000', 'Luzern']]);
  assert.strictEqual(pick(t.e[0]), want, 'ohne Kopfzeile'); assert.strictEqual(t.e.length, 3);
  assert.ok(t.notes.some(n => /keine Kopfzeile/.test(n)));
  // Telefon-/Kunden-Nr. werden nicht zur Hausnummer
  assert.strictEqual(pick(one([['Kunden-Nr', 'Vorname', 'Nachname', 'Strasse', 'Tel. Nr.', 'PLZ', 'Ort'], [7, 'Anna', 'Beispiel', 'Musterweg 12', '031 000 00 00', '3000', 'Bern']]).e[0]), want, 'Nr.-Spalten');
}

console.log('OK – alle Tests bestanden');
