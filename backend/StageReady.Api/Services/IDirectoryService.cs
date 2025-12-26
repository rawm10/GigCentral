using StageReady.Api.DTOs;

namespace StageReady.Api.Services;

public interface IDirectoryService
{
    Task<IEnumerable<DirectoryResponse>> GetDirectoriesAsync(Guid userId);
    Task<DirectoryResponse?> GetDirectoryAsync(Guid id, Guid userId);
    Task<DirectoryResponse> CreateDirectoryAsync(DirectoryInput input, Guid userId);
    Task<DirectoryResponse> UpdateDirectoryAsync(Guid id, DirectoryInput input, Guid userId);
    Task DeleteDirectoryAsync(Guid id, Guid userId);
}
