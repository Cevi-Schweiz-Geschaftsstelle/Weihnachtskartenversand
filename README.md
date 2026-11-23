# Weihnachtskartenversand

Ein Tool für den Versand der Weihnachtsbriefe. Es führt die Adresslisten aller Bereiche zusammen, erkennt Personen, die mehrfach vorkommen, und verteilt die Briefe auf die Zuständigen. Wer zusätzlich unterschreiben muss, ist jeweils vermerkt.

**Online öffnen:** <https://fabulousteaching.github.io/Weihnachtskartenversand/>
**Offline:** `index.html` herunterladen und per Doppelklick im Browser öffnen.

Das Tool ist eine einzelne HTML-Datei. Die Adressdaten werden nur im eigenen Browser verarbeitet und dort zwischengespeichert. Es wird nichts hochgeladen, auch nicht bei der Online-Version.

## Ablauf

1. **Zuständigkeit:**
   - Zuständige Personen mit Vorname und Nachname erfassen. Das **Kürzel entsteht automatisch** aus dem 1. Buchstaben des Vornamens und dem 1. und 2. Buchstaben des Nachnamens (z.B. Anna Beispiel → ABE). Ist es schon vergeben, nimmt das Tool die nächste Variante. Von Hand überschreiben ist möglich.
   - Nach dem Excel-Import schlägt das Tool die Personen vor, die es in den Listen findet. Mit ✕ lässt sich ein Vorschlag ausblenden.
   - Nach **„Erfassen"** öffnet sich ein Fenster: die Kategorien und Untergruppen anhaken, zu denen die Person gehört, dann **„Fertig"**. Später lässt sich das in der Personen-Tabelle über **„✎ Kategorien"** ändern.
   - Personen den Kategorien zuordnen, auch mehrere pro Kategorie. **★** versendet, alle weiteren unterschreiben mit.
   - **Untergruppen** (z.B. Fachgruppen › Informatik, Projektgruppen › Konekta 26) haben eigene Zuständige.
     - Die Untergruppen erscheinen nach dem Excel-Import automatisch und lassen sich auch von Hand anlegen.
     - Was bei einer Untergruppe eingetragen ist, gilt vor der Spalte „Zuständigkeit" in der Excel. Diese gilt vor der Kategorie.
     - Mit „übernehmen" bzw. „Alle aus Excel übernehmen" wird die Zuständigkeit aus der Excel fest eingetragen.
     - Untergruppen aus Excel und Cevi DB werden zusammengeführt („Informatik" = „Fachgruppe Informatik").
     - **Jede Ebene wird einzeln ausgewiesen**, z.B. Ausschüsse › Partner & Politik › ↳ SAJV. Ist bei einer tieferen Untergruppe niemand eingetragen, **erbt** sie die Zuständigkeit der Obergruppe.
   - Die Reihenfolge der Kategorien (▲▼) bestimmt den Vorschlag, wenn jemand in mehreren Kategorien vorkommt.
2. **Excel importieren:** Die Adressliste ins Fenster ziehen.
   - Jedes Blatt bzw. jeder Block (z.B. „CCH › Vorstand") wird automatisch einer Kategorie zugeordnet.
   - Das Blatt „Überblick" liefert die Hauptzuständigkeiten. Die Sammelliste („Masterliste") wird ignoriert, damit nichts doppelt gezählt wird.
3. **Zuteilen:**
   - Für Personen in mehreren Listen wählt man per Klick die Hauptverantwortung. Die anderen unterschreiben automatisch mit.
   - Adressen ohne Zuständigkeit lassen sich frei zuweisen.
4. **Duplikate:** Unsichere Fälle bestätigen oder ablehnen, z.B. gleicher Name mit anderer PLZ oder ein Tippfehler im Vornamen.
5. **Pro Zuständige\*r:** Jede Person sieht ihre Briefe und wo sie mitunterschreibt. Hier gibt es Erledigt-Häkchen, Drucken und den Export.
6. **Export Excel:** Masterliste, ein Blatt pro zuständiger Person und eine Duplikat-Übersicht. Geeignet als Quelle für einen Serienbrief in Word.

**Einstellungen speichern/laden** (Tab Zuständigkeit → Daten): Damit lassen sich Zuständige, Kategorien und Zuteilungen auf einen anderen Computer oder von der Offline- in die Online-Version übertragen. Die Datei enthält Namen und gehört **nicht** in dieses Repository.

## Liste aktualisieren

Eine neue Version ersetzt die alte. Wer auf der neuen Liste nicht mehr steht, fällt raus.

- **Excel:** Ersetzt werden alle Listen mit gleichem Datei- oder Blattnamen (z.B. 2026 statt 2025).
  - Eine Datei mit nur einem Blatt ersetzt nur dieses Blatt.
- **Cevi DB:** Jeder Refresh lädt die DB-Daten komplett neu.
- Nach jeder Aktualisierung erscheint eine kurze Meldung mit Zahlen (z.B. „32 weggefallen, 3 neu“), ohne Namenslisten.
- Entscheide aus „Zuteilen" bleiben bei einer neuen Version erhalten.

