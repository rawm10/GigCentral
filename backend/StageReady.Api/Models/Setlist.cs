namespace StageReady.Api.Models;

public class Setlist
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid DirectoryId { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public Directory Directory { get; set; } = null!;
    public ICollection<SetlistItem> Items { get; set; } = new List<SetlistItem>();
}

public class SetlistItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid SetlistId { get; set; }
    public Guid SheetId { get; set; }
    public int Position { get; set; }
    
    public Setlist Setlist { get; set; } = null!;
    public Sheet Sheet { get; set; } = null!;
}
