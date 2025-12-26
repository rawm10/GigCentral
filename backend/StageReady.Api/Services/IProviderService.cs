using StageReady.Api.DTOs;

namespace StageReady.Api.Services;

public interface IProviderService
{
    Task<IEnumerable<ProviderResponse>> GetProvidersAsync(Guid userId);
    Task<ProviderResponse> AddProviderAsync(ProviderInput input, Guid userId);
}
