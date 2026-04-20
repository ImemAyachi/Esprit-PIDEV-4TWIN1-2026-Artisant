# FloorPlan AI — Universal Architectural Specification Guide

This repository includes the **full verbatim specification** extracted from  
`FloorPlan_AI_Architecture_Guide.docx` (user-supplied). **Do not edit the `.txt` canonical copy** except to replace it when the source Word file is updated.

## Canonical full text (every rule, table, and message)

| File | Description |
|------|----------------|
| `FloorPlan_AI_Architecture_Guide.txt` | Complete extraction — **source of truth** for Sections 1–8 |

## Document map (all sections — no omissions)

1. **SECTION 1 — SIZE & DIMENSION INPUTS** — Area-only, W×H, ranges, defaults by building type, unit conversion.
2. **SECTION 2 — ROOM TYPE INPUTS** — Alias dictionary, counts, size overrides.
3. **SECTION 3 — SPATIAL CONSTRAINTS & RELATIONSHIPS** — Proximity, orientation/light, layout style keywords.
4. **SECTION 4 — NORM COMPLIANCE TABLES** — Min/max m² by budget band (studio → estate).
5. **SECTION 5 — AREA DISTRIBUTION ALGORITHM** — Gross vs net (wall factors), zone %, private split.
6. **SECTION 6 — FOOTPRINT & ASPECT RATIO RULES** — Default ratios by area; special plot cases.
7. **SECTION 7 — VALIDATION RULES & ERROR HANDLING** — Hard vs soft rules, auto-correction order.
8. **SECTION 8 — USER FEEDBACK MESSAGES** — FR/EN UI copy for assumptions and violations.

Closing line in source: *“This document must be included in the system prompt / context of the generation engine.”*

## Implementation requirement

Any change to parsing, budgets, validation, or copy must remain **consistent** with `FloorPlan_AI_Architecture_Guide.txt`.  
Programmatic shortcuts live in `server/src/plan2d/floorPlanArchitectureGuide.js` (factors and loaders) and must be updated when the spec changes.
