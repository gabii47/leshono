"""Transform raw textbook HTML pages -> structured course JSON.

Input:
  content/source/textbook/*.html (raw, immutable)

Output:
  content/generated/course.json

This is a first-pass transformer:
- extracts lesson title
- extracts body text (paragraphs + headings)
- keeps both scripts where visible

Later we will:
- extract vocab tables
- extract exercises/audio
- build Duolingo-like items
"""

from __future__ import annotations

import json
import re
from dataclasses import asdict, dataclass
from pathlib import Path

from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
IN_DIR = ROOT / "content" / "source" / "textbook"
OUT = ROOT / "content" / "generated" / "course.json"
OUT.parent.mkdir(parents=True, exist_ok=True)


@dataclass
class Lesson:
    id: str
    title: str
    url_hint: str | None
    blocks: list[dict]


def guess_id_from_filename(path: Path) -> str:
    # filenames look like: 1.1__<hash>.html OR 1.1.3__<hash>.html
    base = path.stem
    lesson = base.split("__", 1)[0]
    return lesson


def extract_url_hint(html: str) -> str | None:
    # We didn't store the URL in the HTML file; try to recover from canonical tags if present.
    soup = BeautifulSoup(html, "html.parser")
    link = soup.find("link", attrs={"rel": "canonical"})
    if link and link.get("href"):
        return str(link.get("href"))
    return None


def extract_title(soup: BeautifulSoup) -> str:
    # Many pages have: <article><header><table> with the first row containing the title
    header_row = soup.select_one("article header table tr")
    if header_row:
        title = normalize_ws(header_row.get_text(" ", strip=True))
        if title:
            return title

    # Some pages have <strong> in the header
    strong = soup.select_one("article header strong")
    if strong and strong.get_text(strip=True):
        return strong.get_text(" ", strip=True)

    # Fallback: first heading
    h = soup.find(["h1", "h2", "h3"])  # sometimes not present
    if h and h.get_text(strip=True):
        return h.get_text(" ", strip=True)

    # Fallback: any strong inside article
    strong2 = soup.select_one("article strong")
    if strong2 and strong2.get_text(strip=True):
        return strong2.get_text(" ", strip=True)

    t = soup.title.get_text(" ", strip=True) if soup.title else ""
    return t or "Untitled lesson"


def normalize_ws(s: str) -> str:
    s = re.sub(r"\s+", " ", s).strip()
    return s


def extract_blocks(soup: BeautifulSoup) -> list[dict]:
    main = soup.select_one("main")
    if not main:
        return []

    blocks: list[dict] = []

    # 1) Headings/paragraphs/lists
    for el in main.select("h1,h2,h3,p,li"):  # keep simple for v0
        text = normalize_ws(el.get_text(" ", strip=True))
        if not text:
            continue
        tag = el.name
        if tag in ("h1", "h2", "h3"):
            blocks.append({"type": "heading", "level": int(tag[1]), "text": text})
        elif tag == "p":
            blocks.append({"type": "paragraph", "text": text})
        elif tag == "li":
            blocks.append({"type": "list_item", "text": text})

    # 2) NOTE: We intentionally ignore embeds (YouTube/audio) and images.
    # This app will be plain-text + exercises.

    # 3) Tables (many pages are table-only, e.g. abbreviations, vocab, grammar tables)
    for table in main.select("table"):
        for tr in table.select("tr"):
            cells = [normalize_ws(td.get_text(" ", strip=True)) for td in tr.select("th,td")]
            cells = [c for c in cells if c]
            if not cells:
                continue
            # Keep both structured cells + a joined text for simple renderers
            blocks.append({"type": "table_row", "cells": cells, "text": " | ".join(cells)})

    # Remove truly empty blocks.
    # NOTE: many tables contain single-letter abbreviations (e.g. "D", "G", "m."),
    # so we must NOT drop short texts for table rows.
    cleaned = []
    for b in blocks:
        t = b.get("text", "")
        if not t:
            continue
        if b.get("type") != "table_row" and len(t) <= 1:
            continue
        cleaned.append(b)

    # Avoid pathological duplication: if two blocks have identical text, keep first.
    seen = set()
    deduped = []
    for b in cleaned:
        t = b.get("text", "")
        if t in seen:
            continue
        seen.add(t)
        deduped.append(b)

    return deduped


def main() -> None:
    lessons: list[Lesson] = []
    for path in sorted(IN_DIR.glob("*.html")):
        html = path.read_text(encoding="utf-8", errors="ignore")
        soup = BeautifulSoup(html, "lxml")
        lesson_id = guess_id_from_filename(path)
        title = extract_title(soup)
        blocks = extract_blocks(soup)
        lessons.append(
            Lesson(
                id=lesson_id,
                title=title,
                url_hint=extract_url_hint(html),
                blocks=blocks,
            )
        )

    # Sort by numeric-ish id
    def sort_key(les: Lesson):
        parts = [int(p) if p.isdigit() else 9999 for p in re.split(r"[^0-9]+", les.id) if p]
        return parts, les.id

    lessons.sort(key=sort_key)

    course = {
        "name": "Leshono",
        "language": "Turoyo (Surayt)",
        "source": "textbook.surayt.com",
        "lessons": [asdict(l) for l in lessons],
    }
    OUT.write_text(json.dumps(course, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {OUT} with {len(lessons)} lessons")


if __name__ == "__main__":
    main()
