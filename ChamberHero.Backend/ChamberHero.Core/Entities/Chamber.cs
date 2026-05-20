using System;

namespace ChamberHero.Core.Entities;

public class Chamber
{
    public Guid Id { get; set; }
    public Guid DoctorId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string? PhoneNo { get; set; }
    public string? CustomDomain { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
