using System.Collections.Generic;
using System.Threading.Tasks;
using ChamberHero.Core.Entities;
using ChamberHero.Core.Interfaces;
using ChamberHero.Infrastructure.Data; // <-- Make sure this is here
using Microsoft.EntityFrameworkCore;

namespace ChamberHero.Infrastructure.Repositories;

public class DoctorRepository : Repository<Doctor>, IDoctorRepository
{
    private readonly ChamberHeroDbContext _db;

    public DoctorRepository(ChamberHeroDbContext context) : base(context)
    {
        _db = context;
    }

    public async Task<IEnumerable<Doctor>> GetAllAsync()
    {
        return await _db.Doctors.AsNoTracking().ToListAsync();
    }

    public async Task<Doctor?> GetByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        return await _entities
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Email.ToLower() == email.Trim().ToLower(), cancellationToken);
    }
}
