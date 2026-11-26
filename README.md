# Weihnachtskartenversand

Ein Tool für den Versand der Weihnachtsbriefe. Es führt die Adresslisten aller Bereiche zusammen, erkennt Personen, die mehrfach vorkommen, und verteilt die Briefe auf die Zuständigen. Wer zusätzlich unterschreiben muss, ist jeweils vermerkt.

**Online öffnen:** <https://fabulousteaching.github.io/Weihnachtskartenversand/>
**Offline:** `index.html` herunterladen und per Doppelklick im Browser öffnen.

Das Tool ist eine einzelne HTML-Datei. Die Adressdaten werden nur im eigenen Browser verarbeitet und dort zwischengespeichert. Es wird nichts hochgeladen, auch nicht bei der Online-Version.

## Ablauf

Oben stehen vier Kacheln, die sich anklicken lassen:
- **Briefe (eindeutige Empfänger)** öffnet die Masterliste mit allen Briefen.
- **mögliche Duplikate prüfen** (inkl. Personen mit mehreren Adressen) öffnet den Reiter Unvollständig beim Abschnitt mit den Duplikaten.
- **ohne Zuständigkeit** öffnet die Liste „⚠ Ohne Zuständigkeit“, wo man die Zuständigkeit direkt wählen kann.
- **erledigt** öffnet die Masterliste mit dem Filter „Nur nicht erledigte“ (oben als Kärtchen, mit ✕ wieder weg).

1. **Zuständigkeit:** Hier werden die zuständigen Personen erfasst.
   - Vorname und Nachname eintragen. Das **Kürzel entsteht automatisch** aus dem 1. Buchstaben des Vornamens und dem 1. und 2. Buchstaben des Nachnamens (z.B. Anna Beispiel → ABE). Ist es schon vergeben, nimmt das Tool die nächste Variante. Von Hand überschreiben ist möglich.
   - Nach dem Excel-Import schlägt das Tool die Personen vor, die es in den Listen findet. Mit ✕ lässt sich ein Vorschlag ausblenden.
   - Nach **„Erfassen"** öffnet sich ein Fenster: die Kategorien und Untergruppen anhaken, zu denen die Person gehört, dann **„Fertig"**. Später lässt sich das in der Personen-Tabelle über **„✎ Kategorien"** ändern.
   - Die Personen-Tabelle zeigt zuerst nur Kürzel, Name und die Anzahl Briefe („✍ … mit“ = unterschreibt mit). **Ein Klick auf den Namen** klappt die Details auf: Kürzel/Vorname/Nachname bearbeiten und die Kategorien und Untergruppen, für die die Person zuständig ist (★ = versendet), mit „✎ Kategorien“.
