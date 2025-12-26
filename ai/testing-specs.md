# Testing & AI-Assisted Test Generation Specifications

## Overview
StageReady implements a comprehensive testing strategy with 90% unit test coverage enforced via CI/CD, combined with AI-assisted test generation to maintain coverage as the codebase evolves.

## Coverage Requirements

### Backend (.NET 8 / C#)
| Folder/Namespace | Lines | Functions | Branches | Notes |
|-----------------|-------|-----------|----------|-------|
| `Services/**` | 90% | 90% | N/A | Core business logic |
| `Endpoints/**` | Excluded | Excluded | Excluded | Integration-tested separately |
| `DTOs/**` | Excluded | Excluded | Excluded | Data transfer objects |
| `Models/**` | Excluded | Excluded | Excluded | Entity models |
| `Migrations/**` | Excluded | Excluded | Excluded | EF Core migrations |
| `Program.cs` | Excluded | Excluded | Excluded | Application entry point |

**Enforcement**: Coverlet with `coverlet.runsettings` configuration

### Mobile (React Native / TypeScript)
| Folder | Lines | Functions | Branches | Notes |
|--------|-------|-----------|----------|-------|
| `lib/**` | 90% | 90% | N/A | API client, utilities |
| `contexts/**` | 90% | 90% | N/A | React context providers |
| `app/**` | 30% | 20% | N/A | UI screens (lower threshold initially) |

**Enforcement**: Jest with per-folder `coverageThreshold` in `jest.config.js`

## Test Frameworks & Tools

### Backend
- **Framework**: xUnit 3.1.4+
- **Assertions**: FluentAssertions 8.8.0
- **Mocking**: Moq 4.20.72
- **Coverage**: Coverlet Collector 6.0.4
- **Run Command**: `dotnet test --collect:"XPlat Code Coverage" --settings coverlet.runsettings`

#### Backend Test Conventions
```csharp
// File: backend/StageReady.Api.Tests/Services/{ServiceName}Tests.cs
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using StageReady.Api.Services;
using Xunit;

namespace StageReady.Api.Tests.Services;

public class FormatterServiceTests
{
    private readonly IConfiguration _configuration;
    private readonly Mock<ILogger<FormatterService>> _mockLogger;
    private readonly FormatterService _service;

    public FormatterServiceTests()
    {
        // Use ConfigurationBuilder for IConfiguration, not Moq (extension methods not mockable)
        var configBuilder = new ConfigurationBuilder();
        configBuilder.AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["SomeConfig:Key"] = "value"
        });
        _configuration = configBuilder.Build();
        
        _mockLogger = new Mock<ILogger<FormatterService>>();
        _service = new FormatterService(_configuration, _mockLogger.Object);
    }

    [Fact]
    public async Task MethodName_Scenario_ExpectedResult()
    {
        // Arrange
        var input = "test input";

        // Act
        var result = await _service.SomeMethod(input);

        // Assert
        result.Should().Be("expected output");
    }
}
```

### Mobile
- **Framework**: Jest 29.x with jest-expo preset
- **Testing Library**: React Native Testing Library 12.4+
- **Test Renderer**: react-test-renderer 19.1.0 (matches React version)
- **Run Command**: `npm test` or `npm run test:coverage`

#### Mobile Test Conventions
```typescript
// File: mobile/lib/__tests__/api.test.ts
import * as SecureStore from 'expo-secure-store';

// Mock BEFORE imports
jest.mock('expo-secure-store');
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  })),
}));

import { getAuthHeaders } from '../api';

const mockedSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;

describe('api', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return headers with token when token exists', async () => {
    mockedSecureStore.getItemAsync.mockResolvedValueOnce('test-token');
    
    const headers = await getAuthHeaders();
    
    expect(headers).toEqual({ Authorization: 'Bearer test-token' });
  });
});
```

```typescript
// File: mobile/contexts/__tests__/AuthContext.test.tsx
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../AuthContext';
import { authService } from '../../lib/services';

jest.mock('../../lib/services', () => ({
  authService: {
    login: jest.fn(),
    logout: jest.fn(),
  },
}));

describe('AuthContext', () => {
  it('should handle login', async () => {
    (authService.login as jest.Mock).mockResolvedValueOnce({
      user: { id: '1', email: 'test@example.com' },
      accessToken: 'token',
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await act(async () => {
      await result.current.login('test@example.com', 'password');
    });

    expect(result.current.user).toEqual({ id: '1', email: 'test@example.com' });
  });
});
```

## CI/CD Integration

### Workflow: `.github/workflows/ci.yml`
Runs on every push/PR to `main` or `develop`:
1. **Backend Job**: Builds, runs tests, enforces 90% coverage on Services
2. **Mobile Job**: Installs deps, runs tests, enforces per-folder coverage
3. **Coverage Report Job**: Aggregates coverage artifacts and displays summary

**Failure Conditions**:
- Any test failure
- Coverage below threshold in any folder
- Build errors

