# Arbeitsregeln für Claude

## Sprache

- Antworten, Commit-Nachrichten und Pull Requests auf **Deutsch**, Schweizer Schreibweise (immer „ss“, kein „ß“).

## Ablauf bei Änderungen

1. Änderungen nie direkt auf `main`, sondern immer auf einem eigenen **Branch**.
2. Dazu einen **Pull Request** eröffnen.
3. Zusammenführen per **Squash-Merge**. Den Merge darf Claude selbst machen, sobald Build, Tests und Browser-Test erfolgreich waren.

## Prüfen nach jeder Änderung

```bash
python3 build.py
```

```bash
node tests/test_core.js
```

- `build.py` erzeugt `index.html`, `auth.html` und `anleitung.html` aus `src/` und `vendor/`. Die gebauten Dateien gehören mit in den Commit.
- Danach das Tool **im Browser testen** (z.B. `index.html` mit Playwright/Chromium öffnen, oder lokal mit `python3 start-tool.py` unter `http://localhost:8765`) und prüfen, dass die Änderung funktioniert und keine Fehler in der Konsole stehen.

## Datenschutz

- **Niemals echte Adressdaten oder API-Keys ins Repository** – weder in Code, Tests, Commits noch in Pull Requests. `.gitignore` blockiert Excel-, CSV- und Einstellungs-Dateien; diese Sperre nicht umgehen.
- In **Screenshots** (z.B. `anleitung/*.png`) und **Tests** nur **erfundene Personen** und Beispieladressen verwenden (z.B. Anna Beispiel, `@example.org`).
- Im Code stehen keine Personennamen. Zuständige werden im Tool erfasst.

## Projekt

- Repository: `Cevi-Schweiz-Geschaftsstelle/Weihnachtskartenversand`
- Online-Version (GitHub Pages): <https://cevi-schweiz-geschaftsstelle.github.io/Weihnachtskartenversand/>
- Aufbau und Funktionen: siehe `README.md` (Abschnitt „Entwicklung“). Quellen in `src/`, nicht direkt in `index.html` ändern.