2. **Kategorien** (eigener Reiter neben Zuständigkeit):
   - **„＋ Neue Kategorie"** steht zuoberst. Neue Kategorien kommen ans Ende der Liste und lassen sich mit ▲ nach oben schieben.
   - Personen den Kategorien zuordnen, auch mehrere pro Kategorie. **★** versendet, alle weiteren unterschreiben mit.
   - **Hellgrün** sind die Kategorien, deren Adressen aus der Cevi DB kommen (Etikett „● Cevi DB", bzw. „● Cevi DB + Excel", wenn zusätzlich Excel-Listen dazugehören).
   - **Person anlegen und zuweisen** (oben im Reiter): für Empfänger*innen, die in keiner Liste und nicht in der Cevi DB stehen. Zuerst das Feld **Organisation** (nur ausfüllen, wenn die Karte an eine Organisation statt an eine Einzelperson geht; Vor- und Nachname dürfen dann leer bleiben oder als Kontaktperson dienen), dann Vorname, Nachname, Strasse und Nr., PLZ, Ort und bei Bedarf **Bemerkungen** (nur intern, kommt nicht auf die Etikette) eintragen, Kategorie und allenfalls Untergruppe wählen (oder direkt neu anlegen) und wählen, wer zuständig ist → „＋ Person anlegen“ (oder Enter). Die gewählte Zuständigkeit gilt fest, auch vor Untergruppe und Kategorie. Von Hand erfasste Personen stehen in der Masterliste (mit „✎“ bei der Kategorie) und lassen sich dort hinten mit „🗑 löschen“ wieder entfernen.
   - Kategorie **„Cevi Schweiz“** mit den Untergruppen **Geschäftsstelle** und **Vorstand** (die beiden Gruppen aus der Cevi DB). Wer bei der Kategorie eingetragen ist, gilt für beide Untergruppen, solange diese keine eigenen Zuständigen haben.
   - „Anlässe des Jahres“ ist keine eigene Kategorie mehr, sondern eine Untergruppe von **Diverse**. Heisst ein Excel-Blatt wie eine bestehende Untergruppe, landen seine Einträge dort.
   - **Jede Kategorie ist ein aufklappbares Menü:** Zugeklappt steht nur der Name, und falls noch jemand fehlt, dahinter in Orange „noch niemand zugeordnet“ bzw. „3 noch niemand“. Ein Klick zeigt alles andere: Personen zuordnen, Untergruppen, Herkunft (Cevi DB/Excel), Umbenennen. Bei Kategorien mit Untergruppen (z.B. Fachgruppen) wird pro Untergruppe festgelegt, wer zuständig ist. Der Zustand (auf/zu) wird gemerkt.
   - **Untergruppen** (z.B. Fachgruppen › Informatik, Projektgruppen › Konekta 26) haben eigene Zuständige.
     - Die Untergruppen erscheinen nach dem Excel-Import bzw. dem Laden aus der Cevi DB automatisch. Eigene Untergruppen: Kategorie aufklappen → **„＋ Untergruppe erstellen“** (geht bei jeder Kategorie, auch bei solchen ohne Untergruppen).
     - Was bei einer Untergruppe eingetragen ist, gilt vor der Spalte „Zuständigkeit" in der Excel. Diese gilt vor der Kategorie.
     - Mit „übernehmen" bzw. „Alle aus Excel übernehmen" wird die Zuständigkeit aus der Excel fest eingetragen.
     - Untergruppen aus Excel und Cevi DB werden zusammengeführt („Informatik" = „Fachgruppe Informatik").
     - **Jede Ebene wird einzeln ausgewiesen**, z.B. Ausschüsse › Partner & Politik › ↳ SAJV. Ist bei einer tieferen Untergruppe niemand eingetragen, **erbt** sie die Zuständigkeit der Obergruppe.
     - **„✕ entfernen"** nimmt eine Untergruppe heraus, die nicht mehr gebraucht wird (z.B. ein vergangenes Lager). Ihre Adressen fallen weg, sofern sie nicht noch in einer anderen Liste stehen. Bei jedem weiteren Import aus der Cevi DB oder aus Excel wird sie ignoriert. Zurückholen (DB-Untergruppen): Reiter Cevi DB → bei der Gruppe **„Untergruppen wählen“** → Häkchen setzen.
   - Die Reihenfolge der Kategorien (▲▼) bestimmt den Vorschlag, wenn jemand in mehreren Kategorien vorkommt.
