namespace StageReady.Api.Models;

public class Preferences
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public double FontScale { get; set; } = 1.0;
    public string Theme { get; set; } = "light";
    public bool AutoScroll { get; set; } = false;
    public int? ScrollBpm { get; set; }
    public bool HighContrast { get; set; } = false;
    
    public User User { get; set; } = null!;
}
