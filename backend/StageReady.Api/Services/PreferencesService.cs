using StageReady.Api.Data;
using StageReady.Api.DTOs;
using StageReady.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace StageReady.Api.Services;

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
