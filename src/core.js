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
    { id: 'kommissionen', name: 'Kommissionen', source: 'DB', persons: ['GL'], info: 'DLK-Kommission',
      exact: [], strong: ['kommission'], weak: ['dlk'] },
    { id: 'kindeswohl', name: 'PSA', source: 'DB', persons: [], info: 'nur TN Cevi Schweiz',
      exact: ['psa', 'kindeswohl'], strong: ['kindeswohl', 'psa cevi', 'praventionsschulung'], weak: [] },
    { id: 'krisen', name: 'Krisenmanagement', source: 'DB', persons: [], info: 'nur Mitglieder Cevi Schweiz, ohne GS',
      exact: [], strong: ['krisen', 'krisenteam'], weak: [] },
    { id: 'international', name: 'International', source: '', persons: [], info: 'YMCAs, YWCAs, Change Agents',
      exact: [], strong: ['change agent', 'dachverband', 'dachverbande'], weak: ['international', 'ymca', 'ywca'] },
    { id: 'ehren', name: 'Ehren- und Fördermitglieder', source: 'DB', persons: ['GL'], info: '',
      exact: [], strong: ['ehrenmitglied', 'fordermitglied', 'fordermitgleid', 'ehren- und forder', 'ehren und forder'], weak: [] },
    { id: 'diverse', name: 'Diverse', source: 'Alle', persons: [], info: 'Marketing, Stiftungen, Partner',
      exact: [], strong: ['diverse', 'stiftung', 'marketing', 'anlass', 'anlasse', 'fundraising day', 'delegiertenkonferenz'], weak: ['partner'] }, // „Anlässe des Jahres" ist eine Untergruppe von „Diverse"
  ];

  // Labels in „Hauptzuständigkeit", die keine echte Person sind
  const NON_OWNER = ['jeder seine', 'anlass-organisatoren', 'alle', ''];
  /** Schlüssel einer Untergruppe innerhalb einer Kategorie ('' = keine eigene Untergruppe) */
  function groupKey(catName, group) {
    const cn = textKey(catName);
    const drop = new Set([cn, cn.replace(/n$/, ''), cn.replace(/en$/, ''), 'fg', 'pg', 'und', '&', '+', '-']);
    return textKey(group).split(' ').filter(w => w && !drop.has(w)).join('').replace(/[^a-z0-9]/g, '');
  }
  /**
   * Baum einer geladenen DB-Gruppe → Untergruppen der Kategorie.
   * nodes: [{id, name, parentId}] (ohne die Wurzel); rootIds: Set der geladenen Gruppen.
   * Jede Gruppe wird eine eigene Untergruppe (auch tiefere Ebenen). Name = eigener Name,
   * bei gleichnamigen Gruppen innerhalb der Kategorie „Obergruppe › Gruppe".
   * Gibt { subs: [{id, gk, name, parentGk, depth, order}], nameOf: Map(id → Name) } zurück.
   */
  function subgroupTree(catName, rootIds, nodes) {
    const byId = new Map(nodes.map(n => [String(n.id), n]));
    const kids = new Map();
    for (const n of nodes) { const p = String(n.parentId || ''); if (!kids.has(p)) kids.set(p, []); kids.get(p).push(n); }
    for (const a of kids.values()) a.sort((x, y) => String(x.name).localeCompare(String(y.name), 'de'));
    const own = (n) => groupKey(catName, n.name);
    const count = new Map(); for (const n of nodes) { const k = own(n); if (k) count.set(k, (count.get(k) || 0) + 1); }
    const label = (n) => { const k = own(n); if (k && count.get(k) === 1) return str(n.name); const p = byId.get(String(n.parentId)); return p ? str(p.name) + ' › ' + str(n.name) : str(n.name); };
    const subs = [], nameOf = new Map(); let order = 0;
    const walk = (parentId, depth, parentGk) => {
      for (const n of kids.get(String(parentId)) || []) {
        const name = label(n), gk = groupKey(catName, name);
        nameOf.set(String(n.id), name);
        if (gk) subs.push({ id: String(n.id), gk, name, parentGk: parentGk || '', depth, order: order++ });
        walk(n.id, depth + 1, gk || parentGk);
      }
    };
    for (const r of rootIds) walk(r, 0, '');
    return { subs, nameOf };
  }
  /** Zuständige einer Untergruppe (Kürzel/Namen) */
  function groupPersonLabels(c, gk) { const g = c && c.groups && gk ? c.groups[gk] : null; return g && Array.isArray(g.persons) ? g.persons.map(str).filter(Boolean) : []; }
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
  /** Kürzel = 1. Buchstabe Vorname + 1. und 2. Buchstabe Nachname (z.B. Anna Beispiel → ABE) */
  const LETTERS = /[^A-Za-zÄÖÜäöüÉÈÊËéèêëÀÂàâÇçÎÏîïÔôÛÙûù]/g;
  function makeCode(first, last) {
    const f = str(first).replace(LETTERS, ''), l = str(last).replace(LETTERS, '');
    if (!f || l.length < 2) return '';
    return (f.charAt(0) + l.slice(0, 2)).toUpperCase();
  }
  /** Weitere Varianten, falls das Kürzel schon vergeben ist */
  function codeVariants(first, last) {
    const f = str(first).replace(LETTERS, '').toUpperCase(), l = str(last).replace(LETTERS, '').toUpperCase();
    if (!f || l.length < 2) return [];
    const out = [f[0] + l[0] + l[1]];
    for (let i = 2; i < l.length; i++) out.push(f[0] + l[0] + l[i]);
    if (f.length > 1) out.push(f[0] + f[1] + l[0]);
    return [...new Set(out)];
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
        if (!score && t.includes(textKey(c.name))) { score = 4; hit = c.name; } // enthaltener Kategoriename wiegt weniger als ein klares Stichwort
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
    name: ['name', 'name vorname', 'vorname name', 'name, vorname', 'vorname, name', 'nachname vorname', 'vorname nachname', 'name und vorname', 'vollstandiger name', 'empfanger', 'empfangerin', 'empfanger*in', 'kundenname', 'adressat', 'spender', 'spenderin', 'spender*in'],
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
  // Spaltentitel tolerant erkennen: zuerst genaue Namen, dann Muster (de/fr/it/en, Exporte aus hitobito, Abacus, Outlook …)
  function hnorm(h) { return fold(h).replace(/[_\-./()*:#,;|\\[\]]+/g, ' ').replace(/\s+/g, ' ').trim(); }
  const ID_RX = /\b(kunden|kunde nr|beleg|mitglied nr|mitgliedernummer|mitgliednummer|tel|telefon|telephone|phone|mobile|mobil|natel|handy|fax|konto|iban|ahv|id|referenz|rechnung|personal|adress nr|adressnummer|vertrag|datum|date|geburtstag|geburtsdatum|betrag|spende|chf|anzahl)\b/;
  const FULLNAME_RX = /^(name|namen|name 1|name1|voller name|vollstandiger name|name vorname|vorname name|nachname vorname|vorname nachname|name und vorname|empfanger|empfangerin|empfanger in|adressat|adressatin|kunde|kundin|kundenname|spender|spenderin|spender in|mitglied|person|kontakt|kontaktperson|teilnehmer|teilnehmerin|teilnehmende|anzeigename|display name|full name|nom et prenom|nom prenom|prenom nom|nome e cognome|contact)$/;
  const COL_RULES = [
    ['email', /\b(e ?mail|mail|courriel)\b/],
    ['salutation', /\b(anrede|briefanrede|civilite|titel|title|anredeform|grussformel)\b/],
    ['careOf', /^name ?2$|\b(adresszusatz|zusatz|c o|z hd|zhd|zuhanden|adresse 2|adresszeile 2|address line 2|address 2|postfach|case postale)\b/],
    ['zipTown', /\b(plz|npa|cap|postleitzahl|zip|postal code|postcode)\b.*\b(ort|ville|localite|localita|city|town|wohnort)\b|\b(ort|localite)\b.*\b(plz|npa)\b/],
    ['zip', /\b(plz|npa|cap|postleitzahl|zip|zip code|postal code|postcode)\b/],
    ['town', /\b(ort|wohnort|stadt|ville|localite|localita|city|town|ortschaft|domicile|domicilio)\b/],
    ['street', /\b(strasse|str|street|rue|ru|via|adresse|address|anschrift)\b.*\b(nr|nummer|no|hausnummer|numero)\b/],
    ['nr', /\b(hausnummer|haus nr|hausnr|nr|no|numero|nummer|house number|housenumber)\b/],
    ['street', /\b(strasse|str|street|rue|ru|via|adresse|address|adresszeile|address line|anschrift|wohnadresse|postadresse|indirizzo|domizil)\b/],
    ['first', /\b(vorname|vornamen|first name|firstname|given name|prenom|nome)\b/],
    ['last', /\b(nachname|familienname|last name|lastname|surname|family name|cognome|nom de famille)\b/],
    ['org', /\b(organisation|organization|firma|firmenname|institution|company|unternehmen|raison sociale|societe)\b/],
    ['country', /\b(land|country|pays|paese)\b/],
  ];
  function colType(header) {
    const h = fold(header).replace(/\s+/g, ' ').trim();
    if (!h) return null;
    for (const [type, names] of Object.entries(COLS)) if (names.includes(h)) return type;
    const n = hnorm(header);
    if (!n || n.length > 60) return null;
    for (const [type, names] of Object.entries(COLS)) if (names.includes(n)) return type;
    if (FULLNAME_RX.test(n)) return 'name';
    if (ID_RX.test(n) && !/\b(strasse|street|rue|adresse|address|plz|ort|name|vorname)\b/.test(n.replace(ID_RX, ''))) return null;
    for (const [type, rx] of COL_RULES) if (rx.test(n)) return type;
    return null;
  }

  // ---------------------------------------------------------------------------
  // Excel-Arbeitsmappe einlesen  (rows = Array von Arrays je Blatt)
  // ---------------------------------------------------------------------------
  // Häufige Vornamen (gefaltet) – zum Aufteilen einer Spalte „Name" in Vor- und Nachname
  const COMMON_FIRST = ('anna maria ruth verena ursula elisabeth monika barbara sandra daniela nicole andrea katharina christine susanne claudia karin regula esther silvia brigitte heidi rosmarie margrit erika ' +
    'sara sarah laura lea julia lena nina lisa jana eva marianne beatrice cornelia franziska gabriela simone petra martina sabine stefanie melanie jasmin tamara corinne priska therese theres vreni rita hedi doris ' +
    'irene judith sonja nadine rahel debora miriam lara noemi alina selina chiara elena sophie sofia mia emma hanna johanna magdalena helen marlies lotti trudi madeleine nathalie isabelle catherine francoise ' +
    'hans peter thomas daniel martin andreas christian markus marcel michael stefan beat urs walter bruno rolf werner kurt ernst paul heinz josef fritz max david simon lukas jonas samuel matthias tobias philipp ' +
    'patrick reto roger rene pascal adrian benjamin jan nicolas nico fabian florian dominik raphael felix marco mario roland robert rudolf alfred albert anton otto karl georg johannes jakob emil oliver sebastian ' +
    'kevin manuel elias noah luca leon tim joel yves jean pierre jacques claude francois marc luc giovanni giuseppe sandro christoph ruedi res hansjorg hanspeter hansruedi jurg jorg ueli ulrich silvan severin ' +
    'mathias moritz timo jonathan micha michel gabriel aaron levin nils lars erich eduard gottfried hermann viktor victor theo andre andrea').split(' ');
  function firstKey(w) { return fold(w).replace(/[^a-z]/g, ''); }
  const ORG_RX = /\b(stiftung|fondation|fondazione|ag|gmbh|sa|sarl|verein|association|kirchgemeinde|kirche|gemeinde|pfarrei|genossenschaft|firma|verband|cevi|jubla|ywca|ymca|schule|institut|club|klub|bank|versicherung|treuhand|immobilien|stadt)\b/i;
  const CONN = /^(&|\+|und|u\.|et|e)$/i;
  const PARTICLE = /^(von|van|de|der|den|des|del|della|dal|dalla|di|da|du|le|la|zu|vom|zur|ten|ter|dos|das|st\.?)$/i;
  function nameTokens(s) { return str(s).replace(/^(herr|frau|familie|fam\.|hr\.|fr\.|herrn)\s+/i, '').replace(/\s*-\s*/g, '-').split(' ').filter(Boolean); }
  /** Reihenfolge einer Spalte „Name": 'lastFirst' („Muster Hans") oder 'firstLast' („Hans Muster") – nach bekannten Vornamen */
  function guessNameOrder(values, known) {
    let front = 0, back = 0;
    for (const v of values) {
      if (!v || ORG_RX.test(v)) continue;
      const t = nameTokens(v).filter(w => !CONN.test(w)); if (t.length < 2) continue;
      if (known.has(firstKey(t[0]))) front++;
      if (known.has(firstKey(t[t.length - 1]))) back++;
    }
    return front > back ? 'firstLast' : 'lastFirst';
  }
  /** „Muster Hans", „Hans & Anna Muster", „Stiftung XY" → { first, last } bzw. { org } */
  function splitFullName(s, order, known) {
    const t0 = str(s); if (!t0) return {};
    if (ORG_RX.test(t0)) return { org: t0 };
    if (/,/.test(t0)) { const [l, ...f] = t0.split(','); if (str(l) && str(f.join(' '))) return { last: str(l), first: str(f.join(' ')) }; }
    const fam = /^(familie|fam\.)\s+/i.test(t0);
    const tok = nameTokens(t0); if (!tok.length) return {};
    if (fam) return { first: 'Familie', last: tok.join(' ') };
    if (tok.length === 1) return { last: tok[0] };
    const isFirst = (w) => known.has(firstKey(w));
    let ord = order;
    const ci = tok.findIndex(w => CONN.test(w));
    if (ci > 0) ord = ci === 1 ? 'firstLast' : 'lastFirst';   // „Hans & Anna Muster" / „Muster Hans & Anna"
    else if (tok.length === 2) { const a = isFirst(tok[0]), b = isFirst(tok[1]); if (a && !b) ord = 'firstLast'; else if (b && !a) ord = 'lastFirst'; }
    if (ord === 'lastFirst') {
      let k = tok.findIndex((w, i) => i > 0 && !PARTICLE.test(tok[i - 1]) && (isFirst(w) || CONN.test(w)));
      if (ci > 1) k = k < 1 ? ci - 1 : Math.min(k, ci - 1); // das Wort vor „&"/„und" ist ein Vorname
      if (k < 1) k = 1;
      return { last: tok.slice(0, k).join(' '), first: tok.slice(k).join(' ') };
    }
    let k = tok.length - 1;
    while (k > 1 && PARTICLE.test(tok[k - 1])) k--;
    return { first: tok.slice(0, k).join(' '), last: tok.slice(k).join(' ') };
  }

  function headerOk(types) {
    const t = new Set(types.filter(Boolean));
    if ((t.has('first') || t.has('last')) && t.size >= 2) return true;
    return (t.has('name') || t.has('org')) && (t.has('street') || t.has('zip') || t.has('zipTown') || t.has('town'));
  }
  /** Kopfzeile in den ersten 30 Zeilen; auch zweizeilig (z.B. „Name | Vorname | Adresse" über „ | | Strasse | PLZ | Ort") */
  function findHeaderRow(rows) {
    for (let r = 0; r < Math.min(rows.length, 30); r++) {
      const row = rows[r] || [], types = row.map(colType);
      const next = rows[r + 1] || [];
      const len = Math.max(row.length, next.length);
      const merged = Array.from({ length: len }, (_, c) => (colType(next[c]) ? next[c] : colType(row[c]) ? row[c] : null));
      // zweizeilig: die nächste Zeile bringt weitere Spaltentitel (z.B. „Adresse" → „Strasse | PLZ | Ort")
      const adds = next.filter((v, c) => colType(v) && !types[c]).length;
      if (types.some(Boolean) && adds >= 2 && headerOk(merged.map(colType))) return { row: r + 1, header: merged };
      if (headerOk(types)) return { row: r, header: row };
      if (types.some(Boolean) && next.some(v => colType(v)) && headerOk(merged.map(colType))) return { row: r + 1, header: merged };
    }
    return null;
  }

  // PLZ/Ort und Adressen aus einer Zelle lösen
  const ZIP_RX = /^\s*(?:(?:CH|D|DE|A|AT|FL|LI|F|I)\s*[- ]\s*)?(\d{4,5})(?:\.0)?(?:\s+(.*?))?\s*$/i;
  function splitZipTown(v) { const m = ZIP_RX.exec(str(v)); return m ? { zip: m[1], town: (m[2] || '').replace(/^[,\s]+/, '').trim() } : null; }
  /** „Musterweg 12, 3000 Bern" oder mehrzeilig „Hans Muster / Musterweg 12 / 3000 Bern" → { name, street, zip, town } */
  function splitAddress(v) {
    const parts = String(v || '').split(/\r?\n|,|;/).map(x => str(x)).filter(Boolean);
    let i = -1; for (let k = parts.length - 1; k >= 0; k--) { const z = splitZipTown(parts[k]); if (z && z.town) { i = k; break; } }
    if (i < 0) return null;
    const z = splitZipTown(parts[i]);
    return { zip: z.zip, town: z.town, street: i >= 1 ? parts[i - 1] : '', name: i >= 2 ? parts.slice(0, i - 1).join(' ') : '' };
  }
  /** Liste ohne Kopfzeile: Spalten am Inhalt erkennen (PLZ, Strasse mit Nummer, Namen) */
  function inferColumns(rows, known) {
    const sample = rows.slice(0, 300).filter(r => r && r.some(v => str(v)));
    if (sample.length < 2) return null;
    // Etiketten-Liste: ganze Adresse mehrzeilig in einer Zelle („Anna Beispiel / Musterweg 12 / 3000 Bern")
    const isBlock = (v) => v != null && /\n/.test(String(v)) && !!splitAddress(String(v));
    const w0 = Math.max(...sample.map(r => r.length));
    for (let c = 0; c < w0; c++) {
      const vals = sample.map(r => r[c]).filter(v => str(v));
      if (vals.length >= 2 && vals.filter(isBlock).length / vals.length >= 0.6) {
        const start = rows.findIndex(r => r && isBlock(r[c]));
        const header = Array(w0).fill(null); header[c] = 'Name';
        return { row: start - 1, header, inferred: true };
      }
    }
    const width = Math.max(...sample.map(r => r.length));
    const ratio = (c, f) => { let n = 0, k = 0; for (const r of sample) { const v = str(r[c]); if (!v) continue; n++; if (f(v)) k++; } return n >= 2 ? k / n : 0; };
    const filled = (c) => sample.filter(r => str(r[c])).length / sample.length;
    const isZip = v => /^(?:[A-Z]{1,2}[- ])?\d{4,5}(\.0)?$/i.test(v);
    const isZipTown = v => /^(?:[A-Z]{1,2}[- ])?\d{4,5}\s+\D/i.test(v);
    const isStreet = v => /^\D.*\s\d+\s?[a-zA-Z]?$/.test(v) || /^(postfach|case postale)\b/i.test(v);
    const isWordy = v => /^[^\d@]{2,60}$/.test(v);
    const types = Array(width).fill(null);
    for (let c = 0; c < width; c++) {
      if (filled(c) < 0.3) continue;
      if (ratio(c, isZipTown) >= 0.6) types[c] = 'zipTown';
      else if (ratio(c, isZip) >= 0.6) types[c] = 'zip';
      else if (ratio(c, v => v.includes('@')) >= 0.6) types[c] = 'email';
      else if (ratio(c, isStreet) >= 0.5) types[c] = 'street';
    }
    const zc = types.findIndex(t => t === 'zip' || t === 'zipTown'); if (zc < 0) return null;
    if (types[zc] === 'zip' && zc + 1 < width && !types[zc + 1] && ratio(zc + 1, isWordy) >= 0.6) types[zc + 1] = 'town';
    const sc = types.indexOf('street'), limit = sc >= 0 ? sc : zc;
    const textCols = []; for (let c = 0; c < limit; c++) if (!types[c] && filled(c) >= 0.3 && ratio(c, isWordy) >= 0.7) textCols.push(c);
    if (!textCols.length) return null;
    const nameCols = textCols.slice(-2);
    if (nameCols.length === 2) {
      const kf = (c) => ratio(c, v => known.has(firstKey(v.split(' ')[0])));
      const [a, b] = nameCols;
      if (kf(b) > kf(a)) { types[a] = 'last'; types[b] = 'first'; } else { types[a] = 'first'; types[b] = 'last'; }
      if (textCols.length >= 3) types[textCols[textCols.length - 3]] = 'org';
    } else types[nameCols[0]] = 'name';
    const label = { first: 'Vorname', last: 'Nachname', name: 'Name', org: 'Organisation', street: 'Strasse', zip: 'PLZ', zipTown: 'PLZ Ort', town: 'Ort', email: 'E-Mail' };
    const start = rows.findIndex(r => r && (types[zc] === 'zip' ? isZip(str(r[zc])) : isZipTown(str(r[zc]))));
    return start < 0 ? null : { row: start - 1, header: types.map(t => (t ? label[t] : null)), inferred: true };
  }
  const BOOL_RX = /^(ja|nein|yes|no|true|false|wahr|falsch|x|1|0|oui|non|si)$/i;

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
  function parseWorkbookRows(sheets, fileName, cats, opts = {}) {
    const result = { sources: [], overview: null, notes: [] };
    const known = new Set([...COMMON_FIRST, ...(opts.knownFirst || [])].map(firstKey));
    const fileBase = str(fileName).replace(/\.[a-z0-9]+$/i, '');
    const parsed = [];

    for (const sh of sheets) {
      if (SKIP_SHEETS.some(rx => rx.test(sh.name))) continue;
      const rows = sh.rows || [];
      const ov = isOverviewSheet(rows);
      if (ov >= 0) { result.overview = parseOverview(rows, ov, cats); continue; }
      const found = findHeaderRow(rows) || inferColumns(rows, known);
      if (!found) { if (rows.some(r => r && r.some(v => str(v)))) result.notes.push(`Blatt „${sh.name}": keine Adressliste (es fehlen Spalten wie Name, Adresse/Strasse, PLZ, Ort) – nicht verwendet.`); continue; }
      if (found.inferred) result.notes.push(`Blatt „${sh.name}": keine Kopfzeile – Spalten anhand des Inhalts erkannt, bitte kurz prüfen.`);
      const hr = found.row, header = found.header;
      const types = header.map(colType);
      // Ja/Nein-Spalten (z.B. hitobito „Firma") sind keine Namen/Organisationen
      const boolCol = (c) => { let n = 0; for (let r = hr + 1; r < Math.min(rows.length, hr + 60); r++) { const v = str((rows[r] || [])[c]); if (v) { n++; if (!BOOL_RX.test(v)) return false; } } return n > 0; };
      types.forEach((t, c) => { if (['org', 'name', 'careOf', 'first', 'last'].includes(t) && boolCol(c)) types[c] = null; });
      const isFlat = types.includes('category') || types.includes('roles');
      // Blöcke: jede Wiederholung von "Organisation" (bzw. "Vorname") startet einen neuen Block
      const anchorType = types.includes('org') ? 'org' : types.includes('first') ? 'first' : types.includes('name') ? 'name' : 'last';
      const starts = types.map((t, i) => (t === anchorType ? i : -1)).filter(i => i >= 0);
      const blocks = starts.map((s, k) => ({ start: k === 0 ? 0 : s, end: k + 1 < starts.length ? starts[k + 1] : header.length }));
      parsed.push({ sh, rows, hr, header, types, isFlat, blocks });
    }

    // Vornamen aus Blättern mit eigener Vorname-Spalte → helfen beim Aufteilen einer Spalte „Name"
    for (const p of parsed) { const fi = p.types.indexOf('first'); if (fi >= 0) for (let r = p.hr + 1; r < p.rows.length; r++) { const v = str((p.rows[r] || [])[fi]).split(' ')[0]; if (v) known.add(firstKey(v)); } }
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
        const fullOnly = map.name !== undefined && map.first === undefined && map.last === undefined;
        const nameOrder = fullOnly ? guessNameOrder(rows.slice(hr + 1).map(row => str((row || [])[map.name])), known) : '';
        for (let r = hr + 1; r < rows.length; r++) {
          let row = rows[r] || [];
          const get = (t) => (map[t] === undefined ? '' : str(row[map[t]]));
          const e = {
            org: get('org'), first: get('first'), last: get('last'), nick: get('nick'), email: get('email').toLowerCase(),
            street: get('street'), nr: get('nr'), careOf: get('careOf'), zip: get('zip'), town: get('town'), country: get('country'),
            owner: normOwner(get('owner')), extra: get('extra'),
            done: map.done !== undefined && row[map.done] === true,
            group: src.group, catId: src.catId, rowNo: r + 1,
          };
          // PLZ und Ort in einer Zelle, Länderkürzel, ganze Adresse in der Strassenspalte
          const zt = get('zipTown');
          if (zt && !e.zip) { const z = splitZipTown(zt); if (z) { e.zip = z.zip; if (!e.town) e.town = z.town; } else if (!e.town) e.town = zt; }
          if (e.zip && !e.town) { const z = splitZipTown(e.zip); if (z && z.town) { e.zip = z.zip; e.town = z.town; } }
          if (!e.zip && e.town) { const z = splitZipTown(e.town); if (z && z.town) { e.zip = z.zip; e.town = z.town; } }
          if (e.zip) { const z = splitZipTown(e.zip); if (z) e.zip = z.zip; }
          const raw = (t) => (map[t] === undefined || row[map[t]] == null ? '' : String(row[map[t]]));
          if (e.street && !e.zip) { const a = splitAddress(raw('street')); if (a) { e.street = a.street || e.street; e.zip = a.zip; e.town = e.town || a.town; } }
          if (map.name !== undefined && !e.street && !e.zip && /\n/.test(raw('name'))) { const a = splitAddress(String(row[map.name])); if (a) { e.street = a.street; e.zip = a.zip; e.town = a.town; row = [...row]; row[map.name] = a.name; } }
          if (map.name !== undefined) {
            if (fullOnly) { const n = splitFullName(get('name'), nameOrder, known); if (n.org && !e.org) e.org = n.org; if (n.first) e.first = n.first; if (n.last) e.last = n.last; }
            else if (!e.last && map.last === undefined) e.last = get('name'); // „Vorname" + „Name" = Nachname
          }
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
  function entriesFromGroups(pages, source) {
    const out = [], seen = new Set();
    for (const p of pages) for (const g of p.data || []) {
      if (g.type !== 'groups' || seen.has(g.id)) continue; seen.add(g.id);
      const a = g.attributes || {};
      const lines = str(a.address).split(/\n|\r/).map(str).filter(Boolean);
      let street = str(a.street) || lines[0] || '', nr = str(a.housenumber);
      if (!nr && street) { const m = street.match(/^(.*\D)\s+(\d+\s?[a-zA-Z]?)$/); if (m) { street = m[1].trim(); nr = m[2]; } }
      out.push({ org: str(a.display_name || a.name), first: '', last: '', nick: '', email: str(a.email).toLowerCase(), street, nr, careOf: '',
        zip: str(a.zip_code), town: str(a.town), country: str(a.country), owner: normOwner(source.owner), extra: '', done: false,
        group: source.label, catId: source.catId || '', roles: 'Organisation', dbGroupId: String(g.id), groupId: String(g.id), rowNo: null });
    }
    return out;
  }
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
        dbPersonId: pid, groupId: gid, rowNo: null,
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
    const groupPersonCache = new Map();
    const groupPersons = (e) => {
      const c = catById[e.catId]; if (!c || !c.groups) return [];
      const gk = groupKey(c.name, e.group); if (!gk) return [];
      const ck = e.catId + '|' + gk;
      if (!groupPersonCache.has(ck)) {
        // eigene Zuständige, sonst von der Obergruppe erben (z.B. SAJV → Partner & Politik)
        let cur = gk, list = [], guard = 0;
        while (cur && guard++ < 15) {
          list = [...new Set(groupPersonLabels(c, cur).map(l => aliasOf(l)).filter(Boolean))];
          if (list.length) break;
          cur = c.groups[cur] && c.groups[cur].parentGk;
        }
        groupPersonCache.set(ck, list);
      }
      return groupPersonCache.get(ck);
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
    // 3b) Organisation aus der Cevi DB (Adresse der Gruppe) ↔ Excel-Eintrag derselben Organisation + PLZ.
    //     Nur bei genau einem passenden Eintrag automatisch; mehrere (z.B. verschiedene Teams) → zur Prüfung.
    for (const [, idx] of by(e => !isPersonal(e) && e.org && e.zip ? 'orgzip#' + key(e.org) + '#' + key(e.zip) : '')) {
      const dbOrgs = idx.filter(i => entries[i].dbGroupId), others = idx.filter(i => !entries[i].dbGroupId);
      for (let k = 1; k < dbOrgs.length; k++) union(dbOrgs[0], dbOrgs[k], 'Organisation + PLZ');
      if (!dbOrgs.length) continue;
      if (others.length === 1) union(dbOrgs[0], others[0], 'Organisation + PLZ');
      else if (others.length > 1) possible.push({ idx: [dbOrgs[0], ...others], why: 'Gleiche Organisation und PLZ – mehrere Einträge' });
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
      // von Hand festgelegte Zuständigkeit (Person von Hand angelegt) gilt vor Untergruppe und Kategorie
      const effOwner = (e) => (e.fixedOwner && aliasOf(e.owner)) || groupPersons(e)[0] || aliasOf(e.owner) || catPersons(e.catId)[0] || '';
      const extraOwners = (e) => { const gp = groupPersons(e); if (gp.length) return { list: gp.slice(1), via: ' (Untergruppe)' }; return aliasOf(e.owner) ? { list: [], via: '' } : { list: catPersons(e.catId).slice(1), via: ' (Kategorie)' }; };
      const selfName = isPersonal(best) ? fold(best.first.split(' ')[0] + ' ' + best.last) : '';
      const isSelf = (o) => !!(o && selfName && codeNames[o] && fold(codeNames[o]) === selfName);
      const ranked = es.slice().sort((a, b) => (isSelf(effOwner(a)) - isSelf(effOwner(b))) || ((b.fixedOwner ? 1 : 0) - (a.fixedOwner ? 1 : 0)) || ((effOwner(a) ? 0 : 1) - (effOwner(b) ? 0 : 1)) || (prio(a.catId) - prio(b.catId)) || ((b.owner ? 1 : 0) - (a.owner ? 1 : 0)));
      let primary = ranked[0];
      let owner = effOwner(primary);
      const suggested = owner;
      const selfNotes = [];
      // Alle, die als Hauptverantwortung in Frage kommen (Zuständige der Listen + Spalte „Zus. Unterschriften")
      const candidates = [];
      const addCand = (o, via) => { if (!o) return; let c = candidates.find(x => x.owner === o); if (!c) { c = { owner: o, via: [], self: isSelf(o) }; candidates.push(c); } if (via && !c.via.includes(via)) c.via.push(via); };
      const labelOf = (e) => ((catById[e.catId] || {}).name || 'ohne Kategorie') + (e.group && e.group !== (catById[e.catId] || {}).name ? ' › ' + e.group : '');
      for (const e of ranked) { addCand(effOwner(e), labelOf(e)); const x = extraOwners(e); for (const o of x.list) addCand(o, labelOf(e) + x.via); }
      for (const e of ranked) if (e.extra) for (const part of splitOwners(e.extra)) addCand(aliasOf(part), 'Zus. Unterschrift bei ' + labelOf(e));
      let overridden = false;
      if (overrides[pKey]) { owner = overrides[pKey]; overridden = true; const m = es.find(e => effOwner(e) === owner); if (m) primary = m; }
      const coSigners = [];
      const addCo = (o, via) => { if (!o || o === owner) return; if (isSelf(o)) { if (!selfNotes.length) selfNotes.push(o + ' ist die Person selbst – unterschreibt nicht'); return; } let c = coSigners.find(x => x.owner === o); if (!c) { c = { owner: o, via: [] }; coSigners.push(c); } if (via && !c.via.includes(via)) c.via.push(via); };
      for (const e of ranked) {
        const label = ((catById[e.catId] || {}).name || 'ohne Kategorie') + (e.group && e.group !== (catById[e.catId] || {}).name ? ' › ' + e.group : '');
        addCo(effOwner(e), label);
        { const x = extraOwners(e); for (const o of x.list) addCo(o, label + (x.via === ' (Untergruppe)' ? ' (weitere Zuständige der Untergruppe)' : ' (weitere Zuständige der Kategorie)')); }
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
        if (e.mid) m.mid = e.mid; // von Hand erfasst → lässt sich in der Masterliste löschen
        if (!memberships.some(x => x.cat === m.cat && x.group === m.group && x.owner === m.owner && !m.mid)) memberships.push(m);
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
    for (const c of cats) { for (const p of catPersonLabels(c)) labels.add(str(p)); for (const g of Object.values(c.groups || {})) for (const p of (g && g.persons) || []) labels.add(str(p)); }
    const staff = entries.filter(e => e.catId === 'cevi-schweiz' && e.first && isPersonal(e));
    const codeNames = {}, labelToCode = {}, byFirst = new Map();
    for (const e of staff) {
      const code = makeCode(e.first, e.last);
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


  // ---------------------------------------------------------------------------
  // Gemeinsamer Stand: Drei-Wege-Zusammenführung (Microsoft 365 / SharePoint)
  // ---------------------------------------------------------------------------
  const J = (x) => JSON.stringify(x === undefined ? null : x);
  const isObj = (x) => !!x && typeof x === 'object' && !Array.isArray(x);
  const keyedArr = (a) => Array.isArray(a) && a.length > 0 && a.every(x => isObj(x) && x.id !== undefined && x.id !== null);
  /** Drei-Wege-Zusammenführung: base = letzter gemeinsamer Stand, l = meine Änderungen, r = Änderungen der anderen */
  function merge3(b, l, r) {
    if (J(l) === J(b)) return r;
    if (J(r) === J(b)) return l;
    if (J(l) === J(r)) return l;
    if (isObj(l) && isObj(r)) {
      const bb = isObj(b) ? b : {}, out = {};
      for (const k of new Set([...Object.keys(bb), ...Object.keys(l), ...Object.keys(r)])) {
        const inL = k in l, inR = k in r, inB = k in bb;
        if (!inL && inB && J(r[k]) === J(bb[k])) continue;   // bei mir gelöscht
        if (!inR && inB && J(l[k]) === J(bb[k])) continue;   // bei anderen gelöscht
        if (!inL) { out[k] = r[k]; continue; }
        if (!inR) { out[k] = l[k]; continue; }
        out[k] = merge3(bb[k], l[k], r[k]);
      }
      return out;
    }
    if (Array.isArray(l) && Array.isArray(r) && (keyedArr(l) || keyedArr(r))) {
      const toMap = (a) => new Map((Array.isArray(a) ? a : []).filter(isObj).map(x => [String(x.id), x]));
      const mb = toMap(b), ml = toMap(l), mr = toMap(r), out = [];
      for (const id of [...ml.keys(), ...[...mr.keys()].filter(i => !ml.has(i))]) {
        const inL = ml.has(id), inR = mr.has(id), inB = mb.has(id);
        if (!inL && inB && J(mr.get(id)) === J(mb.get(id))) continue;
        if (!inR && inB && J(ml.get(id)) === J(mb.get(id))) continue;
        out.push(!inL ? mr.get(id) : !inR ? ml.get(id) : merge3(mb.get(id), ml.get(id), mr.get(id)));
      }
      return out;
    }
    return l; // beide haben denselben Wert verschieden geändert → die eigene Änderung gilt
  }

  const api = { DEFAULT_CATEGORIES, detectCategory, parseWorkbookRows, splitFullName, guessNameOrder, applyOverview, buildPeople, entriesFromJsonApi, entriesFromGroups, deriveAliases, splitOwners, catPersonLabels, groupKey, groupPersonLabels, subgroupTree, merge3, J, makeCode, codeVariants, fold, key, normOwner, identity, pairKey, str };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.WB = api;
})(typeof window !== 'undefined' ? window : globalThis);
