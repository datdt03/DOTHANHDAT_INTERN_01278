namespace RepairFlow.Api.Configuration;

public sealed class AuthOptions
{
    public const string SectionName = "Auth";

    public string SessionCookieName { get; set; } = "repairflow_session";

    public bool SecureCookie { get; set; }

    public int IdleTimeoutMinutes { get; set; } = 30;

    public int AbsoluteSessionLifetimeHours { get; set; } = 8;

    public int PasswordHashIterations { get; set; } = 600_000;

    public int PasswordHashSaltBytes { get; set; } = 16;

    public int PasswordHashBytes { get; set; } = 32;

    public int SessionTokenBytes { get; set; } = 32;

    public int MaxFailedAttempts { get; set; } = 5;

    public int FailureWindowMinutes { get; set; } = 15;

    public int UserAgentMaxLength { get; set; } = 512;

    public TimeSpan IdleTimeout => TimeSpan.FromMinutes(IdleTimeoutMinutes);

    public TimeSpan AbsoluteSessionLifetime => TimeSpan.FromHours(AbsoluteSessionLifetimeHours);

    public void Validate()
    {
        if (string.IsNullOrWhiteSpace(SessionCookieName) ||
            IdleTimeoutMinutes <= 0 ||
            AbsoluteSessionLifetimeHours <= 0 ||
            PasswordHashIterations < 10_000 ||
            PasswordHashSaltBytes < 8 ||
            PasswordHashBytes < 16 ||
            SessionTokenBytes < 32 ||
            MaxFailedAttempts <= 0 ||
            FailureWindowMinutes <= 0 ||
            UserAgentMaxLength <= 0)
        {
            throw new InvalidOperationException("Auth configuration contains an invalid value.");
        }
    }
}
