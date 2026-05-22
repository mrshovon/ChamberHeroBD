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
    public DbSet<Patient> Patients { get; set; } = null!;

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
            entity.ToTable("doctors");

            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.Email).HasColumnName("email").IsRequired();
            entity.HasIndex(x => x.Email).IsUnique();

            entity.Property(x => x.PasswordHash).HasColumnName("password_hash").IsRequired();
            entity.Property(x => x.FullName).HasColumnName("full_name").IsRequired();
            entity.Property(x => x.BmdcRegistrationNo).HasColumnName("bmdc_registration_no").IsRequired();
            entity.HasIndex(x => x.BmdcRegistrationNo).IsUnique();

            entity.Property(x => x.PhoneNo).HasColumnName("phone_no").IsRequired();
            entity.HasIndex(x => x.PhoneNo).IsUnique();

            entity.Property(x => x.QualificationRaw).HasColumnName("qualification_raw").IsRequired();
            entity.Property(x => x.SystemRole).HasColumnName("system_role").HasConversion<string>().IsRequired();
            entity.Property(x => x.BillingModel).HasColumnName("billing_model").HasConversion<string>().IsRequired();
            entity.Property(x => x.PlanTier).HasColumnName("plan_tier").HasConversion<string>().IsRequired();
            entity.Property(x => x.MaxChambers).HasColumnName("max_chambers").IsRequired();
            entity.Property(x => x.FeaturesAllowed).HasColumnName("features_allowed").HasColumnType("varchar(50)[]").IsRequired();
            entity.Property(x => x.SubscriptionStatus).HasColumnName("subscription_status").HasConversion<string>().IsRequired();
            entity.Property(x => x.TrialStartedAt).HasColumnName("trial_started_at");
            entity.Property(x => x.TrialEndsAt).HasColumnName("trial_ends_at");
            entity.Property(x => x.AppliedCouponCode).HasColumnName("applied_coupon_code");
            entity.Property(x => x.DiscountPercentage).HasColumnName("discount_percentage").HasPrecision(5, 2).HasDefaultValue(0.00m);
            entity.Property(x => x.DiscountEndsAt).HasColumnName("discount_ends_at");
            entity.Property(x => x.IsActive).HasColumnName("is_active").IsRequired();
            entity.Property(x => x.CreatedAt).HasColumnName("created_at").IsRequired();
            entity.Property(x => x.UpdatedAt).HasColumnName("updated_at").IsRequired();
        });

        modelBuilder.Entity<Chamber>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.ToTable("chambers");

            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.DoctorId).HasColumnName("doctor_id").IsRequired();
            entity.Property(x => x.Name).HasColumnName("name").IsRequired();
            entity.Property(x => x.Address).HasColumnName("address").IsRequired();
            entity.Property(x => x.PhoneNo).HasColumnName("phone_no");
            entity.Property(x => x.CustomDomain).HasColumnName("custom_domain");
            entity.HasIndex(x => x.CustomDomain).IsUnique();
            entity.Property(x => x.CreatedAt).HasColumnName("created_at").IsRequired();
            entity.Property(x => x.UpdatedAt).HasColumnName("updated_at").IsRequired();

            entity.HasOne<Doctor>()
                .WithMany(d => d.Chambers)
                .HasForeignKey(x => x.DoctorId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Patient>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.ToTable("patients");

            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.DoctorId).HasColumnName("doctor_id").IsRequired();
            entity.Property(x => x.Name).HasColumnName("name").IsRequired();
            entity.Property(x => x.Age).HasColumnName("age").IsRequired();
            entity.Property(x => x.Gender).HasColumnName("gender").IsRequired();
            entity.Property(x => x.PhoneNo).HasColumnName("phone_no").IsRequired();
            entity.Property(x => x.BloodGroup).HasColumnName("blood_group").IsRequired();
            entity.Property(x => x.Address).HasColumnName("address").IsRequired();
            entity.Property(x => x.CreatedAt).HasColumnName("created_at").IsRequired();
            entity.Property(x => x.UpdatedAt).HasColumnName("updated_at").IsRequired();

            entity.HasOne<Doctor>()
                .WithMany()
                .HasForeignKey(x => x.DoctorId)
                .OnDelete(DeleteBehavior.Cascade);
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
