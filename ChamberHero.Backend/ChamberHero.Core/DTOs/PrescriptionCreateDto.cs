using System;
using System.Collections.Generic;

namespace ChamberHero.Core.DTOs;

public class PrescriptionItemDto
{
    public string MedicineName { get; set; } = string.Empty;
    public string Dosage { get; set; } = string.Empty;
    public string Duration { get; set; } = string.Empty;
    public string Instructions { get; set; } = string.Empty;
}

public class PrescriptionCreateDto
{
    public Guid PatientId { get; set; }
    public Guid ChamberId { get; set; }
    public string ChiefComplaints { get; set; } = string.Empty;
    public string MedicalHistory { get; set; } = string.Empty;
    public string Diagnosis { get; set; } = string.Empty;
    public string Advice { get; set; } = string.Empty;
    public ICollection<PrescriptionItemDto> Items { get; set; } = new List<PrescriptionItemDto>();
}
