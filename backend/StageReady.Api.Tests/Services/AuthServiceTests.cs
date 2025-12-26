using Xunit;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.EntityFrameworkCore;
using StageReady.Api.Data;
using StageReady.Api.DTOs;
using StageReady.Api.Services;

namespace StageReady.Api.Tests.Services;

public class AuthServiceTests : IDisposable
{
    private readonly StageReadyDbContext _context;
    private readonly AuthService _service;
    
    public AuthServiceTests()
    {
        // Use in-memory database for testing
        var options = new DbContextOptionsBuilder<StageReadyDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        
        _context = new StageReadyDbContext(options);
        
        // Use real IConfiguration with JWT settings
        var inMemorySettings = new Dictionary<string, string?>
        {
            {"JwtSettings:SecretKey", "test-secret-key-minimum-32-characters-long-for-hmacsha256"},
            {"JwtSettings:Issuer", "test-issuer"},
            {"JwtSettings:Audience", "test-audience"}
        };
        
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(inMemorySettings)
            .Build();
        
        _service = new AuthService(_context, configuration);
    }
    
    [Fact]
    public async Task SignUpAsync_ShouldCreateUserAndReturnTokens()
    {
        var request = new SignupRequest("test@example.com", "password123", "Test User");
        
        var result = await _service.SignUpAsync(request);
        
        result.Should().NotBeNull();
        result.AccessToken.Should().NotBeNullOrEmpty();
        result.RefreshToken.Should().NotBeNullOrEmpty();
        result.User.Email.Should().Be("test@example.com");
        result.User.DisplayName.Should().Be("Test User");
        
        var userInDb = await _context.Users.FirstOrDefaultAsync(u => u.Email == "test@example.com");
        userInDb.Should().NotBeNull();
        userInDb!.PasswordHash.Should().NotBeNullOrEmpty();
    }
    
    [Fact]
    public async Task SignUpAsync_ShouldThrowIfEmailExists()
    {
        var request = new SignupRequest("duplicate@example.com", "password123", "User 1");
        await _service.SignUpAsync(request);
        
        var duplicateRequest = new SignupRequest("duplicate@example.com", "password456", "User 2");
        
        var act = async () => await _service.SignUpAsync(duplicateRequest);
        
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Email already registered");
    }
    
    [Fact]
    public async Task LoginAsync_ShouldReturnTokensForValidCredentials()
    {
        var signupRequest = new SignupRequest("login@example.com", "password123", "Login User");
        await _service.SignUpAsync(signupRequest);
        
        var loginRequest = new LoginRequest("login@example.com", "password123");
        var result = await _service.LoginAsync(loginRequest);
        
        result.Should().NotBeNull();
        result.AccessToken.Should().NotBeNullOrEmpty();
        result.RefreshToken.Should().NotBeNullOrEmpty();
        result.User.Email.Should().Be("login@example.com");
    }
    
    [Fact]
    public async Task LoginAsync_ShouldThrowForInvalidEmail()
    {
        var loginRequest = new LoginRequest("nonexistent@example.com", "password123");
        
        var act = async () => await _service.LoginAsync(loginRequest);
        
        await act.Should().ThrowAsync<UnauthorizedAccessException>()
            .WithMessage("Invalid credentials");
    }
    
    [Fact]
    public async Task LoginAsync_ShouldThrowForInvalidPassword()
    {
        var signupRequest = new SignupRequest("user@example.com", "correctpassword", "User");
        await _service.SignUpAsync(signupRequest);
        
        var loginRequest = new LoginRequest("user@example.com", "wrongpassword");
        
        var act = async () => await _service.LoginAsync(loginRequest);
        
        await act.Should().ThrowAsync<UnauthorizedAccessException>()
            .WithMessage("Invalid credentials");
    }
    
    [Fact]
    public void GenerateAccessToken_ShouldCreateValidJwt()
    {
        var userId = Guid.NewGuid();
        var email = "token@example.com";
        
        var token = _service.GenerateAccessToken(userId, email);
        
        token.Should().NotBeNullOrEmpty();
        token.Split('.').Should().HaveCount(3); // JWT has 3 parts
    }
    
    [Fact]
    public void GenerateRefreshToken_ShouldCreateValidJwt()
    {
        var userId = Guid.NewGuid();
        
        var token = _service.GenerateRefreshToken(userId);
        
        token.Should().NotBeNullOrEmpty();
        token.Split('.').Should().HaveCount(3); // JWT has 3 parts
    }
    
    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }
}