3. **Excel importieren:** Die Adressliste ins Fenster ziehen oder im Reiter **Importierte Listen** (ganz hinten) auf **„＋ Excel hinzufügen“**. Dort stehen auch alle eingelesenen Listen: einzeln ein-/ausschalten, Kategorie ändern, entfernen.
   - **Liste im Tool bearbeiten (✎ bearbeiten):** öffnet die Einträge einer Excel-Liste (oder „Von Hand erfasst“) als Tabelle direkt im Tool.
     - **Ändern:** in ein Feld klicken und tippen; mit Tab oder Enter wird gespeichert. Angepasste Zeilen sind gelb.
     - **Ergänzen:** unterste Zeile ausfüllen und „＋“ (oder Enter) – die Person gehört dann zu dieser Liste (gleiche Kategorie, Gruppe und Zuständigkeit wie die übrigen Zeilen) und ist grün markiert. Wird die Liste ausgeschaltet oder entfernt, gilt das auch für die ergänzten Personen.
     - **Entfernen:** 🗑 – Zeilen aus der Excel-Liste werden durchgestrichen und kommen nicht mehr ins Tool (↺ holt sie zurück); im Tool ergänzte werden gelöscht.
     - Alles bleibt auch nach einem **neuen Import** derselben Datei erhalten. Die Excel-Datei selbst wird nicht verändert. Bei langen Listen hilft das Suchfeld.
   - Jedes Blatt bzw. jeder Block (z.B. „CCH › Vorstand") wird automatisch einer Kategorie zugeordnet.
   - **Fast jede Liste wird gelesen.** Gebraucht werden nur Name, Vorname, Strasse (mit Nr.), PLZ und Ort; alle anderen Spalten werden ignoriert.
     - Spaltentitel auf Deutsch, Französisch, Italienisch oder Englisch und aus Exporten von hitobito, Abacus, Bexio, Outlook usw., z.B. „Prénom/Nom“, „Nome/Cognome“, „First Name/Last Name“, „Strasse und Nr.“, „Adresszeile 1“, „NPA“, „Localité“, „Name 1/Name 2“.
     - Zusammengelegte Spalten: „PLZ Ort“ (`3000 Bern`, auch `CH-3000`), „Name, Vorname“ (`Muster, Hans`), ganzer Name in einer Spalte „Name“ (Reihenfolge wird erkannt, Paare mit „&“ bleiben zusammen, „Stiftung …“ = Organisation), ganze Adresse in einer Zelle (`Musterweg 12, 3000 Bern`).
     - Kopfzeile bis Zeile 30 (Titelzeilen davor sind kein Problem), auch zweizeilige Kopfzeilen.
     - Ohne Kopfzeile: Spalten werden am Inhalt erkannt (PLZ, Strasse mit Nummer, Vornamen). Etiketten-Listen mit der ganzen Adresse mehrzeilig in einer Zelle gehen auch. Das Tool meldet kurz, wenn es so vorgegangen ist.
     - Ja/Nein-Spalten, Telefon-, Kunden- und Belegnummern werden nicht mit Hausnummern verwechselt.
     - Steht in der E-Mail-Spalte Text ohne @ (z.B. „Haus des Sports“), gilt er als Adresszusatz und kommt auf die Etikette.
     - Ausland: „D-58313“ oder „D-Herdecke“ (auch A-, F-, I-, FL-) und „Bruxelles, BELGIUM“ werden erkannt. Auf der Etikette steht dann „58313 Herdecke“ und darunter das Land in Grossbuchstaben (z.B. DEUTSCHLAND), wie es die Post verlangt. Im Excel-Export gibt es dafür die Spalte „Land“.
     - Dateiformate: .xlsx, .xls, .xlsm, .ods, .csv/.tsv/.txt (Komma, Semikolon oder Tab; Umlaute aus UTF-8 und aus Excel-CSV unter Windows).
   - Blätter ohne Adressen (z.B. eine reine Zahlungsliste oder „Hinweise“) werden mit einem kurzen Hinweis übergangen.
   - Das Blatt „Überblick" liefert die Hauptzuständigkeiten. Die Sammelliste („Masterliste") wird ignoriert, damit nichts doppelt gezählt wird.
