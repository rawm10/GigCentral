using StageReady.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace StageReady.Api.Data;

public class StageReadyDbContext : DbContext
{
    public StageReadyDbContext(DbContextOptions<StageReadyDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Provider> Providers => Set<Provider>();
    public DbSet<Models.Directory> Directories => Set<Models.Directory>();
    public DbSet<Sheet> Sheets => Set<Sheet>();
    public DbSet<SheetVersion> SheetVersions => Set<SheetVersion>();
    public DbSet<Setlist> Setlists => Set<Setlist>();
    public DbSet<SetlistItem> SetlistItems => Set<SetlistItem>();
    public DbSet<Preferences> Preferences => Set<Preferences>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("users");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.ExternalSub).HasColumnName("external_sub");
            entity.Property(e => e.Email).HasColumnName("email").IsRequired();
            entity.Property(e => e.PasswordHash).HasColumnName("password_hash");
            entity.Property(e => e.DisplayName).HasColumnName("display_name");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            
            entity.HasIndex(e => e.Email).IsUnique();
            entity.HasIndex(e => e.ExternalSub).IsUnique();
        });

        modelBuilder.Entity<Provider>(entity =>
        {
            entity.ToTable("providers");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.Name).HasColumnName("name").IsRequired();
            entity.Property(e => e.PatCipher).HasColumnName("pat_cipher").IsRequired();
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            
            entity.HasOne(e => e.User)
                  .WithMany()
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Models.Directory>(entity =>
        {
            entity.ToTable("directories");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.Name).HasColumnName("name").IsRequired();
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.SortOrder).HasColumnName("sort_order");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            
            entity.HasOne(e => e.User)
                  .WithMany()
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Sheet>(entity =>
        {
            entity.ToTable("sheets");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.Title).HasColumnName("title").IsRequired();
            entity.Property(e => e.Artist).HasColumnName("artist");
            entity.Property(e => e.Key).HasColumnName("key");
            entity.Property(e => e.Capo).HasColumnName("capo");
            entity.Property(e => e.Format).HasColumnName("format").IsRequired();
            entity.Property(e => e.Body).HasColumnName("body").IsRequired();
            entity.Property(e => e.Source).HasColumnName("source");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");
            
            entity.HasOne(e => e.User)
                  .WithMany()
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
                  
            entity.HasIndex(e => new { e.UserId, e.Title });
        });

        modelBuilder.Entity<SheetVersion>(entity =>
        {
            entity.ToTable("sheet_versions");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.SheetId).HasColumnName("sheet_id");
            entity.Property(e => e.Body).HasColumnName("body").IsRequired();
            entity.Property(e => e.Notes).HasColumnName("notes");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            
            entity.HasOne(e => e.Sheet)
                  .WithMany()
                  .HasForeignKey(e => e.SheetId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Setlist>(entity =>
        {
            entity.ToTable("setlists");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.DirectoryId).HasColumnName("directory_id");
            entity.Property(e => e.Name).HasColumnName("name").IsRequired();
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            
            entity.HasOne(e => e.Directory)
                  .WithMany()
                  .HasForeignKey(e => e.DirectoryId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<SetlistItem>(entity =>
        {
            entity.ToTable("setlist_items");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.SetlistId).HasColumnName("setlist_id");
            entity.Property(e => e.SheetId).HasColumnName("sheet_id");
            entity.Property(e => e.Position).HasColumnName("position");
            
            entity.HasOne(e => e.Setlist)
                  .WithMany(s => s.Items)
                  .HasForeignKey(e => e.SetlistId)
                  .OnDelete(DeleteBehavior.Cascade);
                  
            entity.HasOne(e => e.Sheet)
                  .WithMany()
                  .HasForeignKey(e => e.SheetId)
                  .OnDelete(DeleteBehavior.Cascade);
                  
            entity.HasIndex(e => new { e.SetlistId, e.Position });
        });

        modelBuilder.Entity<Preferences>(entity =>
        {
            entity.ToTable("preferences");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.FontScale).HasColumnName("font_scale");
            entity.Property(e => e.Theme).HasColumnName("theme");
            entity.Property(e => e.AutoScroll).HasColumnName("auto_scroll");
            entity.Property(e => e.ScrollBpm).HasColumnName("scroll_bpm");
            entity.Property(e => e.HighContrast).HasColumnName("high_contrast");
            
            entity.HasOne(e => e.User)
                  .WithOne()
                  .HasForeignKey<Preferences>(e => e.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
