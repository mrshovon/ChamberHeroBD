using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using ChamberHero.Core.Entities;
using ChamberHero.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace ChamberHero.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DoctorsController : ControllerBase
{
    private readonly IDoctorRepository _doctorRepository;

    public DoctorsController(IDoctorRepository doctorRepository)
    {
        _doctorRepository = doctorRepository;
    }

    [HttpGet]
    public async Task<IActionResult> GetAllDoctors()
    {
        try
        {
            var doctors = await _doctorRepository.GetAllAsync();
            return Ok(doctors);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while fetching doctors.", error = ex.Message });
        }
    }
}