4. **Unvollständig:** Alles, was noch eine Entscheidung braucht, in einem Reiter. Die Zahl am Reiter zeigt, wie viel noch offen ist.
   - **Mögliche Duplikate prüfen:** Unsichere Fälle bestätigen oder ablehnen, z.B. gleicher Name mit anderer PLZ oder ein Tippfehler im Vornamen. Haben die beiden Einträge verschiedene Adressen, gibt es unter jedem Eintrag „Dieselbe Person – diese Adresse“: zusammenführen und gleich festlegen, welche Adresse gilt.
   - **Mehrere Adressen – eine wählen:** Eine Person mit zwei oder mehr verschiedenen Adressen ist nicht gültig. Sie wird rot markiert („Welche Adresse gilt?“), nicht gedruckt und zählt als offen, bis eine Adresse angeklickt ist. Die Wahl geht auch direkt in der Masterliste (Spalte Adresse). Mit „↺ andere Adresse wählen“ lässt sie sich ändern.
   - **Ohne Zuständigkeit:** Diese Adressen lassen sich frei zuweisen.
   - **Mehrfach gelistet:** Für Personen in mehreren Listen wählt man per Klick die Hauptverantwortung. Die anderen unterschreiben automatisch mit.
   - **Automatisch zusammengeführt** (aufklappbar): Alle Personen, die das Tool selbst zusammengeführt hat. Bei einem Fehler „Trennen".
5. **Pro Zuständige\*r:** Jede Person sieht ihre Briefe und wo sie mitunterschreibt. Hier gibt es Erledigt-Häkchen, Drucken und den Export.
   - **Adresse ausblenden:** Hinten in jeder Zeile (in der Masterliste und bei jeder Person) steht „✕ ausblenden“. Eine ausgeblendete Adresse wird nicht verschickt: kein Brief, keine Etikette, kein Export, keine offene Entscheidung. Sie bleibt grau in der Masterliste und bei der Person unter „Ausgeblendet“ und lässt sich mit „↺ einblenden“ zurückholen. Das gilt auch nach neuen Importen – z.B. wenn zu viele Adressen importiert wurden.
   - **Zuständigkeit anpassen (Spalte „Unterschreiben auch“):** Steht dort niemand, gibt es den Knopf „Zuständigkeit anpassen“; stehen Personen dort (✍ …), genügt ein Klick auf einen Namen. Im Fenster:
     - **★ versendet:** Hauptzuständigkeit festlegen (gilt fest, auch nach neuen Importen) oder „Automatisch“ (aus Kategorie/Untergruppe). Wechselt die Hauptzuständigkeit, wird die bisherige Person als Mitunterschreibende vorgeschlagen.
     - **✍ unterschreibt mit:** weitere Personen hinzufügen oder automatisch Mitunterschreibende (aus anderen Kategorien) entfernen.
   - **Bearbeiten (✎):** Hinten in jeder Zeile steht unter „✕ ausblenden“ der Knopf „✎ bearbeiten“.
     - Alles, was nicht aus der Cevi DB kommt (Excel-Listen und von Hand erfasste Personen), lässt sich ganz anpassen: Organisation, Name, Adresszusatz, Strasse, Nr., PLZ, Ort, Land, E-Mail und **Bemerkungen**. Die Person ist danach mit „angepasst“ markiert; die Anpassung bleibt auch nach einem neuen Import erhalten (solange die Zeile in der Excel-Liste gleich bleibt), „↺ Original aus der Liste“ verwirft sie. Häkchen „erledigt“, Ausblenden und die gewählte Untergruppe bleiben erhalten.
     - Bei Personen aus der Cevi DB sind Name und Adresse gesperrt (sie werden in der Cevi DB korrigiert); die **Bemerkung** lässt sich trotzdem festhalten.
     - Bemerkungen erscheinen gelb unter dem Namen („📝 …“), sind in der Suche der Masterliste auffindbar und stehen im Excel-Export in der Spalte „Bemerkungen“ – auf die Etikette kommen sie nicht.
   - **Löschen (🗑):** In den Kategorien **Diverse, Alpenblick, MIO und Internationale Partner** dürfen Adressen gelöscht werden. Hinten in der Zeile steht dort „🗑 löschen“, auch bei Adressen aus Excel oder der Cevi DB. Von Hand erfasste Personen lassen sich überall löschen. Steht jemand zusätzlich in einer anderen Kategorie, bleibt die Person dort (das Tool sagt es vor dem Löschen). Gelöschte Adressen kommen auch bei einem neuen Import nicht zurück. Oben in der Masterliste steht „🗑 N gelöscht · wiederherstellen“.
   - **Untergruppe zuweisen:** Ein Klick auf den Namen einer Person (oder auf ihre Kategorie unter „Gefunden in“) öffnet ein kleines Fenster. Dort lässt sich pro Kategorie die Untergruppe wählen, „keine Untergruppe“ setzen oder direkt eine **neue Untergruppe** anlegen. Danach richtet sich die Zuständigkeit nach der Untergruppe (sonst nach der Kategorie). Das funktioniert für alle Personen: aus Excel, aus der Cevi DB und von Hand erfasst. Die Wahl bleibt auch nach einem neuen Import erhalten. Wählt man wieder die Gruppe aus der Liste, gilt wieder die Liste.
   - Ganz oben in der Liste links steht **📋 Masterliste**: alle Empfänger\*innen mit Suche, Filtern und dem Gesamt-Export (früher ein eigener Reiter). Filter: Kategorie, **Untergruppe** (erscheint nur, wenn die gewählte Kategorie Untergruppen hat; eine Obergruppe schliesst ihre Untergruppen ein, „– ohne Untergruppe –“ zeigt die direkt in der Kategorie) und Zuständige. Das Häkchen **„nur ausgeblendete“** zeigt nur die ausgeblendeten Personen (mit Anzahl).
   - **🏷 Etiketten:** Alle Adressen der gewählten Person auf A4-Etikettenbögen drucken.
     - Bögen: Avery Zweckform 3475, 3474, 3422, L7160, L7163 oder eigene Masse.
     - Sortiert nach Name oder PLZ, optional nur nicht erledigte.
     - Startposition für angebrauchte Bögen, Probedruck mit Rahmen, Vorschau.
     - Im Druckfenster Skalierung 100 % und Ränder „Keine" wählen.
