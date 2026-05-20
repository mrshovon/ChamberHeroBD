using ChamberHero.Core;
using ChamberHero.Core.DTOs;
using ChamberHero.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace ChamberHero.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] DoctorRegisterDto request, CancellationToken cancellationToken)
    {
        var result = await _authService.RegisterAsync(request, cancellationToken);
        return Ok(ApiResponse<AuthResponseDto>.SuccessResponse(result, "Doctor created successfully."));
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] DoctorLoginDto request, CancellationToken cancellationToken)
    {
        var result = await _authService.LoginAsync(request, cancellationToken);
        return Ok(ApiResponse<AuthResponseDto>.SuccessResponse(result, "Login successful."));
    }
}
