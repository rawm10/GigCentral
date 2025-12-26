using StageReady.Api.DTOs;

namespace StageReady.Api.Services;

public interface ISetlistService
{
    Task<IEnumerable<SetlistResponse>> GetSetlistsByDirectoryAsync(Guid directoryId, Guid userId);
    Task<SetlistResponse?> GetSetlistAsync(Guid setlistId, Guid userId);
    Task<SetlistResponse> CreateSetlistAsync(CreateSetlistRequest request, Guid userId);
    Task<SetlistItemResponse> AddItemAsync(Guid setlistId, AddSetlistItemRequest request, Guid userId);
    Task RemoveItemAsync(Guid setlistId, Guid itemId, Guid userId);
    Task ReorderItemsAsync(Guid setlistId, ReorderItemsRequest request, Guid userId);
}
