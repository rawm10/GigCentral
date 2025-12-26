using StageReady.Api.DTOs;
using StageReady.Api.Services;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace StageReady.Api;

public static class SheetEndpoints
{
    public static void MapSheetEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/sheets")
            .WithTags("Sheets")
            .RequireAuthorization();

        group.MapGet("", async (
            HttpContext context,
            ISheetService sheetService,
            [FromQuery] Guid? directoryId,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20) =>
        {
            var userId = GetUserId(context);
            var sheets = await sheetService.GetSheetsAsync(userId, directoryId, page, pageSize);
            return Results.Ok(sheets);
        });

        group.MapGet("/{id:guid}", async (Guid id, HttpContext context, ISheetService sheetService) =>
        {
            var userId = GetUserId(context);
            var sheet = await sheetService.GetSheetAsync(id, userId);
            return sheet != null ? Results.Ok(sheet) : Results.NotFound();
        });

        group.MapPost("", async ([FromBody] SheetInput input, HttpContext context, ISheetService sheetService) =>
        {
            var userId = GetUserId(context);
            var sheet = await sheetService.CreateSheetAsync(input, userId);
            return Results.Created($"/api/v1/sheets/{sheet.Id}", sheet);
        });

        group.MapPut("/{id:guid}", async (
            Guid id,
            [FromBody] SheetInput input,
            HttpContext context,
            ISheetService sheetService) =>
        {
            try
            {
                var userId = GetUserId(context);
                var sheet = await sheetService.UpdateSheetAsync(id, input, userId);
                return Results.Ok(sheet);
            }
            catch (KeyNotFoundException)
            {
                return Results.NotFound();
            }
        });

        group.MapDelete("/{id:guid}", async (Guid id, HttpContext context, ISheetService sheetService) =>
        {
            var userId = GetUserId(context);
            await sheetService.DeleteSheetAsync(id, userId);
            return Results.NoContent();
        });

        group.MapPost("/import", async (
            [FromBody] ImportSheetRequest request,
            HttpContext context,
            ISheetService sheetService,
            ILogger<Program> logger) =>
        {
            try
            {
                var userId = GetUserId(context);
                logger.LogInformation("Import request - SourceType: {SourceType}, HasBody: {HasBody}, Provider: {Provider}", 
                    request.SourceType, !string.IsNullOrEmpty(request.Body), request.ProviderName);
                var sheet = await sheetService.ImportSheetAsync(request, userId);
                return Results.Created($"/api/v1/sheets/{sheet.Id}", sheet);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to import sheet");
                return Results.UnprocessableEntity(new { error = ex.Message });
            }
        });

        group.MapPost("/preview-format", async (
            [FromBody] PreviewFormatRequest request,
            IFormatterService formatterService) =>
        {
            try
            {
                var formattedBody = await formatterService.FormatToChordProAsync(
                    request.Body, 
                    request.ChordsOnly,
                    request.CustomInstructions);
                
                return Results.Ok(new { formattedBody });
            }
            catch (Exception ex)
            {
                return Results.BadRequest(new { error = ex.Message });
            }
        });

        group.MapPost("/{id:guid}/format", async (
            Guid id,
            [FromBody] FormatSheetRequest request,
            HttpContext context,
            ISheetService sheetService) =>
        {
            try
            {
                var userId = GetUserId(context);
                var result = await sheetService.FormatSheetAsync(id, request, userId);
                return Results.Ok(result);
            }
            catch (KeyNotFoundException)
            {
                return Results.NotFound();
            }
        });

        group.MapPost("/{id:guid}/transpose", async (
            Guid id,
            [FromBody] TransposeRequest request,
            HttpContext context,
            ISheetService sheetService) =>
        {
            try
            {
                var userId = GetUserId(context);
                var sheet = await sheetService.TransposeSheetAsync(id, request, userId);
                return Results.Ok(sheet);
            }
            catch (KeyNotFoundException)
            {
                return Results.NotFound();
            }
        });
    }

    private static Guid GetUserId(HttpContext context)
    {
        // Try standard claim first
        var userIdClaim = context.User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
        
        // Fallback to claim type variations
        if (string.IsNullOrEmpty(userIdClaim))
        {
            userIdClaim = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        }
        
        if (string.IsNullOrEmpty(userIdClaim))
        {
            userIdClaim = context.User.FindFirst("sub")?.Value;
        }
        
        if (string.IsNullOrEmpty(userIdClaim))
        {
            // Log all available claims for debugging
            var claims = string.Join(", ", context.User.Claims.Select(c => $"{c.Type}={c.Value}"));
            throw new UnauthorizedAccessException($"User ID claim not found. Available claims: {claims}");
        }
        
        return Guid.Parse(userIdClaim);
    }
}
