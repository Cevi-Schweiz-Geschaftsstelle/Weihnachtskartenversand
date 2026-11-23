/* Weihnachtsbrief-Tool – Kernlogik (Einlesen, Kategorien, Duplikate, Zuteilung)
 * Läuft im Browser (window.WB) und in Node (module.exports) für Tests.
 */
(function (root) {
  'use strict';

  // ---------------------------------------------------------------------------
  // Kategorien (wie Blatt „Überblick"; die Zuständigen kommen beim Import aus dem Überblick
  // oder werden im Tab „Zuständigkeit" erfasst – hier bewusst keine Personennamen)
  // ---------------------------------------------------------------------------
  const DEFAULT_CATEGORIES = [
    { id: 'cevi-schweiz', name: 'Cevi Schweiz', source: 'GL', persons: ['GL'], info: 'Vorstand, Geschäftsstelle, Zivis',
      exact: ['cch', 'cevi schweiz'], strong: ['vorstand', 'geschaftsstelle', 'zivildienst'], weak: ['zivi'] },
    { id: 'alpenblick', name: 'Alpenblick', source: '', persons: [], info: '',
      exact: [], strong: ['alpenblick'], weak: [] },
    { id: 'finanzen', name: 'Finanzen und Versicherungen', source: '', persons: [], info: '',
      exact: ['finanzen'], strong: ['finanz', 'versicherung'], weak: ['bank', 'revision'] },
    { id: 'ausschuesse', name: 'Ausschüsse', source: 'DB', persons: [], info: '',
      exact: [], strong: ['ausschuss', 'ausschusse', 'sajv', 'liegenschaften'], weak: ['partner & politik', 'politik'] },
    { id: 'fundraising', name: 'Fundraising', source: 'Abacus', persons: [], info: '',
      exact: [], strong: ['fundraising', 'spender', 'spende', 'abacus', 'kirchgemeinde'], weak: ['kirche', 'gonner'] },
    { id: 'ausbildung', name: 'Ausbildung', source: '', persons: [], info: 'ohne FG-Mitglieder (siehe Fachgruppen)',
      exact: [], strong: ['ausbildung'], weak: ['kurs'] },
    { id: 'mio', name: 'MIO', source: '', persons: [], info: '7 RV und 5 AG, Cevi Zürich, Cevi Gossau',
      exact: ['mio'], strong: ['regionalverband', 'regionalverbande', 'mitgliedorganisation'], weak: [] },
    { id: 'fachgruppen', name: 'Fachgruppen', source: 'DB', persons: [], info: 'jeder seine',
      exact: [], strong: ['fachgruppe'], weak: [] },
    { id: 'projektgruppen', name: 'Projektgruppen', source: 'DB', persons: [], info: 'jeder seine',
      exact: [], strong: ['projektgruppe', 'projektteam', 'kernteam'], weak: ['conveniat', 'lager', 'konekta'] },
    { id: 'anlaesse', name: 'Anlässe des Jahres', source: 'DB (Absprache GL)', persons: [], info: 'Anlass-Organisatoren, z.B. TN Fundraising Day',
      exact: [], strong: ['anlass', 'anlasse', 'fundraising day', 'delegiertenkonferenz'], weak: [] },
    { id: 'kommissionen', name: 'Kommissionen', source: 'DB', persons: ['GL'], info: 'DLK-Kommission',
      exact: [], strong: ['kommission'], weak: ['dlk'] },
    { id: 'kindeswohl', name: 'Kindeswohl', source: 'DB', persons: [], info: 'nur TN Cevi Schweiz',
      exact: ['psa'], strong: ['kindeswohl', 'psa cevi', 'praventionsschulung'], weak: [] },
    { id: 'krisen', name: 'Krisenmanagement', source: 'DB', persons: [], info: 'nur Mitglieder Cevi Schweiz, ohne GS',
      exact: [], strong: ['krisen', 'krisenteam'], weak: [] },
    { id: 'international', name: 'International', source: '', persons: [], info: 'YMCAs, YWCAs, Change Agents',
      exact: [], strong: ['change agent', 'dachverband', 'dachverbande'], weak: ['international', 'ymca', 'ywca'] },
    { id: 'ehren', name: 'Ehren- und Fördermitglieder', source: 'DB', persons: ['GL'], info: '',
      exact: [], strong: ['ehrenmitglied', 'fordermitglied', 'fordermitgleid', 'ehren- und forder', 'ehren und forder'], weak: [] },
    { id: 'diverse', name: 'Diverse', source: 'Alle', persons: [], info: 'Marketing, Stiftungen, Partner',
      exact: [], strong: ['diverse', 'stiftung', 'marketing'], weak: ['partner'] },
  ];

  // Labels in „Hauptzuständigkeit", die keine echte Person sind
  const NON_OWNER = ['jeder seine', 'anlass-organisatoren', 'alle', ''];
  /** Zuständige einer Kategorie (Liste von Kürzeln/Namen); kompatibel mit altem Feld „owner" */
  function catPersonLabels(c) { if (!c) return []; if (Array.isArray(c.persons)) return c.persons.map(str).filter(Boolean); return splitOwners(c.owner || ''); }

  const SKIP_SHEETS = [/^\s*<</, /^\s*end\s*$/i];

  // ---------------------------------------------------------------------------
  // Helfer
  // ---------------------------------------------------------------------------
  function str(v) {
    if (v === null || v === undefined) return '';
    if (typeof v === 'boolean') return '';
    return String(v).replace(/\s+/g, ' ').trim();
  }
  function fold(s) {
    return str(s).toLowerCase()
      .replace(/ß/g, 'ss')
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/ae/g, 'a').replace(/oe/g, 'o').replace(/ue/g, 'u');
  }
  function key(s) { return fold(s).replace(/[^a-z0-9]/g, ''); }
  function textKey(s) { return fold(s).replace(/[^a-z0-9&+\- ]/g, ' ').replace(/\s+/g, ' ').trim(); }

  function normOwner(v) {
    const s = str(v);
    if (!s) return '';
    // Kurzzeichen (jre, Jpe, mtr …) einheitlich in Grossbuchstaben
    if (/^(team|alle)$/i.test(s)) return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
    if (/^[a-zäöü]{2,4}$/.test(s) || /^[A-ZÄÖÜ]{2,4}$/.test(s)) return s.toUpperCase();
    return s;
  }
  function splitOwners(v) { return str(v).split(/\s*(?:[,;\/+&]|\bund\b)\s*/i).map(str).filter(Boolean); }
  function isEmail(s) { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s); }

  function levenshtein(a, b) {
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;
    let prev = new Array(b.length + 1);
    for (let j = 0; j <= b.length; j++) prev[j] = j;
    for (let i = 1; i <= a.length; i++) {
      const cur = [i];
      for (let j = 1; j <= b.length; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      }
      prev = cur;
    }
    return prev[b.length];
  }
  function similarFirst(a, b) {
    const x = key(a), y = key(b);
    if (!x || !y) return false;
    if (x === y) return true;
    if (x.length >= 3 && y.length >= 3 && (x.startsWith(y) || y.startsWith(x))) return true;
    if (x.slice(0, 3) === y.slice(0, 3) && Math.min(x.length, y.length) <= 4) return true; // Miri / Mirjam
    return levenshtein(x, y) <= (Math.max(x.length, y.length) >= 6 ? 2 : 1);
  }

  // ---------------------------------------------------------------------------
  // Kategorie-Erkennung
  // ---------------------------------------------------------------------------
  function detectCategory(text, cats) {
    const t = textKey(text);
    if (!t) return null;
    let best = null;
    for (const c of cats) {
      let score = 0, hit = '';
      const names = [c.name, ...(c.exact || [])].map(textKey);
      if (names.includes(t)) { score = 10; hit = c.name; }
      else {
        for (const k of c.strong || []) if (t.includes(textKey(k))) { if (score < 5) { score = 5; hit = k; } }
        if (!score && t.includes(textKey(c.name))) { score = 5; hit = c.name; }
        for (const k of c.weak || []) if (t.includes(textKey(k))) { if (score < 2) { score = 2; hit = k; } }
      }
      if (score && (!best || score > best.score)) best = { catId: c.id, score, hit };
    }
    return best;
  }
  function detectFromMany(texts, cats) {
    // erster Text mit sicherem Treffer gewinnt (Blattname vor Dateiname vor Gruppenname)
    let best = null;
    for (const tx of texts) {
      const d = detectCategory(tx, cats);
      if (d && (!best || d.score > best.score)) best = { ...d, from: tx };
      if (best && best.score >= 10) break;
    }
    return best;
  }

  // ---------------------------------------------------------------------------
  // Spalten-Erkennung
  // ---------------------------------------------------------------------------
  const COLS = {
    org: ['organisation', 'organization', 'firma', 'firmenname', 'institution'],
    first: ['vorname', 'first name', 'first_name', 'prenom'],
    last: ['nachname', 'last name', 'last_name', 'familienname', 'nom'],
    nick: ['ubername', 'pfadiname', 'cevi-name', 'cevi name'],
    email: ['email', 'e-mail', 'haupt-e-mail', 'mail', 'e-mail-adresse', 'emailadresse'],
    street: ['strasse', 'street', 'adresse', 'address'],
    nr: ['nr', 'nr.', 'hausnummer', 'housenumber', 'hausnr'],
    careOf: ['adresszusatz', 'c/o', 'zusatz', 'address_care_of'],
    zip: ['plz', 'postleitzahl', 'zip', 'zip_code', 'npa'],
    town: ['ort', 'wohnort', 'stadt', 'town', 'localite'],
    country: ['land', 'country'],
    owner: ['zustandigkeit', 'zustandig', 'verantwortlich', 'hauptzustandigkeit'],
    extra: ['zus. unterschriften', 'zus unterschriften', 'zusatzliche unterschriften', 'unterschriften', 'mitunterschreiben'],
    done: ['erledigt', 'versendet', 'done'],
    category: ['kategorie', 'kategorien'],
    group: ['gruppe', 'gruppen', 'hauptgruppe', 'primary group'],
    roles: ['rollen', 'rolle', 'roles'],
  };
  function colType(header) {
    const h = fold(header).replace(/\s+/g, ' ').trim();
    if (!h) return null;
    for (const [type, names] of Object.entries(COLS)) if (names.includes(h)) return type;
    return null;
  }

  // ---------------------------------------------------------------------------
  // Excel-Arbeitsmappe einlesen  (rows = Array von Arrays je Blatt)
  // ---------------------------------------------------------------------------
  function findHeaderRow(rows) {
    for (let r = 0; r < Math.min(rows.length, 15); r++) {
      const types = (rows[r] || []).map(colType);
      const n = new Set(types.filter(Boolean)).size;
      if (types.includes('first') || types.includes('last')) { if (n >= 2) return r; }
    }
    return -1;
  }

  function isOverviewSheet(rows) {
    for (let r = 0; r < Math.min(rows.length, 5); r++) {
      const cells = (rows[r] || []).map(fold);
      if (cells.includes('kategorien') && cells.some(c => c.startsWith('hauptzustandigkeit'))) return r;
    }
    return -1;
  }

  function parseOverview(rows, headerRow, cats) {
    const h = rows[headerRow].map(fold);
    const ci = h.indexOf('kategorien');
    const si = h.findIndex(c => c.startsWith('zu finden'));
    const oi = h.findIndex(c => c.startsWith('hauptzustandigkeit'));
    const ii = h.findIndex(c => c.startsWith('info'));
    const found = [];
    for (let r = headerRow + 1; r < rows.length; r++) {
      const row = rows[r] || [];
      const name = str(row[ci]);
      if (!name) continue;
      const d = detectCategory(name, cats);
      const entry = { name, source: si >= 0 ? str(row[si]) : '', owner: oi >= 0 ? str(row[oi]) : '', info: ii >= 0 ? str(row[ii]) : '' };
      if (d) { entry.catId = d.catId; }
      found.push(entry);
    }
    return found;
  }

  function blockTitle(rows, headerRow, start, end) {
    for (let r = headerRow - 1; r >= 0 && r >= headerRow - 3; r--) {
      const row = rows[r] || [];
      const cells = [];
      for (let c = start; c < end; c++) { const v = str(row[c]); if (v) cells.push(v); }
      if (cells.length === 1 && !/zur[uü]ck zur [uü]bersicht/i.test(cells[0])) return cells[0];
    }
    return '';
  }

  /**
   * @param {Array<{name:string, rows:any[][]}>} sheets
   * @param {string} fileName
   * @param {Array} cats
   * @returns {{sources:Array, overview:Array|null, notes:string[]}}
   */
  function parseWorkbookRows(sheets, fileName, cats) {
    const result = { sources: [], overview: null, notes: [] };
    const fileBase = str(fileName).replace(/\.[a-z0-9]+$/i, '');
    const parsed = [];

    for (const sh of sheets) {
      if (SKIP_SHEETS.some(rx => rx.test(sh.name))) continue;
      const rows = sh.rows || [];
      const ov = isOverviewSheet(rows);
      if (ov >= 0) { result.overview = parseOverview(rows, ov, cats); continue; }
      const hr = findHeaderRow(rows);
      if (hr < 0) { if (rows.some(r => r && r.some(v => str(v)))) result.notes.push(`Blatt „${sh.name}": keine Adress-Spalten gefunden – übersprungen.`); continue; }
      const header = rows[hr];
      const types = header.map(colType);
      const isFlat = types.includes('category') || types.includes('roles');
      // Blöcke: jede Wiederholung von "Organisation" (bzw. "Vorname") startet einen neuen Block
      const anchorType = types.includes('org') ? 'org' : 'first';
      const starts = types.map((t, i) => (t === anchorType ? i : -1)).filter(i => i >= 0);
      const blocks = starts.map((s, k) => ({ start: s, end: k + 1 < starts.length ? starts[k + 1] : header.length }));
      parsed.push({ sh, rows, hr, header, types, isFlat, blocks });
    }

    const hasBlockSheets = parsed.some(p => !p.isFlat);
    for (const p of parsed) {
      const { sh, rows, hr, types, isFlat, blocks } = p;
      if (isFlat && hasBlockSheets && /master|alle adressen|gesamt/i.test(sh.name)) {
        result.notes.push(`Blatt „${sh.name}" ist eine Sammelliste – ignoriert, weil die Kategorie-Blätter derselben Datei eingelesen werden.`);
        continue;
      }
      const sheetDet = detectFromMany([sh.name, fileBase], cats);
      for (const b of blocks) {
        const map = {};
        for (let c = b.start; c < b.end; c++) if (types[c] && map[types[c]] === undefined) map[types[c]] = c;
        const title = blocks.length > 1 || !isFlat ? blockTitle(rows, hr, b.start, b.end) : '';
        const group = title && textKey(title) !== textKey(sh.name) ? title : (title || sh.name);
        let det = sheetDet;
        if (!det || det.score < 5) det = detectFromMany([sh.name, title, fileBase], cats) || det;
        const src = {
          id: `xls:${fileBase}:${sh.name}:${b.start}`,
          kind: 'excel', file: fileName, sheet: sh.name, block: title,
          label: `${sh.name}${title && title !== sh.name ? ' › ' + title : ''}`,
          group, catId: det ? det.catId : '', detectedBy: det ? det.from + ' → „' + det.hit + '"' : '',
          confidence: det ? (det.score >= 10 ? 'sicher' : det.score >= 5 ? 'wahrscheinlich' : 'unsicher') : 'keine',
          perRow: isFlat, entries: [],
        };
        for (let r = hr + 1; r < rows.length; r++) {
          const row = rows[r] || [];
          const get = (t) => (map[t] === undefined ? '' : str(row[map[t]]));
          const e = {
            org: get('org'), first: get('first'), last: get('last'), nick: get('nick'), email: get('email').toLowerCase(),
            street: get('street'), nr: get('nr'), careOf: get('careOf'), zip: get('zip'), town: get('town'), country: get('country'),
            owner: normOwner(get('owner')), extra: get('extra'),
            done: map.done !== undefined && row[map.done] === true,
            group: src.group, catId: src.catId, rowNo: r + 1,
          };
          if (!e.first && !e.last && !e.org && !e.street) continue;
          let headerLike = 0;
          for (const [t, c] of Object.entries(map)) if (colType(row[c]) === t) headerLike++;
          if (headerLike >= 2) continue;
          if (!e.nr && e.street) { const m = e.street.match(/^(.*\D)\s+(\d+\s?[a-zA-Z]?)$/); if (m) { e.street = m[1].trim(); e.nr = m[2]; } }
          if (e.email && !isEmail(e.email)) e.email = '';
          if (isFlat) {
            const rowCat = get('category'), rowGroup = get('group'), roles = get('roles');
            if (rowGroup) e.group = rowGroup;
            const d = detectFromMany([rowCat, roles, rowGroup], cats);
            if (d) e.catId = d.catId;
            if (roles) e.roles = roles;
          }
          src.entries.push(e);
        }
        if (src.entries.length) result.sources.push(src);
      }
    }
    return result;
  }

  /** Overview-Blatt auf Kategorien anwenden */
  function applyOverview(cats, overview) {
    if (!overview) return cats;
    const out = cats.map(c => ({ ...c }));
    for (const o of overview) {
      const c = out.find(x => x.id === o.catId);
      if (!c) continue;
      c.source = o.source || c.source;
      const ownerLabel = o.owner;
      if (!c.personsManual && !c.ownerManual) c.persons = NON_OWNER.includes(fold(ownerLabel)) ? [] : splitOwners(ownerLabel);
      if (NON_OWNER.includes(fold(ownerLabel)) && ownerLabel) c.info = [ownerLabel, o.info].filter(Boolean).join(', ');
      else if (o.info) c.info = o.info;
    }
    return out;
  }

  // ---------------------------------------------------------------------------
  // Cevi-DB (hitobito JSON:API) → Einträge
  // ---------------------------------------------------------------------------
  function entriesFromJsonApi(pages, source, cats) {
    const people = new Map(), groups = new Map(), entries = [];
    const roles = [];
    for (const p of pages) {
      for (const inc of p.included || []) {
        if (inc.type === 'people') people.set(inc.id, inc.attributes || {});
        if (inc.type === 'groups') groups.set(inc.id, inc.attributes || {});
      }
      for (const d of p.data || []) if (d.type === 'roles') roles.push(d);
    }
    const seen = new Set();
    for (const r of roles) {
      const pid = r.relationships && r.relationships.person && r.relationships.person.data && r.relationships.person.data.id
        || String((r.attributes || {}).person_id || '');
      const gid = r.relationships && r.relationships.group && r.relationships.group.data && r.relationships.group.data.id
        || String((r.attributes || {}).group_id || '');
      const a = people.get(pid);
      if (!a) continue;
      const g = groups.get(gid) || {};
      const groupName = str(g.display_name || g.name) || source.label;
      const k = pid + '|' + gid;
      if (seen.has(k)) continue;
      seen.add(k);
      let street = str(a.street), nr = str(a.housenumber);
      if (!street && a.address) {
        const line = str(String(a.address).split('\n')[0]);
        const m = line.match(/^(.*\D)\s+(\d+\s?[a-zA-Z]?)$/);
        street = m ? m[1].trim() : line; nr = m ? m[2] : '';
      }
      const catId = source.catId || (detectFromMany([groupName, source.label], cats) || {}).catId || '';
      entries.push({
        org: a.company ? str(a.company_name) : '', first: str(a.first_name), last: str(a.last_name), nick: str(a.nickname),
        email: str(a.email).toLowerCase(), street, nr, careOf: str(a.address_care_of), zip: str(a.zip_code), town: str(a.town),
        country: str(a.country), owner: normOwner(source.owner), extra: '', done: false,
        group: groupName, catId, roles: str((r.attributes || {}).name || (r.attributes || {}).type),
        dbPersonId: pid, rowNo: null,
      });
    }
    return entries;
  }

  // ---------------------------------------------------------------------------
  // Duplikate finden + Zuständigkeit zuteilen
  // ---------------------------------------------------------------------------
  function isPersonal(e) { return !!e.last && !/^\s*(z\.?\s?h|c\/o|zuhanden|team)/i.test(e.first); }
  function personNameKey(e) {
    if (isPersonal(e)) return key(e.first) + '|' + key(e.last);
    return 'org|' + key(e.org) + '|' + key(e.first) + '|' + key(e.last);
  }
  function identity(e) { return [personNameKey(e), key(e.zip), e.email].join('#'); }
  function pairKey(a, b) { return a < b ? a + '§' + b : b + '§' + a; }

  /**
   * @param {Array} entries  alle Einträge (mit .uid, .catId, .owner …)
   * @param {object} opts { cats, order (catIds), aliases (Map lowercased->label), decisions {pairKey:'same'|'different'}, overrides {personKey: owner} }
   */
  function buildPeople(entries, opts) {
    const cats = opts.cats;
    const order = opts.order || cats.map(c => c.id);
    const catById = Object.fromEntries(cats.map(c => [c.id, c]));
    const decisions = opts.decisions || {};
    const overrides = opts.overrides || {};
    const codeNames = opts.codeNames || {};
    const catPersonCache = new Map();
    const catPersons = (catId) => {
      if (!catPersonCache.has(catId)) catPersonCache.set(catId, [...new Set(catPersonLabels(catById[catId]).map(l => aliasOf(l)).filter(Boolean))]);
      return catPersonCache.get(catId);
    };
    const aliasOf = (o) => { const s = normOwner(o); if (!s) return ''; return (opts.aliases && opts.aliases.get(fold(s))) || s; };

    const n = entries.length;
    const parent = entries.map((_, i) => i);
    const find = (i) => { while (parent[i] !== i) { parent[i] = parent[parent[i]]; i = parent[i]; } return i; };
    const reasons = new Map(); // root-pair -> reason
    const ids = entries.map(identity);
    const blocked = (i, j) => decisions[pairKey(ids[i], ids[j])] === 'different';
    const union = (i, j, why) => {
      if (blocked(i, j)) return false;
      const a = find(i), b = find(j);
      if (a === b) return true;
      parent[b] = a;
      const rs = reasons.get(a) || new Set();
      (reasons.get(b) || new Set()).forEach(x => rs.add(x));
      rs.add(why);
      reasons.set(a, rs);
      return true;
    };

    const by = (fn) => { const m = new Map(); entries.forEach((e, i) => { const k = fn(e); if (!k) return; if (!m.has(k)) m.set(k, []); m.get(k).push(i); }); return m; };

    // 1) gleicher Name + gleiche PLZ
    for (const [, idx] of by(e => (e.first || e.last || e.org) && e.zip ? personNameKey(e) + '#' + key(e.zip) : '')) for (let k = 1; k < idx.length; k++) union(idx[0], idx[k], 'Name + PLZ');
    // 2) gleiche E-Mail und passender Nachname
    for (const [, idx] of by(e => e.email)) {
      for (let k = 1; k < idx.length; k++) {
        const a = entries[idx[0]], b = entries[idx[k]];
        if (!a.last || !b.last || key(a.last) === key(b.last) || similarFirst(a.last, b.last)) union(idx[0], idx[k], 'E-Mail');
      }
    }
    // 3) gleicher Name, nur eine (oder keine) PLZ bekannt → zusammenführen; verschiedene PLZ → zur Prüfung
    const possible = [];
    for (const [, idx] of by(e => (e.first && isPersonal(e)) ? personNameKey(e) : '')) {
      if (idx.length < 2) continue;
      const zips = new Set(idx.map(i => key(entries[i].zip)).filter(Boolean));
      if (zips.size <= 1) { for (let k = 1; k < idx.length; k++) union(idx[0], idx[k], 'Name (Adresse fehlt teilweise)'); }
      else possible.push({ idx, why: 'Gleicher Name, aber verschiedene PLZ' });
    }
    // 4) Benutzer-Entscheide "gleiche Person"
    const idPos = new Map(); ids.forEach((id, i) => { if (!idPos.has(id)) idPos.set(id, i); });
    for (const [pk, v] of Object.entries(decisions)) {
      if (v !== 'same') continue;
      const [a, b] = pk.split('§');
      if (idPos.has(a) && idPos.has(b)) union(idPos.get(a), idPos.get(b), 'manuell bestätigt');
    }
    // 5) ähnliche Vornamen bei gleichem Nachnamen + (gleicher Adresse | gleicher E-Mail | fehlender Adresse) → Vorschlag
    for (const [, idx] of by(e => isPersonal(e) ? key(e.last) : '')) {
      if (idx.length < 2) continue;
      for (let x = 0; x < idx.length; x++) for (let y = x + 1; y < idx.length; y++) {
        const i = idx[x], j = idx[y];
        if (find(i) === find(j)) continue;
        const a = entries[i], b = entries[j];
        if (key(a.first) === key(b.first)) continue; // bereits in Regel 3 behandelt
        if (!similarFirst(a.first, b.first)) continue;
        const sameAddr = a.zip && a.zip === b.zip && key(a.street) && key(a.street) === key(b.street) && key(a.nr) === key(b.nr);
        const sameMail = a.email && a.email === b.email;
        const noAddr = !a.zip || !b.zip;
        if (sameAddr || sameMail || noAddr) possible.push({ idx: [i, j], why: `Ähnlicher Vorname (${a.first} / ${b.first})` + (sameAddr ? ', gleiche Adresse' : sameMail ? ', gleiche E-Mail' : '') });
      }
    }

    // Cluster bilden
    const clusters = new Map();
    entries.forEach((e, i) => { const r = find(i); if (!clusters.has(r)) clusters.set(r, []); clusters.get(r).push(i); });

    const prio = (catId) => { const p = order.indexOf(catId); return p < 0 ? 999 : p; };
    const completeness = (e) => (e.street ? 2 : 0) + (e.zip ? 2 : 0) + (e.town ? 1 : 0) + (e.email ? 1 : 0) + (e.origin === 'db' ? 3 : 0);
    const people = [];
    const personOfEntry = new Array(n);

    for (const [root, idx] of clusters) {
      const es = idx.map(i => entries[i]);
      // stabiler Schlüssel für gespeicherte Entscheide/Häkchen
      const pkeys = es.map(e => e.email || (personNameKey(e) + '#' + key(e.zip))).sort();
      const pKey = pkeys[0];
      const best = es.slice().sort((a, b) => completeness(b) - completeness(a))[0];
      const effOwner = (e) => aliasOf(e.owner) || catPersons(e.catId)[0] || '';
      const selfName = isPersonal(best) ? fold(best.first.split(' ')[0] + ' ' + best.last) : '';
      const isSelf = (o) => !!(o && selfName && codeNames[o] && fold(codeNames[o]) === selfName);
      const ranked = es.slice().sort((a, b) => (isSelf(effOwner(a)) - isSelf(effOwner(b))) || ((effOwner(a) ? 0 : 1) - (effOwner(b) ? 0 : 1)) || (prio(a.catId) - prio(b.catId)) || ((b.owner ? 1 : 0) - (a.owner ? 1 : 0)));
      let primary = ranked[0];
      let owner = effOwner(primary);
      const suggested = owner;
      const selfNotes = [];
      // Alle, die als Hauptverantwortung in Frage kommen (Zuständige der Listen + Spalte „Zus. Unterschriften")
      const candidates = [];
      const addCand = (o, via) => { if (!o) return; let c = candidates.find(x => x.owner === o); if (!c) { c = { owner: o, via: [], self: isSelf(o) }; candidates.push(c); } if (via && !c.via.includes(via)) c.via.push(via); };
      const labelOf = (e) => ((catById[e.catId] || {}).name || 'ohne Kategorie') + (e.group && e.group !== (catById[e.catId] || {}).name ? ' › ' + e.group : '');
      for (const e of ranked) { addCand(effOwner(e), labelOf(e)); if (!aliasOf(e.owner)) for (const o of catPersons(e.catId).slice(1)) addCand(o, labelOf(e) + ' (Kategorie)'); }
      for (const e of ranked) if (e.extra) for (const part of splitOwners(e.extra)) addCand(aliasOf(part), 'Zus. Unterschrift bei ' + labelOf(e));
      let overridden = false;
      if (overrides[pKey]) { owner = overrides[pKey]; overridden = true; const m = es.find(e => effOwner(e) === owner); if (m) primary = m; }
      const coSigners = [];
      const addCo = (o, via) => { if (!o || o === owner) return; if (isSelf(o)) { if (!selfNotes.length) selfNotes.push(o + ' ist die Person selbst – unterschreibt nicht'); return; } let c = coSigners.find(x => x.owner === o); if (!c) { c = { owner: o, via: [] }; coSigners.push(c); } if (via && !c.via.includes(via)) c.via.push(via); };
      for (const e of ranked) {
        const label = ((catById[e.catId] || {}).name || 'ohne Kategorie') + (e.group && e.group !== (catById[e.catId] || {}).name ? ' › ' + e.group : '');
        addCo(effOwner(e), label);
        if (!aliasOf(e.owner)) for (const o of catPersons(e.catId).slice(1)) addCo(o, label + ' (weitere Zuständige der Kategorie)');
        if (e.extra) for (const part of splitOwners(e.extra)) addCo(aliasOf(part), 'Spalte „Zus. Unterschriften" (' + label + ')');
      }
      const addrSet = new Map();
      for (const e of es) if (e.zip || e.street) { const k = key(e.street) + key(e.nr) + '#' + key(e.zip); if (!addrSet.has(k)) addrSet.set(k, e); }
      const notes = [];
      if (addrSet.size > 1) notes.push('Unterschiedliche Adressen: ' + [...addrSet.values()].map(e => [e.street, e.nr].filter(Boolean).join(' ') + ', ' + [e.zip, e.town].filter(Boolean).join(' ')).join(' ⟷ '));
      if (!best.zip || !best.street) notes.push('Adresse unvollständig');
      if (!owner) notes.push('Keine Zuständigkeit hinterlegt');
      if (isSelf(owner)) notes.push('Zuständig ist die Person selbst – bitte anders zuteilen');
      notes.push(...selfNotes);
      const memberships = [];
      for (const e of ranked) {
        const m = { catId: e.catId, cat: (catById[e.catId] || {}).name || 'ohne Kategorie', group: e.group, owner: effOwner(e), source: e.sourceLabel || '', origin: e.origin || 'excel', roles: e.roles || '' };
        if (!memberships.some(x => x.cat === m.cat && x.group === m.group && x.owner === m.owner)) memberships.push(m);
      }
      const person = {
        key: pKey, entryUids: es.map(e => e.uid),
        org: best.org || (es.find(e => e.org) || {}).org || '', first: best.first, last: best.last, nick: best.nick || '',
        email: best.email || (es.find(e => e.email) || {}).email || '',
        street: best.street, nr: best.nr, careOf: best.careOf || '', zip: best.zip, town: best.town, country: best.country || '',
        owner, overridden, suggested, candidates, primaryCatId: primary.catId, primaryCat: (catById[primary.catId] || {}).name || 'ohne Kategorie', primaryGroup: primary.group,
        coSigners, memberships, notes,
        mergeReasons: es.length > 1 ? [...(reasons.get(root) || [])] : [],
        isDuplicate: es.length > 1, doneFromFile: es.some(e => e.done),
        ownerOptions: [...new Set(es.map(effOwner).filter(Boolean))],
        fromDb: es.some(e => e.origin === 'db'),
      };
      person.displayName = (person.first || person.last) ? [person.first, person.last].filter(Boolean).join(' ') : person.org;
      people.push(person);
      idx.forEach(i => { personOfEntry[i] = person; });
    }

    // Vorschläge zur Prüfung (nur zwischen verschiedenen Personen)
    const review = [];
    const seenPairs = new Set();
    for (const p of possible) {
      const ps = [...new Set(p.idx.map(i => personOfEntry[i]))];
      if (ps.length < 2) continue;
      for (let x = 0; x < ps.length; x++) for (let y = x + 1; y < ps.length; y++) {
        const a = ps[x], b = ps[y];
        const ea = entries.find(e => e.uid === a.entryUids[0]), eb = entries.find(e => e.uid === b.entryUids[0]);
        const pk = pairKey(identity(ea), identity(eb));
        if (seenPairs.has(pk) || decisions[pk]) continue;
        seenPairs.add(pk);
        review.push({ pairKey: pk, a, b, why: p.why });
      }
    }

    people.sort((a, b) => (a.last || a.org).localeCompare(b.last || b.org, 'de') || (a.first || '').localeCompare(b.first || '', 'de'));
    return { people, review };
  }

  // ---------------------------------------------------------------------------
  // Kürzel (z.B. OSC) automatisch Personen von Cevi Schweiz zuordnen:
  // Konvention = 1. Buchstabe Vorname + 2 Buchstaben Nachname
  // ---------------------------------------------------------------------------
  function deriveAliases(entries, cats) {
    const observed = new Set();
    const labels = new Set();
    const addObs = (v) => { for (const p of splitOwners(v)) { const o = normOwner(p); if (/^[A-Za-zÄÖÜäöü]{2,4}$/.test(o)) observed.add(o.toUpperCase()); if (o && !/^[A-ZÄÖÜ]{2,4}$/.test(o)) labels.add(o); } };
    for (const e of entries) { addObs(e.owner); addObs(e.extra); }
    for (const c of cats) for (const p of catPersonLabels(c)) labels.add(str(p));
    const staff = entries.filter(e => e.catId === 'cevi-schweiz' && e.first && isPersonal(e));
    const codeNames = {}, labelToCode = {}, byFirst = new Map();
    for (const e of staff) {
      const ln = e.last.replace(/[^A-Za-zÄÖÜäöüÉÈéèàç]/g, '');
      const code = (e.first.charAt(0) + ln.slice(0, 2)).toUpperCase();
      if (!observed.has(code)) continue;
      const full = e.first.split(' ')[0] + ' ' + e.last;
      if (codeNames[code] && codeNames[code] !== full) { codeNames[code] = codeNames[code] + ' / ' + full; continue; }
      codeNames[code] = full;
      const f = fold(e.first.split(' ')[0]);
      if (!byFirst.has(f)) byFirst.set(f, new Set());
      byFirst.get(f).add(code);
    }
    // Vornamen eindeutig? (alle Cevi-Schweiz-Personen mit diesem Vornamen zählen)
    const firstCount = new Map();
    const seenStaff = new Set();
    for (const e of staff) { const id = key(e.first) + key(e.last); if (seenStaff.has(id)) continue; seenStaff.add(id); const f = fold(e.first.split(' ')[0]); firstCount.set(f, (firstCount.get(f) || 0) + 1); }
    for (const l of labels) {
      const f = fold(l);
      if (!/^[a-z\-]+$/.test(f)) continue;
      const codes = byFirst.get(f);
      if (codes && codes.size === 1 && firstCount.get(f) === 1) labelToCode[f] = [...codes][0];
    }
    return { codeNames, labelToCode, observed: [...observed].sort() };
  }

  const api = { DEFAULT_CATEGORIES, detectCategory, parseWorkbookRows, applyOverview, buildPeople, entriesFromJsonApi, deriveAliases, splitOwners, catPersonLabels, fold, key, normOwner, identity, pairKey, str };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.WB = api;
})(typeof window !== 'undefined' ? window : globalThis);
