# Phase 2 — Track A4 (Product/UX)

Date: 2026-02-23

## Goal
Tighten user-facing onboarding by removing confusing / conflicting docs.

## Changes shipped
- **README.md**
  - Aligned API paths to the actual Next.js routes (`/api/v1/*`), including `drift`.
  - Clarified endpoints support **GET + POST** where implemented.
  - Updated CLI section to reflect the current CLI command set (demo/status/artifacts/analyze/optimize), instead of older `pressure/verbosity/half-life` commands.
  - Fixed a middleware snippet typo: `createSkyntNetMiddleware` → `createSkynetMiddleware` (doc-only).
- **START_HERE.md**
  - Updated “Try the CLI” commands to match the current CLI behavior (`skynet` runs demo when called without args).

## Why
The repo currently contains both “cognitive infrastructure” APIs and a registry-focused CLI; mismatched commands/paths made first-run confusing.

## Follow-ups (optional)
- Consider adding a short note explaining the **two surfaces**:
  1) HTTP cognitive metrics API (`/api/v1/*`)
  2) CLI (registry + diagnostics)
- If desired, rename/adjust CLI descriptions to better match the repo’s primary positioning.
