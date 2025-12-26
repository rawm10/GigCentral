using StageReady.Api.DTOs;
using StageReady.Api.Services;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;

namespace StageReady.Api;

public static class SetlistEndpoints
{
    public static void MapSetlistEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/setlists")
            .WithTags("Setlists")
            .RequireAuthorization();

        group.MapGet("/directory/{directoryId:guid}", async (
            Guid directoryId,
            HttpContext context,
            ISetlistService setlistService) =>
        {
            var userId = GetUserId(context);
            var setlists = await setlistService.GetSetlistsByDirectoryAsync(directoryId, userId);
            return Results.Ok(setlists);
        });

        group.MapGet("/{id:guid}", async (
            Guid id,
            HttpContext context,
            ISetlistService setlistService) =>
        {
            var userId = GetUserId(context);
            var setlist = await setlistService.GetSetlistAsync(id, userId);
            return setlist != null ? Results.Ok(setlist) : Results.NotFound();
        });

        group.MapPost("", async (
            [FromBody] CreateSetlistRequest request,
            HttpContext context,
            ISetlistService setlistService) =>
        {
            try
            {
                var userId = GetUserId(context);
                var setlist = await setlistService.CreateSetlistAsync(request, userId);
                return Results.Created($"/api/v1/setlists/{setlist.Id}", setlist);
            }
            catch (KeyNotFoundException ex)
            {
                return Results.BadRequest(new { error = ex.Message });
            }
        });

        group.MapPost("/{id:guid}/items", async (
            Guid id,
            [FromBody] AddSetlistItemRequest request,
            HttpContext context,
            ISetlistService setlistService) =>
        {
            try
            {
                var userId = GetUserId(context);
                var item = await setlistService.AddItemAsync(id, request, userId);
                return Results.Created($"/api/v1/setlists/{id}/items/{item.Id}", item);
            }
            catch (KeyNotFoundException ex)
            {
                return Results.BadRequest(new { error = ex.Message });
            }
        });

        group.MapDelete("/{setlistId:guid}/items/{itemId:guid}", async (
            Guid setlistId,
            Guid itemId,
            HttpContext context,
            ISetlistService setlistService) =>
        {
            try
            {
                var userId = GetUserId(context);
                await setlistService.RemoveItemAsync(setlistId, itemId, userId);
                return Results.NoContent();
            }
            catch (KeyNotFoundException ex)
            {
                return Results.NotFound(new { error = ex.Message });
            }
        });

        group.MapPatch("/{id:guid}/reorder", async (
            Guid id,
            [FromBody] ReorderItemsRequest request,
            HttpContext context,
            ISetlistService setlistService) =>
        {
            try
            {
                var userId = GetUserId(context);
                await setlistService.ReorderItemsAsync(id, request, userId);
                return Results.NoContent();
            }
            catch (KeyNotFoundException ex)
            {
                return Results.NotFound(new { error = ex.Message });
            }
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
