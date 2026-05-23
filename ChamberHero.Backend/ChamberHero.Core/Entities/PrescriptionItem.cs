using System;

namespace ChamberHero.Core.Entities;

public class PrescriptionItem
{
    public Guid Id { get; set; }
    public Guid PrescriptionId { get; set; }
    public string MedicineName { get; set; } = string.Empty;
    public string Dosage { get; set; } = string.Empty;
    public string Duration { get; set; } = string.Empty;
    public string Instructions { get; set; } = string.Empty;
    public Prescription? Prescription { get; set; }
}
