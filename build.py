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

# ---------------------------------------------------------------------------
# anleitung.html: Anleitung für Nutzer*innen (Quelle: src/anleitung.md, Bilder: anleitung/*.png)
import html as _html
import re as _re


def _inline(t):
    t = _html.escape(t, quote=False)
    t = t.replace("\\*", "&#42;")
    t = _re.sub(r"\[([^\]]+)\]\(([^)]+)\)", lambda m: f'<a href="{m.group(2)}">{m.group(1)}</a>', t)
    t = _re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", t)
    t = _re.sub(r"(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?!\w)", r"<em>\1</em>", t)
    return t


def _list_html(entries, k):
    """Baut aus (Einrückung, Art, Text) ab Position k eine verschachtelte Liste.
    Gibt das HTML und die Position nach der Liste zurück."""
    indent, kind = entries[k][0], entries[k][1]
    items = ""
    while k < len(entries) and entries[k][0] == indent:
        text = entries[k][2]
        k += 1
        sub = ""
        while k < len(entries) and entries[k][0] > indent:
            s, k = _list_html(entries, k)
            sub += s
        items += f"<li>{_inline(text)}{sub}</li>"
    return f"<{kind}>{items}</{kind}>", k


def _md_to_html(md):
    out, toc = [], []
    lines = md.split("\n")
    i = 0
    while i < len(lines):
        ln = lines[i]
        if not ln.strip():
            i += 1
            continue
        m = _re.match(r"^(#{1,3}) (.+)$", ln)
        if m:
            level, text = len(m.group(1)), m.group(2)
            slug = _re.sub(r"[^a-z0-9]+", "-", text.lower().translate(str.maketrans("äöüß", "aous"))).strip("-")
            if level == 2:
                toc.append((slug, text))
            out.append(f'<h{level} id="{slug}">{_inline(text)}</h{level}>')
            i += 1
            continue
        m = _re.match(r"^!\[([^\]]*)\]\(([^)]+)\)$", ln.strip())
        if m:
            out.append(f'<figure><a href="{m.group(2)}" target="_blank" rel="noopener"><img src="{m.group(2)}" alt="{_html.escape(m.group(1))}"></a></figure>')
            i += 1
            continue
        if ln.startswith("|"):
            rows = []
            while i < len(lines) and lines[i].startswith("|"):
                rows.append([c.strip() for c in lines[i].strip().strip("|").split("|")])
                i += 1
            head, body = rows[0], [r for r in rows[1:] if not all(_re.match(r"^-+$", c) for c in r)]
            out.append("<table><thead><tr>" + "".join(f"<th>{_inline(c)}</th>" for c in head) + "</tr></thead><tbody>"
                       + "".join("<tr>" + "".join(f"<td>{_inline(c)}</td>" for c in r) + "</tr>" for r in body) + "</tbody></table>")
            continue
        if _re.match(r"^(\d+\.|-) ", ln):
            # Liste; jede Unterebene ist 4 Leerzeichen tiefer eingerückt (beliebig tief)
            entries = []
            while i < len(lines) and (_re.match(r"^(\d+\.|-) ", lines[i]) or lines[i].startswith("    ")):
                m = _re.match(r"^( *)(\d+\.|-) (.*)$", lines[i])
                if m:
                    entries.append((len(m.group(1)), "ol" if m.group(2)[0].isdigit() else "ul", m.group(3)))
                else:
                    entries.append((len(lines[i]) - len(lines[i].lstrip(" ")), "ul", lines[i].strip()))
                i += 1
            out.append(_list_html(entries, 0)[0])
            continue
        para = [ln]
        i += 1
        while i < len(lines) and lines[i].strip() and not _re.match(r"^(#|\||!\[|\d+\. |- )", lines[i]):
            para.append(lines[i])
            i += 1
        text = " ".join(p.strip() for p in para)
        cls = ' class="cap"' if _re.match(r"^\*Bild \d+", text) else ""
        out.append(f"<p{cls}>{_inline(text)}</p>")
    return "\n".join(out), toc


_md = read("src", "anleitung.md")
_body, _toc = _md_to_html(_md)
_page = read("src", "anleitung.html")
_page = _page.replace("<!--TOC-->", "".join(f'<li><a href="#{s}">{_html.escape(t)}</a></li>' for s, t in _toc), 1)
_page = _page.replace("<!--INHALT-->", _body, 1)
with open(os.path.join(HERE, "anleitung.html"), "w", encoding="utf-8") as f:
    f.write(_page)
print("anleitung.html gebaut:", len(_page.encode("utf-8")) // 1024, "KB,", len(_toc), "Abschnitte")
