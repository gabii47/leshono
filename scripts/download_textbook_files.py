"""Download all /files/* assets referenced by scraped HTML pages.

Input:
  content/source/textbook/*.html
Output:
  content/source/textbook/files/<id>.<ext>

Then you can copy that folder into the Flutter app assets.
"""

from __future__ import annotations

import re
from pathlib import Path
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
HTML_DIR = ROOT / "content" / "source" / "textbook"
OUT_DIR = HTML_DIR / "files"
OUT_DIR.mkdir(parents=True, exist_ok=True)

BASE = "https://textbook.surayt.com/"

SESSION = requests.Session()
SESSION.headers.update({"User-Agent": "LeshonoImporter/0.1"})


def main() -> None:
    refs: set[str] = set()
    for p in HTML_DIR.glob("*.html"):
        html = p.read_text(encoding="utf-8", errors="ignore")
        soup = BeautifulSoup(html, "lxml")
        for img in soup.select("img[src]"):
            src = img.get("src")
            if not src:
                continue
            # Look for ../files/12345.jpg or /files/12345.jpg
            m = re.search(r"/files/[^\s'\"]+", src)
            if not m:
                continue
            path = m.group(0).lstrip("/")
            refs.add(path)

    print(f"Found {len(refs)} referenced /files assets")

    ok = 0
    for rel in sorted(refs):
        url = urljoin(BASE, rel)
        out = OUT_DIR / Path(rel).name
        if out.exists() and out.stat().st_size > 0:
            ok += 1
            continue
        try:
            r = SESSION.get(url, timeout=30)
            r.raise_for_status()
            out.write_bytes(r.content)
            ok += 1
        except Exception as e:
            print(f"ERROR {url}: {e}")

    print(f"Downloaded {ok}/{len(refs)}")


if __name__ == "__main__":
    main()
