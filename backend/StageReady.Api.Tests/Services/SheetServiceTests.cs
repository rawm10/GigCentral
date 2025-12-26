using Xunit;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using Moq;
using StageReady.Api.Data;
using StageReady.Api.DTOs;
using StageReady.Api.Services;

namespace StageReady.Api.Tests.Services;

public class SheetServiceTests : IDisposable
{
    private readonly StageReadyDbContext _context;
    private readonly SheetService _service;
    private readonly IFormatterService _mockFormatterService;
    private readonly Guid _testUserId = Guid.NewGuid();
    
    public SheetServiceTests()
    {
        var options = new DbContextOptionsBuilder<StageReadyDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        
        _context = new StageReadyDbContext(options);
        
        // Mock formatter service
        var mockFormatter = new Mock<IFormatterService>();
        mockFormatter.Setup(f => f.FormatToChordProAsync(It.IsAny<string>(), It.IsAny<bool>(), It.IsAny<string>()))
            .ReturnsAsync((string input, bool chordsOnly, string? instructions) => input);
        mockFormatter.Setup(f => f.TransposeAsync(It.IsAny<string>(), It.IsAny<int>(), It.IsAny<bool>()))
            .ReturnsAsync((string input, int semitones, bool useNashville) => input);
        
        _mockFormatterService = mockFormatter.Object;
        _service = new SheetService(_context, _mockFormatterService);
    }
    
    [Fact]
    public async Task CreateSheetAsync_ShouldCreateSheet()
    {
        var input = new SheetInput(
            Title: "Test Song",
            Artist: "Test Artist",
            Key: "C",
            Capo: 0,
            Format: "chordpro",
            Body: "[C]Hello world",
            Source: "manual"
        );
        
        var result = await _service.CreateSheetAsync(input, _testUserId);
        
        result.Should().NotBeNull();
        result.Title.Should().Be("Test Song");
        result.Artist.Should().Be("Test Artist");
        result.Key.Should().Be("C");
        result.Body.Should().Be("[C]Hello world");
        
        var sheetInDb = await _context.Sheets.FirstOrDefaultAsync(s => s.Title == "Test Song");
        sheetInDb.Should().NotBeNull();
    }
    
    [Fact]
    public async Task GetSheetAsync_ShouldReturnSheetForUser()
    {
        var input = new SheetInput(
            Title: "Get Test",
            Artist: null,
            Key: "G",
            Capo: null,
            Format: "chordpro",
            Body: "[G]Test",
            Source: null
        );
        
        var created = await _service.CreateSheetAsync(input, _testUserId);
        
        var result = await _service.GetSheetAsync(Guid.Parse(created.Id), _testUserId);
        
        result.Should().NotBeNull();
        result!.Title.Should().Be("Get Test");
        result.Key.Should().Be("G");
    }
    
    [Fact]
    public async Task GetSheetAsync_ShouldReturnNullForWrongUser()
    {
        var input = new SheetInput("Sheet", null, null, null, "chordpro", "Body", null);
        var created = await _service.CreateSheetAsync(input, _testUserId);
        
        var wrongUserId = Guid.NewGuid();
        var result = await _service.GetSheetAsync(Guid.Parse(created.Id), wrongUserId);
        
        result.Should().BeNull();
    }
    
    [Fact]
    public async Task UpdateSheetAsync_ShouldUpdateSheet()
    {
        var input = new SheetInput("Original", "Artist", "C", 0, "chordpro", "Original body", null);
        var created = await _service.CreateSheetAsync(input, _testUserId);
        
        var updateInput = new SheetInput("Updated", "New Artist", "D", 2, "chordpro", "Updated body", "edited");
        var result = await _service.UpdateSheetAsync(Guid.Parse(created.Id), updateInput, _testUserId);
        
        result.Title.Should().Be("Updated");
        result.Artist.Should().Be("New Artist");
        result.Key.Should().Be("D");
        result.Capo.Should().Be(2);
        result.Body.Should().Be("Updated body");
        result.Source.Should().Be("edited");
    }
    
    [Fact]
    public async Task UpdateSheetAsync_ShouldCreateVersion()
    {
        var input = new SheetInput("Version Test", null, null, null, "chordpro", "Original", null);
        var created = await _service.CreateSheetAsync(input, _testUserId);
        
        var updateInput = new SheetInput("Version Test", null, null, null, "chordpro", "Updated", null);
        await _service.UpdateSheetAsync(Guid.Parse(created.Id), updateInput, _testUserId);
        
        var versions = await _context.SheetVersions
            .Where(v => v.SheetId == Guid.Parse(created.Id))
            .ToListAsync();
        
        versions.Should().HaveCount(1);
        versions[0].Body.Should().Be("Original");
    }
    
    [Fact]
    public async Task DeleteSheetAsync_ShouldRemoveSheet()
    {
        var input = new SheetInput("Delete Test", null, null, null, "chordpro", "Body", null);
        var created = await _service.CreateSheetAsync(input, _testUserId);
        
        await _service.DeleteSheetAsync(Guid.Parse(created.Id), _testUserId);
        
        var deleted = await _context.Sheets.FindAsync(Guid.Parse(created.Id));
        deleted.Should().BeNull();
    }
    
    [Fact]
    public async Task GetSheetsAsync_ShouldReturnUserSheets()
    {
        await _service.CreateSheetAsync(new SheetInput("Sheet 1", null, null, null, "chordpro", "Body 1", null), _testUserId);
        await _service.CreateSheetAsync(new SheetInput("Sheet 2", null, null, null, "chordpro", "Body 2", null), _testUserId);
        
        var otherUserId = Guid.NewGuid();
        await _service.CreateSheetAsync(new SheetInput("Other Sheet", null, null, null, "chordpro", "Body", null), otherUserId);
        
        var result = await _service.GetSheetsAsync(_testUserId, null, 1, 10);
        
        result.Should().HaveCount(2);
        result.Should().OnlyContain(s => s.Title.StartsWith("Sheet"));
    }
    
    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }
}
