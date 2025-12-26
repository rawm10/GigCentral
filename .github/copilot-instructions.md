# StageReady Project Context

## Project Overview
StageReady (formerly ChordKeeper) is a mobile app for organizing chord sheets into gig-ready setlists with a Phase 2 gig marketplace module.

## Architecture
- **Client**: React Native (Expo 54), TypeScript, expo-router 6, React Query
- **Backend**: .NET 8 Minimal APIs, Entity Framework Core, PostgreSQL 18
- **Storage**: PostgreSQL database "stageready" (lowercase)
- **Auth**: JWT tokens with SecureStore (mobile) / localStorage fallback (web)
- **Development**: Windows PowerShell, VS Code, local development environment

## Tech Stack
- **Frontend**: React Native 0.81.5, Expo 54.0.30, expo-router 6.0.21, TypeScript, @tanstack/react-query
- **Backend**: .NET 8, PostgreSQL, EF Core, JWT authentication
- **Hosting**: Local development (http://0.0.0.0:5000 for backend, Expo for mobile)

## Data Model (PostgreSQL)
- **users**: id (UUID PK), external_sub, email (UNIQUE), display_name, created_at
- **providers**: id (UUID PK), user_id (FK), name, pat_cipher, created_at
- **directories**: id (UUID PK), user_id (FK), name, description, sort_order, created_at
- **sheets**: id (UUID PK), user_id (FK), title, artist, key, capo, format (chordpro/plain), body (TEXT), source, created_at, updated_at
- **sheet_versions**: id (UUID PK), sheet_id (FK), body, notes, created_at
- **setlists**: id (UUID PK), directory_id (FK), name, created_at
- **setlist_items**: id (UUID PK), setlist_id (FK), sheet_id (FK), position
- **preferences**: id (UUID PK), user_id (FK), font_scale, theme, auto_scroll, scroll_bpm, high_contrast

## Key API Endpoints
- Auth: `/api/v1/auth/signup`, `/api/v1/auth/login`
- Sheets: `/api/v1/sheets` (CRUD), `/api/v1/sheets/import`, `/api/v1/sheets/{id}/transpose`
- Directories: `/api/v1/directories` (CRUD)
- Setlists: `/api/v1/setlists` (CRUD)
- Preferences: `/api/v1/preferences`

## Mobile App Structure
- `mobile/app/_layout.tsx`: Root layout with QueryClientProvider, AuthProvider, and ThemeProvider
- `mobile/app/index.tsx`: Auth routing (redirects to login or library)
- `mobile/app/(tabs)/`: Bottom tab navigation (library, setlists, settings)
- `mobile/app/sheet/[id].tsx`: Sheet viewer with transpose, edit, delete
- `mobile/app/import.tsx`: Import sheets with title, artist, key fields
- `mobile/contexts/AuthContext.tsx`: Authentication state management
- `mobile/contexts/ThemeContext.tsx`: Theme state management (light/dark/system modes)
- `mobile/lib/services.ts`: API service layer
- `mobile/lib/api.ts`: Axios configuration

## Theming System (REQUIRED for all new UI)
**Every new page and component MUST use the theme system:**

```typescript
import { useTheme } from '../contexts/ThemeContext';

export default function MyScreen() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  // ... component code
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
  },
  text: {
    color: theme.colors.text,
  },
  // ... more styles
});
```

### Theme Color Properties (use these exclusively):
- `theme.colors.background` - Main screen backgrounds
- `theme.colors.surface` - Cards, headers, modals, elevated surfaces
- `theme.colors.primary` - Buttons, links, active states, FABs
- `theme.colors.text` - Primary text color
- `theme.colors.textSecondary` - Secondary/muted text, labels
- `theme.colors.border` - Borders, dividers, separators
- `theme.colors.error` - Error states, delete/destructive actions
- `theme.colors.success` - Success states, confirmations
- `theme.colors.inputBackground` - TextInput backgrounds
- `theme.colors.tabBarBackground` - Bottom tab bar background
- `theme.colors.tabBarInactive` - Inactive tab icons

### Required for ALL Components:
- TextInput: `placeholderTextColor={theme.colors.textSecondary}`
- ActivityIndicator: `color={theme.colors.primary}`
- Switch: `trackColor={{ false: theme.colors.border, true: theme.colors.primary }}`
- Icons: Use `theme.colors.primary` for interactive, `theme.colors.border` for inactive

### Theme Modes:
- **light**: Light theme colors
- **dark**: Dark theme colors  
- **system**: Automatically follows device theme preference (default)
- User preference stored in backend `preferences.theme` field

## ChordPro Format
- Metadata: `{title: ...}`, `{artist: ...}`, `{key: ...}`, `{capo: ...}`
- Chords: Must be wrapped in brackets like `[C]`, `[Am]`, `[G7]`
- Formatter: Automatically brackets standalone chords, skips metadata lines
- Transpose: Changes chords by semitones, updates key field

## Important Notes
- Database name must be lowercase: "stageready"
- Backend listens on http://0.0.0.0:5000 in development
- Mobile .env uses local IP: EXPO_PUBLIC_API_URL=http://10.0.0.50:5000/api/v1
- Windows Firewall rule required for port 5000
- JWT claims: Try Sub, then NameIdentifier, then uid, then user_id
- ChordPro metadata lines start with `{` and should not be modified by chord bracketing
- React Query invalidation triggers UI refresh after mutations

## Current Implementation Status
### Completed
- ✅ Complete rebrand from ChordKeeper to StageReady
- ✅ PostgreSQL database setup with migrations
- ✅ Backend API running on network
- ✅ Mobile app rendering and navigation
- ✅ Authentication (signup/login)
- ✅ Import sheets with metadata
- ✅ View, edit, delete sheets
- ✅ Transpose functionality with chord bracketing
- ✅ Directory (setlist) creation
- ✅ Performance mode with screen wake-lock
- ✅ Light/Dark/System theme switching across all pages
- ✅ Theme preferences stored in backend

### In Progress
- Directory/setlist management UI
- Sheet organization within directories

### Pending
- Phase 2 gig marketplace features
- Provider integrations
- Export to PDF
- Advanced formatting options

## Development Guidelines
- Use npm with --legacy-peer-deps for mobile dependencies
- Backend changes require restart: Stop dotnet process, run `dotnet run` from StageReady.Api directory
- Mobile hot-reloads automatically
- Use `router.push()` for navigation, `router.back()` to go back
- React Query: `invalidateQueries` after mutations to refresh data
- Error handling: Try-catch with Alert.alert for user feedback
