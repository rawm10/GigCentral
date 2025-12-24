namespace StageReady.Api.DTOs;

public record DirectoryResponse(string Id, string Name, string? Description, int SortOrder);
public record DirectoryInput(string Name, string? Description, int? SortOrder);
