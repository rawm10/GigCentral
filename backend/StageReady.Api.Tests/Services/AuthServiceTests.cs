Here is a comprehensive set of unit tests for the `AuthService` class using the xUnit framework, FluentAssertions, and Moq:


This test suite covers the following scenarios:

1. `SignUpAsync` method:
   - When email is already registered, it should throw an `InvalidOperationException`.
   - When email is not registered, it should create a new user and return an `AuthResponse`.

2. `LoginAsync` method:
   - When credentials are invalid, it should throw an `UnauthorizedAccessException`.
   - When credentials are valid, it should return an `AuthResponse`.

3. `RefreshTokenAsync` method:
   - When the user is not found, it should throw an `UnauthorizedAccessException`.
   - When the user is found, it should return an `AuthResponse`.

The tests use Moq to mock the `StageReadyDbContext` and `IConfiguration` dependencies, and FluentAssertions to make the assertions more readable and expressive.
