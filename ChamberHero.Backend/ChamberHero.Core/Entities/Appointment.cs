using System;

namespace ChamberHero.Core.Entities;

public class Appointment
{
    public Guid Id { get; set; }
    public Guid DoctorId { get; set; }
    public Guid PatientId { get; set; }
    public Guid ChamberId { get; set; }
    public int SerialNo { get; set; }
    public DateTime AppointmentDate { get; set; }
    public AppointmentStatus Status { get; set; } = AppointmentStatus.Waiting;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public Patient? Patient { get; set; }
    public Chamber? Chamber { get; set; }
}
