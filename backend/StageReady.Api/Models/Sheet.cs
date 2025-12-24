namespace StageReady.Api.Models;

public class Sheet
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Artist { get; set; }
    public string? Key { get; set; }
    public int? Capo { get; set; }
    public string Format { get; set; } = "chordpro";
    public string Body { get; set; } = string.Empty;
    public string? Source { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    public User User { get; set; } = null!;
}

public class SheetVersion
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid SheetId { get; set; }
    public string Body { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public Sheet Sheet { get; set; } = null!;
}
