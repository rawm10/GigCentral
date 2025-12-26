using StageReady.Api.DTOs;

namespace StageReady.Api.Services;

public interface IProviderService
{
    Task<IEnumerable<ProviderResponse>> GetProvidersAsync(Guid userId);
    Task<ProviderResponse> AddProviderAsync(ProviderInput input, Guid userId);
}

public interface IDirectoryService
{
    Task<IEnumerable<DirectoryResponse>> GetDirectoriesAsync(Guid userId);
    Task<DirectoryResponse?> GetDirectoryAsync(Guid id, Guid userId);
    Task<DirectoryResponse> CreateDirectoryAsync(DirectoryInput input, Guid userId);
    Task<DirectoryResponse> UpdateDirectoryAsync(Guid id, DirectoryInput input, Guid userId);
    Task DeleteDirectoryAsync(Guid id, Guid userId);
}

public interface ISetlistService
{
    Task<IEnumerable<SetlistResponse>> GetSetlistsByDirectoryAsync(Guid directoryId, Guid userId);
    Task<SetlistResponse?> GetSetlistAsync(Guid setlistId, Guid userId);
    Task<SetlistResponse> CreateSetlistAsync(CreateSetlistRequest request, Guid userId);
    Task<SetlistItemResponse> AddItemAsync(Guid setlistId, AddSetlistItemRequest request, Guid userId);
    Task RemoveItemAsync(Guid setlistId, Guid itemId, Guid userId);
    Task ReorderItemsAsync(Guid setlistId, ReorderItemsRequest request, Guid userId);
}

public interface IPreferencesService
{
    Task<PreferencesResponse?> GetPreferencesAsync(Guid userId);
    Task<PreferencesResponse> UpdatePreferencesAsync(PreferencesInput input, Guid userId);
}
