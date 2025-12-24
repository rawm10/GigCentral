# Development Environment Setup

## Backend Environment Variables

Create a `.env` file in `backend/ChordKeeper.Api/` (or use User Secrets):

```env
# Database
ConnectionStrings__DefaultConnection=Host=localhost;Database=stageready;Username=postgres;Password=yourpassword

# JWT Settings
JwtSettings__SecretKey=YourSuperSecretKeyHereThatIsAtLeast32CharactersLong!
JwtSettings__Issuer=StageReady.Api
JwtSettings__Audience=StageReady.Client

# Azure (Optional - for production)
Azure__KeyVaultUrl=https://your-keyvault.vault.azure.net/
Azure__TenantId=your-tenant-id
Azure__ClientId=your-client-id
Azure__ClientSecret=your-client-secret

# OpenAI (Optional - for AI formatting)
OpenAI__Endpoint=https://your-openai.openai.azure.com/
OpenAI__ApiKey=your-api-key
OpenAI__DeploymentName=gpt-4
```

## Mobile Environment Variables

Create a `.env` file in `mobile/`:

```env
# API Configuration
EXPO_PUBLIC_API_URL=http://localhost:5000/api/v1

# For production
# EXPO_PUBLIC_API_URL=https://api.chordkeeper.app/api/v1
```

## Using User Secrets (Recommended for Backend)

Instead of a .env file, use .NET User Secrets for development:

```powershell
cd backend/StageReady.Api

# Initialize user secrets
dotnet user-secrets init

# Add secrets (replace 'yourpassword' with your PostgreSQL password)
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Database=stageready;Username=postgres;Password=yourpassword"
dotnet user-secrets set "JwtSettings:SecretKey" "YourSuperSecretKeyHereThatIsAtLeast32CharactersLong!"
dotnet user-secrets set "JwtSettings:Issuer" "StageReady.Api"
dotnet user-secrets set "JwtSettings:Audience" "StageReady.Client"
```

**Note**: Database name is `stageready` (lowercase). Make sure this matches your PostgreSQL database name.

## PostgreSQL Setup

### Using Docker (Recommended)

```powershell
# Run PostgreSQL in Docker
docker run --name stageready-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=stageready -p 5432:5432 -d postgres:14

# Connect to verify
docker exec -it stageready-db psql -U postgres -d stageready
```

### Local Installation

1. Install PostgreSQL 14+
2. Create database:
   ```sql
   CREATE DATABASE stageready;
   ```

## First-Time Setup Steps

1. **Clone repository**
2. **Setup PostgreSQL** (using Docker or local installation)
3. **Configure backend** (User Secrets or appsettings.Development.json)
4. **Run migrations**:
   ```powershell
   cd backend/StageReady.Api
   dotnet ef database update
   ```
5. **Start backend**:
   ```powershell
   dotnet run
   ```
6. **Install mobile dependencies**:
   ```powershell
   cd mobile
   npm install
   ```
7. **Start mobile app**:
   ```powershell
   npm start
   ```

## Troubleshooting

### Backend won't start
- Check PostgreSQL is running
- Verify connection string
- Check JWT SecretKey is at least 32 characters

### Mobile can't connect to API
- Update API_URL in `lib/api.ts`
- For Android emulator, use `http://10.0.2.2:5000`
- For iOS simulator, use `http://localhost:5000`
- Disable HTTPS redirect in development if needed

### Database migration errors
```powershell
# Drop and recreate database
dotnet ef database drop
dotnet ef database update
```
