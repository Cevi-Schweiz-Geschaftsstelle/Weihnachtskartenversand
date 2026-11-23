#!/usr/bin/env python3
"""Baut index.html aus src/app.html + src/core.js + vendor/*.js (eine einzige, offline lauffähige Datei)
sowie auth.html (Rückkehrseite für die Microsoft-Anmeldung).

Aufruf:  python3 build.py
"""
import os

HERE = os.path.dirname(os.path.abspath(__file__))


def read(*p):
    with open(os.path.join(HERE, *p), encoding="utf-8") as f:
        return f.read()


html = read("src", "app.html")
xlsx = read("vendor", "xlsx.full.min.js")
msal = read("vendor", "msal-browser.min.js")
core = read("src", "core.js")
for marker in ("/*__XLSX__*/", "/*__MSAL__*/", "/*__CORE__*/"):
    assert marker in html, "Platzhalter fehlt in src/app.html: " + marker
assert "</script" not in xlsx and "</script" not in core and "</script" not in msal
html = html.replace("/*__XLSX__*/", "/* SheetJS Community Edition 0.18.5 – Apache-2.0 – https://sheetjs.com */\n" + xlsx, 1)
html = html.replace("/*__MSAL__*/", "/* Microsoft Authentication Library (msal-browser) – MIT */\n" + msal, 1)
html = html.replace("/*__CORE__*/", core, 1)
with open(os.path.join(HERE, "index.html"), "w", encoding="utf-8") as f:
    f.write(html)
print("index.html gebaut:", len(html.encode("utf-8")) // 1024, "KB")

# Rückkehrseite für die Microsoft-Anmeldung (muss auf derselben Adresse liegen wie das Tool)
auth = read("src", "auth.html")
bridge = read("vendor", "msal-redirect-bridge.min.js")
assert "/*__BRIDGE__*/" in auth and "</script" not in bridge
auth = auth.replace("/*__BRIDGE__*/", "/* msal-browser redirect bridge – MIT */\n" + bridge, 1)
with open(os.path.join(HERE, "auth.html"), "w", encoding="utf-8") as f:
    f.write(auth)
print("auth.html gebaut:", len(auth.encode("utf-8")) // 1024, "KB")
