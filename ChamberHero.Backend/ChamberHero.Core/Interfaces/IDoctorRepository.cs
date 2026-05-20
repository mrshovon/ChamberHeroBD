using ChamberHero.Core.Entities;

namespace ChamberHero.Core.Interfaces;

public interface IDoctorRepository : IRepository<Doctor, Guid>
{
    Task<Doctor?> GetByEmailAsync(string email, CancellationToken cancellationToken = default);
}
