using ChamberHero.Core.Entities;

namespace ChamberHero.Core.DTOs;

public class AuthResponseDto
{
    public string Token { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public PlanTier PlanTier { get; set; }
    public SubscriptionStatus SubscriptionStatus { get; set; }
    public DateTime TrialEndsAt { get; set; }
}
