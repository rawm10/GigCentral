
# spec.md: ChordKeeper

## 1. Overview
ChordKeeper is a mobile app (iOS/Android) that organizes chord sheets into gig-ready setlists. It imports user content and, where licensed, fetches provider content via PAT. A formatter service normalizes to ChordPro, aligns chords over lyrics, fits content to device viewport, and supports transpose/capo/Nashville. Performance Mode avoids manual scrolling with large, readable layouts.

## 2. Architecture
- **Client**: React Native (TypeScript), Expo Router, React Query; native modules for pedal support.
- **Backend (BFF)**: .NET 8 Minimal APIs or Azure Functions: auth/session, provider adapters, formatting service, sync APIs, telemetry.
- **Storage**: Postgres for entities; Azure Blob for exports; Redis for caches.
- **Secrets**: Azure Key Vault for PATs and credentials.
- **Observability**: App Insights + OpenTelemetry/W3C TraceContext.
- **CI/CD**: GitHub Actions → build/test/deploy; environments: Dev/Test/Prod.

Interaction: Mobile → BFF (REST JSON) → Provider → BFF → DB/Blob; on-device import path bypasses network.

## 3. Tech Stack
- **Frontend**: React Native (Expo), TypeScript, React Query/Zustand, Tailwind RN or Native Base.
- **Backend**: .NET 8 Minimal APIs/Azure Functions; EF Core; FluentValidation.
- **AI**: Azure OpenAI for formatting (optional); deterministic rules-engine fallback.
- **Auth**: Entra External ID (successor to Azure AD B2C) or existing B2C tenant; JWT tokens.
- **Hosting**: Azure Functions (Consumption) or App Service; Postgres; Blob; Key Vault.
- **Testing**: Jest/RTL (mobile), xUnit (server), Playwright (E2E), Dredd/Prism (API contracts).

## 4. Data Model (Postgres)
**users**(id UUID PK, external_sub TEXT UNIQUE, email TEXT UNIQUE, display_name TEXT, created_at TIMESTAMP)
**providers**(id UUID PK, user_id UUID FK users, name TEXT, pat_cipher TEXT, created_at TIMESTAMP)
**directories**(id UUID PK, user_id UUID FK users, name TEXT, description TEXT, sort_order INT, created_at TIMESTAMP)
**sheets**(id UUID PK, user_id UUID FK users, title TEXT, artist TEXT, key TEXT, capo INT, format TEXT CHECK IN('chordpro','plain'), body TEXT, source TEXT, created_at TIMESTAMP, updated_at TIMESTAMP)
**sheet_versions**(id UUID PK, sheet_id UUID FK sheets, body TEXT, notes TEXT, created_at TIMESTAMP)
**setlists**(id UUID PK, directory_id UUID FK directories, name TEXT, created_at TIMESTAMP)
**setlist_items**(id UUID PK, setlist_id UUID FK setlists, sheet_id UUID FK sheets, position INT)
**preferences**(id UUID PK, user_id UUID FK users, font_scale REAL, theme TEXT, auto_scroll BOOLEAN, scroll_bpm INT, high_contrast BOOLEAN)

Indexes:
- sheets(user_id, title)
- setlist_items(setlist_id, position)

## 5. API Contracts (summary)
OpenAPI v3 file provided separately in `openapi.yaml`. Highlights:
- Auth: `/auth/signup`, `/auth/login`, `/auth/refresh`
- Providers: `/providers` (POST add PAT, GET list)
- Sheets: CRUD, `/sheets/import`, `/sheets/{id}/format`, `/sheets/{id}/transpose`
- Directories & Setlists: CRUD; `/setlists/{id}/items`
- Preferences: `/preferences`
- Export: `/exports/pdf`

## 6. Security
- **AuthN**: JWT access/refresh; secure cookie for refresh on mobile if desired.
- **AuthZ**: user-owned resources; future scopes for shared setlists.
- **Secrets**: PAT encrypted in Key Vault; provider calls rate-limited.
- **Data Protection**: TLS in transit; storage encryption at rest; PII minimized (email only).
- **Threats**: STRIDE-lite; audit logs on provider usage; DoS protection.

## 7. Frontend Specification
- Screens/Routes: Login, Library, Directory, Setlist, Sheet Viewer/Editor, Import Wizard, Performance Mode, Settings.
- Components: SheetViewer (ChordPro renderer), SetlistManager (drag-and-drop), ImportWizard, PATManager, TransposeControls.
- Accessibility: WCAG 2.2 AA; font scaling 1.0–2.5x; high-contrast theme; labels.

### 7.1 Theming System
**ALL new pages and components MUST use the theme system:**
- Import `useTheme` hook from `contexts/ThemeContext`
- Call `const { theme } = useTheme()` in component
- Create styles using `createStyles(theme)` function pattern
- Use theme colors for ALL UI elements:
  - `theme.colors.background` - screen backgrounds
  - `theme.colors.surface` - cards, headers, modals
  - `theme.colors.primary` - buttons, active states, links
  - `theme.colors.text` - primary text
  - `theme.colors.textSecondary` - secondary/muted text
  - `theme.colors.border` - borders, dividers
  - `theme.colors.error` - error states, delete actions
  - `theme.colors.success` - success states
  - `theme.colors.inputBackground` - text input backgrounds
  - `theme.colors.tabBarBackground` - bottom tab bar
  - `theme.colors.tabBarInactive` - inactive tab icons
- Set `placeholderTextColor={theme.colors.textSecondary}` on ALL TextInput components
- Use `color={theme.colors.primary}` for ActivityIndicator components
- Theme modes: 'light', 'dark', 'system' (follows device)
- Theme preference stored in backend preferences table

## 8. Workflows
**Provider Import**
1) User adds PAT → stored encrypted.
2) User selects provider + song ID → adapter fetches content within TOS → format → save sheet.

**AI Formatting**
- Prompt: convert free text to ChordPro, align chords ahead of syllable, preserve bar/section breaks, wrap to viewport columns, avoid orphan chords; return structured tokens.
- Fallback rules: regex chord detection; syllable alignment; soft wrapping; transpose/capo conversion; Nashville toggle.

**Performance Mode**
- Large-font layout; prevent sleep; pedal navigation (prev/next page); optional tempo auto-scroll.

## 9. Telemetry & Ops
- Logs: correlationId per request.
- Metrics: format_latency_p95, import_success_rate, offline_hits, crash_free_sessions.
- Traces: mobile → BFF → provider → formatter.
- Alerts: API 5xx rate, auth failure spike, PAT adapter errors.

## 10. Testing Strategy
- Unit: formatter rules, transpose math, Nashville conversion.
- Contract: OpenAPI tests.
- E2E: import → format → perform → export.
- Performance: format API 100 RPS, p95 < 250 ms (cached).

## 11. Deployment & Environments
- Dev/Test/Prod; IaC via Bicep/Terraform for Functions/App Service, Postgres, Blob, Key Vault, External ID.
- Blue/green; feature flags for adapters and AI versions.

## 12. Compliance & Accessibility
- Respect provider licensing; store only user-permitted content.
- WCAG audits for mobile.

## 13. NFRs
- Availability: 99.9%.
- Latency: <250 ms p95 for format endpoint (cached); <500 ms p95 for read APIs.
- Offline: library/setlist viewing & performing fully offline.
- Battery: 2-hour stage mode without thermal throttling.

## 14. Open Questions
- Ultimate Guitar integration viability (licensing & TOS) vs. local-only import.
- Monetization tiering and regional store prices.
- Share links scope and permission model.

## 15. Versioning
- API `/api/v1`; EF Core migrations; `sheet_versions` for edits.
