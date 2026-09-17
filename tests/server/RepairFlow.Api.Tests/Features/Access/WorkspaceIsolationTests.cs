using RepairFlow.Api.Features.Access.Application;
using RepairFlow.Api.Features.Access.Domain;

namespace RepairFlow.Api.Tests.Features.Access;

public sealed class WorkspaceIsolationTests
{
    [Fact]
    public void Workspace_policy_requires_the_resource_workspace_to_match_the_session()
    {
        var fixture = AccessFixture.Create();
        var policy = new AccessAuthorizationPolicy();
        var receptionist = AccessFixture.CreateContext(
            fixture.ActiveReceptionistAccount,
            fixture.PrimaryWorkspace,
            fixture.ReceptionistMembership,
            fixture.ReceptionistStaff);

        var decision = policy.Evaluate(
            new AccessAuthorizationRequest(
                receptionist,
                AccessAction.OperationalRead,
                fixture.SecondaryWorkspace.Id));

        Assert.False(decision.IsAllowed);
        Assert.Equal(AuthorizationFailureReason.CrossWorkspace, decision.FailureReason);
        Assert.True(decision.HideResource);
    }

    [Fact]
    public void Assignment_from_another_workspace_cannot_authorize_a_technician()
    {
        var fixture = AccessFixture.Create();
        var policy = new AccessAuthorizationPolicy();
        var technicianPrincipal = new AccessPrincipal(
            Guid.Parse("00000000-0000-0000-0000-000000000207"),
            "technician-isolation@example.test",
            fixture.TechnicianStaff.Id,
            AccountStatus.Active);
        var technicianMembership = new WorkspaceMembership(
            Guid.Parse("00000000-0000-0000-0000-000000000307"),
            fixture.PrimaryWorkspace.Id,
            fixture.TechnicianStaff.Id,
            AccessRole.Technician,
            MembershipStatus.Active);
        var technician = AccessFixture.CreateContext(
            technicianPrincipal,
            fixture.PrimaryWorkspace,
            technicianMembership,
            fixture.TechnicianStaff);
        var resourceId = Guid.Parse("00000000-0000-0000-0000-000000000403");

        var decision = policy.Evaluate(
            new AccessAuthorizationRequest(
                technician,
                AccessAction.RepairWrite,
                fixture.PrimaryWorkspace.Id,
                resourceId,
                [
                    new AssignmentScope(
                        fixture.SecondaryWorkspace.Id,
                        resourceId,
                        technician.StaffProfile.Id,
                        AssignmentResponsibility.Repairer)
                ]));

        Assert.False(decision.IsAllowed);
        Assert.Equal(AuthorizationFailureReason.AssignmentRequired, decision.FailureReason);
    }

    [Fact]
    public void Missing_authenticated_context_is_denied_by_default()
    {
        var decision = new AccessAuthorizationPolicy().Evaluate(
            new AccessAuthorizationRequest(
                Context: null,
                AccessAction.OperationalRead,
                Guid.NewGuid()));

        Assert.False(decision.IsAllowed);
        Assert.Equal(AuthorizationFailureReason.AuthenticationRequired, decision.FailureReason);
    }
}
