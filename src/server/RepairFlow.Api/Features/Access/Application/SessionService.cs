using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using RepairFlow.Api.Configuration;
using RepairFlow.Api.Features.Access.Domain;

namespace RepairFlow.Api.Features.Access.Application;

public sealed record ResolvedAccessSession(
    AccessContext Context,
    Guid SessionId,
    DateTimeOffset ExpiresAt);

public sealed class SessionService
{
    public const string ResolvedSessionItemKey = "RepairFlow.ResolvedAccessSession";

    private readonly IAccessRepository _repository;
    private readonly IAccessAuditSink _auditSink;
    private readonly AuthOptions _options;

    public SessionService(
        IAccessRepository repository,
        IAccessAuditSink auditSink,
        IOptions<AuthOptions> options)
    {
        _repository = repository;
        _auditSink = auditSink;
        _options = options.Value;
    }

    public string? ReadToken(HttpRequest request)
    {
        return request.Cookies.TryGetValue(_options.SessionCookieName, out var token)
            ? token
            : null;
    }

    public async Task<ResolvedAccessSession?> ResolveAsync(
        string rawToken,
        DateTimeOffset now,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(rawToken))
        {
            return null;
        }

        var tokenHash = SessionToken.Hash(rawToken);
        var snapshot = await _repository.FindSessionByTokenHashAsync(tokenHash, cancellationToken);
        if (snapshot is null)
        {
            return null;
        }

        if (snapshot.Session.RevokedAt is not null)
        {
            return null;
        }

        if (now >= snapshot.Session.AbsoluteExpiresAt)
        {
            await RevokeStoredSessionAsync(snapshot, now, "absolute_expiry", cancellationToken);
            return null;
        }

        if (now - snapshot.Session.LastAccessedAt >= _options.IdleTimeout)
        {
            await RevokeStoredSessionAsync(snapshot, now, "idle_timeout", cancellationToken);
            return null;
        }

        if (snapshot.Account.Principal.Status != AccountStatus.Active ||
            snapshot.Account.StaffProfile.Status != StaffProfileStatus.Active ||
            snapshot.WorkspaceMembership.Membership.Status != MembershipStatus.Active)
        {
            await RevokeStoredSessionAsync(snapshot, now, "access_inactive", cancellationToken);
            return null;
        }

        if (!AccessContext.TryCreate(
                snapshot.Account.Principal,
                snapshot.WorkspaceMembership.Workspace,
                snapshot.WorkspaceMembership.Membership,
                snapshot.Account.StaffProfile,
                attributedStaff: null,
                out var context,
                activeRole: snapshot.Session.ActiveRole))
        {
            await RevokeStoredSessionAsync(snapshot, now, "invalid_access_context", cancellationToken);
            return null;
        }

        await _repository.TouchSessionAsync(snapshot.Session.Id, now, cancellationToken);
        return new ResolvedAccessSession(
            context!,
            snapshot.Session.Id,
            snapshot.Session.AbsoluteExpiresAt);
    }

    public async Task<ResolvedAccessSession?> ChangeActiveRoleAsync(
        ResolvedAccessSession current,
        AccessRole activeRole,
        DateTimeOffset now,
        CancellationToken cancellationToken = default)
    {
        if (!current.Context.Membership.HasRole(activeRole))
        {
            return null;
        }

        if (current.Context.ActiveRole == activeRole)
        {
            return current;
        }

        var updated = await _repository.UpdateSessionActiveRoleAsync(
            current.SessionId,
            activeRole,
            now,
            cancellationToken);
        if (!updated)
        {
            return null;
        }

        await _auditSink.RecordAsync(
            new AccessAuditEvent(
                "active_role_changed",
                "employee",
                current.Context.Workspace.Id,
                current.Context.StaffProfile.Id,
                current.SessionId,
                $"{AccessRoleCodec.ToWireValue(current.Context.ActiveRole)}->{AccessRoleCodec.ToWireValue(activeRole)}",
                null,
                null,
                now),
            cancellationToken);

        return current with
        {
            Context = current.Context with { ActiveRole = activeRole }
        };
    }

    public async Task<bool> RevokeAsync(
        string? rawToken,
        DateTimeOffset now,
        string reason,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(rawToken))
        {
            return false;
        }

        var tokenHash = SessionToken.Hash(rawToken);
        var snapshot = await _repository.FindSessionByTokenHashAsync(tokenHash, cancellationToken);
        var revoked = await _repository.RevokeSessionAsync(
            tokenHash,
            now,
            reason,
            cancellationToken);

        if (revoked && snapshot is not null)
        {
            await _auditSink.RecordAsync(
                new AccessAuditEvent(
                    "logout_succeeded",
                    "employee",
                    snapshot.Session.WorkspaceId,
                    snapshot.Session.StaffProfileId,
                    snapshot.Session.Id,
                    reason,
                    snapshot.Session.IpHash,
                    snapshot.Session.UserAgent,
                    now),
                cancellationToken);
        }

        return revoked;
    }

    public void WriteCookie(HttpResponse response, string rawToken, DateTimeOffset expiresAt, bool isHttps)
    {
        response.Cookies.Append(
            _options.SessionCookieName,
            rawToken,
            new CookieOptions
            {
                HttpOnly = true,
                Secure = _options.SecureCookie || isHttps,
                SameSite = SameSiteMode.Lax,
                Expires = expiresAt,
                IsEssential = true,
                Path = "/"
            });
    }

    public void ClearCookie(HttpResponse response)
    {
        response.Cookies.Delete(
            _options.SessionCookieName,
            new CookieOptions
            {
                HttpOnly = true,
                Secure = _options.SecureCookie,
                SameSite = SameSiteMode.Lax,
                IsEssential = true,
                Path = "/"
            });
    }

    public static ResolvedAccessSession? GetResolved(HttpContext context) =>
        context.Items.TryGetValue(ResolvedSessionItemKey, out var value)
            ? value as ResolvedAccessSession
            : null;

    private async Task RevokeStoredSessionAsync(
        AccessSessionSnapshot snapshot,
        DateTimeOffset now,
        string reason,
        CancellationToken cancellationToken)
    {
        await _repository.RevokeSessionAsync(
            snapshot.Session.TokenHash,
            now,
            reason,
            cancellationToken);
    }
}
