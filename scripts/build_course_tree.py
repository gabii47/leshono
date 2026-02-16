"""Build a hierarchical course tree that mirrors textbook.surayt.com navigation.

Input:
  content/generated/course.json (flat list of pages)
Output:
  content/generated/course_tree.json

Tree structure:
  course
    sections (0,1,2,3,4,5,6)
      pages (all pages under that section)

This is intentionally simple and deterministic. The app can decide which pages
are "lessons" vs "subpages" later.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INP = ROOT / "content" / "generated" / "course.json"
OUT = ROOT / "content" / "generated" / "course_tree.json"

SECTION_TITLES = {
    "0": "Home",
    "1": "Šlomo Surayt I - Beginner (A-B)",
    "2": "Šlomo Surayt II - Advanced (B-C)",
    "3": "Reader Qëryono",
    "4": "Grammar Tables",
    "5": "Kunoš mele - Glossary",
    "6": "Bibliography",
}


def sort_key(page_id: str):
    parts = [int(p) for p in re.findall(r"\d+", page_id)]
    return parts


def main() -> None:
    data = json.loads(INP.read_text(encoding="utf-8"))
    pages = data["lessons"]

    buckets: dict[str, list[dict]] = {}
    for p in pages:
        pid = p["id"]
        top = pid.split(".", 1)[0]
        buckets.setdefault(top, []).append(p)

    sections = []
    for sec_id, sec_pages in sorted(buckets.items(), key=lambda kv: sort_key(kv[0])):
        sec_pages.sort(key=lambda p: sort_key(p["id"]))
        sections.append(
            {
                "id": sec_id,
                "title": SECTION_TITLES.get(sec_id, f"Section {sec_id}"),
                "pages": sec_pages,
            }
        )

    out = {
        "name": data.get("name"),
        "language": data.get("language"),
        "source": data.get("source"),
        "sections": sections,
    }
    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {OUT} with {len(sections)} sections")


if __name__ == "__main__":
    main()
