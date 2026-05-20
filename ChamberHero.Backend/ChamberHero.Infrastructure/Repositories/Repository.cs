using ChamberHero.Core.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ChamberHero.Infrastructure.Repositories;

public class Repository<TEntity> : IRepository<TEntity, Guid> where TEntity : class
{
    protected readonly DbContext _context;
    protected readonly DbSet<TEntity> _entities;

    public Repository(DbContext context)
    {
        _context = context;
        _entities = context.Set<TEntity>();
    }

    public async Task<TEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _entities.FindAsync(new object[] { id }, cancellationToken);
    }

    public async Task<IEnumerable<TEntity>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _entities.AsNoTracking().ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<TEntity>> GetPagedAsync(int pageNumber, int pageSize, CancellationToken cancellationToken = default)
    {
        return await _entities.AsNoTracking()
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
    }

    public async Task<TEntity> AddAsync(TEntity entity, CancellationToken cancellationToken = default)
    {
        var entry = await _entities.AddAsync(entity, cancellationToken);
        return entry.Entity;
    }

    public async Task<IEnumerable<TEntity>> AddRangeAsync(IEnumerable<TEntity> entities, CancellationToken cancellationToken = default)
    {
        await _entities.AddRangeAsync(entities, cancellationToken);
        return entities;
    }

    public Task<TEntity> UpdateAsync(TEntity entity, CancellationToken cancellationToken = default)
    {
        _entities.Update(entity);
        return Task.FromResult(entity);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await GetByIdAsync(id, cancellationToken);
        if (entity == null)
        {
            return false;
        }

        _entities.Remove(entity);
        return true;
    }

    public Task<bool> DeleteAsync(TEntity entity, CancellationToken cancellationToken = default)
    {
        _entities.Remove(entity);
        return Task.FromResult(true);
    }

    public Task<int> CountAsync(CancellationToken cancellationToken = default)
    {
        return _entities.CountAsync(cancellationToken);
    }

    public async Task<bool> ExistsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _entities.FindAsync(new object[] { id }, cancellationToken) != null;
    }
}
