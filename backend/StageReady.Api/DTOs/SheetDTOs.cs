namespace StageReady.Api.DTOs;

public record SheetSummaryResponse(
    string Id,
    string Title,
    string? Artist,
    string? Key,
    DateTime UpdatedAt
);

public record SheetResponse(
    string Id,
    string Title,
    string? Artist,
    string? Key,
    int? Capo,
    string Format,
    string Body,
    string? Source,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public record SheetInput(
    string Title,
    string? Artist,
    string? Key,
    int? Capo,
    string? Format,
    string Body,
    string? Source
);

public record ImportSheetRequest(
    string SourceType,
    string? Body,
    string? ProviderName,
    string? ProviderSongId,
    Guid? PatId
);

public record PreviewFormatRequest(
    string Body,
    bool ChordsOnly,
    string? CustomInstructions
);

public record FormatSheetRequest(
    string? Strategy,
    ViewportInfo? Viewport,
    FormatOptions? Options
);

public record ViewportInfo(int Width, int Height, int Dpi);
public record FormatOptions(double? FontScale, bool? AvoidScroll);

public record FormatSheetResponse(
    string FormattedBody,
    MetricsInfo Metrics
);

public record MetricsInfo(int Lines, int EstimatedPageCount);

public record TransposeRequest(int? Semitones, bool? UseNashville);
