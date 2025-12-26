# StageReady

StageReady is a cross-platform mobile application (iOS/Android) for musicians to organize chord sheets, build gig-ready setlists, perform without manual scrolling, **discover gigs, and manage bookings with venues**. 

**Phase 1 (Core Features)**: Chord sheet management and setlist organization  
**Phase 2 (Gig Marketplace)**: Connect musicians with venues, manage conversations, and coordinate performance dates

## Features

### Phase 1: ChordKeeper (Current)
- **Chord Sheet Management**: Import, organize, and edit chord sheets
- **Smart Formatting**: AI-powered ChordPro formatting with rules-engine fallback
- **Setlist Organization**: Create directories and setlists for gigs
- **Performance Mode**: Large, readable layouts with screen wake-lock
- **Transpose & Capo**: Easy key changes and Nashville Numbers support
- **Offline-First**: Full functionality without internet connection
- **Cloud Sync**: Access your library across devices

### Phase 2: Gig Marketplace
- **Gig Discovery**: Browse and search local gig opportunities by location, genre, and date
- **Smart Matching**: AI-powered recommendations based on your setlists and preferences
- **One-Tap Applications**: Apply to gigs using your existing setlists as portfolios
- **Venue Tools**: Post gigs, review applicants, manage bookings
- **Conversation Management**: Thread-based messaging between venues and musicians with read receipts and notifications
- **Date & Calendar Management**: Coordinate performance dates, manage availability, schedule rehearsals, and sync with calendar apps
- **Booking Management**: Track applications, confirmed gigs, performance history, and contract status
- **Availability Calendar**: Musicians set available dates; venues view musician availability before booking
- **Automated Reminders**: Notifications for upcoming gigs, pending responses, and contract deadlines
- **Ratings & Reviews**: Build reputation through verified performance reviews
- **Multi-Party Coordination**: Group conversations for bands, venues, and event coordinators

## Architecture

### Backend (.NET 8 API)
- **Location**: `/backend/StageReady.Api`
- **Stack**: .NET 8 Minimal APIs, Entity Framework Core, PostgreSQL
- **Features**: 
  - JWT Authentication
  - Sheet CRUD operations
  - ChordPro formatting service
  - Provider adapters for licensed content
  - Preferences management

### Mobile App (React Native)
- **Location**: `/mobile`
- **Stack**: React Native with Expo, TypeScript, React Query
- **Features**:
  - Tab-based navigation (Library, Setlists, Settings)
  - Authentication with secure token storage
  - Offline-first data caching
  - Performance mode with keep-awake

## Getting Started

See [SETUP.md](SETUP.md) for complete setup instructions.

### Quick Start

#### Prerequisites
- .NET 8 SDK
- PostgreSQL 14+
- Node.js 18+
- Expo Go app on your phone

#### Backend Setup
```powershell
cd backend/StageReady.Api
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Database=stageready;Username=postgres;Password=yourpassword"
dotnet user-secrets set "JwtSettings:SecretKey" "YourSuperSecretKeyHereThatIsAtLeast32CharactersLong!"
dotnet user-secrets set "JwtSettings:Issuer" "StageReady.Api"
dotnet user-secrets set "JwtSettings:Audience" "StageReady.Client"
dotnet ef database update
$env:ASPNETCORE_ENVIRONMENT="Development"
dotnet run
```