6. **Excel exportieren** (Pro Zuständige\*r → 📋 Masterliste, oben rechts): Masterliste, ein Blatt pro zuständiger Person und eine Duplikat-Übersicht. Geeignet als Quelle für einen Serienbrief in Word.

**Oben rechts:**
- **↻ Aktualisieren:** gleicht sofort mit allen ab und lädt die Cevi DB neu, falls ein Key da ist. Beim ersten Mal öffnet er die Microsoft-Anmeldung.
- **☰ Menü:** Zurücksetzen (Erledigt-Häkchen, Zuteilungen & Duplikat-Entscheide, alle Daten auf diesem Computer)

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
| `GET /api/groups/:id` | Gruppe Cevi Schweiz lesen (Gruppenliste im Reiter Cevi DB) |

Einrichten:
1. In der Cevi DB bei der Gruppe Cevi Schweiz → Tab **API-Keys** → neuer Key.
   - Berechtigung: *Leserechte auf dieser Ebene* (oder *… und darunterliegenden Ebenen*).
   - Zugriffsbereich: **Personen** und **Gruppen**.
2. Im selben Formular unter **Hosts mit API-Zugriff** eintragen: `https://fabulousteaching.github.io`
3. Im Tool im Tab **Cevi DB** den Key einfügen.
4. **Gruppen aus der Cevi DB – zwei Spalten:**
   - Links **„✓ Für Versand berücksichtigt“**, rechts **„✕ Für Versand nicht berücksichtigt“**. Jede Karte ist eine Gruppe der obersten Ebene von Cevi Schweiz (Geschäftsstelle, Vorstand, Fachgruppen, Projektgruppen …).
   - **Verschieben per Drag & Drop** (oder „← berücksichtigen“ bzw. ✕ klicken). Wer nach rechts kommt, wird beim nächsten Laden nicht mehr berücksichtigt.
   - **Beim Berücksichtigen** öffnet sich ein Fenster: Kategorie wählen (Vorschlag nach Gruppentyp und Name, oder „＋ Neue Kategorie“), optional Zuständig, und mit Häkchen wählen, **welche Untergruppen** dazugehören. Ein Häkchen bei einer Gruppe setzt es auch bei ihren Untergruppen; „keine Untergruppen“ lädt nur die Gruppe selbst (wie bei PSA). Danach wird gleich geladen.
   - **Links** zeigt jede Karte Kategorie, Zuständig und wie viele Untergruppen dabei sind („alle 12“, „9 von 12“, „nur Cevi CH“). **„Untergruppen wählen“** ändert die Auswahl jederzeit – so lassen sich auch früher entfernte Untergruppen wieder dazunehmen.
   - Mitgliederorganisationen (MIO) stehen grau rechts: Sie kommen nicht aus der Cevi DB, sondern aus Excel.
   - Neue Untergruppen unter einer berücksichtigten Gruppe werden beim Aktualisieren erkannt (siehe „Neue Gruppen in der DB“). Nicht gewählte Untergruppen werden nicht gefragt.
   - Die Gruppenliste wird beim Aktualisieren nachgeführt; „jetzt neu lesen“ liest sie sofort.
   - **Erweitert** (aufklappbar): „Immer ausschliessen“ (Wortteile im Gruppennamen, eine pro Zeile, Vorgabe: Ehemalige, Archiv, Norwegen Lager 2025, ESG LTS 2025 – solche Gruppen samt Untergruppen werden nie geladen, auch künftige und auch aus Excel; Leerzeichen spielen keine Rolle, 2025 = 25) und die Startgruppe „Cevi Schweiz“ (Nummer oder Link).
   - **🎓 Kursleitungen** (Karte in der rechten Spalte, nach links ziehen): lädt alle Kurse eines Jahres der Ebene Cevi Schweiz (wie in der DB unter Anlässe → Kurse, „diese Ebene“) und übernimmt **alle Rollen ausser Teilnehmende**: Hauptleitung, Leitung, Küche, Helfer/innen, Kasse, Referent/innen. Jeder Kurs wird eine Untergruppe der Kategorie (Vorgabe: Ausbildung), so lassen sich pro Kurs Zuständige festlegen. Jahr leer = jeweils das aktuelle Jahr.
     - Dafür braucht der **API-Key** in der Cevi DB zusätzlich die Häkchen **„Anlässe“** und **„Teilnehmende von Anlässen“** (Cevi Schweiz → Bearbeiten → API-Keys → Key bearbeiten). Der Key selbst bleibt gleich.
     - Die Schnittstelle für Kurs-Teilnahmen gibt es ab hitobito 2.9. Kennt die Cevi DB sie noch nicht, meldet das Tool das; die übrigen DB-Daten werden trotzdem geladen.
