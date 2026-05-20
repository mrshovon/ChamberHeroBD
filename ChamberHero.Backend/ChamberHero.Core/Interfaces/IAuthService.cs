using ChamberHero.Core.DTOs;

namespace ChamberHero.Core.Interfaces;

public interface IAuthService
{
    Task<AuthResponseDto> RegisterAsync(DoctorRegisterDto request, CancellationToken cancellationToken = default);
    Task<AuthResponseDto> LoginAsync(DoctorLoginDto request, CancellationToken cancellationToken = default);
}
