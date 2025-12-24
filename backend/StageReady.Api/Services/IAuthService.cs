using StageReady.Api.DTOs;

namespace StageReady.Api.Services;

public interface IAuthService
{
    Task<AuthResponse> SignUpAsync(SignupRequest request);
    Task<AuthResponse> LoginAsync(LoginRequest request);
    Task<AuthResponse> RefreshTokenAsync(string userId);
    string GenerateAccessToken(Guid userId, string email);
    string GenerateRefreshToken(Guid userId);
}
