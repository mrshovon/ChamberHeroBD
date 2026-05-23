using System;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using ChamberHero.Core.DTOs;
using ChamberHero.Core.Entities;
using ChamberHero.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ChamberHero.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AppointmentsController : ControllerBase
{
    private readonly ChamberHeroDbContext _context;

    public AppointmentsController(ChamberHeroDbContext context)
    {
        _context = context;
    }

    [HttpPost("check-in")]
    public async Task<IActionResult> CheckInAppointment([FromBody] AppointmentCheckInDto request, CancellationToken cancellationToken)
    {
        var doctorIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(doctorIdClaim, out var doctorId))
        {
            return Unauthorized(new { message = "Unable to resolve authenticated doctor." });
        }

        var today = DateTime.UtcNow.Date;
        var tomorrow = today.AddDays(1);

        var existingAppointment = await _context.Appointments
            .AsNoTracking()
            .Where(a => a.PatientId == request.PatientId && a.ChamberId == request.ChamberId)
            .Where(a => a.AppointmentDate >= today && a.AppointmentDate < tomorrow)
            .FirstOrDefaultAsync(cancellationToken);

        if (existingAppointment != null)
        {
            return BadRequest(new { success = false, message = "This patient is already checked into today's queue." });
        }

        var nextSerial = await _context.Appointments
            .Where(a => a.ChamberId == request.ChamberId && a.AppointmentDate >= today && a.AppointmentDate < tomorrow)
            .CountAsync(cancellationToken) + 1;

        var appointment = new Appointment
        {
            Id = Guid.NewGuid(),
            DoctorId = doctorId,
            PatientId = request.PatientId,
            ChamberId = request.ChamberId,
            SerialNo = nextSerial,
            AppointmentDate = DateTime.UtcNow,
            Status = AppointmentStatus.Waiting,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Appointments.Add(appointment);
        await _context.SaveChangesAsync(cancellationToken);

        return Ok(appointment);
    }

    [HttpGet("live")]
    public async Task<IActionResult> GetLiveAppointments([FromQuery] Guid chamberId, [FromQuery] DateTime? date, CancellationToken cancellationToken)
    {
        var doctorIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(doctorIdClaim, out var doctorId))
        {
            return Unauthorized(new { message = "Unable to resolve authenticated doctor." });
        }

        var targetDate = (date ?? DateTime.UtcNow).Date;
        var nextDay = targetDate.AddDays(1);

        var appointments = await _context.Appointments
            .AsNoTracking()
            .Include(a => a.Patient)
            .Where(a => a.ChamberId == chamberId && a.DoctorId == doctorId && a.AppointmentDate >= targetDate && a.AppointmentDate < nextDay)
            .OrderBy(a => a.SerialNo)
            .ToListAsync(cancellationToken);

        return Ok(appointments);
    }

    [HttpPatch("{id}/status")]
    public async Task<IActionResult> UpdateAppointmentStatus(Guid id, [FromBody] AppointmentStatusUpdateDto request, CancellationToken cancellationToken)
    {
        var doctorIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(doctorIdClaim, out var doctorId))
        {
            return Unauthorized(new { message = "Unable to resolve authenticated doctor." });
        }

        var appointment = await _context.Appointments.FindAsync(new object[] { id }, cancellationToken);
        if (appointment == null || appointment.DoctorId != doctorId)
        {
            return NotFound(new { message = "Appointment not found." });
        }

        if (!Enum.TryParse<AppointmentStatus>(request.Status, true, out var newStatus))
        {
            return BadRequest(new { message = "Invalid appointment status." });
        }

        appointment.Status = newStatus;
        appointment.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        return Ok(appointment);
    }
}
