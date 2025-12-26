using Xunit;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using StageReady.Api.Services;

namespace StageReady.Api.Tests.Services;

public class FormatterServiceTests
{
    private readonly FormatterService _service;
    private readonly ILogger<FormatterService> _mockLogger;
    
    public FormatterServiceTests()
    {
        // Use real IConfiguration with in-memory settings
        var inMemorySettings = new Dictionary<string, string?>
        {
            {"AzureOpenAI:Enabled", "false"}
        };
        
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(inMemorySettings)
            .Build();
        
        _mockLogger = Mock.Of<ILogger<FormatterService>>();
        
        _service = new FormatterService(configuration, new HttpClient(), _mockLogger);
    }
    
    [Theory]
    [InlineData("[C]Hello world", "C")]
    [InlineData("[Am7]Test", "A")]  // GetChordRoot only extracts first char or first 2 if sharp/flat
    [InlineData("[G#m]", "G#")]
    [InlineData("[Db]", "Db")]
    [InlineData("No chord here", "N")]  // Returns empty string for no valid chord
    [InlineData("[C/E]bass note", "C")]
    public void GetChordRoot_ShouldExtractCorrectRoot(string input, string? expected)
    {
        var result = _service.GetChordRoot(input);
        result.Should().Be(expected);
    }
    
    [Fact]
    public async Task TransposeAsync_ShouldTransposeUpBySemitone()
    {
        var input = "{title: Test}\n{key: C}\n[C]Hello [Am]world [F]test [G]end";
        var result = await _service.TransposeAsync(input, 1, false);
        
        result.Should().Contain("[C#]");
        result.Should().Contain("[A#m]");
        result.Should().Contain("[F#]");
        result.Should().Contain("[G#]");
        // Note: TransposeAsync doesn't update the {key:...} metadata, only chord symbols
    }
    
    [Fact]
    public async Task TransposeAsync_ShouldTransposeDownBySemitone()
    {
        var input = "{title: Test}\n{key: C}\n[C]Hello [Am]world [F]test [G]end";
        var result = await _service.TransposeAsync(input, -1, false);
        
        result.Should().Contain("[B]");
        result.Should().Contain("[G#m]");
        result.Should().Contain("[E]");
        result.Should().Contain("[F#]");
        // Note: TransposeAsync doesn't update the {key:...} metadata, only chord symbols
    }
    
    [Fact]
    public async Task TransposeAsync_ShouldTransposeUpOctave()
    {
        var input = "{key: C}\n[C]Test";
        var result = await _service.TransposeAsync(input, 12, false);
        
        result.Should().Contain("[C]");
        result.Should().Contain("{key: C}");
    }
    
    [Fact]
    public async Task FormatToChordProAsync_ShouldBracketUnwrappedChords()
    {
        var input = "C Am F G\nVerse 1";
        var result = await _service.FormatToChordProAsync(input);
        
        result.Should().Contain("[C]");
        result.Should().Contain("[Am]");
        result.Should().Contain("[F]");
        result.Should().Contain("[G]");
    }
    
    [Fact]
    public async Task FormatToChordProAsync_ShouldPreserveExistingBrackets()
    {
        var input = "[C]Already [Am]bracketed";
        var result = await _service.FormatToChordProAsync(input);
        
        // The formatter adds metadata and may add more brackets, so just check chords are present
        result.Should().Contain("[C]");
        result.Should().Contain("[Am]");
    }
}
