# ADR 0001 — Tech stack

- Date: 2026-02-16
- Status: Accepted

## Decision
Use **Flutter** for a single codebase targeting **iOS + Android + Web**.

## Rationale
- One UI implementation across platforms
- Great control of typography (needed for Syriac/Serto)
- Offline-first friendly (SQLite/Isar/Hive)
- Web support for a companion experience

## Notes
- Backend is optional for MVP; start local-first.
- Add auth/sync later if needed.
