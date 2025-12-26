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
