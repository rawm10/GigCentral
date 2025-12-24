namespace StageReady.Api.DTOs;

public record SetlistResponse(string Id, string DirectoryId, string Name, DateTime CreatedAt);
public record CreateSetlistRequest(Guid DirectoryId, string Name);
public record SetlistItemResponse(string Id, string SetlistId, string SheetId, int Position);
public record AddSetlistItemRequest(Guid SheetId, int? Position);
