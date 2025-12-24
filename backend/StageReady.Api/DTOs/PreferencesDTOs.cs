namespace StageReady.Api.DTOs;

public record PreferencesResponse(
    double FontScale,
    string Theme,
    bool AutoScroll,
    int? ScrollBpm,
    bool HighContrast
);

public record PreferencesInput(
    double? FontScale,
    string? Theme,
    bool? AutoScroll,
    int? ScrollBpm,
    bool? HighContrast
);
