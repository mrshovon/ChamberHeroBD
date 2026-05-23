using System;
using System.Collections.Generic;

namespace ChamberHero.Core.Entities;

public class Prescription
{
    public Guid Id { get; set; }
    public Guid DoctorId { get; set; }
    public Guid PatientId { get; set; }
    public Guid ChamberId { get; set; }
    public string ChiefComplaints { get; set; } = string.Empty;
    public string MedicalHistory { get; set; } = string.Empty;
    public string Diagnosis { get; set; } = string.Empty;
    public string Advice { get; set; } = string.Empty;
    public ICollection<PrescriptionItem> Items { get; set; } = new List<PrescriptionItem>();
}
