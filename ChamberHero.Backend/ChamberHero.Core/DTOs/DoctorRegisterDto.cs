using ChamberHero.Core.Entities;

namespace ChamberHero.Core.DTOs;

public class DoctorRegisterDto
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? BmdcRegistrationNo { get; set; }
    public string? PhoneNo { get; set; }
    public string? QualificationRaw { get; set; }
    public BillingModel BillingModel { get; set; }
    public PlanTier PlanTier { get; set; }

    // Initial chamber registration
    public string ChamberName { get; set; } = string.Empty;
    public string ChamberAddress { get; set; } = string.Empty;
    public string? ChamberPhoneNo { get; set; }
    public string? ChamberCustomDomain { get; set; }
}
