using ChamberHero.Core.Entities;
using ChamberHero.Core.Interfaces;
using ChamberHero.Infrastructure.Data; // <-- Make sure this is here
using Microsoft.EntityFrameworkCore;

namespace ChamberHero.Infrastructure.Repositories;

public class DoctorRepository : Repository<Doctor>, IDoctorRepository
{
    // Pass context directly to base, no private fields declared inside here
    public DoctorRepository(ChamberHeroDbContext context) : base(context)
    {
    }
    public async Task<Doctor?> GetByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        return await _entities
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Email.ToLower() == email.Trim().ToLower(), cancellationToken);
    }
}
