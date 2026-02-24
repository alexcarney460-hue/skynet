# Neon Skynet Dashboard Shell

Date: 2026-02-24

## Overview

The dashboard landing page (`app/page.tsx`) now renders the neon Skynet shell called for in Phase 2. The layout uses reusable components with deterministic dummy data to showcase the intended pink / blue / purple visual direction.

## Components

| Component | File | Notes |
| --- | --- | --- |
| `TopCommandBar` | `app/components/TopCommandBar.tsx` | Mission header displaying operators online, mission clock (auto-formatted to America/Los_Angeles), signal integrity meter, and the current command queue. |
| `MetricTile` | `app/components/MetricTile.tsx` | Neon metric cards with configurable gradients and status deltas. |
| `ThreatRadar` | `app/components/ThreatRadar.tsx` | Synthetic radar visualization plotting threat vectors based on `vector` (degrees) and `intensity` (0-1). Includes textual summaries per threat. |
| `GlobalMap` | `app/components/GlobalMap.tsx` | Placeholder global mesh map with animated node markers plus a node inventory list. |

All components are server-safe and consume typed props, enabling future data hookups without refactoring the view layer.

## Dummy Data Entrypoints

Dummy data lives at the top of `app/page.tsx`:

- `metrics`: Values for the metric tiles
- `commandQueue`: Items rendered in the TopCommandBar queue
- `threatVectors`: Threat radar inputs
- `globalNodes`: Nodes rendered on the mesh map

Swap these arrays with live data sources (RPC, API calls, etc.) to hydrate the dashboard. The shell is otherwise production-ready.

## Styling

- `app/globals.css` now establishes the neon gradient palette, dark color scheme, and font defaults
- Page-level background uses layered gradients and grid lines for the holographic vibe

## Build

`npm run build` passes, confirming the new layout compiles cleanly under Next.js 16 / TypeScript 5.
