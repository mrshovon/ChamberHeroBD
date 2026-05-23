using System;

namespace ChamberHero.Core.Entities;

public class Patient
{
    public Guid Id { get; set; }
    public Guid DoctorId { get; set; }
    public Guid? ChamberId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Age { get; set; }
    public string Gender { get; set; } = string.Empty;
    public string PhoneNo { get; set; } = string.Empty;
    public string BloodGroup { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
