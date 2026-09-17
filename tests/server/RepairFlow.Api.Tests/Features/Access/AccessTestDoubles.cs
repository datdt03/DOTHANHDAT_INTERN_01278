using System.Collections.Concurrent;
using RepairFlow.Api.Features.Access.Application;
using RepairFlow.Api.Features.Access.Domain;

namespace RepairFlow.Api.Tests.Features.Access;

public sealed class TestAccessRepository : IAccessRepository
{
    private readonly ConcurrentDictionary<Guid, AccessAccount> _accounts;
    private readonly ConcurrentDictionary<Guid, AccessWorkspaceMembership> _memberships;
    private readonly ConcurrentDictionary<Guid, AccessSession> _sessions = new();

    private TestAccessRepository(
        IEnumerable<AccessAccount> accounts,
        IEnumerable<AccessWorkspaceMembership> memberships)
    {
        _accounts = new(accounts.ToDictionary(account => account.Principal.Id));
        _memberships = new(memberships.ToDictionary(item => item.Membership.Id));
    }

    public IReadOnlyCollection<AccessSession> Sessions => _sessions.Values.ToArray();

    public static TestAccessRepository Create(
        AccessFixtureSet fixture,
        ICredentialHasher credentialHasher)
    {
        var integrationManagerStaff = new StaffProfile(
            Guid.Parse("00000000-0000-0000-0000-000000000106"),
            "Manager Integration",
            "+84912345678",
            StaffProfileStatus.Active);

        return new TestAccessRepository(
            [
                new AccessAccount(
                    fixture.ActiveOwnerAccount,
                    fixture.OwnerStaff,
                    credentialHasher.Hash(AccessFixture.KnownPassword)),
                new AccessAccount(
                    fixture.ActiveReceptionistAccount,
                    fixture.ReceptionistStaff,
                    credentialHasher.Hash(AccessFixture.KnownPassword)),
                new AccessAccount(
                    fixture.InactiveManagerAccount,
                    fixture.ManagerStaff,
                    credentialHasher.Hash(AccessFixture.KnownPassword)),
                new AccessAccount(
                    new AccessPrincipal(
                        Guid.Parse("00000000-0000-0000-0000-000000000204"),
                        "technician.integration@example.test",
                        fixture.TechnicianStaff.Id,
                        AccountStatus.Active),
                    fixture.TechnicianStaff,
                    credentialHasher.Hash(AccessFixture.KnownPassword)),
                new AccessAccount(
                    new AccessPrincipal(
                        Guid.Parse("00000000-0000-0000-0000-000000000205"),
                        "manager.integration@example.test",
                        integrationManagerStaff.Id,
                        AccountStatus.Active),
                    integrationManagerStaff,
                    credentialHasher.Hash(AccessFixture.KnownPassword))
            ],
            [
                new AccessWorkspaceMembership(fixture.PrimaryWorkspace, fixture.OwnerMembership),
                new AccessWorkspaceMembership(fixture.SecondaryWorkspace, fixture.SecondaryOwnerMembership),
                new AccessWorkspaceMembership(fixture.PrimaryWorkspace, fixture.ReceptionistMembership),
                new AccessWorkspaceMembership(fixture.PrimaryWorkspace, fixture.SuspendedManagerMembership),
                new AccessWorkspaceMembership(fixture.PrimaryWorkspace, fixture.UnprovisionedStaffMembership),
                new AccessWorkspaceMembership(
                    fixture.PrimaryWorkspace,
                    new WorkspaceMembership(
                        Guid.Parse("00000000-0000-0000-0000-000000000306"),
                        fixture.PrimaryWorkspace.Id,
                        integrationManagerStaff.Id,
                        AccessRole.Manager,
                        MembershipStatus.Active)),
                new AccessWorkspaceMembership(
                    fixture.PrimaryWorkspace,
                    new WorkspaceMembership(
                        Guid.Parse("00000000-0000-0000-0000-000000000307"),
                        fixture.PrimaryWorkspace.Id,
                        fixture.TechnicianStaff.Id,
                        AccessRole.Technician,
                        MembershipStatus.Active))
            ]);
    }

