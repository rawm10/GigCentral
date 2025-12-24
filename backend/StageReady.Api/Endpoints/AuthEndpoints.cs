using StageReady.Api.DTOs;
using StageReady.Api.Services;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;

namespace StageReady.Api;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/auth").WithTags("Authentication");

        group.MapPost("/signup", async ([FromBody] SignupRequest request, IAuthService authService) =>
        {
            try
            {
                var response = await authService.SignUpAsync(request);
                return Results.Created($"/api/v1/users/{response.User.Id}", response);
            }
            catch (InvalidOperationException ex)
            {
                return Results.BadRequest(new { error = ex.Message });
            }
        });

        group.MapPost("/login", async ([FromBody] LoginRequest request, IAuthService authService) =>
        {
            try
            {
                var response = await authService.LoginAsync(request);
                return Results.Ok(response);
            }
            catch (UnauthorizedAccessException)
            {
                return Results.Unauthorized();
            }
        });

        group.MapPost("/refresh", async (HttpContext context, IAuthService authService) =>
        {
            var tokenType = context.User.FindFirst("typ")?.Value;
            if (!string.Equals(tokenType, "refresh", StringComparison.OrdinalIgnoreCase))
            {
                return Results.Unauthorized();
            }

            var userId = context.User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
            
            if (string.IsNullOrEmpty(userId))
            {
                return Results.Unauthorized();
            }

            try
            {
                var response = await authService.RefreshTokenAsync(userId);
                return Results.Ok(response);
            }
            catch (UnauthorizedAccessException)
            {
                return Results.Unauthorized();
            }
        }).RequireAuthorization();
    }
}
