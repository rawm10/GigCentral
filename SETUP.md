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
# For local development with mobile device on same network, use your computer's IP
EXPO_PUBLIC_API_URL=http://10.0.0.50:5000/api/v1

# For emulator/simulator development
# EXPO_PUBLIC_API_URL=http://localhost:5000/api/v1

# For production
# EXPO_PUBLIC_API_URL=https://api.stageready.app/api/v1
```

**Important**: Replace `10.0.0.50` with your computer's actual local IP address. Find it using:
```powershell
Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -like "10.*" -or $_.IPAddress -like "192.168.*"}
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
4. **Configure Windows Firewall** (for mobile device access):
   - Open **Windows Defender Firewall with Advanced Security**
   - Click **Inbound Rules** → **New Rule...**
   - Select **Port** → **TCP** → Enter **5000**
   - Select **Allow the connection**
   - Check all profiles (Domain, Private, Public)
   - Name it "StageReady API"
5. **Run migrations**:
   ```powershell
   cd backend/StageReady.Api
   dotnet ef database update
   ```
6. **Start backend**:
   ```powershell
   # Set environment to Development to listen on all network interfaces
   $env:ASPNETCORE_ENVIRONMENT="Development"
   cd backend/StageReady.Api
   dotnet run
   ```
   Backend should show: `Now listening on: http://0.0.0.0:5000`
   
7. **Install mobile dependencies**:
   ```powershell
   cd mobile
   npm install --legacy-peer-deps
- Port 5000 already in use: Kill existing process
  ```powershell
  Get-Process | Where-Object {$_.ProcessName -eq "dotnet"} | Stop-Process -Force
  ```

### Mobile can't connect to API
- **Network Error**: Ensure both phone and PC are on the same WiFi network
- **Firewall blocking**: Add Windows Firewall rule for port 5000 (see setup step 4)
- **Wrong IP address**: Update `.env` file with correct local IP address
- **Backend not listening on network**: Ensure `appsettings.Development.json` has:
  ```json
  "Kestrel": {
    "Endpoints": {
      "Http": {
        "Url": "http://0.0.0.0:5000"
      }
    }
  }
  ```
- Test connectivity from phone's browser: Navigate to `http://YOUR_IP:5000/api/v1/auth/login`
  - Should see "Method Not Allowed" (405) - this means connection works!
  - Timeout or "can't connect" means firewall or network issue

### React Navigation errors
- Remove duplicate `@react-navigation/native` package (expo-router includes it)
- Clear cache and reinstall:
  ```powershell
  cd mobile
  Remove-Item -Recurse -Force node_modules,.expo
  npm install --legacy-peer-deps
  ```

### Database migration errors
```powershell
# Drop and recreate database
dotnet ef database drop
dotnet ef database update
```

### Expo app won't load
- Clear Expo cache: `npm start -- --clear`
- Ensure `mobile/index.js` exists with content: `import 'expo-router/entry';`
- Check `package.json` has `"main": "index.js"
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
