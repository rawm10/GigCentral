using StageReady.Api.Data;
using StageReady.Api.DTOs;
using Microsoft.EntityFrameworkCore;

namespace StageReady.Api.Services;

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

    public async Task<DirectoryResponse?> GetDirectoryAsync(Guid id, Guid userId)
    {
        var directory = await _context.Directories
            .FirstOrDefaultAsync(d => d.Id == id && d.UserId == userId);
        
        if (directory == null) return null;
        
        return new DirectoryResponse(
            directory.Id.ToString(),
            directory.Name,
            directory.Description,
            directory.SortOrder
        );
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
