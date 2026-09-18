using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;
using RepairFlow.Api.Configuration;
using RepairFlow.Api.Features.Access.Domain;

namespace RepairFlow.Api.Features.Access.Application;

public sealed record LoginCommand(string Email, string Password, Guid? WorkspaceId);

public enum AuthenticationResultKind
{
    Success,
    Failure,
    WorkspaceSelectionRequired,
    RateLimited
}

public sealed record AuthenticationResult(
    AuthenticationResultKind Kind,
    AccessContext? Context = null,
    AccessSession? Session = null,
    string? RawToken = null,
    IReadOnlyList<AccessWorkspaceMembership>? AvailableWorkspaces = null);

public sealed class AuthenticationService
{
    private readonly IAccessRepository _repository;
    private readonly ICredentialHasher _credentialHasher;
    private readonly IAccessRateLimiter _rateLimiter;
    private readonly IAccessAuditSink _auditSink;
    private readonly AuthOptions _options;

    public AuthenticationService(
        IAccessRepository repository,
        ICredentialHasher credentialHasher,
        IAccessRateLimiter rateLimiter,
        IAccessAuditSink auditSink,
        IOptions<AuthOptions> options)
    {
        _repository = repository;
        _credentialHasher = credentialHasher;
        _rateLimiter = rateLimiter;
        _auditSink = auditSink;
        _options = options.Value;
    }

    public async Task<AuthenticationResult> AuthenticateAsync(
        LoginCommand command,
        string? ipAddress,
        string? userAgent,
        DateTimeOffset now,
        CancellationToken cancellationToken = default)
    {
        var email = NormalizeEmail(command.Email);
        var rateLimitKey = $"{email}|{ipAddress ?? "unknown"}";
        if (!_rateLimiter.IsAllowed(rateLimitKey, now))
        {
            await RecordAuditAsync(
                "login_rate_limited",
                actorType: "system",
                reason: "rate_limit",
                ipAddress: ipAddress,
                userAgent: userAgent,
                occurredAt: now,
                cancellationToken: cancellationToken);
            return new AuthenticationResult(AuthenticationResultKind.RateLimited);
        }

        var account = await _repository.FindAccountByEmailAsync(email, cancellationToken);
        var credentialsMatch = account is not null
            ? _credentialHasher.Verify(command.Password, account.CredentialHash)
            : VerifyUnknownAccount(command.Password);

        if (account is null ||
            !credentialsMatch ||
            account.Principal.Status != AccountStatus.Active ||
            account.StaffProfile.Status != StaffProfileStatus.Active)
        {
            _rateLimiter.RecordFailure(rateLimitKey, now);
            await RecordAuditAsync(
                "login_failed",
                principalId: account?.Principal.Id,
                userId: account?.StaffProfile.Id,
                actorType: "system",
                reason: "invalid_credentials_or_inactive_account",
                ipAddress: ipAddress,
                userAgent: userAgent,
                occurredAt: now,
                cancellationToken: cancellationToken);
            return new AuthenticationResult(AuthenticationResultKind.Failure);
        }

        var memberships = await _repository.FindMembershipsAsync(
            account.Principal.StaffProfileId,
            cancellationToken);
        var activeMemberships = memberships
            .Where(item => item.Membership.Status == MembershipStatus.Active)
            .ToArray();

        if (activeMemberships.Length == 0)
        {
            _rateLimiter.RecordFailure(rateLimitKey, now);
            await RecordAuditAsync(
                "login_failed",
                principalId: account.Principal.Id,
                userId: account.StaffProfile.Id,
                actorType: "system",
                reason: "no_active_membership",
                ipAddress: ipAddress,
                userAgent: userAgent,
                occurredAt: now,
                cancellationToken: cancellationToken);
            return new AuthenticationResult(AuthenticationResultKind.Failure);
        }

        AccessWorkspaceMembership? selectedMembership = null;
        if (command.WorkspaceId is not null)
        {
            selectedMembership = activeMemberships.SingleOrDefault(
                item => item.Workspace.Id == command.WorkspaceId.Value);
            if (selectedMembership is null)
            {
                _rateLimiter.RecordFailure(rateLimitKey, now);
                await RecordAuditAsync(
                    "login_failed",
                    principalId: account.Principal.Id,
                    userId: account.StaffProfile.Id,
                    actorType: "system",
                    reason: "workspace_not_available",
                    ipAddress: ipAddress,
                    userAgent: userAgent,
                    occurredAt: now,
                    cancellationToken: cancellationToken);
                return new AuthenticationResult(AuthenticationResultKind.Failure);
            }
        }
        else if (activeMemberships.Length == 1)
        {
            selectedMembership = activeMemberships[0];
        }
        else
        {
            await RecordAuditAsync(
                "workspace_selection_required",
                principalId: account.Principal.Id,
                userId: account.StaffProfile.Id,
                actorType: "employee",
                reason: "multiple_active_memberships",
                ipAddress: ipAddress,
                userAgent: userAgent,
                occurredAt: now,
                cancellationToken: cancellationToken);
            return new AuthenticationResult(
                AuthenticationResultKind.WorkspaceSelectionRequired,
                AvailableWorkspaces: activeMemberships);
        }

        if (!AccessContext.TryCreate(
                account.Principal,
                selectedMembership.Workspace,
                selectedMembership.Membership,
                account.StaffProfile,
                attributedStaff: null,
                out var accessContext))
        {
            _rateLimiter.RecordFailure(rateLimitKey, now);
            await RecordAuditAsync(
                "login_failed",
                principalId: account.Principal.Id,
                userId: account.StaffProfile.Id,
                workspaceId: selectedMembership.Workspace.Id,
                actorType: "system",
                reason: "invalid_access_context",
                ipAddress: ipAddress,
                userAgent: userAgent,
                occurredAt: now,
                cancellationToken: cancellationToken);
            return new AuthenticationResult(AuthenticationResultKind.Failure);
        }

        var rawToken = SessionToken.Create(_options.SessionTokenBytes);
        var session = new AccessSession(
            Guid.NewGuid(),
            account.Principal.Id,
            account.StaffProfile.Id,
            selectedMembership!.Workspace.Id,
            SessionToken.Hash(rawToken),
            now,
            now,
            now.Add(_options.AbsoluteSessionLifetime),
            RevokedAt: null,
            RevokeReason: null,
            AccessSecurity.HashIdentifier(ipAddress),
            AccessSecurity.NormalizeUserAgent(userAgent, _options.UserAgentMaxLength),
            selectedMembership.Membership.Role);

        await _repository.CreateSessionAsync(session, cancellationToken);
        _rateLimiter.RecordSuccess(rateLimitKey);
        await RecordAuditAsync(
            "login_succeeded",
            account.Principal.Id,
            account.StaffProfile.Id,
            selectedMembership.Workspace.Id,
            "employee",
            "authenticated",
            ipAddress,
            userAgent,
            now,
            cancellationToken);

        return new AuthenticationResult(
            AuthenticationResultKind.Success,
            accessContext,
            session,
            rawToken);
    }