## Cevi DB anbinden (Live-Daten statt Excel)

Die Cevi DB läuft auf [hitobito](https://github.com/hitobito/hitobito). Das Tool liest über deren JSON:API, nur lesend:

| Abfrage | Zweck |
|---|---|
| `GET /api/roles?filter[group_id]=…&include=person,group` | Mitglieder einer Gruppe inkl. Adresse |
| `GET /api/groups?filter[parent_id]=…` | Untergruppen |
| `GET /api/groups/:id` | Verbindungstest |

Einrichten:
1. In der Cevi DB bei der Gruppe Cevi Schweiz → Tab **API-Keys** → neuer Key.
   - Berechtigung: *Leserechte auf dieser Ebene* (oder *… und darunterliegenden Ebenen*).
   - Zugriffsbereich: **Personen** und **Gruppen**.
2. Im selben Formular unter **Hosts mit API-Zugriff** eintragen: `https://fabulousteaching.github.io`
3. Im Tool im Tab **Cevi DB** den Key einfügen.
4. **Gruppen automatisch übernehmen:**
   - Die Gruppe „Cevi Schweiz" eintragen (Nummer oder Link) und auf **„Gruppen lesen"** klicken.
   - Das Tool liest alle Gruppen dieser Ebene und schlägt pro Gruppe die Kategorie vor. Grundlage sind Gruppentyp (Vorstand, Geschäftsstelle, Spender …) und Name.
   - Gruppen mit Untergruppen (z.B. Fachgruppen) werden als Untergruppen der Kategorie eingerichtet.
   - Vorschlag prüfen, dann **„Übernehmen und Daten laden"**.
   - **„Nur diese Gruppen übernehmen":** eine Liste, eine Gruppe pro Zeile. Vorgabe: Geschäftsstelle, Ausschüsse, Fachgruppen, Projektgruppen, Kommissionen, Krisenmanagement › Cevi CH, Ehrenmitglieder, PSA, Mitgliederorganisationen (MIO).
     - Alle anderen Gruppen werden ignoriert und im Vorschlag nur aufgelistet.
     - Leichte Namensabweichungen werden erkannt (z.B. „Krisenteam" für Krisenmanagement, „PSA Cevi Schweiz" für PSA).
     - **Nur eine Untergruppe:** `Gruppe › Untergruppe`, z.B. `Krisenmanagement › Cevi CH`. Dann wird nur diese Untergruppe geladen, ohne die Obergruppe und ohne die übrigen Untergruppen. „CH" findet auch „Schweiz". Statt `›` geht auch `>` oder `/`.
     - Nicht gefundene Einträge werden gemeldet, bei Untergruppen mit der Liste der vorhandenen.
     - Bleibt die Liste leer, schlägt das Tool alle Gruppen vor.
   - **„Immer ausschliessen":** Wortteile im Gruppennamen, Vorgabe „Ehemalige".
     - Solche Gruppen werden nie übernommen, auch nicht als Untergruppe, z.B. „Ehemalige Fachgruppen" oder „Ehemalige Ausschüsse".
     - Bereits übernommene werden beim nächsten Aktualisieren entfernt.
   - **Mitgliederorganisationen (MIO)** sind eigene Ebenen mit vielen Mitgliedern. Übernommen wird darum nur die **Adresse der Organisation** (ein Brief pro Organisation), nicht deren Mitglieder. Stimmen Organisation und PLZ mit genau einem Excel-Eintrag überein, ist das ein Brief.
5. Später genügt **„↻ Aus Cevi DB aktualisieren"**.

Ohne Eintrag bei „Hosts mit API-Zugriff" (z.B. Datei per Doppelklick geöffnet) gibt es eine Alternative: `python3 start-tool.py` startet das Tool unter `http://localhost:8765` und leitet die Abfragen lokal weiter.

Der API-Key gibt Lesezugriff auf Personendaten. Er gehört nie ins Repository oder in einen Chat. Das Tool speichert ihn ab Werk nicht. Nach dem Versand den Key in der Cevi DB löschen.

## Datenschutz

- In dieses Repository gehören **keine** Adresslisten, Einstellungs-Dateien oder API-Keys. `.gitignore` blockiert Excel-, CSV- und Einstellungs-Dateien.
- Im Code stehen bewusst keine Personennamen. Zuständige werden im Tool erfasst.

## Entwicklung

```
src/app.html        Oberfläche (HTML/CSS/JS)
src/core.js         Logik: Einlesen, Kategorien, Duplikate, Zuteilung
vendor/             SheetJS (Excel lesen/schreiben, Apache-2.0)
build.py            baut daraus index.html (eine Datei, läuft offline)
start-tool.py       lokaler Start mit Weiterleitung zur Cevi DB
tests/test_core.js  Schnelltest der Logik mit erfundenen Daten
```

Nach Änderungen in `src/`:

```bash
python3 build.py
```

```bash
node tests/test_core.js
```
