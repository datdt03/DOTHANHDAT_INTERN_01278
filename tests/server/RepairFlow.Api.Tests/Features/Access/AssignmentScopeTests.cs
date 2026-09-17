using RepairFlow.Api.Features.Access.Application;
using RepairFlow.Api.Features.Access.Domain;

namespace RepairFlow.Api.Tests.Features.Access;

public sealed class AssignmentScopeTests
{
    [Fact]
    public void Receptionist_writes_require_matching_intake_or_handover_responsibility()
    {
        var fixture = AccessFixture.Create();
        var policy = new AccessAuthorizationPolicy();
        var receptionist = AccessFixture.CreateContext(
            fixture.ActiveReceptionistAccount,
            fixture.PrimaryWorkspace,
            fixture.ReceptionistMembership,
            fixture.ReceptionistStaff);
        var resourceId = Guid.Parse("00000000-0000-0000-0000-000000000404");

        var unassigned = policy.Evaluate(
            new AccessAuthorizationRequest(
                receptionist,
                AccessAction.IntakeWrite,
                fixture.PrimaryWorkspace.Id,
                resourceId));
        var assignedIntake = policy.Evaluate(
            new AccessAuthorizationRequest(
                receptionist,
                AccessAction.IntakeWrite,
                fixture.PrimaryWorkspace.Id,
                resourceId,
                [Assignment(fixture, resourceId, AssignmentResponsibility.Intake, receptionist.StaffProfile.Id)]));
        var assignedHandover = policy.Evaluate(
            new AccessAuthorizationRequest(
                receptionist,
                AccessAction.HandoverWrite,
                fixture.PrimaryWorkspace.Id,
                resourceId,
                [Assignment(fixture, resourceId, AssignmentResponsibility.Handover, receptionist.StaffProfile.Id)]));

        Assert.False(unassigned.IsAllowed);
        Assert.Equal(AuthorizationFailureReason.AssignmentRequired, unassigned.FailureReason);
        Assert.True(assignedIntake.IsAllowed);
        Assert.True(assignedHandover.IsAllowed);
    }

    [Fact]
    public void Technician_writes_require_the_matching_responsibility()
    {
        var fixture = AccessFixture.Create();
        var policy = new AccessAuthorizationPolicy();
        var technicianPrincipal = new AccessPrincipal(
            Guid.Parse("00000000-0000-0000-0000-000000000208"),
            "technician-scope@example.test",
            fixture.TechnicianStaff.Id,
            AccountStatus.Active);
        var technicianMembership = new WorkspaceMembership(
            Guid.Parse("00000000-0000-0000-0000-000000000308"),
            fixture.PrimaryWorkspace.Id,
            fixture.TechnicianStaff.Id,
            AccessRole.Technician,
            MembershipStatus.Active);
        var technician = AccessFixture.CreateContext(
            technicianPrincipal,
            fixture.PrimaryWorkspace,
            technicianMembership,
            fixture.TechnicianStaff);
        var resourceId = Guid.Parse("00000000-0000-0000-0000-000000000405");

        var repair = policy.Evaluate(
            new AccessAuthorizationRequest(
                technician,
                AccessAction.RepairWrite,
                fixture.PrimaryWorkspace.Id,
                resourceId,
                [Assignment(fixture, resourceId, AssignmentResponsibility.Repairer, technician.StaffProfile.Id)]));
        var wrongResponsibility = policy.Evaluate(
            new AccessAuthorizationRequest(
                technician,
                AccessAction.RepairWrite,
                fixture.PrimaryWorkspace.Id,
                resourceId,
                [Assignment(fixture, resourceId, AssignmentResponsibility.QualityChecker, technician.StaffProfile.Id)]));
        var qualityCheck = policy.Evaluate(
            new AccessAuthorizationRequest(
                technician,
                AccessAction.QualityCheckWrite,
                fixture.PrimaryWorkspace.Id,
                resourceId,
                [Assignment(fixture, resourceId, AssignmentResponsibility.QualityChecker, technician.StaffProfile.Id)]));

        Assert.True(repair.IsAllowed);
        Assert.False(wrongResponsibility.IsAllowed);
        Assert.Equal(AuthorizationFailureReason.AssignmentRequired, wrongResponsibility.FailureReason);
        Assert.True(qualityCheck.IsAllowed);
    }

    [Fact]
    public void Inactive_assignment_cannot_authorize_a_write()
    {
        var fixture = AccessFixture.Create();
        var policy = new AccessAuthorizationPolicy();
        var receptionist = AccessFixture.CreateContext(
            fixture.ActiveReceptionistAccount,
            fixture.PrimaryWorkspace,
            fixture.ReceptionistMembership,
            fixture.ReceptionistStaff);
        var resourceId = Guid.Parse("00000000-0000-0000-0000-000000000406");

        var decision = policy.Evaluate(
            new AccessAuthorizationRequest(
                receptionist,
                AccessAction.IntakeWrite,
                fixture.PrimaryWorkspace.Id,
                resourceId,
                [Assignment(fixture, resourceId, AssignmentResponsibility.Intake, receptionist.StaffProfile.Id, false)]));

        Assert.False(decision.IsAllowed);
        Assert.Equal(AuthorizationFailureReason.AssignmentRequired, decision.FailureReason);
    }

    private static AssignmentScope Assignment(
        AccessFixtureSet fixture,
        Guid resourceId,
        AssignmentResponsibility responsibility,
        Guid staffProfileId,
        bool isActive = true) =>
        new(
            fixture.PrimaryWorkspace.Id,
            resourceId,
            staffProfileId,
            responsibility,
            isActive);
}