    private bool VerifyUnknownAccount(string password)
    {
        if (string.IsNullOrEmpty(password))
        {
            return false;
        }

        _ = _credentialHasher.Hash(password);
        return false;
    }

    private async Task RecordAuditAsync(
        string action,
        Guid? principalId = null,
        Guid? userId = null,
        Guid? workspaceId = null,
        string actorType = "system",
        string? reason = null,
        string? ipAddress = null,
        string? userAgent = null,
        DateTimeOffset? occurredAt = null,
        CancellationToken cancellationToken = default)
    {
        await _auditSink.RecordAsync(
            new AccessAuditEvent(
                action,
                actorType,
                workspaceId,
                userId,
                principalId,
                reason,
                AccessSecurity.HashIdentifier(ipAddress),
                AccessSecurity.NormalizeUserAgent(userAgent, _options.UserAgentMaxLength),
                occurredAt ?? DateTimeOffset.UtcNow),
            cancellationToken);
    }

    private static string NormalizeEmail(string email) =>
        email.Trim().ToUpperInvariant();
}

public static class SessionToken
{
    public static string Create(int byteLength) =>
        Microsoft.AspNetCore.WebUtilities.WebEncoders.Base64UrlEncode(
            RandomNumberGenerator.GetBytes(byteLength));

    public static string Hash(string rawToken) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(rawToken))).ToLowerInvariant();
}

public static class AccessSecurity
{
    public static string? HashIdentifier(string? value) =>
        string.IsNullOrWhiteSpace(value)
            ? null
            : Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(value))).ToLowerInvariant();

    public static string? NormalizeUserAgent(string? userAgent, int maxLength)
    {
        if (string.IsNullOrWhiteSpace(userAgent))
        {
            return null;
        }

        return userAgent.Length <= maxLength ? userAgent : userAgent[..maxLength];
    }
}