#### Mobile Setup
1. **Add firewall rule** for port 5000 (see [SETUP.md](SETUP.md#first-time-setup-steps))
2. **Configure mobile app**:
   ```powershell
   cd mobile
   # Create .env file with your computer's IP address
   echo "EXPO_PUBLIC_API_URL=http://YOUR_IP:5000/api/v1" > .env
   npm install --legacy-peer-deps
   npm start
   ```
3. **Scan QR code** with Expo Go app (ensure phone and PC on same WiFi)

4. **Run the API**:
   ```powershell
   dotnet run
   ```

   API will be available at `https://localhost:5001` (or configured port)

### Mobile Setup

1. **Navigate to mobile directory**:
   ```powershell
   cd mobile
   ```

2. **Install dependencies**:
   ```powershell
   npm install
   ```

3. **Update API URL** in `lib/api.ts`:
   ```typescript
   const API_URL = 'http://localhost:5000/api/v1';
   ```
   
   For iOS simulator, use `http://localhost:5000`  
   For Android emulator, use `http://10.0.2.2:5000`

4. **Start Expo**:
   ```powershell
   npm start
   ```

5. **Run on device/simulator**:
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app for physical device

## Database Schema

See [spec.md](ai/spec.md) for complete schema. Key tables:

- `users` - User accounts
- `sheets` - Chord sheets
- `directories` - Organization folders (gigs)
- `setlists` - Song lists for performances
- `setlist_items` - Songs in setlists
- `preferences` - User display preferences
- `providers` - Third-party service integrations (PAT storage)

## API Endpoints

Full OpenAPI specification: [openapi.yaml](ai/openapi.yaml)

Key endpoints:
- `POST /api/v1/auth/signup` - Create account
- `POST /api/v1/auth/login` - Sign in
- `GET /api/v1/sheets` - List sheets
- `POST /api/v1/sheets/import` - Import sheet
- `POST /api/v1/sheets/{id}/transpose` - Transpose key
- `GET /api/v1/directories` - List directories
- `POST /api/v1/setlists` - Create setlist

## Development

### Backend Development

```powershell
cd backend/ChordKeeper.Api
dotnet watch run
```

### Mobile Development

```powershell
cd mobile
npm start
```

For hot reload, the app will automatically refresh on file changes.

### Adding Database Migrations

```powershell
cd backend/ChordKeeper.Api
dotnet ef migrations add YourMigrationName
dotnet ef database update
```

## Project Structure

```
GigCentral/
├── ai/
│   ├── openapi.yaml          # API specification
│   ├── RDP.md                # Requirements document
│   └── spec.md               # Technical specification
├── backend/
│   └── ChordKeeper.Api/
│       ├── Data/             # EF Core context
│       ├── Models/           # Entity models
│       ├── DTOs/             # Data transfer objects
│       ├── Services/         # Business logic
│       ├── Endpoints/        # API endpoints
│       └── Program.cs        # App entry point
└── mobile/
    ├── app/                  # Expo Router screens
    │   ├── (tabs)/          # Tab navigation
    │   ├── login.tsx        # Auth screens
    │   └── sheet/           # Sheet viewer
    ├── lib/                  # Services & utilities
    ├── contexts/             # React contexts
    └── package.json
```

## Configuration

### Backend Configuration

Edit `backend/ChordKeeper.Api/appsettings.json`:

- `ConnectionStrings:DefaultConnection` - PostgreSQL connection
- `JwtSettings:SecretKey` - JWT signing key (min 32 chars)
- `JwtSettings:Issuer` - Token issuer
- `JwtSettings:Audience` - Token audience

### Mobile Configuration

Edit `mobile/lib/api.ts`:

- `API_URL` - Backend API base URL

## Production Deployment

### Backend (Azure)

1. Create Azure App Service or Function App
2. Configure PostgreSQL (Azure Database for PostgreSQL)
3. Set environment variables:
   - Connection strings
   - JWT settings
   - Azure Key Vault for secrets
4. Deploy via GitHub Actions or Azure CLI

### Mobile (App Stores)

1. **iOS**:
   ```powershell
   npx expo build:ios
   ```
   Submit to App Store Connect

2. **Android**:
   ```powershell
   npx expo build:android
   ```
   Submit to Google Play Console

## Testing

### Backend Tests
```powershell
cd backend/ChordKeeper.Api.Tests
dotnet test
```

### Mobile Tests
```powershell
cd mobile
npm test
```

## License

See [LICENSE](LICENSE) file for details.

## Documentation

- [Requirements Document (RDP)](ai/RDP.md)
- [Technical Specification](ai/spec.md)
- [API Documentation](ai/openapi.yaml)

## Support

For issues and questions, please create an issue in the repository.

