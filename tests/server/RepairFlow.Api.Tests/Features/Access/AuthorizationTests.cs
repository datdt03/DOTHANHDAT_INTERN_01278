using RepairFlow.Api.Features.Access.Application;
using RepairFlow.Api.Features.Access.Domain;

namespace RepairFlow.Api.Tests.Features.Access;

public sealed class AuthorizationTests
{
    [Fact]
    public void Owner_and_manager_can_manage_operations_but_only_owner_manages_credentials()
    {
        var fixture = AccessFixture.Create();
        var policy = new AccessAuthorizationPolicy();
        var owner = AccessFixture.CreateContext(
            fixture.ActiveOwnerAccount,
            fixture.PrimaryWorkspace,
            fixture.OwnerMembership,
            fixture.OwnerStaff);
        var manager = AccessFixture.CreateContext(
            fixture.InactiveManagerAccount with { Status = AccountStatus.Active },
            fixture.PrimaryWorkspace,
            fixture.SuspendedManagerMembership with { Status = MembershipStatus.Active },
            fixture.ManagerStaff);

        AssertAllowed(policy, owner, AccessAction.WorkspaceRead, fixture.PrimaryWorkspace.Id);
        AssertAllowed(policy, owner, AccessAction.CredentialManage, fixture.PrimaryWorkspace.Id);
        AssertAllowed(policy, manager, AccessAction.StaffManage, fixture.PrimaryWorkspace.Id);
        AssertAllowed(policy, manager, AccessAction.AssignmentManage, fixture.PrimaryWorkspace.Id);

        var managerCredentialDecision = policy.Evaluate(
            new AccessAuthorizationRequest(
                manager,
                AccessAction.CredentialManage,
                fixture.PrimaryWorkspace.Id));

        Assert.False(managerCredentialDecision.IsAllowed);
        Assert.Equal(AuthorizationFailureReason.RoleDenied, managerCredentialDecision.FailureReason);
    }

    [Fact]
    public void Receptionist_gets_operational_read_but_not_technical_or_audit_data()
    {
        var fixture = AccessFixture.Create();
        var policy = new AccessAuthorizationPolicy();
        var receptionist = AccessFixture.CreateContext(
            fixture.ActiveReceptionistAccount,
            fixture.PrimaryWorkspace,
            fixture.ReceptionistMembership,
            fixture.ReceptionistStaff);

        AssertAllowed(policy, receptionist, AccessAction.OperationalRead, fixture.PrimaryWorkspace.Id);

        var technicalDecision = policy.Evaluate(
            new AccessAuthorizationRequest(
                receptionist,
                AccessAction.TechnicalRead,
                fixture.PrimaryWorkspace.Id));
        var auditDecision = policy.Evaluate(
            new AccessAuthorizationRequest(
                receptionist,
                AccessAction.AuditRead,
                fixture.PrimaryWorkspace.Id));

        Assert.False(technicalDecision.IsAllowed);
        Assert.Equal(AuthorizationFailureReason.RoleDenied, technicalDecision.FailureReason);
        Assert.False(auditDecision.IsAllowed);
        Assert.Equal(AuthorizationFailureReason.RoleDenied, auditDecision.FailureReason);
    }

    [Fact]
    public void Technician_needs_an_active_assignment_for_relevant_reads()
    {
        var fixture = AccessFixture.Create();
        var policy = new AccessAuthorizationPolicy();
        var technicianPrincipal = new AccessPrincipal(
            Guid.Parse("00000000-0000-0000-0000-000000000206"),
            "technician@example.test",
            fixture.TechnicianStaff.Id,
            AccountStatus.Active);
        var technicianMembership = new WorkspaceMembership(
            Guid.Parse("00000000-0000-0000-0000-000000000306"),
            fixture.PrimaryWorkspace.Id,
            fixture.TechnicianStaff.Id,
            AccessRole.Technician,
            MembershipStatus.Active);
        var technician = AccessFixture.CreateContext(
            technicianPrincipal,
            fixture.PrimaryWorkspace,
            technicianMembership,
            fixture.TechnicianStaff);
        var resourceId = Guid.Parse("00000000-0000-0000-0000-000000000401");

        var withoutAssignment = policy.Evaluate(
            new AccessAuthorizationRequest(
                technician,
                AccessAction.TechnicalRead,
                fixture.PrimaryWorkspace.Id,
                resourceId));
        var withAssignment = policy.Evaluate(
            new AccessAuthorizationRequest(
                technician,
                AccessAction.TechnicalRead,
                fixture.PrimaryWorkspace.Id,
                resourceId,
                [Assignment(resourceId, technician.StaffProfile.Id, AssignmentResponsibility.Diagnosis)]));

        Assert.False(withoutAssignment.IsAllowed);
        Assert.Equal(AuthorizationFailureReason.AssignmentRequired, withoutAssignment.FailureReason);
        Assert.True(withAssignment.IsAllowed);
    }

    [Fact]
    public void Cross_workspace_resource_is_hidden_with_a_safe_denial()
    {
        var fixture = AccessFixture.Create();
        var policy = new AccessAuthorizationPolicy();
        var owner = AccessFixture.CreateContext(
            fixture.ActiveOwnerAccount,
            fixture.PrimaryWorkspace,
            fixture.OwnerMembership,
            fixture.OwnerStaff);

        var decision = policy.Evaluate(
            new AccessAuthorizationRequest(
                owner,
                AccessAction.OperationalRead,
                fixture.SecondaryWorkspace.Id,
                Guid.Parse("00000000-0000-0000-0000-000000000402")));

        Assert.False(decision.IsAllowed);
        Assert.Equal(AuthorizationFailureReason.CrossWorkspace, decision.FailureReason);
        Assert.True(decision.HideResource);
    }

    [Fact]
    public void Capability_projection_is_presentation_only_and_matches_role_scope()
    {
        var fixture = AccessFixture.Create();
        var receptionist = AccessFixture.CreateContext(
            fixture.ActiveReceptionistAccount,
            fixture.PrimaryWorkspace,
            fixture.ReceptionistMembership,
            fixture.ReceptionistStaff);
        var response = new AccessService().ToSafeResponse(receptionist);

        Assert.True(response.Capabilities.CanViewOperationalProjection);
        Assert.True(response.Capabilities.CanWriteIntake);
        Assert.True(response.Capabilities.WritesRequireAssignment);
        Assert.True(response.Capabilities.CanReadWorkspaceTags);
        Assert.True(response.Capabilities.CanCreateWorkspaceTags);
        Assert.False(response.Capabilities.CanManageWorkspaceTags);
        Assert.True(response.Capabilities.CanAssignRepairItemTags);
        Assert.False(response.Capabilities.CanViewTechnicalDetails);
        Assert.False(response.Capabilities.CanViewAudit);
        Assert.DoesNotContain("token", response.Capabilities.ToString(), StringComparison.OrdinalIgnoreCase);
    }

    private static void AssertAllowed(
        IAccessAuthorizationPolicy policy,
        AccessContext context,
        AccessAction action,
        Guid workspaceId)
    {
        var decision = policy.Evaluate(
            new AccessAuthorizationRequest(context, action, workspaceId));
        Assert.True(decision.IsAllowed);
    }

    private static AssignmentScope Assignment(
        Guid resourceId,
        Guid staffProfileId,
        AssignmentResponsibility responsibility) =>
        new(
            Guid.Parse("00000000-0000-0000-0000-000000000001"),
            resourceId,
            staffProfileId,
            responsibility);
}
