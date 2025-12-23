
# Sprint 1 Backlog — ChordKeeper (2 weeks)

## Goals
Deliver the core skeleton enabling: authentication, local import, rules-engine formatter, directories/setlists, and offline cache. Keep cloud costs minimal by using serverless and on-device processing where possible.

## Epics & Stories

### E1: Project & CI/CD Setup
- **S1.1** Create repo structure (mobile + server) and GitHub Actions for build/test.
  - *Definition of Done*: RN app builds for Android/iOS; server compiles/tests; basic linting.
- **S1.2** IaC scaffolding (Bicep/Terraform) for Dev: Azure Functions, Postgres, Blob, Key Vault, App Insights.
  - *DoD*: Infra plan applied to Dev; secrets injected via Key Vault references.

### E2: Auth & Session (External ID)
- **S2.1** Configure Entra External ID (or existing B2C) tenant for email/password.
  - *DoD*: Signup/login works in Dev; JWT access/refresh; mobile secured API calls.
- **S2.2** Mobile login screen + token storage; logout.
  - *DoD*: Persisted session; auto-refresh; error handling.

### E3: Library & Offline Cache
- **S3.1** Local SQLite/AsyncStorage data layer; sync engine skeleton.
  - *DoD*: Sheets/directories cached; offline reads work.
- **S3.2** Library screen with search/filter; directory CRUD.
  - *DoD*: Create/rename/delete directory; list sheets.

### E4: Import & Formatting (Rules Engine)
- **S4.1** Import Wizard: paste text or upload `.pro/.txt`; parse to ChordPro.
  - *DoD*: Successful import stored as `sheets` with metadata.
- **S4.2** Rules-engine formatter (on-device): chord detection, line wrap, viewport-fit.
  - *DoD*: Sheet renders without manual scroll for common cases; metrics shown.

### E5: Setlists & Performance Mode (MVP)
- **S5.1** Setlist CRUD; add/move/reorder items.
  - *DoD*: Persisted order; drag-and-drop UI.
- **S5.2** Performance Mode v0: large font, prevent sleep, previous/next page.
  - *DoD*: Stage-ready rendering; no network dependency.

### E6: Telemetry & QA
- **S6.1** App Insights logging; correlationId propagation.
  - *DoD*: Logs for auth, import, format, setlist actions.
- **S6.2** Tests: unit (formatter, transpose), basic E2E (import→perform), API contract validation.
  - *DoD*: CI green; coverage baseline.

## Estimates (ideal days)
- E1: 2d
- E2: 3d
- E3: 3d
- E4: 3d
- E5: 3d
- E6: 2d

## Risks & Mitigations
- Provider licensing: Defer to v1 adapter once agreements are clear.
- Mobile performance: Optimize rendering; memoization; precompute wraps.
- Auth complexity: Use proven templates; keep to password + email in MVP.

## Acceptance Criteria (Sprint Demo)
- User can sign up/login and stay signed in.
- User can import a text/ChordPro sheet; it formats to fit the device.
- User can create directories and setlists; reorder songs.
- Performance Mode displays a setlist song without manual scrolling.
- Actions logged in App Insights; offline reading works.
