namespace StageReady.Api.DTOs;

public record SignupRequest(string Email, string Password, string? DisplayName);
public record LoginRequest(string Email, string Password);

public record AuthResponse(string AccessToken, string RefreshToken, UserResponse User);
public record UserResponse(string Id, string Email, string? DisplayName);
