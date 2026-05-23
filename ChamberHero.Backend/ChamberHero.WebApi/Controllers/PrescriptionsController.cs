using System;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ChamberHero.Core.DTOs;
using ChamberHero.Core.Entities;
using ChamberHero.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ChamberHero.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PrescriptionsController : ControllerBase
{
    private readonly ChamberHeroDbContext _context;

    public PrescriptionsController(ChamberHeroDbContext context)
    {
        _context = context;
    }

    [HttpPost]
    public async Task<IActionResult> CreatePrescription([FromBody] PrescriptionCreateDto request, CancellationToken cancellationToken)
    {
        var doctorIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(doctorIdClaim, out var doctorId))
        {
            return Unauthorized(new { message = "Unable to resolve authenticated doctor." });
        }

        var prescription = new Prescription
        {
            Id = Guid.NewGuid(),
            DoctorId = doctorId,
            PatientId = request.PatientId,
            ChamberId = request.ChamberId,
            ChiefComplaints = request.ChiefComplaints.Trim(),
            MedicalHistory = request.MedicalHistory.Trim(),
            Diagnosis = request.Diagnosis.Trim(),
            Advice = request.Advice.Trim(),
        };

        prescription.Items = request.Items
            .Select(item => new PrescriptionItem
            {
                Id = Guid.NewGuid(),
                PrescriptionId = prescription.Id,
                MedicineName = item.MedicineName.Trim(),
                Dosage = item.Dosage.Trim(),
                Duration = item.Duration.Trim(),
                Instructions = item.Instructions.Trim(),
            })
            .ToList();

        _context.Prescriptions.Add(prescription);

        var activeAppointment = await _context.Appointments
            .FirstOrDefaultAsync(a => a.PatientId == prescription.PatientId
                                   && a.ChamberId == prescription.ChamberId
                                   && a.AppointmentDate == DateTime.UtcNow.Date
                                   && a.Status != AppointmentStatus.Completed,
                cancellationToken);

        if (activeAppointment != null)
        {
            activeAppointment.Status = AppointmentStatus.Completed;
            activeAppointment.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync(cancellationToken);

        return Ok(prescription);
    }
}
