
# RDP: StageReady

## 1. Executive Summary
StageReady is a cross-platform mobile app (Android + iOS) for musicians to organize chord sheets, build gig-ready setlists, and perform **without manual scrolling**. It imports user-provided chord sheets (text/ChordPro) and optionally fetches content from licensed providers via user Personal Access Tokens (PAT). A formatting service (AI + rules engine) normalizes sheets, aligns chords over lyrics, fits to the device viewport, and supports transpose/capo/Nashville Numbers. Users authenticate and sync their library across devices while maintaining **offline-first** performance for gigs.

## 2. Goals & Non-Goals
**Goals**
- Seamless directory/setlist management with drag-and-drop ordering.
- Import from text/ChordPro and pluggable provider adapters (via PAT) subject to licensing.
- AI-powered formatting to eliminate scrolling; tempo-synced auto-scroll optional.
- User login, cloud sync, and offline cache.
- Transpose, capo, Nashville Numbers view; high-contrast/dark mode.

**Non-Goals (for MVP)**
- Social sharing network or public marketplace of tabs.
- Audio-to-chords transcription.
- Real-time multi-user collaboration.

## 3. Success Metrics (KPIs)
- Time-to-first-setlist < 3 minutes.
- p95 sheet open/render < 250 ms (cached).
- Crash-free sessions > 99.8%.
- Offline usability (acceptance tests) = 100% for library/setlist/performance.
- NPS > 40 within 90 days.

## 4. User Personas & Journeys
- **Gigging Guitarist**: Needs large readable charts, quick transpose, no scrolling.
- **Band Leader**: Curates sets per gig; exports PDFs and orders easily.
- **Session Player**: Imports on the fly; dark/high-contrast stage mode.

Top workflows:
1) Import or fetch song → format → add to setlist → perform.
2) Create gig directory → drag songs into order → stage mode (prevent sleep).
3) Sign in on new device → library/setlists sync → perform offline.

## 5. Scope (MVP vs. v1 vs. vNext)
**MVP**
- Auth (email/password or passwordless) & basic cloud sync.
- Import sources: local text/ChordPro; provider fetch via PAT adapter (licensed use only).
- Formatter (LLM + rules engine fallback) → ChordPro normalization; viewport-fit; avoid-scroll.
- Directories & setlists; move/copy; reorder.
- Offline cache; dark/high-contrast; large font toggle; PDF export.

**v1**
- Tempo-synced auto-scroll; tap tempo.
- Capo & transpose; Nashville Numbers.
- Bluetooth page-turn (AirTurn/PageFlip-class devices).
- Share setlists via read-only links.

**vNext**
- Collaboration; live sync; annotations.
- Audio BPM/time signature suggestions.
- Team spaces; iPad stage mode.

## 6. Requirements
### 6.1 Functional
- Add/manage provider PATs; import song by provider ID.
- Parse free-form text into normalized **ChordPro**; preserve sections and bar breaks.
- Organize by directories (gigs) and setlists; reorder with drag-and-drop.
- Performance Mode: adaptive layout to avoid scrolling; optional auto-scroll/page-turn.
- Export to PDF; import `.pro/.cho/.txt`.

### 6.2 Non-Functional
- Offline-first with background sync; optimistic UI; conflict resolution via `sheet_versions`.
- Accessibility: WCAG 2.2 AA; dynamic type; screen reader labels.
- Security: encrypted at rest/in transit; PAT secret storage with rotation; rate-limited provider calls.
- Observability: structured logs, metrics, traces; crash reporting.
- Battery/thermal controls during Performance Mode.

## 7. Constraints & Assumptions
- Mobile: **React Native** (Expo or bare), TypeScript.
- Backend: **.NET 8** Minimal APIs / **Azure Functions** (BFF).
- Cloud: Azure (App Service/Functions, Postgres, Blob Storage, Key Vault, App Insights).
- Provider content is **subject to licensing/TOS**; only import content the user is permitted to access.

## 8. Risks & Mitigations
- **Licensing/TOS for tabs/lyrics**: Use provider-approved APIs or user-supplied content; store only what’s permitted; include export for user-owned sheets.
- **Network variability at gigs**: Offline cache and pre-render; background sync; local-only import path.
- **Device fragmentation**: QA across popular devices; adaptive layout; fallback fonts.

## 9. Dependencies
- Azure AD B2C (or Entra External ID) for auth.
- Azure OpenAI for formatting (optional); rules engine fallback.
- Provider adapters (Ultimate Guitar or others) wired via interface.

## 10. Stakeholders & RACI
- Product Owner, Tech Lead (mobile), Tech Lead (backend), QA, Legal.

## 11. Timeline & Milestones
- **Sprint 1–2 (MVP core)**: Auth, local import, formatter, directories/setlists, offline cache.
- **Sprint 3–4 (MVP polish)**: PDF export, PAT adapter skeleton, telemetry, accessibility.
- **Sprint 5–6 (v1 enablers)**: auto-scroll, transpose/capo, Nashville, pedal support.

## 12. Monetization
- **Free tier**: Local library, manual import, basic rules-engine formatting.
- **Pro (subscription)**: Cloud sync; AI formatter; PDF export; pedal support; advanced setlist tools.
- Price targets: $4.99–$9.99/month or $29.99 lifetime unlock; regional pricing per store policy.
- Potential affiliate links for licensed provider content (subject to agreements).

## 13. Appendices
- Wireframes: Library, Import, Sheet Viewer, Setlist Manager, Performance Mode.
- Glossary: ChordPro, Nashville Numbers, PAT, BFF, Auto-scroll.
