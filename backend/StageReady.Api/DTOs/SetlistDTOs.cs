namespace StageReady.Api.DTOs;

public record SetlistResponse(string Id, string DirectoryId, string Name, List<SetlistItemResponse>? Items, DateTime CreatedAt);
public record CreateSetlistRequest(Guid DirectoryId, string Name);
public record SetlistItemResponse(string Id, string SheetId, int Position, string? Title, string? Artist, string? Key);
public record AddSetlistItemRequest(Guid SheetId, int? Position);
public record ReorderItemsRequest(List<ReorderItem> Items);
public record ReorderItem(Guid Id, int Position);
