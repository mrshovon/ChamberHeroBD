using System;

namespace ChamberHero.Core.DTOs;

public class AppointmentCheckInDto
{
    public Guid PatientId { get; set; }
    public Guid ChamberId { get; set; }
}

public class AppointmentStatusUpdateDto
{
    public string Status { get; set; } = string.Empty;
}
