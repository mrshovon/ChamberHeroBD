using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BCrypt.Net;
using ChamberHero.Core.DTOs;
using ChamberHero.Core.Entities;
using ChamberHero.Core.Interfaces;
using ChamberHero.Infrastructure.Data;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace ChamberHero.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly ChamberHeroDbContext _context;
    private readonly IDoctorRepository _doctorRepository;
    private readonly IChamberRepository _chamberRepository;
    private readonly IConfiguration _configuration;

    public AuthService(
        ChamberHeroDbContext context,
        IDoctorRepository doctorRepository,
        IChamberRepository chamberRepository,
        IConfiguration configuration)
    {
        _context = context;
        _doctorRepository = doctorRepository;
        _chamberRepository = chamberRepository;
        _configuration = configuration;
    }

    public async Task<AuthResponseDto> RegisterAsync(DoctorRegisterDto request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            throw new ArgumentException("Email and password are required.");
        }

        var existingDoctor = await _doctorRepository.GetByEmailAsync(request.Email, cancellationToken);
        if (existingDoctor != null)
        {
            throw new InvalidOperationException("A doctor with the specified email already exists.");
        }

        var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);
        var (maxChambers, featuresAllowed) = GetPlanDefaults(request.PlanTier);

        var doctor = new Doctor
        {
            Id = Guid.NewGuid(),
            Email = request.Email.Trim().ToLowerInvariant(),
            PasswordHash = passwordHash,
            FullName = request.FullName.Trim(),
            BmdcRegistrationNo = request.BmdcRegistrationNo?.Trim(),
            PhoneNo = request.PhoneNo?.Trim(),
            QualificationRaw = request.QualificationRaw?.Trim(),
            SystemRole = SystemRole.Doctor,
            BillingModel = request.BillingModel,
            PlanTier = request.PlanTier,
            MaxChambers = maxChambers,
            FeaturesAllowed = featuresAllowed,
            SubscriptionStatus = SubscriptionStatus.Trial,
            TrialStartedAt = DateTime.UtcNow,
            TrialEndsAt = DateTime.UtcNow.AddDays(14)
        };

        var chamber = new Chamber
        {
            Id = Guid.NewGuid(),
            DoctorId = doctor.Id,
            Name = request.ChamberName.Trim(),
            Address = request.ChamberAddress.Trim(),
            PhoneNo = request.ChamberPhoneNo?.Trim(),
            CustomDomain = request.ChamberCustomDomain?.Trim()
        };

        await using var transaction = await _context.BeginTransactionAsync(cancellationToken);
        try
        {
            await _doctorRepository.AddAsync(doctor, cancellationToken);
            await _chamberRepository.AddAsync(chamber, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }

        var token = GenerateJwtToken(doctor);

        return new AuthResponseDto
        {
            Token = token,
            FullName = doctor.FullName,
            PlanTier = doctor.PlanTier,
            SubscriptionStatus = doctor.SubscriptionStatus,
            TrialEndsAt = doctor.TrialEndsAt
        };
    }

    public async Task<AuthResponseDto> LoginAsync(DoctorLoginDto request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            throw new ArgumentException("Email and password are required.");
        }

        var doctor = await _doctorRepository.GetByEmailAsync(request.Email, cancellationToken);
        if (doctor == null)
        {
            throw new UnauthorizedAccessException("Invalid credentials.");
        }

        if (!BCrypt.Net.BCrypt.Verify(request.Password, doctor.PasswordHash))
        {
            throw new UnauthorizedAccessException("Invalid credentials.");
        }

        var token = GenerateJwtToken(doctor);

        return new AuthResponseDto
        {
            Token = token,
            FullName = doctor.FullName,
            PlanTier = doctor.PlanTier,
            SubscriptionStatus = doctor.SubscriptionStatus,
            TrialEndsAt = doctor.TrialEndsAt
        };
    }

    private static (int maxChambers, string[] featuresAllowed) GetPlanDefaults(PlanTier planTier)
    {
        const string bilingualAdvice = "BilingualAdvice";
        const string assistantPanel = "AssistantPanel";
        const string corePrescribing = "CorePrescribing";
        const string seoWebsite = "SEOWebsite";
        const string automatedSMS = "AutomatedSMS";
        const string waitingRoomDisplay = "WaitingRoomDisplay";
        const string customDomains = "CustomDomains";
        const string referralNetwork = "ReferralNetwork";

        return planTier switch
        {
            PlanTier.Lite => (1, new[] { bilingualAdvice, assistantPanel, corePrescribing }),
            PlanTier.Pro => (3, new[] { bilingualAdvice, assistantPanel, corePrescribing, seoWebsite, automatedSMS }),
            PlanTier.Elite => (99, new[] { bilingualAdvice, assistantPanel, corePrescribing, seoWebsite, automatedSMS, waitingRoomDisplay, customDomains, referralNetwork }),
            PlanTier.Pay_As_You_Grow => (99, new[] { bilingualAdvice, assistantPanel, corePrescribing, seoWebsite, automatedSMS, waitingRoomDisplay, customDomains, referralNetwork }),
            _ => throw new ArgumentOutOfRangeException(nameof(planTier), planTier, "Unsupported plan tier.")
        };
    }

    private string GenerateJwtToken(Doctor doctor)
    {
        var jwtSettings = _configuration.GetSection("JwtSettings");
        var secretKey = jwtSettings["SecretKey"] ?? throw new InvalidOperationException("JwtSettings:SecretKey is not configured.");
        var issuer = jwtSettings["Issuer"];
        var audience = jwtSettings["Audience"];
        var expirationMinutes = int.TryParse(jwtSettings["ExpirationMinutes"], out var minutes) ? minutes : 1440;

        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, doctor.Id.ToString()),
            new(ClaimTypes.Email, doctor.Email),
            new("SystemRole", doctor.SystemRole.ToString()),
            new("PlanTier", doctor.PlanTier.ToString()),
            new("SubscriptionStatus", doctor.SubscriptionStatus.ToString())
        };

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expirationMinutes),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
