using StageReady.Api.Data;
using StageReady.Api.DTOs;
using StageReady.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace StageReady.Api.Services;

public class AuthService : IAuthService
{
    private readonly StageReadyDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthService(StageReadyDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    public async Task<AuthResponse> SignUpAsync(SignupRequest request)
    {
        if (await _context.Users.AnyAsync(u => u.Email == request.Email))
        {
            throw new InvalidOperationException("Email already registered");
        }

        var user = new User
        {
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            DisplayName = request.DisplayName
        };

        _context.Users.Add(user);
        
        // Create default preferences
        var preferences = new Preferences
        {
            UserId = user.Id
        };
        _context.Preferences.Add(preferences);
        
        await _context.SaveChangesAsync();

        var accessToken = GenerateAccessToken(user.Id, user.Email);
        var refreshToken = GenerateRefreshToken(user.Id);

        return new AuthResponse(
            accessToken,
            refreshToken,
            new UserResponse(user.Id.ToString(), user.Email, user.DisplayName)
        );
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        
        if (user == null || user.PasswordHash == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            throw new UnauthorizedAccessException("Invalid credentials");
        }

        var accessToken = GenerateAccessToken(user.Id, user.Email);
        var refreshToken = GenerateRefreshToken(user.Id);

        return new AuthResponse(
            accessToken,
            refreshToken,
            new UserResponse(user.Id.ToString(), user.Email, user.DisplayName)
        );
    }

    public async Task<AuthResponse> RefreshTokenAsync(string userId)
    {
        var user = await _context.Users.FindAsync(Guid.Parse(userId));
        
        if (user == null)
        {
            throw new UnauthorizedAccessException("User not found");
        }

        var accessToken = GenerateAccessToken(user.Id, user.Email);
        var refreshToken = GenerateRefreshToken(user.Id);

        return new AuthResponse(
            accessToken,
            refreshToken,
            new UserResponse(user.Id.ToString(), user.Email, user.DisplayName)
        );
    }

    public string GenerateAccessToken(Guid userId, string email)
    {
        var jwtSettings = _configuration.GetSection("JwtSettings");
        var secretKey = jwtSettings["SecretKey"] ?? throw new InvalidOperationException("JWT SecretKey not configured");
        
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, userId.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, email),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim("typ", "access")
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: jwtSettings["Issuer"],
            audience: jwtSettings["Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(1),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public string GenerateRefreshToken(Guid userId)
    {
        // Stateless refresh token as a signed JWT (no DB persistence required for MVP).
        // Mobile sends this token as Bearer to /auth/refresh.
        var jwtSettings = _configuration.GetSection("JwtSettings");
        var secretKey = jwtSettings["SecretKey"] ?? throw new InvalidOperationException("JWT SecretKey not configured");

        // NOTE: We intentionally don't include email here; only sub + typ.
        // The refresh endpoint will look up the user by sub.
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, userId.ToString()),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim("typ", "refresh")
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: jwtSettings["Issuer"],
            audience: jwtSettings["Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddDays(30),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