### Workflow: `.github/workflows/ai-test-gen.yml`
Triggered on PR open/sync when files in `Services/`, `lib/`, or `contexts/` change:
1. **Analyzes Diff**: Identifies changed files requiring tests
2. **Generates Prompt**: Creates LLM-ready prompt with:
   - Changed code diffs
   - Existing test file list
   - Coverage requirements
   - Test conventions
3. **Uploads Artifact**: `test-generation-prompt` contains `test-prompt.md`
4. **Comments on PR**: Instructs developer to download artifact and generate tests

**Developer Workflow**:
1. Open PR with code changes
2. AI workflow comments with instructions
3. Download `test-generation-prompt` artifact
4. Use LLM (Copilot/Claude/GPT-4) with `test-prompt.md` to generate tests
5. Review generated tests for correctness
6. Add tests to PR and commit
7. CI enforces coverage on updated PR

**Note**: AI does NOT auto-commit tests. Human review required.

## AI Test Generation Prompt Template

The AI workflow generates a prompt following this structure:

```markdown
# Test Generation Request

## Objective
Generate or update unit tests for the changed code files.

### Coverage Requirements
- Backend (C#/.NET): 90% line and function coverage for Services
- Mobile (TypeScript): 90% line and function coverage for lib/ and contexts/

### Test Conventions
[Framework-specific conventions from above]

### For Each Changed File:
1. If test file exists: Update it to cover new/modified functionality
2. If test file doesn't exist: Create new test file with comprehensive tests
3. Ensure all public methods/functions are tested
4. Include edge cases and error scenarios
5. Follow existing test patterns

## Changed Code Analysis
[Git diffs of changed files]

## Existing Test Files
[List of current test files]

## Output Format
Provide test files as separate code blocks with file paths as headers.
```

## Test File Naming & Organization

### Backend
```
backend/
├── StageReady.Api/
│   └── Services/
│       ├── AuthService.cs
│       └── SheetService.cs
└── StageReady.Api.Tests/
    └── Services/
        ├── AuthServiceTests.cs          # Tests for AuthService
        └── SheetServiceTests.cs          # Tests for SheetService
```

### Mobile
```
mobile/
├── lib/
│   ├── api.ts
│   └── __tests__/
│       └── api.test.ts                   # Tests for api.ts
└── contexts/
    ├── AuthContext.tsx
    └── __tests__/
        └── AuthContext.test.tsx          # Tests for AuthContext
```

## Running Tests Locally

### Backend
```powershell
cd backend
dotnet test --collect:"XPlat Code Coverage" --settings coverlet.runsettings
```

Coverage report: `backend/StageReady.Api.Tests/TestResults/{guid}/coverage.cobertura.xml`

### Mobile
```powershell
cd mobile
npm test                    # Run all tests
npm run test:watch          # Watch mode
npm run test:coverage       # With coverage report
```

Coverage report: `mobile/coverage/lcov-report/index.html`

## Updating Coverage Thresholds

### Backend: `backend/coverlet.runsettings`
```xml
<Threshold>90</Threshold>
<ThresholdType>line,method</ThresholdType>
```

### Mobile: `mobile/jest.config.js`
```javascript
coverageThreshold: {
  'lib/': {
    lines: 90,
    functions: 90,
  },
  'contexts/': {
    lines: 90,
    functions: 90,
  },
}
```

## Mocking Strategies

### Backend
- **IConfiguration**: Use `ConfigurationBuilder` with `AddInMemoryCollection`
- **ILogger**: Mock with `Mock<ILogger<T>>`
- **DbContext**: Use in-memory database or mock with `Mock<DbContext>`
- **HttpClient**: Mock or use `HttpMessageHandler` for integration tests

### Mobile
- **expo-secure-store**: Mocked in `jest.setup.js`
- **expo-router**: Mocked in `jest.setup.js`
- **axios**: Mock `axios.create()` to return object with interceptors
- **AsyncStorage**: Auto-mocked via `@react-native-async-storage/async-storage/jest/async-storage-mock`
- **React Query**: Use `QueryClientProvider` wrapper with test query client

## Known Limitations & Workarounds

### Backend
- **Extension methods on IConfiguration**: Cannot be mocked directly with Moq. Use `ConfigurationBuilder` instead.
- **EF Core in-memory**: For Services using DbContext, prefer mocking the context or using SQLite in-memory for integration tests.

### Mobile
- **Expo 54 winter runtime**: Requires `structuredClone` and `__ExpoImportMetaRegistry` mocks in `jest.setup.js`.
- **React Native Testing Library**: Ensure `react-test-renderer` version matches React version exactly.
- **Async tests**: Always use `await waitFor()` when testing async state updates in contexts.

## Future Enhancements
- [ ] Integration tests for API endpoints (Endpoints/ folder)
- [ ] E2E tests for mobile UI flows using Detox or Maestro
- [ ] Mutation testing to verify test quality
- [ ] Visual regression testing for mobile screens
- [ ] Automated test generation on commit (opt-in via git hook)
- [ ] Coverage trend tracking over time
