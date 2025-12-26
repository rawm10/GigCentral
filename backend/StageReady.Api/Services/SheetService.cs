using StageReady.Api.Data;
using StageReady.Api.DTOs;
using StageReady.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace StageReady.Api.Services;

public class SheetService : ISheetService
{
    private readonly StageReadyDbContext _context;
    private readonly IFormatterService _formatterService;

    public SheetService(StageReadyDbContext context, IFormatterService formatterService)
    {
        _context = context;
        _formatterService = formatterService;
    }

    public async Task<IEnumerable<SheetSummaryResponse>> GetSheetsAsync(Guid userId, Guid? directoryId, int page, int pageSize)
    {
        var query = _context.Sheets.Where(s => s.UserId == userId);
        
        // Note: DirectoryId filtering would require a many-to-many relationship
        // For now, returning all user sheets
        
        return await query
            .OrderByDescending(s => s.UpdatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(s => new SheetSummaryResponse(
                s.Id.ToString(),
                s.Title,
                s.Artist,
                s.Key,
                s.UpdatedAt
            ))
            .ToListAsync();
    }

    public async Task<SheetResponse?> GetSheetAsync(Guid sheetId, Guid userId)
    {
        var sheet = await _context.Sheets
            .FirstOrDefaultAsync(s => s.Id == sheetId && s.UserId == userId);
        
        if (sheet == null) return null;
        
        return MapToResponse(sheet);
    }

    public async Task<SheetResponse> CreateSheetAsync(SheetInput input, Guid userId)
    {
        var sheet = new Sheet
        {
            UserId = userId,
            Title = input.Title,
            Artist = input.Artist,
            Key = input.Key,
            Capo = input.Capo,
            Format = input.Format ?? "chordpro",
            Body = input.Body,
            Source = input.Source
        };

        _context.Sheets.Add(sheet);
        await _context.SaveChangesAsync();

        return MapToResponse(sheet);
    }

    public async Task<SheetResponse> UpdateSheetAsync(Guid sheetId, SheetInput input, Guid userId)
    {
        var sheet = await _context.Sheets
            .FirstOrDefaultAsync(s => s.Id == sheetId && s.UserId == userId);
        
        if (sheet == null)
        {
            throw new KeyNotFoundException("Sheet not found");
        }

        // Create version before updating
        var version = new SheetVersion
        {
            SheetId = sheet.Id,
            Body = sheet.Body,
            Notes = "Auto-saved before update"
        };
        _context.SheetVersions.Add(version);

        sheet.Title = input.Title;
        sheet.Artist = input.Artist;
        sheet.Key = input.Key;
        sheet.Capo = input.Capo;
        sheet.Format = input.Format ?? sheet.Format;
        sheet.Body = input.Body;
        sheet.Source = input.Source;
        sheet.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return MapToResponse(sheet);
    }

    public async Task DeleteSheetAsync(Guid sheetId, Guid userId)
    {
        var sheet = await _context.Sheets
            .FirstOrDefaultAsync(s => s.Id == sheetId && s.UserId == userId);
        
        if (sheet != null)
        {
            _context.Sheets.Remove(sheet);
            await _context.SaveChangesAsync();
        }
    }

    public async Task<SheetResponse> ImportSheetAsync(ImportSheetRequest request, Guid userId)
    {
        string body = request.Body ?? string.Empty;
        string source = "manual";

        if (request.SourceType == "provider")
        {
            // Provider import would be implemented here
            // For now, using body as-is
            source = $"{request.ProviderName}:{request.ProviderSongId}";
        }

        // Format the imported content
        var formatted = await _formatterService.FormatToChordProAsync(body);

        var sheet = new Sheet
        {
            UserId = userId,
            Title = ExtractTitle(formatted) ?? "Untitled",
            Artist = ExtractArtist(formatted),
            Key = ExtractKey(formatted),
            Format = "chordpro",
            Body = formatted,
            Source = source
        };

        _context.Sheets.Add(sheet);
        await _context.SaveChangesAsync();

        return MapToResponse(sheet);
    }

    public async Task<FormatSheetResponse> FormatSheetAsync(Guid sheetId, FormatSheetRequest request, Guid userId)
    {
        var sheet = await _context.Sheets
            .FirstOrDefaultAsync(s => s.Id == sheetId && s.UserId == userId);
        
        if (sheet == null)
        {
            throw new KeyNotFoundException("Sheet not found");
        }

        var formatted = await _formatterService.FormatForViewportAsync(
            sheet.Body,
            request.Viewport,
            request.Options
        );

        var lines = formatted.Split('\n').Length;
        var estimatedPages = (int)Math.Ceiling(lines / 40.0);

        return new FormatSheetResponse(
            formatted,
            new MetricsInfo(lines, estimatedPages)
        );
    }

    public async Task<SheetResponse> TransposeSheetAsync(Guid sheetId, TransposeRequest request, Guid userId)
    {
        var sheet = await _context.Sheets
            .FirstOrDefaultAsync(s => s.Id == sheetId && s.UserId == userId);
        
        if (sheet == null)
        {
            throw new KeyNotFoundException("Sheet not found");
        }

        var transposed = await _formatterService.TransposeAsync(
            sheet.Body,
            request.Semitones ?? 0,
            request.UseNashville ?? false
        );

        sheet.Body = transposed;
        sheet.UpdatedAt = DateTime.UtcNow;
        
        if (request.Semitones.HasValue && !string.IsNullOrEmpty(sheet.Key))
        {
            sheet.Key = TransposeKey(sheet.Key, request.Semitones.Value);
        }

        await _context.SaveChangesAsync();

        return MapToResponse(sheet);
    }

    private static SheetResponse MapToResponse(Sheet sheet)
    {
        return new SheetResponse(
            sheet.Id.ToString(),
            sheet.Title,
            sheet.Artist,
            sheet.Key,
            sheet.Capo,
            sheet.Format,
            sheet.Body,
            sheet.Source,
            sheet.CreatedAt,
            sheet.UpdatedAt
        );
    }

    private static string? ExtractTitle(string chordPro)
    {
        var match = System.Text.RegularExpressions.Regex.Match(chordPro, @"\{title:\s*(.+?)\}", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
        return match.Success ? match.Groups[1].Value.Trim() : null;
    }

    private static string? ExtractArtist(string chordPro)
    {
        var match = System.Text.RegularExpressions.Regex.Match(chordPro, @"\{artist:\s*(.+?)\}", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
        return match.Success ? match.Groups[1].Value.Trim() : null;
    }

    private static string? ExtractKey(string chordPro)
    {
        var match = System.Text.RegularExpressions.Regex.Match(chordPro, @"\{key:\s*(.+?)\}", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
        return match.Success ? match.Groups[1].Value.Trim() : null;
    }

    private static string TransposeKey(string key, int semitones)
    {
        var keys = new[] { "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B" };
        var index = Array.IndexOf(keys, key);
        if (index == -1) return key;
        
        var newIndex = (index + semitones + 12) % 12;
        return keys[newIndex];
    }
}
