namespace ChamberHero.Core.Interfaces;

/// <summary>
/// Abstraction for database context operations ensuring transactional integrity
/// and repository pattern isolation.
/// </summary>
public interface IDbContext
{
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    Task<IDbContextTransaction> BeginTransactionAsync(CancellationToken cancellationToken = default);
}

/// <summary>
/// Transaction wrapper interface for managing database transactions
/// </summary>
public interface IDbContextTransaction : IAsyncDisposable
{
    Task CommitAsync(CancellationToken cancellationToken = default);
    Task RollbackAsync(CancellationToken cancellationToken = default);
}
