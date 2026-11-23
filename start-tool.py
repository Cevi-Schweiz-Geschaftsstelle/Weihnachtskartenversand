#!/usr/bin/env python3
"""Startet das Weihnachtsbrief-Tool lokal und leitet Cevi-DB-Anfragen weiter.

Warum? Ein Browser darf die Cevi DB nur direkt abfragen, wenn beim API-Key
die Adresse des Tools unter "Hosts mit API-Zugriff" eingetragen ist. Mit diesem
Skript läuft das Tool unter http://localhost:8765 und die Anfragen an /api/...
werden von hier aus an die Cevi DB weitergeleitet - dann braucht es keinen Eintrag.

Start:   python3 start-tool.py            (Windows: py start-tool.py)
Beenden: Ctrl+C
Nur Python 3 nötig, keine Zusatzpakete. Der Token wird nicht gespeichert,
sondern nur bei jeder Anfrage unverändert an die Cevi DB weitergegeben.
"""
import http.server, json, os, re, sys, urllib.error, urllib.parse, urllib.request, webbrowser

TARGET = os.environ.get("CEVI_DB_URL", "https://db.cevi.ch").rstrip("/")
PORT = int(os.environ.get("PORT", "8765"))
HERE = os.path.dirname(os.path.abspath(__file__))
HTML = "index.html"


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=HERE, **kw)

    def do_GET(self):
        path = urllib.parse.urlsplit(self.path).path
        if path in ("/", "/index.html"):
            self.send_response(302)
            self.send_header("Location", "/" + urllib.parse.quote(HTML))
            self.end_headers()
            return
        if path == "/proxy-info.json":
            body = json.dumps({"target": TARGET}).encode()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        if path.startswith("/api/"):
            return self.proxy()
        if path.lower().endswith((".html", ".js", ".css", ".png", ".svg", ".ico")):
            return super().do_GET()
        self.send_error(404)

    def proxy(self):
        url = TARGET + self.path
        headers = {"Accept": self.headers.get("Accept", "application/vnd.api+json")}
        if self.headers.get("X-TOKEN"):
            headers["X-TOKEN"] = self.headers["X-TOKEN"]
        req = urllib.request.Request(url, headers=headers, method="GET")
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                status, ctype, body = r.status, r.headers.get("Content-Type", "application/json"), r.read()
        except urllib.error.HTTPError as e:
            status, ctype, body = e.code, e.headers.get("Content-Type", "application/json"), e.read()
        except Exception as e:  # Netzwerkfehler
            status, ctype = 502, "application/json"
            body = json.dumps({"errors": [{"status": "502", "title": "Cevi DB nicht erreichbar", "detail": str(e)}]}).encode()
        self.send_response(status)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt, *args):
        # Token nie ins Protokoll schreiben
        sys.stderr.write("  " + re.sub(r"\?[^ \"]*", "", fmt % args) + "\n")


if __name__ == "__main__":
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    link = f"http://localhost:{PORT}/"
    print(f"Weihnachtsbrief-Tool läuft: {link}   (Cevi DB: {TARGET})\nBeenden mit Ctrl+C")
    if "--no-browser" not in sys.argv:
        webbrowser.open(link)
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass
