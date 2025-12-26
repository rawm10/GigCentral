using StageReady.Api.DTOs;
using StageReady.Api.Services;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;

namespace StageReady.Api;

public static class ProviderEndpoints
{
    public static void MapProviderEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/providers")
            .WithTags("Providers")
            .RequireAuthorization();

        group.MapGet("", async (HttpContext context, IProviderService providerService) =>
        {
            var userId = GetUserId(context);
            var providers = await providerService.GetProvidersAsync(userId);
            return Results.Ok(providers);
        });

        group.MapPost("", async (
            [FromBody] ProviderInput input,
            HttpContext context,
            IProviderService providerService) =>
        {
            var userId = GetUserId(context);
            var provider = await providerService.AddProviderAsync(input, userId);
            return Results.Created($"/api/v1/providers/{provider.Id}", provider);
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
