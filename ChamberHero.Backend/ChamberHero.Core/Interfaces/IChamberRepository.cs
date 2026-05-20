using ChamberHero.Core.Entities;

namespace ChamberHero.Core.Interfaces;

public interface IChamberRepository : IRepository<Chamber, Guid>
{
    Task<IEnumerable<Chamber>> GetByDoctorIdAsync(Guid doctorId, CancellationToken cancellationToken = default);
}
