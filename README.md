# Weihnachtskartenversand

Ein Tool für den Versand der Weihnachtsbriefe. Es führt die Adresslisten aller Bereiche zusammen, erkennt Personen, die mehrfach vorkommen, und verteilt die Briefe auf die Zuständigen. Wer zusätzlich unterschreiben muss, ist jeweils vermerkt.

**Online öffnen:** <https://fabulousteaching.github.io/Weihnachtskartenversand/>
**Offline:** `index.html` herunterladen und per Doppelklick im Browser öffnen.

Das Tool ist eine einzelne HTML-Datei. Die Adressdaten werden nur im eigenen Browser verarbeitet und dort zwischengespeichert. Es wird nichts hochgeladen, auch nicht bei der Online-Version.

## Ablauf

1. **Zuständigkeit:** Hier werden die zuständigen Personen erfasst.
   - Vorname und Nachname eintragen. Das **Kürzel entsteht automatisch** aus dem 1. Buchstaben des Vornamens und dem 1. und 2. Buchstaben des Nachnamens (z.B. Anna Beispiel → ABE). Ist es schon vergeben, nimmt das Tool die nächste Variante. Von Hand überschreiben ist möglich.
   - Nach dem Excel-Import schlägt das Tool die Personen vor, die es in den Listen findet. Mit ✕ lässt sich ein Vorschlag ausblenden.
   - Nach **„Erfassen"** öffnet sich ein Fenster: die Kategorien und Untergruppen anhaken, zu denen die Person gehört, dann **„Fertig"**. Später lässt sich das in der Personen-Tabelle über **„✎ Kategorien"** ändern.
   - Rechts: die importierten Listen.
2. **Kategorien** (eigener Reiter neben Zuständigkeit):
   - **„＋ Neue Kategorie"** steht zuoberst. Neue Kategorien kommen ans Ende der Liste und lassen sich mit ▲ nach oben schieben.
   - Personen den Kategorien zuordnen, auch mehrere pro Kategorie. **★** versendet, alle weiteren unterschreiben mit.
   - **Hellgrün** sind die Kategorien, deren Adressen aus der Cevi DB kommen (Etikett „● Cevi DB", bzw. „● Cevi DB + Excel", wenn zusätzlich Excel-Listen dazugehören).
   - **Kategorien mit Untergruppen** (z.B. Fachgruppen, Projektgruppen) sind ein **aufklappbares Menü**: Klick auf den Namen zeigt die Untergruppen, und dort wird pro Untergruppe festgelegt, wer zuständig ist. Zugeklappt zeigt die Zeile, wie viele Untergruppen schon jemanden haben. Umbenennen mit ✎.
   - **Untergruppen** (z.B. Fachgruppen › Informatik, Projektgruppen › Konekta 26) haben eigene Zuständige.
     - Die Untergruppen erscheinen nach dem Excel-Import bzw. dem Laden aus der Cevi DB automatisch und lassen sich auch von Hand anlegen.
     - Was bei einer Untergruppe eingetragen ist, gilt vor der Spalte „Zuständigkeit" in der Excel. Diese gilt vor der Kategorie.
     - Mit „übernehmen" bzw. „Alle aus Excel übernehmen" wird die Zuständigkeit aus der Excel fest eingetragen.
     - Untergruppen aus Excel und Cevi DB werden zusammengeführt („Informatik" = „Fachgruppe Informatik").
     - **Jede Ebene wird einzeln ausgewiesen**, z.B. Ausschüsse › Partner & Politik › ↳ SAJV. Ist bei einer tieferen Untergruppe niemand eingetragen, **erbt** sie die Zuständigkeit der Obergruppe.
     - **„✕ entfernen"** nimmt eine Untergruppe heraus, die nicht mehr gebraucht wird (z.B. ein vergangenes Lager). Ihre Adressen fallen weg, sofern sie nicht noch in einer anderen Liste stehen. Bei jedem weiteren Import aus der Cevi DB oder aus Excel wird sie ignoriert. Mit **↺** lässt sie sich wiederherstellen.
   - Die Reihenfolge der Kategorien (▲▼) bestimmt den Vorschlag, wenn jemand in mehreren Kategorien vorkommt.
3. **Excel importieren:** Die Adressliste ins Fenster ziehen oder **☰ Menü → „Aus Excel importieren"**.
   - Jedes Blatt bzw. jeder Block (z.B. „CCH › Vorstand") wird automatisch einer Kategorie zugeordnet.
   - Das Blatt „Überblick" liefert die Hauptzuständigkeiten. Die Sammelliste („Masterliste") wird ignoriert, damit nichts doppelt gezählt wird.