    public void SetAccountStatus(Guid principalId, AccountStatus status)
    {
        _accounts.AddOrUpdate(
            principalId,
            _ => throw new InvalidOperationException("The test account does not exist."),
            (_, account) => account with
            {
                Principal = account.Principal with { Status = status }
            });
    }

    public void SetStaffStatus(Guid principalId, StaffProfileStatus status)
    {
        _accounts.AddOrUpdate(
            principalId,
            _ => throw new InvalidOperationException("The test account does not exist."),
            (_, account) => account with
            {
                StaffProfile = account.StaffProfile with { Status = status }
            });
    }

    public void SetMembershipStatus(Guid membershipId, MembershipStatus status)
    {
        _memberships.AddOrUpdate(
            membershipId,
            _ => throw new InvalidOperationException("The test membership does not exist."),
            (_, item) => item with
            {
                Membership = item.Membership with { Status = status }
            });
    }

    public Task<AccessAccount?> FindAccountByEmailAsync(
        string normalizedEmail,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var account = _accounts.Values.SingleOrDefault(item =>
            string.Equals(
                item.Principal.Email,
                normalizedEmail,
                StringComparison.OrdinalIgnoreCase));
        return Task.FromResult(account);
    }

    public Task<IReadOnlyList<AccessWorkspaceMembership>> FindMembershipsAsync(
        Guid staffProfileId,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        IReadOnlyList<AccessWorkspaceMembership> memberships = _memberships.Values
            .Where(item => item.Membership.StaffProfileId == staffProfileId)
            .OrderBy(item => item.Workspace.Id)
            .ToArray();
        return Task.FromResult(memberships);
    }

    public Task<AccessSessionSnapshot?> FindSessionByTokenHashAsync(
        string tokenHash,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var session = _sessions.Values.SingleOrDefault(item => item.TokenHash == tokenHash);
        if (session is null ||
            !_accounts.TryGetValue(session.PrincipalId, out var account))
        {
            return Task.FromResult<AccessSessionSnapshot?>(null);
        }

        var membership = _memberships.Values.SingleOrDefault(item =>
            item.Membership.StaffProfileId == session.StaffProfileId &&
            item.Membership.WorkspaceId == session.WorkspaceId);
        return Task.FromResult<AccessSessionSnapshot?>(
            membership is null
                ? null
                : new AccessSessionSnapshot(session, account, membership));
    }

    public Task CreateSessionAsync(
        AccessSession session,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        if (!_sessions.TryAdd(session.Id, session))
        {
            throw new InvalidOperationException("The test session already exists.");
        }

        return Task.CompletedTask;
    }

    public Task TouchSessionAsync(
        Guid sessionId,
        DateTimeOffset accessedAt,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        _sessions.AddOrUpdate(
            sessionId,
            _ => throw new InvalidOperationException("The test session does not exist."),
            (_, session) => session with { LastAccessedAt = accessedAt });
        return Task.CompletedTask;
    }

    public Task<bool> RevokeSessionAsync(
        string tokenHash,
        DateTimeOffset revokedAt,
        string reason,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var session = _sessions.Values.SingleOrDefault(item => item.TokenHash == tokenHash);
        if (session is null || session.RevokedAt is not null)
        {
            return Task.FromResult(false);
        }

        _sessions[session.Id] = session with
        {
            RevokedAt = revokedAt,
            RevokeReason = reason
        };
        return Task.FromResult(true);
    }
}

public sealed class RecordingAccessAuditSink : IAccessAuditSink
{
    private readonly ConcurrentQueue<AccessAuditEvent> _events = new();

    public IReadOnlyCollection<AccessAuditEvent> Events => _events.ToArray();

    public Task RecordAsync(
        AccessAuditEvent auditEvent,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        _events.Enqueue(auditEvent);
        return Task.CompletedTask;
    }
}
