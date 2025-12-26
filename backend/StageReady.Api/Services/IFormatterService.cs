using StageReady.Api.DTOs;

namespace StageReady.Api.Services;

public interface IFormatterService
{
    Task<string> FormatToChordProAsync(string input, bool chordsOnly = false, string? customInstructions = null);
    Task<string> FormatForViewportAsync(string chordPro, ViewportInfo? viewport, FormatOptions? options);
    Task<string> TransposeAsync(string chordPro, int semitones, bool useNashville);
}