4. **Unvollständig:** Alles, was noch eine Entscheidung braucht, in einem Reiter. Die Zahl am Reiter zeigt, wie viel noch offen ist.
   - **Mögliche Duplikate prüfen:** Unsichere Fälle bestätigen oder ablehnen, z.B. gleicher Name mit anderer PLZ oder ein Tippfehler im Vornamen.
   - **Ohne Zuständigkeit:** Diese Adressen lassen sich frei zuweisen.
   - **Mehrfach gelistet:** Für Personen in mehreren Listen wählt man per Klick die Hauptverantwortung. Die anderen unterschreiben automatisch mit.
   - **Automatisch zusammengeführt** (aufklappbar): Alle Personen, die das Tool selbst zusammengeführt hat. Bei einem Fehler „Trennen".
5. **Pro Zuständige\*r:** Jede Person sieht ihre Briefe und wo sie mitunterschreibt. Hier gibt es Erledigt-Häkchen, Drucken und den Export.
   - **🏷 Etiketten:** Alle Adressen der gewählten Person auf A4-Etikettenbögen drucken.
     - Bögen: Avery Zweckform 3475, 3474, 3422, L7160, L7163 oder eigene Masse.
     - Sortiert nach Name oder PLZ, optional nur nicht erledigte.
     - Startposition für angebrauchte Bögen, Probedruck mit Rahmen, Vorschau.
     - Im Druckfenster Skalierung 100 % und Ränder „Keine" wählen.
6. **Excel exportieren** (☰ Menü): Masterliste, ein Blatt pro zuständiger Person und eine Duplikat-Übersicht. Geeignet als Quelle für einen Serienbrief in Word.

**Oben rechts:**
- **↻ Aktualisieren:** gleicht sofort mit allen ab und lädt die Cevi DB neu, falls ein Key da ist. Beim ersten Mal öffnet er die Microsoft-Anmeldung.
- **☰ Menü:** Aus Excel importieren · Excel exportieren · Zurücksetzen (Erledigt-Häkchen, Zuteilungen & Duplikat-Entscheide, alle Daten auf diesem Computer)

Jede Änderung wird **automatisch gespeichert**, ohne Knopf. „Erledigt“-Häkchen aus den Excel-Listen werden immer übernommen.

## Mit allen abgleichen (Microsoft 365)

Der Stand des Tools liegt in einer SharePoint-Website von Cevi statt nur im eigenen Browser. Dazu gehören Listen, Zuständige, Kategorien, Zuteilungen, Duplikat-Entscheide und Erledigt-Häkchen.

Der Knopf **„↻ Aktualisieren“** oben rechts gleicht sofort ab: Er sendet die eigenen Änderungen und holt den Stand aller. Ohne Anmeldung öffnet er zuerst die Microsoft-Anmeldung. Ist er orange, braucht es eine Anmeldung oder der Abgleich ist gestört (Hinweis beim Darüberfahren).

- Jede Person meldet sich mit ihrem **eigenen Cevi-Microsoft-Konto** an.
- Alle Mitglieder der Website sehen denselben Stand. Änderungen erscheinen bei den anderen nach etwa 20 Sekunden.
- **Gleichzeitige Änderungen** werden zusammengeführt. Haben zwei Personen denselben Wert verschieden geändert, gilt die zuletzt gespeicherte Änderung.
- Der **API-Key der Cevi DB** ist nicht im gemeinsamen Stand. Wer aus der DB aktualisiert, speichert die Daten für alle. Alle anderen brauchen keinen Key.
- **Key für Berechtigte** (zuunterst im Reiter Cevi DB, zugeklappt): Der Key kann in einem eigenen Ordner `Weihnachtsbrief-Tool-Schluessel` liegen, dessen Zugriff in SharePoint auf wenige Personen eingeschränkt ist. Wer Zugriff hat, bekommt den Key nach der Microsoft-Anmeldung automatisch, nur im Speicher des Browsers. Einrichten:
  1. Key oben eintragen.
  2. „Schlüssel-Ordner in SharePoint anlegen“.
  3. In SharePoint die Vererbung der Berechtigungen beenden, Mitglieder und Besucher entfernen, nur die Berechtigten hinzufügen.
  4. Bestätigen und „Key im Schlüssel-Ordner speichern“.
- Gespeichert wird die Datei `Weihnachtsbrief-Tool/zustand.json` in der Standard-Dokumentbibliothek der Website.

**Einrichtung durch die IT:**
- SharePoint-Website anlegen.
- App-Registrierung in Entra ID:
  - Single-Page-Anwendung,
  - Umleitungs-URI `https://fabulousteaching.github.io/Weihnachtskartenversand/auth.html`,
  - delegierte Graph-Berechtigungen `User.Read` und `Sites.ReadWrite.All`,
  - Administratorzustimmung.
- Zurückmelden: Tenant-ID, Client-ID und die Adresse der Website. Sie sind in `src/app.html` (`M365_DEFAULTS`) fest hinterlegt. Niemand muss etwas eintragen: Beim ersten Öffnen meldet man sich einmal mit dem Cevi-Konto an, danach läuft der Abgleich automatisch.

Ohne diese Einrichtung arbeitet das Tool wie bisher nur auf dem eigenen Computer.

## Liste aktualisieren

Eine neue Version ersetzt die alte. Wer auf der neuen Liste nicht mehr steht, fällt raus.

