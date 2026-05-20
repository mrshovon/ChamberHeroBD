using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using ChamberHero.Core.Entities;

namespace ChamberHero.Core.Interfaces;

public interface IDoctorRepository : IRepository<Doctor, Guid>
{
    Task<IEnumerable<Doctor>> GetAllAsync();

    Task<Doctor?> GetByEmailAsync(string email, CancellationToken cancellationToken = default);
}
