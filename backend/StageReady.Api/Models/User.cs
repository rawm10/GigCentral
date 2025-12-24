namespace StageReady.Api.Models;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string? ExternalSub { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? PasswordHash { get; set; }
    public string? DisplayName { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
