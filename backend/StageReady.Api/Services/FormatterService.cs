using StageReady.Api.DTOs;
using System.Text.RegularExpressions;
using System.Text.Json;
using System.Text;

namespace StageReady.Api.Services;

public class FormatterService : IFormatterService
{
    private readonly IConfiguration _configuration;
    private readonly HttpClient _httpClient;
    private readonly ILogger<FormatterService> _logger;
    
    public FormatterService(
        IConfiguration configuration,
        HttpClient httpClient,
        ILogger<FormatterService> logger)
    {
        _configuration = configuration;
        _httpClient = httpClient;
        _logger = logger;
    }
    
    public async Task<string> FormatToChordProAsync(string input, bool chordsOnly = false, string? customInstructions = null)
    {
        // Try AI formatting first if enabled
        var aiEnabled = _configuration.GetValue<bool>("AzureOpenAI:Enabled");
        if (aiEnabled)
        {
            try
            {
                var aiResult = await FormatWithAIAsync(input, chordsOnly, customInstructions);
                if (!string.IsNullOrEmpty(aiResult))
                {
                    return aiResult;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "AI formatting failed, falling back to rules-based formatting");
            }
        }
        
        // Fall back to rules-based formatting
        return FormatWithRules(input, chordsOnly);
    }
    
    private async Task<string> FormatWithAIAsync(string input, bool chordsOnly, string? customInstructions = null)
    {
        var endpoint = _configuration["AzureOpenAI:Endpoint"];
        var apiKey = _configuration["AzureOpenAI:ApiKey"];
        var deploymentName = _configuration["AzureOpenAI:DeploymentName"];
        
        if (string.IsNullOrEmpty(endpoint) || string.IsNullOrEmpty(apiKey))
        {
            return string.Empty;
        }
        
        var url = $"{endpoint}/openai/deployments/{deploymentName}/chat/completions?api-version=2024-08-01-preview";
        
        var systemPrompt = chordsOnly 
            ? @"You are a chord sheet formatter. Format the chord progression in a clean, easy-to-read format.

Rules:
1. Extract ONLY the chords from the input
2. Use {title: ...}, {artist: ...}, {key: ...}, {capo: ...} for metadata if present
3. Wrap ALL chords in brackets like [C], [Am], [G7]
4. Organize chords by section (Verse, Chorus, Bridge, etc.)
5. Use chord diagrams/progressions format: [C] [Am] [F] [G]
6. Include timing/bar information if present (e.g., | [C] | [Am] | [F] [G] |)
7. Remove all lyrics, keep only chord information

Output ONLY the formatted chord progression, nothing else."
            : @"You are a chord sheet formatter. Convert the user's input into clean ChordPro format.

Rules:
1. Use {title: ...}, {artist: ...}, {key: ...}, {capo: ...} for metadata
2. Wrap ALL chords in brackets like [C], [Am], [G7]
3. Place chords inline with lyrics at the position they should be played
4. Preserve song structure (verses, choruses, bridge, etc.) using {start_of_verse}, {end_of_verse}, etc.
5. Remove any tab notation or guitar tablature
6. Clean up formatting but preserve the song's content
7. If key or capo info is present, extract it to metadata
8. Make it clean, readable, and easy to play

Output ONLY the formatted ChordPro text, nothing else.";

        // Add custom instructions if provided
        var userPrompt = input;
        if (!string.IsNullOrEmpty(customInstructions))
        {
            userPrompt = $"{input}\n\n---\nAdditional Instructions: {customInstructions}";
        }

        var requestBody = new
        {
            messages = new[]
            {
                new { role = "system", content = systemPrompt },
                new { role = "user", content = userPrompt }
            },
            temperature = 0.3,
            max_tokens = 2000
        };
        
        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("api-key", apiKey);
        request.Content = new StringContent(
            JsonSerializer.Serialize(requestBody),
            Encoding.UTF8,
            "application/json");
        
        var response = await _httpClient.SendAsync(request);
        response.EnsureSuccessStatusCode();
        
        var responseBody = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(responseBody);
        
        if (doc.RootElement.TryGetProperty("choices", out var choices) &&
            choices.GetArrayLength() > 0)
        {
            var firstChoice = choices[0];
            if (firstChoice.TryGetProperty("message", out var message) &&
                message.TryGetProperty("content", out var content))
            {
                return content.GetString() ?? string.Empty;
            }
        }
        
        return string.Empty;
    }
    
