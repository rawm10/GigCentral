using StageReady.Api.DTOs;

namespace StageReady.Api.Services;

public interface IPreferencesService
{
    Task<PreferencesResponse?> GetPreferencesAsync(Guid userId);
    Task<PreferencesResponse> UpdatePreferencesAsync(PreferencesInput input, Guid userId);
}
