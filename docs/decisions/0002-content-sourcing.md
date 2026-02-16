# ADR 0002 — Content sourcing & licensing

- Date: 2026-02-16
- Status: Proposed

## Goal
Import lessons 1.1 → 5.3 from https://textbook.surayt.com into our internal content format.

## Important
Before publishing to the App Store / Play Store, we must confirm we have **rights/license** to redistribute the textbook content (text, images, audio, video links) in an app.

## Approach
- Build a **scraper/importer** that downloads and normalizes content into `content/generated/`.
- Keep a clear separation:
  - `content/source/` = raw downloaded HTML + assets (immutable)
  - `content/generated/` = structured lesson JSON used by the app

## TBD
- Whether to store only *references/links* (e.g., YouTube) vs bundling media.
