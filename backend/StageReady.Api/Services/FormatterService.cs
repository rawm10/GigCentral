using StageReady.Api.DTOs;
using System.Text.RegularExpressions;

namespace StageReady.Api.Services;

public class FormatterService : IFormatterService
{
    public async Task<string> FormatToChordProAsync(string input)
    {
        // This is a basic rules-based formatter
        // In production, this would call Azure OpenAI for AI-powered formatting
        
        await Task.CompletedTask;
        
        if (input.Contains("{title:") || input.Contains("{t:"))
        {
            // Already in ChordPro format
            return input;
        }

        var lines = input.Split('\n');
        var output = new System.Text.StringBuilder();
        
        // Try to detect title from first non-empty line
        var firstLine = lines.FirstOrDefault(l => !string.IsNullOrWhiteSpace(l));
        if (firstLine != null)
        {
            output.AppendLine($"{{title: {firstLine.Trim()}}}");
        }

        foreach (var line in lines.Skip(1))
        {
            if (string.IsNullOrWhiteSpace(line))
            {
                output.AppendLine();
                continue;
            }

            // Detect chord lines (lines with mostly chord-like patterns)
            if (IsChordLine(line))
            {
                // Convert chord line to inline chords
                var nextLineIdx = Array.IndexOf(lines, line) + 1;
                if (nextLineIdx < lines.Length)
                {
                    var lyricLine = lines[nextLineIdx];
                    output.AppendLine(MergeChordAndLyrics(line, lyricLine));
                }
            }
            else if (!IsChordLine(lines.ElementAtOrDefault(Array.IndexOf(lines, line) - 1)))
            {
                output.AppendLine(line);
            }
        }

        return output.ToString();
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
        var notePattern = new Regex(@"^([A-G][#b]?)(.*)$");
        var match = notePattern.Match(chord);
        
        if (!match.Success) return chord;
        
        var note = match.Groups[1].Value.Replace("b", "#");
        var suffix = match.Groups[2].Value;
        
        var index = Array.IndexOf(notes, note);
        if (index == -1) return chord;
        
        var newIndex = (index + semitones + 12) % 12;
        return notes[newIndex] + suffix;
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
}
