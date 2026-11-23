#!/usr/bin/env python3
"""Baut index.html aus src/app.html + src/core.js + vendor/xlsx.full.min.js (eine einzige, offline lauffähige Datei).

Aufruf:  python3 build.py
"""
import os

HERE = os.path.dirname(os.path.abspath(__file__))


def read(*p):
    with open(os.path.join(HERE, *p), encoding="utf-8") as f:
        return f.read()


html = read("src", "app.html")
xlsx = read("vendor", "xlsx.full.min.js")
core = read("src", "core.js")
assert "/*__XLSX__*/" in html and "/*__CORE__*/" in html, "Platzhalter fehlen in src/app.html"
assert "</script" not in xlsx and "</script" not in core
html = html.replace("/*__XLSX__*/", "/* SheetJS Community Edition 0.18.5 – Apache-2.0 – https://sheetjs.com */\n" + xlsx, 1)
html = html.replace("/*__CORE__*/", core, 1)
with open(os.path.join(HERE, "index.html"), "w", encoding="utf-8") as f:
    f.write(html)
print("index.html gebaut:", len(html.encode("utf-8")) // 1024, "KB")