    private string FormatWithRules(string input, bool chordsOnly)
    {
        if (chordsOnly)
        {
            return ExtractChordsOnly(input);
        }
        
        if (input.Contains("{title:") || input.Contains("{t:"))
        {
            // Already in ChordPro format, but ensure chords are bracketed line by line
            var inputLines = input.Split('\n');
            var result = new System.Text.StringBuilder();
            
            foreach (var inputLine in inputLines)
            {
                result.AppendLine(EnsureChordsAreBracketed(inputLine));
            }
            
            return result.ToString().TrimEnd();
        }

        var lines = input.Split('\n');
        var output = new System.Text.StringBuilder();
        
        // Try to detect title from first non-empty line
        var firstLine = lines.FirstOrDefault(l => !string.IsNullOrWhiteSpace(l));
        if (firstLine != null && !firstLine.StartsWith("{title:"))
        {
            output.AppendLine($"{{title: {firstLine.Trim()}}}");
        }

        for (int i = 0; i < lines.Length; i++)
        {
            var line = lines[i];
            
            if (string.IsNullOrWhiteSpace(line))
            {
                output.AppendLine();
                continue;
            }

            // Skip metadata lines
            if (line.StartsWith("{"))
            {
                output.AppendLine(line);
                continue;
            }

            // Detect chord lines (lines with mostly chord-like patterns)
            if (IsChordLine(line))
            {
                // Convert chord line to inline chords
                if (i + 1 < lines.Length)
                {
                    var lyricLine = lines[i + 1];
                    output.AppendLine(MergeChordAndLyrics(line, lyricLine));
                    i++; // Skip the lyric line since we merged it
                }
                else
                {
                    // Chord line without lyrics
                    output.AppendLine(BracketChords(line));
                }
            }
            else
            {
                // Regular line - check if it has inline chords
                output.AppendLine(EnsureChordsAreBracketed(line));
            }
        }

        return output.ToString();
    }

    private static string EnsureChordsAreBracketed(string line)
    {
        // Skip metadata lines (ChordPro directives like {title: ...}, {artist: ...})
        if (line.TrimStart().StartsWith("{"))
        {
            return line;
        }
        
        // Find standalone chords (not already in brackets) and wrap them
        // Matches: C, Am, D7, Gsus4, c, am, etc. (case insensitive) but not [C], [Am], etc.
        var chordPattern = new Regex(@"(?<!\[)\b([A-Ga-g][#b]?(?:maj|min|m|M|sus|dim|aug|add)?[0-9]*)(?!\])", RegexOptions.IgnoreCase);
        return chordPattern.Replace(line, match => 
        {
            var chord = match.Groups[1].Value;
            // Capitalize first letter
            if (chord.Length > 0)
            {
                chord = char.ToUpper(chord[0]) + chord.Substring(1);
            }
            return $"[{chord}]";
        });
    }

    private static string BracketChords(string line)
    {
        // Skip metadata lines
        if (line.TrimStart().StartsWith("{"))
        {
            return line;
        }
        
        var chordPattern = new Regex(@"\b([A-Ga-g][#b]?(?:maj|min|m|M|sus|dim|aug|add)?[0-9]*)\b", RegexOptions.IgnoreCase);
        return chordPattern.Replace(line, match =>
        {
            var chord = match.Groups[1].Value;
            // Capitalize first letter
            if (chord.Length > 0)
            {
                chord = char.ToUpper(chord[0]) + chord.Substring(1);
            }
            return $"[{chord}]";
        });
    }

    public async Task<string> FormatForViewportAsync(string chordPro, ViewportInfo? viewport, FormatOptions? options)
    {
        await Task.CompletedTask;
        
        // Basic viewport formatting - wrap lines to fit
        var maxWidth = viewport?.Width ?? 800;
        var fontScale = options?.FontScale ?? 1.0;
        var charsPerLine = (int)(maxWidth / (8 * fontScale)); // Approximate

        var lines = chordPro.Split('\n');
        var output = new System.Text.StringBuilder();

        foreach (var line in lines)
        {
            if (line.Length <= charsPerLine || line.StartsWith("{"))
            {
                output.AppendLine(line);
            }
            else
            {
                // Wrap long lines
                var words = line.Split(' ');
                var currentLine = "";
                
                foreach (var word in words)
                {
                    if ((currentLine + word).Length > charsPerLine)
                    {
                        output.AppendLine(currentLine.Trim());
                        currentLine = word + " ";
                    }
                    else
                    {
                        currentLine += word + " ";
                    }
                }
                
                if (!string.IsNullOrEmpty(currentLine))
                {
                    output.AppendLine(currentLine.Trim());
                }
            }
        }

        return output.ToString();
    }

    public async Task<string> TransposeAsync(string chordPro, int semitones, bool useNashville)
    {
        await Task.CompletedTask;
        
        if (semitones == 0 && !useNashville) return chordPro;

        var chordPattern = new Regex(@"\[([A-G][#b]?(?:maj|min|m|M|sus|dim|aug|add)?[0-9]*)\]");
        
        return chordPattern.Replace(chordPro, match =>
        {
            var chord = match.Groups[1].Value;
            var transposed = useNashville ? ToNashville(chord) : TransposeChord(chord, semitones);
            return $"[{transposed}]";
        });
    }

    private static bool IsChordLine(string? line)
    {
        if (string.IsNullOrWhiteSpace(line)) return false;
        
        var chordPattern = new Regex(@"\b[A-G][#b]?(maj|min|m|M|sus|dim|aug|add)?[0-9]*\b");
        var matches = chordPattern.Matches(line);
        var chordChars = matches.Sum(m => m.Length);
        
        return chordChars > line.Length * 0.3; // 30% or more is chord-like
    }

