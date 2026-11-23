# Weihnachtskartenversand

Ein Tool für den Versand der Weihnachtsbriefe. Es führt die Adresslisten aller Bereiche zusammen, erkennt Personen, die mehrfach vorkommen, und verteilt die Briefe auf die Zuständigen. Wer zusätzlich unterschreiben muss, ist jeweils vermerkt.

**Online öffnen:** <https://fabulousteaching.github.io/Weihnachtskartenversand/>
**Offline:** `index.html` herunterladen und per Doppelklick im Browser öffnen.

Das Tool ist eine einzelne HTML-Datei. Die Adressdaten werden nur im eigenen Browser verarbeitet und dort zwischengespeichert. Es wird nichts hochgeladen, auch nicht bei der Online-Version.

## Ablauf

1. **Zuständigkeit:**
   - Zuständige Personen mit Vorname und Nachname erfassen. Das **Kürzel entsteht automatisch** aus dem 1. Buchstaben des Vornamens und dem 1. und 2. Buchstaben des Nachnamens (z.B. Anna Beispiel → ABE). Ist es schon vergeben, nimmt das Tool die nächste Variante. Von Hand überschreiben ist möglich.
   - In der Spalte **„Auch genannt"** stehen weitere Kürzel oder Namen, unter denen die Person in den Listen vorkommt. Steht dort z.B. „GL", gehen alle GL-Briefe an diese Person.
   - Nach dem Excel-Import schlägt das Tool die Personen vor, die es in den Listen findet. Mit ✕ lässt sich ein Vorschlag ausblenden.
   - Personen den Kategorien zuordnen, auch mehrere pro Kategorie. **★** versendet, alle weiteren unterschreiben mit.
   - Die Reihenfolge der Kategorien (▲▼) bestimmt den Vorschlag, wenn jemand in mehreren Kategorien vorkommt.
2. **Excel importieren:** Die Adressliste ins Fenster ziehen.
   - Jedes Blatt bzw. jeder Block (z.B. „CCH › Vorstand") wird automatisch einer Kategorie zugeordnet.
   - Das Blatt „Überblick" liefert die Hauptzuständigkeiten. Die Sammelliste („Masterliste") wird ignoriert, damit nichts doppelt gezählt wird.
3. **Zuteilen:**
   - Für Personen in mehreren Listen wählt man per Klick die Hauptverantwortung. Die anderen unterschreiben automatisch mit.
   - Adressen ohne Zuständigkeit lassen sich frei zuweisen.
4. **Duplikate prüfen:** Unsichere Fälle bestätigen oder ablehnen, z.B. gleicher Name mit anderer PLZ oder ein Tippfehler im Vornamen.
5. **Pro Zuständige\*r:** Jede Person sieht ihre Briefe und wo sie mitunterschreibt. Hier gibt es Erledigt-Häkchen, Drucken und den Export.
6. **Export Excel:** Masterliste, ein Blatt pro zuständiger Person und eine Duplikat-Übersicht. Geeignet als Quelle für einen Serienbrief in Word.

**Einstellungen speichern/laden** (Tab Zuständigkeit → Daten): Damit lassen sich Zuständige, Kategorien und Zuteilungen auf einen anderen Computer oder von der Offline- in die Online-Version übertragen. Die Datei enthält Namen und gehört **nicht** in dieses Repository.

## Liste aktualisieren

Eine neue Version ersetzt die alte. Wer auf der neuen Liste nicht mehr steht, fällt raus.

- **Excel:** Ersetzt werden alle Listen mit gleichem Datei- oder Blattnamen (z.B. 2026 statt 2025).
  - Eine Datei mit nur einem Blatt ersetzt nur dieses Blatt.
- **Cevi DB:** Jeder Refresh lädt die DB-Daten komplett neu.
- **Änderungsbericht:** Nach jeder Aktualisierung zeigt er, wer weggefallen, neu dazugekommen oder umgezogen ist und bei wem jetzt jemand anderes versendet. Mit **Rückgängig** geht es zurück.
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
3. Im Tool → Tab **Cevi DB**: Key einfügen, Gruppen-IDs oder -Links eintragen, „Jetzt aktualisieren".

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
