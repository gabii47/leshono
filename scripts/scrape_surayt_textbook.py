"""Scrape/import Šlomo Surayt online course pages into local raw HTML.

Target site:
  https://textbook.surayt.com/en/Online%20Course/...

Output:
  content/source/textbook/...

This script is intentionally conservative:
- Fetches pages politely (rate-limited)
- Stores raw HTML as evidence/source-of-truth

After this, a separate script should transform raw HTML -> structured JSON.
"""

from __future__ import annotations

import hashlib
import os
import re
import time
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup

BASE = "https://textbook.surayt.com"
START_URL = "https://textbook.surayt.com/en/Online%20Course/1.1?content-fragment-id=4174"

OUT_DIR = Path(__file__).resolve().parents[1] / "content" / "source" / "textbook"
OUT_DIR.mkdir(parents=True, exist_ok=True)

SESSION = requests.Session()
SESSION.headers.update(
    {
        "User-Agent": "TuroyoLingoImporter/0.1 (personal study; contact: local)",
        "Accept-Language": "en",
    }
)


def safe_slug(url: str) -> str:
    """Stable filename based on path+query."""
    p = urlparse(url)
    key = (p.path + "?" + (p.query or "")).encode("utf-8")
    h = hashlib.sha256(key).hexdigest()[:16]
    # also include last path segment for readability
    tail = p.path.rstrip("/").split("/")[-1] or "root"
    tail = re.sub(r"[^a-zA-Z0-9._-]+", "_", tail)
    return f"{tail}__{h}.html"


def fetch(url: str, *, sleep_s: float = 1.0) -> str:
    r = SESSION.get(url, timeout=30)
    r.raise_for_status()
    time.sleep(sleep_s)
    return r.text


def save_raw(url: str, html: str) -> Path:
    fn = safe_slug(url)
    path = OUT_DIR / fn
    path.write_text(html, encoding="utf-8")
    return path


def extract_lesson_links(html: str) -> list[str]:
    soup = BeautifulSoup(html, "html.parser")
    links = []
    for a in soup.select("nav a[href]"):
        href = a.get("href")
        if not href:
            continue
        if "/en/Online%20Course/" not in href:
            continue
        full = urljoin(BASE, href)
        links.append(full)
    # de-dup preserving order
    seen = set()
    out = []
    for u in links:
        if u not in seen:
            seen.add(u)
            out.append(u)
    return out


def main() -> None:
    print(f"Fetching start: {START_URL}")
    html = fetch(START_URL)
    save_raw(START_URL, html)

    lesson_links = extract_lesson_links(html)
    print(f"Found {len(lesson_links)} nav links")

    # Filter to lesson-ish pages only (1.x, 2.x, 3, 4, 5.x etc.).
    # We will tune this once we see the exact URL patterns.
    for i, url in enumerate(lesson_links, 1):
        try:
            print(f"[{i}/{len(lesson_links)}] {url}")
            page = fetch(url)
            save_raw(url, page)
        except Exception as e:
            print(f"ERROR: {url}: {e}")


if __name__ == "__main__":
    main()