    private static string MergeChordAndLyrics(string chordLine, string lyricLine)
    {
        var chordPattern = new Regex(@"\b[A-G][#b]?(maj|min|m|M|sus|dim|aug|add)?[0-9]*\b");
        var matches = chordPattern.Matches(chordLine);
        
        var result = lyricLine;
        foreach (Match match in matches.Reverse())
        {
            var position = match.Index;
            if (position <= result.Length)
            {
                result = result.Insert(position, $"[{match.Value}]");
            }
        }
        
        return result;
    }

    private static string TransposeChord(string chord, int semitones)
    {
        var notes = new[] { "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B" };
        var flats = new Dictionary<string, string>
        {
            ["Db"] = "C#", ["Eb"] = "D#", ["Gb"] = "F#", ["Ab"] = "G#", ["Bb"] = "A#"
        };
        
        var notePattern = new Regex(@"^([A-G][#b]?)(.*)$");
        var match = notePattern.Match(chord);
        
        if (!match.Success) return chord;
        
        var note = match.Groups[1].Value;
        var suffix = match.Groups[2].Value;
        
        // Convert flats to sharps
        if (flats.TryGetValue(note, out var sharpNote))
        {
            note = sharpNote;
        }
        
        var index = Array.IndexOf(notes, note);
        if (index == -1) return chord;
        
        var newIndex = (index + semitones + 12) % 12;
        return notes[newIndex] + suffix;
    }

    private string ExtractChordsOnly(string input)
    {
        var output = new System.Text.StringBuilder();
        var lines = input.Split('\n');
        var chordPattern = new Regex(@"\b([A-G][#b]?(?:maj|min|m|M|sus|dim|aug|add)?[0-9]*)\b", RegexOptions.IgnoreCase);
        
        string? currentSection = null;
        var sectionChords = new List<string>();
        
        for (int i = 0; i < lines.Length; i++)
        {
            var line = lines[i].Trim();
            
            if (string.IsNullOrWhiteSpace(line)) continue;
            
            // Detect section headers (Verse, Chorus, Bridge, etc.)
            if (Regex.IsMatch(line, @"^(Verse|Chorus|Bridge|Intro|Outro|Pre-?Chorus|Interlude|Solo)", RegexOptions.IgnoreCase))
            {
                // Output previous section if exists
                if (currentSection != null && sectionChords.Count > 0)
                {
                    output.AppendLine($"{{start_of_{currentSection.ToLower()}}}");
                    output.AppendLine(string.Join(" ", sectionChords.Select(c => $"[{c}]")));
                    output.AppendLine($"{{end_of_{currentSection.ToLower()}}}");
                    output.AppendLine();
                }
                
                currentSection = line;
                sectionChords.Clear();
                continue;
            }
            
            // Extract chords from line
            var matches = chordPattern.Matches(line);
            if (matches.Count > 0)
            {
                foreach (Match match in matches)
                {
                    var chord = match.Groups[1].Value;
                    // Capitalize first letter
                    if (chord.Length > 0)
                    {
                        chord = char.ToUpper(chord[0]) + chord.Substring(1);
                    }
                    if (!sectionChords.Contains(chord))
                    {
                        sectionChords.Add(chord);
                    }
                }
            }
        }
        
        // Output last section
        if (currentSection != null && sectionChords.Count > 0)
        {
            output.AppendLine($"{{start_of_{currentSection.ToLower()}}}");
            output.AppendLine(string.Join(" ", sectionChords.Select(c => $"[{c}]")));
            output.AppendLine($"{{end_of_{currentSection.ToLower()}}}");
        }
        else if (sectionChords.Count > 0)
        {
            // No sections detected, just output all chords
            output.AppendLine(string.Join(" ", sectionChords.Select(c => $"[{c}]")));
        }
        
        return output.ToString();
    }

    private static string ToNashville(string chord)
    {
        // Simplified Nashville number conversion (assumes C major key)
        var noteToNumber = new Dictionary<string, string>
        {
            ["C"] = "1", ["D"] = "2", ["E"] = "3", ["F"] = "4",
            ["G"] = "5", ["A"] = "6", ["B"] = "7"
        };
        
        var notePattern = new Regex(@"^([A-G])(.*)$");
        var match = notePattern.Match(chord);
        
        if (!match.Success) return chord;
        
        var note = match.Groups[1].Value;
        var suffix = match.Groups[2].Value;
        
        return noteToNumber.TryGetValue(note, out var number) ? number + suffix : chord;
    }

    // Simple utility method to test AI generation
    public string GetChordRoot(string chord)
    {
        if (string.IsNullOrWhiteSpace(chord))
            return string.Empty;
            
        // Remove brackets if present
        chord = chord.Trim('[', ']');
        
        // Extract root note (first 1-2 characters)
        if (chord.Length >= 2 && (chord[1] == '#' || chord[1] == 'b'))
            return chord.Substring(0, 2);
        
        return chord.Length > 0 ? chord.Substring(0, 1) : string.Empty;
    }
}
