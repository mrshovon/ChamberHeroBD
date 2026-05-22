using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using ChamberHero.Core.Entities;

namespace ChamberHero.Core.Interfaces;

public interface IPatientRepository : IRepository<Patient, Guid>
{
    Task<IEnumerable<Patient>> GetByDoctorIdAsync(Guid doctorId, CancellationToken cancellationToken = default);
}
