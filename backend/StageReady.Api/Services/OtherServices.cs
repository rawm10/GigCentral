using StageReady.Api.Data;
using StageReady.Api.DTOs;
using StageReady.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace StageReady.Api.Services;

public class ProviderService : IProviderService
{
    private readonly StageReadyDbContext _context;

    public ProviderService(StageReadyDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<ProviderResponse>> GetProvidersAsync(Guid userId)
    {
        return await _context.Providers
            .Where(p => p.UserId == userId)
            .Select(p => new ProviderResponse(
                p.Id.ToString(),
                p.Name,
                p.CreatedAt
            ))
            .ToListAsync();
    }

    public async Task<ProviderResponse> AddProviderAsync(ProviderInput input, Guid userId)
    {
        // In production, encrypt the PAT using Azure Key Vault
        var provider = new Provider
        {
            UserId = userId,
            Name = input.Name,
            PatCipher = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(input.Pat))
        };

        _context.Providers.Add(provider);
        await _context.SaveChangesAsync();

        return new ProviderResponse(
            provider.Id.ToString(),
            provider.Name,
            provider.CreatedAt
        );
    }
}

public class DirectoryService : IDirectoryService
{
    private readonly StageReadyDbContext _context;

    public DirectoryService(StageReadyDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<DirectoryResponse>> GetDirectoriesAsync(Guid userId)
    {
        return await _context.Directories
            .Where(d => d.UserId == userId)
            .OrderBy(d => d.SortOrder)
            .Select(d => new DirectoryResponse(
                d.Id.ToString(),
                d.Name,
                d.Description,
                d.SortOrder
            ))
            .ToListAsync();
    }

    public async Task<DirectoryResponse> CreateDirectoryAsync(DirectoryInput input, Guid userId)
    {
        var directory = new Models.Directory
        {
            UserId = userId,
            Name = input.Name,
            Description = input.Description,
            SortOrder = input.SortOrder ?? 0
        };

        _context.Directories.Add(directory);
        await _context.SaveChangesAsync();

        return new DirectoryResponse(
            directory.Id.ToString(),
            directory.Name,
            directory.Description,
            directory.SortOrder
        );
    }

    public async Task<DirectoryResponse> UpdateDirectoryAsync(Guid id, DirectoryInput input, Guid userId)
    {
        var directory = await _context.Directories
            .FirstOrDefaultAsync(d => d.Id == id && d.UserId == userId);

        if (directory == null)
        {
            throw new KeyNotFoundException("Directory not found");
        }

        directory.Name = input.Name;
        directory.Description = input.Description;
        if (input.SortOrder.HasValue)
        {
            directory.SortOrder = input.SortOrder.Value;
        }

        await _context.SaveChangesAsync();

        return new DirectoryResponse(
            directory.Id.ToString(),
            directory.Name,
            directory.Description,
            directory.SortOrder
        );
    }

    public async Task DeleteDirectoryAsync(Guid id, Guid userId)
    {
        var directory = await _context.Directories
            .FirstOrDefaultAsync(d => d.Id == id && d.UserId == userId);

        if (directory != null)
        {
            _context.Directories.Remove(directory);
            await _context.SaveChangesAsync();
        }
    }
}

public class SetlistService : ISetlistService
{
    private readonly StageReadyDbContext _context;

    public SetlistService(StageReadyDbContext context)
    {
        _context = context;
    }

    public async Task<SetlistResponse> CreateSetlistAsync(CreateSetlistRequest request, Guid userId)
    {
        var directory = await _context.Directories
            .FirstOrDefaultAsync(d => d.Id == request.DirectoryId && d.UserId == userId);

        if (directory == null)
        {
            throw new KeyNotFoundException("Directory not found");
        }

        var setlist = new Setlist
        {
            DirectoryId = request.DirectoryId,
            Name = request.Name
        };

        _context.Setlists.Add(setlist);
        await _context.SaveChangesAsync();

        return new SetlistResponse(
            setlist.Id.ToString(),
            setlist.DirectoryId.ToString(),
            setlist.Name,
            setlist.CreatedAt
        );
    }

    public async Task<SetlistItemResponse> AddItemAsync(Guid setlistId, AddSetlistItemRequest request, Guid userId)
    {
        var setlist = await _context.Setlists
            .Include(s => s.Directory)
            .Include(s => s.Items)
            .FirstOrDefaultAsync(s => s.Id == setlistId && s.Directory.UserId == userId);

        if (setlist == null)
        {
            throw new KeyNotFoundException("Setlist not found");
        }

        var position = request.Position ?? (setlist.Items.Any() ? setlist.Items.Max(i => i.Position) + 1 : 0);

        var item = new SetlistItem
        {
            SetlistId = setlistId,
            SheetId = request.SheetId,
            Position = position
        };

        _context.SetlistItems.Add(item);
        await _context.SaveChangesAsync();

        return new SetlistItemResponse(
            item.Id.ToString(),
            item.SetlistId.ToString(),
            item.SheetId.ToString(),
            item.Position
        );
    }
}

public class PreferencesService : IPreferencesService
{
    private readonly StageReadyDbContext _context;

    public PreferencesService(StageReadyDbContext context)
    {
        _context = context;
    }

    public async Task<PreferencesResponse?> GetPreferencesAsync(Guid userId)
    {
        var prefs = await _context.Preferences
            .FirstOrDefaultAsync(p => p.UserId == userId);

        if (prefs == null) return null;

        return new PreferencesResponse(
            prefs.FontScale,
            prefs.Theme,
            prefs.AutoScroll,
            prefs.ScrollBpm,
            prefs.HighContrast
        );
    }

    public async Task<PreferencesResponse> UpdatePreferencesAsync(PreferencesInput input, Guid userId)
    {
        var prefs = await _context.Preferences
            .FirstOrDefaultAsync(p => p.UserId == userId);

        if (prefs == null)
        {
            prefs = new Preferences { UserId = userId };
            _context.Preferences.Add(prefs);
        }

        if (input.FontScale.HasValue) prefs.FontScale = input.FontScale.Value;
        if (input.Theme != null) prefs.Theme = input.Theme;
        if (input.AutoScroll.HasValue) prefs.AutoScroll = input.AutoScroll.Value;
        if (input.ScrollBpm.HasValue) prefs.ScrollBpm = input.ScrollBpm;
        if (input.HighContrast.HasValue) prefs.HighContrast = input.HighContrast.Value;

        await _context.SaveChangesAsync();

        return new PreferencesResponse(
            prefs.FontScale,
            prefs.Theme,
            prefs.AutoScroll,
            prefs.ScrollBpm,
            prefs.HighContrast
        );
    }
}
