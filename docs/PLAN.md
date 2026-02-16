# Plan

## Goal
Build a Duolingo-style app for Turoyo using your existing class materials.

## Phase 0 — Decisions (blocking)
1. Target platforms: iOS/Android only, or also Web?
2. Preferred stack: Flutter / React Native / native?
3. Do you need accounts + sync across devices, or offline-only first?
4. Do you need audio (TTS/recordings) in v1?

## Phase 1 — MVP (4–6 weeks equivalent)
- Course tree: Sections → Units → Lessons
- Exercise engine (core types):
  - Multiple choice (word/translation)
  - Tap-to-build sentence
  - Type the answer
  - Match pairs
- SRS / review queue (basic Leitner/SM-2)
- Progress tracking (XP, streak)
- Local-first storage; optional auth later

## Phase 2 — Content pipeline
- Standardize your materials into `content/source/` (CSV/JSON)
- Build importer to generate:
  - normalized lexicon
  - prompts + distractors
  - lesson bundles
  - audio manifest

## Phase 3 — Polish
- Duolingo-like UI, animations, sound
- Admin tooling for content editing

## Deliverables
- Clean repo, reproducible builds, CI, and exportable assets.
