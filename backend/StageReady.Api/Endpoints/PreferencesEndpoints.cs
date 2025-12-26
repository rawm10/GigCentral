using StageReady.Api.DTOs;
using StageReady.Api.Services;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;

namespace StageReady.Api;

public static class PreferencesEndpoints
{
    public static void MapPreferencesEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/preferences")
            .WithTags("Preferences")
            .RequireAuthorization();

        group.MapGet("", async (HttpContext context, IPreferencesService preferencesService) =>
        {
            var userId = GetUserId(context);
            var preferences = await preferencesService.GetPreferencesAsync(userId);
            return preferences != null ? Results.Ok(preferences) : Results.NotFound();
        });

        group.MapPut("", async (
            [FromBody] PreferencesInput input,
            HttpContext context,
            IPreferencesService preferencesService) =>
        {
            var userId = GetUserId(context);
            var preferences = await preferencesService.UpdatePreferencesAsync(input, userId);
            return Results.Ok(preferences);
        });
    }

    private static Guid GetUserId(HttpContext context)
    {
        // Try multiple claim types for compatibility
        var userIdClaim = context.User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
            ?? context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
            ?? context.User.FindFirst("uid")?.Value
            ?? context.User.FindFirst("user_id")?.Value;
            
        if (string.IsNullOrEmpty(userIdClaim))
        {
            throw new UnauthorizedAccessException("User ID claim not found");
        }
        
        return Guid.Parse(userIdClaim);
    }
}
