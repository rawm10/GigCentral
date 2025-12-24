namespace StageReady.Api.DTOs;

public record ProviderResponse(string Id, string Name, DateTime CreatedAt);
public record ProviderInput(string Name, string Pat);
