using Microsoft.Extensions.Options;
using RepairFlow.Api.Configuration;
using RepairFlow.Api.Features.Access.Application;
using RepairFlow.Api.Features.Access.Domain;

namespace RepairFlow.Api.Tests.Features.Access;

public sealed class SessionTests
{
    [Fact]
    public async Task Valid_session_resolves_context_and_refreshes_last_activity()
    {
        var fixture = AccessFixture.Create();
        var options = new AuthOptions { PasswordHashIterations = 10_000 };
        var (authentication, sessions, repository, _) = CreateSut(fixture, options);
        var issuedAt = DateTimeOffset.UtcNow;
        var login = await authentication.AuthenticateAsync(
            new LoginCommand(fixture.ActiveReceptionistAccount.Email, AccessFixture.KnownPassword, null),
            null,
            null,
            issuedAt);
        var accessedAt = issuedAt.AddMinutes(5);

        var resolved = await sessions.ResolveAsync(login.RawToken!, accessedAt);

        Assert.NotNull(resolved);
        Assert.Equal(fixture.PrimaryWorkspace.Id, resolved!.Context.Workspace.Id);
        Assert.Equal(fixture.ActiveReceptionistAccount.Id, resolved.Context.Principal.Id);
        Assert.Equal(accessedAt, repository.Sessions.Single().LastAccessedAt);
    }

    [Fact]
    public async Task Idle_timeout_revokes_the_session()
    {
        var fixture = AccessFixture.Create();
        var options = new AuthOptions { PasswordHashIterations = 10_000 };
        var (authentication, sessions, repository, _) = CreateSut(fixture, options);
        var issuedAt = DateTimeOffset.UtcNow;
        var login = await authentication.AuthenticateAsync(
            new LoginCommand(fixture.ActiveReceptionistAccount.Email, AccessFixture.KnownPassword, null),
            null,
            null,
            issuedAt);

        var resolved = await sessions.ResolveAsync(
            login.RawToken!,
            issuedAt.Add(options.IdleTimeout));

        Assert.Null(resolved);
        Assert.Equal("idle_timeout", repository.Sessions.Single().RevokeReason);
    }

    [Fact]
    public async Task Absolute_expiry_revokes_the_session_even_if_idle_policy_would_also_expire()
    {
        var fixture = AccessFixture.Create();
        var options = new AuthOptions { PasswordHashIterations = 10_000 };
        var (authentication, sessions, repository, _) = CreateSut(fixture, options);
        var issuedAt = DateTimeOffset.UtcNow;
        var login = await authentication.AuthenticateAsync(
            new LoginCommand(fixture.ActiveReceptionistAccount.Email, AccessFixture.KnownPassword, null),
            null,
            null,
            issuedAt);

        var resolved = await sessions.ResolveAsync(
            login.RawToken!,
            login.Session!.AbsoluteExpiresAt);

        Assert.Null(resolved);
        Assert.Equal("absolute_expiry", repository.Sessions.Single().RevokeReason);
    }

    [Fact]
    public async Task Repeated_logout_is_safe_and_only_the_first_revoke_succeeds()
    {
        var fixture = AccessFixture.Create();
        var options = new AuthOptions { PasswordHashIterations = 10_000 };
        var (authentication, sessions, repository, audit) = CreateSut(fixture, options);
        var now = DateTimeOffset.UtcNow;
        var login = await authentication.AuthenticateAsync(
            new LoginCommand(fixture.ActiveReceptionistAccount.Email, AccessFixture.KnownPassword, null),
            null,
            null,
            now);

        var first = await sessions.RevokeAsync(login.RawToken, now.AddMinutes(1), "logout");
        var second = await sessions.RevokeAsync(login.RawToken, now.AddMinutes(2), "logout");

        Assert.True(first);
        Assert.False(second);
        Assert.Equal("logout", repository.Sessions.Single().RevokeReason);
        Assert.Contains(audit.Events, item => item.Action == "logout_succeeded");
    }

    [Fact]
    public async Task Membership_change_invalidates_an_existing_session()
    {
        var fixture = AccessFixture.Create();
        var options = new AuthOptions { PasswordHashIterations = 10_000 };
        var (authentication, sessions, repository, _) = CreateSut(fixture, options);
        var now = DateTimeOffset.UtcNow;
        var login = await authentication.AuthenticateAsync(
            new LoginCommand(fixture.ActiveReceptionistAccount.Email, AccessFixture.KnownPassword, null),
            null,
            null,
            now);
        repository.SetMembershipStatus(
            fixture.ReceptionistMembership.Id,
            MembershipStatus.Suspended);

        var resolved = await sessions.ResolveAsync(login.RawToken!, now.AddMinutes(1));

        Assert.Null(resolved);
        Assert.Equal("access_inactive", repository.Sessions.Single().RevokeReason);
    }

    private static (
        AuthenticationService Authentication,
        SessionService Sessions,
        TestAccessRepository Repository,
        RecordingAccessAuditSink Audit) CreateSut(
        AccessFixtureSet fixture,
        AuthOptions options)
    {
        var optionsAccessor = Options.Create(options);
        var credentialHasher = new CredentialHasher(optionsAccessor);
        var repository = TestAccessRepository.Create(fixture, credentialHasher);
        var audit = new RecordingAccessAuditSink();
        var authentication = new AuthenticationService(
            repository,
            credentialHasher,
            new InMemoryAccessRateLimiter(optionsAccessor),
            audit,
            optionsAccessor);
        var sessions = new SessionService(repository, audit, optionsAccessor);
        return (authentication, sessions, repository, audit);
    }
}
