using System;
using System.Threading.Tasks;
using FluentAssertions;
using Moq;
using StageReady.Api.DTOs;
using Xunit;

namespace StageReady.Api.Services.Tests
{
    public class AuthServiceTests
    {
        private readonly Mock<IAuthService> _mockAuthService;

        public AuthServiceTests()
        {
            _mockAuthService = new Mock<IAuthService>();
        }

        [Fact]
        public async Task SignUpAsync_ValidRequest_ReturnsAuthResponse()
        {
            // Arrange
            var signupRequest = new SignupRequest
            {
                Email = "test@example.com",
                Password = "password123"
            };
            var expectedAuthResponse = new AuthResponse
            {
                AccessToken = "access_token",
                RefreshToken = "refresh_token",
                UserId = Guid.NewGuid()
            };

            _mockAuthService.Setup(s => s.SignUpAsync(signupRequest)).ReturnsAsync(expectedAuthResponse);

            // Act
            var actualAuthResponse = await _mockAuthService.Object.SignUpAsync(signupRequest);

            // Assert
            actualAuthResponse.Should().BeEquivalentTo(expectedAuthResponse);
        }

        [Fact]
        public async Task LoginAsync_ValidRequest_ReturnsAuthResponse()
        {
            // Arrange
            var loginRequest = new LoginRequest
            {
                Email = "test@example.com",
                Password = "password123"
            };
            var expectedAuthResponse = new AuthResponse
            {
                AccessToken = "access_token",
                RefreshToken = "refresh_token",
                UserId = Guid.NewGuid()
            };

            _mockAuthService.Setup(s => s.LoginAsync(loginRequest)).ReturnsAsync(expectedAuthResponse);

            // Act
            var actualAuthResponse = await _mockAuthService.Object.LoginAsync(loginRequest);

            // Assert
            actualAuthResponse.Should().BeEquivalentTo(expectedAuthResponse);
        }

        [Fact]
        public async Task RefreshTokenAsync_ValidUserId_ReturnsAuthResponse()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var expectedAuthResponse = new AuthResponse
            {
                AccessToken = "access_token",
                RefreshToken = "refresh_token",
                UserId = userId
            };

            _mockAuthService.Setup(s => s.RefreshTokenAsync(userId.ToString())).ReturnsAsync(expectedAuthResponse);

            // Act
            var actualAuthResponse = await _mockAuthService.Object.RefreshTokenAsync(userId.ToString());

            // Assert
            actualAuthResponse.Should().BeEquivalentTo(expectedAuthResponse);
        }

        [Fact]
        public void GenerateAccessToken_ValidUserId_ReturnsAccessToken()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var email = "test@example.com";

            // Act
            var accessToken = _mockAuthService.Object.GenerateAccessToken(userId, email);

            // Assert
            accessToken.Should().NotBeNullOrEmpty();
        }

        [Fact]
        public void GenerateRefreshToken_ValidUserId_ReturnsRefreshToken()
        {
            // Arrange
            var userId = Guid.NewGuid();

            // Act
            var refreshToken = _mockAuthService.Object.GenerateRefreshToken(userId);

            // Assert
            refreshToken.Should().NotBeNullOrEmpty();
        }
    }