5. Danach aktualisiert das Tool die DB-Daten **bei jedem Öffnen oder Neuladen automatisch**, sofern ein API-Key da ist (von Hand gemerkt oder automatisch aus dem Schlüssel-Ordner). Hat jemand in den letzten 2 Minuten aktualisiert, wird nicht nochmals geladen. Sofort geht es mit **„↻ Aktualisieren“** oben rechts: Der Knopf gleicht den gemeinsamen Stand ab und lädt die Cevi DB. Ist ein Key da, ist der Kasten „Verbindung zur Cevi DB“ zugeklappt. Aufklappen braucht es nur, um den Key zu ändern.
6. **Neue Gruppen in der DB:** Beim Übernehmen merkt sich das Tool alle Gruppen. Taucht beim Aktualisieren eine neue Gruppe oder Untergruppe auf, fragt es in einem Fenster nach:
   - als Untergruppe der bisherigen Kategorie (z.B. neue Fachgruppe → Fachgruppen),
   - in eine andere Kategorie,
   - als neue Kategorie,
   - oder nicht übernehmen.

   Bis zur Antwort werden ihre Mitglieder nicht geladen. „Später“ fragt beim nächsten Mal wieder; offene Fragen stehen auch im Reiter „Unvollständig“. Ausgeschlossene Gruppen (z.B. „Ehemalige …“) werden nicht gefragt. Nicht übernommene Gruppen lassen sich im Reiter Cevi DB unter „Ausgeschlossene Gruppen“ mit ↺ zurückholen.

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
