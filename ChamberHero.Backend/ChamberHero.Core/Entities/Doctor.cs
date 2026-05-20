using System;

namespace ChamberHero.Core.Entities;

public enum SystemRole
{
    Doctor,
    SuperAdmin
}

public enum BillingModel
{
    Subscription_Fixed,
    Pay_Per_Rx
}

public enum PlanTier
{
    Lite,
    Pro,
    Elite,
    Pay_As_You_Grow
}

public enum SubscriptionStatus
{
    Trial,
    Active,
    Past_Due,
    Suspended
}

public class Doctor
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? BmdcRegistrationNo { get; set; }
    public string? PhoneNo { get; set; }
    public string? QualificationRaw { get; set; }
    public SystemRole SystemRole { get; set; }
    public BillingModel BillingModel { get; set; }
    public PlanTier PlanTier { get; set; }
    public int MaxChambers { get; set; }
    public string[] FeaturesAllowed { get; set; } = Array.Empty<string>();
    public SubscriptionStatus SubscriptionStatus { get; set; }
    public DateTime TrialStartedAt { get; set; }
    public DateTime TrialEndsAt { get; set; }
}
