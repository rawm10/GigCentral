Here's a comprehensive set of unit tests for the `FormatterService` class using xUnit, FluentAssertions, and Moq:


This set of unit tests covers the following scenarios:

1. `FormatToChordProAsync` should format the input using AI when AI is enabled.
2. `FormatToChordProAsync` should fall back to rules-based formatting when AI fails.
3. `FormatToChordProAsync` should format the input using rules-based formatting when AI is disabled.
4. `FormatForViewportAsync` should wrap lines according to the provided viewport information.
5. `TransposeAsync` should transpose chords by the specified semitones.
6. `TransposeAsync` should use the Nashville number system when requested.
7. `GetChordRoot` should extract the chord root from the input chord.

These tests use Moq to create mock dependencies for the `IConfiguration`, `HttpClient`, and `ILogger` interfaces, and FluentAssertions to make the assertions more readable and expressive.
