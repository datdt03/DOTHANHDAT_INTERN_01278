using Microsoft.Extensions.Options;
using RepairFlow.Api.Configuration;
using RepairFlow.Api.Features.Access.Application;
using RepairFlow.Api.Features.Access.Domain;

namespace RepairFlow.Api.Tests.Features.Access;

public sealed class AuthenticationTests
{
    [Fact]
    public async Task Active_provisioned_account_with_active_membership_creates_a_hashed_session()
    {
        var fixture = AccessFixture.Create();
        var (service, repository, audit) = CreateSut(fixture);

        var result = await service.AuthenticateAsync(
            new LoginCommand(
                fixture.ActiveReceptionistAccount.Email,
                AccessFixture.KnownPassword,
                WorkspaceId: null),
            "127.0.0.1",
            "test-agent",
            DateTimeOffset.UtcNow);

        Assert.Equal(AuthenticationResultKind.Success, result.Kind);
        Assert.Equal(
            fixture.ReceptionistMembership.WorkspaceId,
            result.Context!.Workspace.Id);
        Assert.NotNull(result.RawToken);
        Assert.NotEqual(result.RawToken, result.Session!.TokenHash);
        Assert.Single(repository.Sessions);
        Assert.Contains(audit.Events, item => item.Action == "login_succeeded");
    }

    [Fact]
    public async Task Wrong_credentials_return_a_generic_failure_without_creating_a_session()
    {
        var fixture = AccessFixture.Create();
        var (service, repository, audit) = CreateSut(fixture);

        var result = await service.AuthenticateAsync(
            new LoginCommand(fixture.ActiveReceptionistAccount.Email, "wrong-password", null),
            null,
            null,
            DateTimeOffset.UtcNow);

        Assert.Equal(AuthenticationResultKind.Failure, result.Kind);
        Assert.Null(result.Context);
        Assert.Null(result.RawToken);
        Assert.Empty(repository.Sessions);
        Assert.Contains(audit.Events, item => item.Action == "login_failed");
    }

    [Fact]
    public async Task Inactive_account_suspended_membership_and_unprovisioned_staff_are_rejected()
    {
        var fixture = AccessFixture.Create();
        var (service, repository, _) = CreateSut(fixture);

        var inactiveAccount = await service.AuthenticateAsync(
            new LoginCommand(fixture.InactiveManagerAccount.Email, AccessFixture.KnownPassword, null),
            null,
            null,
            DateTimeOffset.UtcNow);
        var unprovisionedStaff = await service.AuthenticateAsync(
            new LoginCommand("staff-without-account@example.test", AccessFixture.KnownPassword, null),
            null,
            null,
            DateTimeOffset.UtcNow.AddSeconds(1));

        repository.SetAccountStatus(
            fixture.InactiveManagerAccount.Id,
            AccountStatus.Active);
        repository.SetMembershipStatus(
            fixture.SuspendedManagerMembership.Id,
            MembershipStatus.Active);
        repository.SetAccountStatus(
            fixture.InactiveManagerAccount.Id,
            AccountStatus.Locked);
        var lockedAccount = await service.AuthenticateAsync(
            new LoginCommand(fixture.InactiveManagerAccount.Email, AccessFixture.KnownPassword, null),
            null,
            null,
            DateTimeOffset.UtcNow.AddSeconds(2));

        repository.SetMembershipStatus(
            fixture.ReceptionistMembership.Id,
            MembershipStatus.Removed);
        var removedMembership = await service.AuthenticateAsync(
            new LoginCommand(fixture.ActiveReceptionistAccount.Email, AccessFixture.KnownPassword, null),
            null,
            null,
            DateTimeOffset.UtcNow.AddSeconds(3));

        Assert.Equal(AuthenticationResultKind.Failure, inactiveAccount.Kind);
        Assert.Equal(AuthenticationResultKind.Failure, unprovisionedStaff.Kind);
        Assert.Equal(AuthenticationResultKind.Failure, lockedAccount.Kind);
        Assert.Equal(AuthenticationResultKind.Failure, removedMembership.Kind);
    }

    [Fact]
    public async Task Multiple_workspaces_require_selection_and_selected_workspace_is_isolated()
    {
        var fixture = AccessFixture.Create();
        var (service, repository, _) = CreateSut(fixture);

        var selection = await service.AuthenticateAsync(
            new LoginCommand(fixture.ActiveOwnerAccount.Email, AccessFixture.KnownPassword, null),
            null,
            null,
            DateTimeOffset.UtcNow);
        var selected = await service.AuthenticateAsync(
            new LoginCommand(
                fixture.ActiveOwnerAccount.Email,
                AccessFixture.KnownPassword,
                fixture.SecondaryWorkspace.Id),
            null,
            null,
            DateTimeOffset.UtcNow.AddSeconds(1));

        Assert.Equal(AuthenticationResultKind.WorkspaceSelectionRequired, selection.Kind);
        Assert.Equal(2, selection.AvailableWorkspaces!.Count);
        Assert.Equal(AuthenticationResultKind.Success, selected.Kind);
        Assert.Equal(fixture.SecondaryWorkspace.Id, selected.Context!.Workspace.Id);
        Assert.Single(repository.Sessions);
    }

    [Fact]
    public async Task Repeated_failures_are_rate_limited_without_disclosing_account_state()
    {
        var fixture = AccessFixture.Create();
        var options = new AuthOptions
        {
            PasswordHashIterations = 10_000,
            MaxFailedAttempts = 2
        };
        var (service, _, audit) = CreateSut(fixture, options);

        var command = new LoginCommand(fixture.ActiveReceptionistAccount.Email, "wrong-password", null);
        var first = await service.AuthenticateAsync(command, "127.0.0.1", null, DateTimeOffset.UtcNow);
        var second = await service.AuthenticateAsync(command, "127.0.0.1", null, DateTimeOffset.UtcNow.AddSeconds(1));
        var third = await service.AuthenticateAsync(command, "127.0.0.1", null, DateTimeOffset.UtcNow.AddSeconds(2));

        Assert.Equal(AuthenticationResultKind.Failure, first.Kind);
        Assert.Equal(AuthenticationResultKind.Failure, second.Kind);
        Assert.Equal(AuthenticationResultKind.RateLimited, third.Kind);
        Assert.Contains(audit.Events, item => item.Action == "login_rate_limited");
    }

    private static (
        AuthenticationService Service,
        TestAccessRepository Repository,
        RecordingAccessAuditSink Audit) CreateSut(
        AccessFixtureSet fixture,
        AuthOptions? options = null)
    {
        options ??= new AuthOptions { PasswordHashIterations = 10_000 };
        var optionsAccessor = Options.Create(options);
        var credentialHasher = new CredentialHasher(optionsAccessor);
        var repository = TestAccessRepository.Create(fixture, credentialHasher);
        var audit = new RecordingAccessAuditSink();
        var service = new AuthenticationService(
            repository,
            credentialHasher,
            new InMemoryAccessRateLimiter(optionsAccessor),
            audit,
            optionsAccessor);
        return (service, repository, audit);
    }
}
