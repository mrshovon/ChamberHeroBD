using ChamberHero.Core.Entities;
using ChamberHero.Core.Interfaces;
using Microsoft.EntityFrameworkCore;
using EfTransaction = Microsoft.EntityFrameworkCore.Storage.IDbContextTransaction;

namespace ChamberHero.Infrastructure.Data;

public class ChamberHeroDbContext : DbContext, IDbContext
{
    public ChamberHeroDbContext(DbContextOptions<ChamberHeroDbContext> options)
        : base(options)
    {
    }

    public DbSet<Doctor> Doctors { get; set; } = null!;
    public DbSet<Chamber> Chambers { get; set; } = null!;

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        // ... your custom code
        return base.SaveChangesAsync(cancellationToken);
    }

    public async Task<IDbContextTransaction> BeginTransactionAsync(CancellationToken cancellationToken = default)
    {
        var transaction = await Database.BeginTransactionAsync(cancellationToken);
        return new EfCoreDbContextTransaction(transaction);
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Doctor>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Email).IsRequired();
            entity.Property(x => x.PasswordHash).IsRequired();
            entity.Property(x => x.FullName).IsRequired();
            entity.Property(x => x.FeaturesAllowed).HasColumnType("text[]");
        });

        modelBuilder.Entity<Chamber>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Name).IsRequired();
            entity.Property(x => x.Address).IsRequired();
            entity.HasOne<Doctor>().WithMany().HasForeignKey(x => x.DoctorId).OnDelete(DeleteBehavior.Cascade);
        });
    }
}

internal sealed class EfCoreDbContextTransaction : IDbContextTransaction
{
    private readonly EfTransaction _innerTransaction;

    public EfCoreDbContextTransaction(EfTransaction innerTransaction)
    {
        _innerTransaction = innerTransaction;
    }

    public async ValueTask DisposeAsync() => await _innerTransaction.DisposeAsync();
    public Task CommitAsync(CancellationToken cancellationToken = default) => _innerTransaction.CommitAsync(cancellationToken);
    public Task RollbackAsync(CancellationToken cancellationToken = default) => _innerTransaction.RollbackAsync(cancellationToken);
}