- **Excel:** Ersetzt werden alle Listen mit gleichem Datei- oder Blattnamen (z.B. 2026 statt 2025).
  - Eine Datei mit nur einem Blatt ersetzt nur dieses Blatt.
- **Cevi DB:** Jeder Refresh lädt die DB-Daten komplett neu.
- Nach jeder Aktualisierung erscheint eine kurze Meldung mit Zahlen (z.B. „32 weggefallen, 3 neu“), ohne Namenslisten.
- Entscheide aus „Unvollständig" bleiben bei einer neuen Version erhalten.

## Cevi DB anbinden (Live-Daten statt Excel)

Die Cevi DB läuft auf [hitobito](https://github.com/hitobito/hitobito). Das Tool liest über deren JSON:API, nur lesend:

| Abfrage | Zweck |
|---|---|
| `GET /api/roles?filter[group_id]=…&include=person,group` | Mitglieder einer Gruppe inkl. Adresse |
| `GET /api/groups?filter[parent_id]=…` | Untergruppen |
| `GET /api/groups/:id` | Gruppe Cevi Schweiz lesen (Gruppen automatisch übernehmen) |

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
     - **Nur eine Untergruppe:** `Gruppe › Untergruppe`, z.B. `Krisenmanagement › Cevi CH`. Dann wird nur diese Untergruppe geladen, ohne die Obergruppe und ohne die übrigen Untergruppen. „CH" findet auch „Schweiz". Statt `›` geht auch `>` oder `/`. Früher übernommene andere Untergruppen (z.B. Basel, Bern) verschwinden beim nächsten Aktualisieren.
     - Nicht gefundene Einträge werden gemeldet, bei Untergruppen mit der Liste der vorhandenen.
     - Bleibt die Liste leer, schlägt das Tool alle Gruppen vor.
   - **„Immer ausschliessen":** Wortteile im Gruppennamen, eine pro Zeile. Vorgabe: Ehemalige, Archiv, Norwegen Lager 2025, ESG LTS 2025.
     - Solche Gruppen werden nie übernommen, auch nicht als Untergruppe, z.B. „Ehemalige Fachgruppen" oder „Ehemalige Ausschüsse". Das gilt auch für Untergruppen aus Excel.
     - Leerzeichen spielen keine Rolle, und 2025 = 25: „Norwegen Lager 2025" trifft auch „Norwegenlager 25".
     - Bereits übernommene werden beim nächsten Aktualisieren entfernt.
     - Einzelne Untergruppen lassen sich auch direkt im Reiter Kategorien mit „✕ entfernen" ausschliessen.
   - **Mitgliederorganisationen (MIO)** sind eigene Ebenen mit vielen Mitgliedern. Übernommen wird darum nur die **Adresse der Organisation** (ein Brief pro Organisation), nicht deren Mitglieder. Stimmen Organisation und PLZ mit genau einem Excel-Eintrag überein, ist das ein Brief.
5. Danach aktualisiert das Tool die DB-Daten **bei jedem Öffnen oder Neuladen automatisch**, sofern ein API-Key da ist (von Hand gemerkt oder automatisch aus dem Schlüssel-Ordner). Hat jemand in den letzten 2 Minuten aktualisiert, wird nicht nochmals geladen. Sofort geht es mit **„↻ Aktualisieren“** oben rechts: Der Knopf gleicht den gemeinsamen Stand ab und lädt die Cevi DB. Ist ein Key da, ist der Kasten „Verbindung zur Cevi DB“ zugeklappt. Aufklappen braucht es nur, um den Key zu ändern.

Ohne Eintrag bei „Hosts mit API-Zugriff" (z.B. Datei per Doppelklick geöffnet) gibt es eine Alternative: `python3 start-tool.py` startet das Tool unter `http://localhost:8765` und leitet die Abfragen lokal weiter.

Der API-Key gibt Lesezugriff auf Personendaten. Er gehört nie ins Repository, in einen Chat oder in eine Mail. Das Tool speichert ihn ab Werk nicht lokal. Geteilt wird er nur über den eingeschränkten Schlüssel-Ordner (siehe „Mit allen abgleichen“). Nach dem Versand den Key in der Cevi DB löschen.

## Datenschutz

- In dieses Repository gehören **keine** Adresslisten oder API-Keys. `.gitignore` blockiert Excel- und CSV-Dateien.
- Im Code stehen bewusst keine Personennamen. Zuständige werden im Tool erfasst.

## Entwicklung

```
src/app.html        Oberfläche (HTML/CSS/JS), inkl. Abgleich mit Microsoft 365
src/auth.html       Rückkehrseite für die Microsoft-Anmeldung (MSAL „Redirect Bridge")
src/core.js         Logik: Einlesen, Kategorien, Duplikate, Zuteilung
vendor/             SheetJS (Excel, Apache-2.0), MSAL (Microsoft-Anmeldung, MIT)
build.py            baut daraus index.html (eine Datei, läuft offline) und auth.html
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
