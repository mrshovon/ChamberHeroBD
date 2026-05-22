using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using ChamberHero.Core.Entities;
using ChamberHero.Core.Interfaces;
using ChamberHero.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ChamberHero.Infrastructure.Repositories;

public class PatientRepository : Repository<Patient>, IPatientRepository
{
    private readonly ChamberHeroDbContext _db;

    public PatientRepository(ChamberHeroDbContext context) : base(context)
    {
        _db = context;
    }

    public async Task<IEnumerable<Patient>> GetByDoctorIdAsync(Guid doctorId, CancellationToken cancellationToken = default)
    {
        return await _db.Patients
            .AsNoTracking()
            .Where(x => x.DoctorId == doctorId)
            .ToListAsync(cancellationToken);
    }
}
