using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using ChamberHero.Core.DTOs;
using ChamberHero.Core.Entities;
using ChamberHero.Core.Interfaces;
using ChamberHero.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ChamberHero.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PatientsController : ControllerBase
{
    private readonly IPatientRepository _patientRepository;
    private readonly ChamberHeroDbContext _context;

    public PatientsController(IPatientRepository patientRepository, ChamberHeroDbContext context)
    {
        _patientRepository = patientRepository;
        _context = context;
    }

    [HttpPost]
    public async Task<IActionResult> CreatePatient([FromBody] PatientCreateDto request, CancellationToken cancellationToken)
    {
        var doctorIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(doctorIdClaim, out var doctorId))
        {
            return Unauthorized(new { message = "Unable to resolve authenticated doctor." });
        }

        var patient = new Patient
        {
            Id = Guid.NewGuid(),
            DoctorId = doctorId,
            Name = request.Name.Trim(),
            Age = request.Age,
            Gender = request.Gender.Trim(),
            PhoneNo = request.PhoneNo.Trim(),
            BloodGroup = request.BloodGroup.Trim(),
            Address = request.Address.Trim(),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _patientRepository.AddAsync(patient, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        return Ok(patient);
    }

    [HttpGet]
    public async Task<IActionResult> GetPatients(CancellationToken cancellationToken)
    {
        var doctorIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(doctorIdClaim, out var doctorId))
        {
            return Unauthorized(new { message = "Unable to resolve authenticated doctor." });
        }

        var patients = await _patientRepository.GetByDoctorIdAsync(doctorId, cancellationToken);
        return Ok(patients);
    }
}
