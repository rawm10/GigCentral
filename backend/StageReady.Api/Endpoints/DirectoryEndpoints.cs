using StageReady.Api.DTOs;
using StageReady.Api.Services;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;

namespace StageReady.Api;

public static class DirectoryEndpoints
{
    public static void MapDirectoryEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/directories")
            .WithTags("Directories")
            .RequireAuthorization();

        group.MapGet("", async (HttpContext context, IDirectoryService directoryService) =>
        {
            var userId = GetUserId(context);
            var directories = await directoryService.GetDirectoriesAsync(userId);
            return Results.Ok(directories);
        });

        group.MapGet("/{id:guid}", async (
            Guid id,
            HttpContext context,
            IDirectoryService directoryService) =>
        {
            var userId = GetUserId(context);
            var directory = await directoryService.GetDirectoryAsync(id, userId);
            return directory != null ? Results.Ok(directory) : Results.NotFound();
        });

        group.MapPost("", async (
            [FromBody] DirectoryInput input,
            HttpContext context,
            IDirectoryService directoryService) =>
        {
            var userId = GetUserId(context);
            var directory = await directoryService.CreateDirectoryAsync(input, userId);
            return Results.Created($"/api/v1/directories/{directory.Id}", directory);
        });

        group.MapPut("/{id:guid}", async (
            Guid id,
            [FromBody] DirectoryInput input,
            HttpContext context,
            IDirectoryService directoryService) =>
        {
            try
            {
                var userId = GetUserId(context);
                var directory = await directoryService.UpdateDirectoryAsync(id, input, userId);
                return Results.Ok(directory);
            }
            catch (KeyNotFoundException)
            {
                return Results.NotFound();
            }
        });

        group.MapDelete("/{id:guid}", async (
            Guid id,
            HttpContext context,
            IDirectoryService directoryService) =>
        {
            var userId = GetUserId(context);
            await directoryService.DeleteDirectoryAsync(id, userId);
            return Results.NoContent();
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
