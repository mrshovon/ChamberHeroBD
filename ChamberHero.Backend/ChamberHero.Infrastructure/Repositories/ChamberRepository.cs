using ChamberHero.Core.Entities;
using ChamberHero.Core.Interfaces;
using ChamberHero.Infrastructure.Data; // 🟢 1. Added this to find ChamberHeroDbContext
using Microsoft.EntityFrameworkCore;

namespace ChamberHero.Infrastructure.Repositories;

public class ChamberRepository : Repository<Chamber>, IChamberRepository
{
    public ChamberRepository(ChamberHeroDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Chamber>> GetByDoctorIdAsync(Guid doctorId, CancellationToken cancellationToken = default)
    {
        return await _entities
            .AsNoTracking()
            .Where(x => x.DoctorId == doctorId)
            .ToListAsync(cancellationToken);
    }
}
