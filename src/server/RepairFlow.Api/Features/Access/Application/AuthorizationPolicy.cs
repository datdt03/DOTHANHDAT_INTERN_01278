using RepairFlow.Api.Features.Access.Domain;

namespace RepairFlow.Api.Features.Access.Application;

public sealed class AccessAuthorizationPolicy : IAccessAuthorizationPolicy
{
    public AuthorizationDecision Evaluate(AccessAuthorizationRequest request)
    {
        if (request.Context is null || !request.Context.IsAuthenticated)
        {
            return AuthorizationDecision.Deny(AuthorizationFailureReason.AuthenticationRequired);
        }

        var context = request.Context;
        if (context.Principal.Status != AccountStatus.Active ||
            context.StaffProfile.Status != StaffProfileStatus.Active)
        {
            return AuthorizationDecision.Deny(AuthorizationFailureReason.InactivePrincipal);
        }

        if (context.Membership.Status != MembershipStatus.Active)
        {
            return AuthorizationDecision.Deny(AuthorizationFailureReason.InactiveMembership);
        }

        if (context.Principal.StaffProfileId != context.StaffProfile.Id ||
            context.Membership.StaffProfileId != context.StaffProfile.Id ||
            context.Membership.WorkspaceId != context.Workspace.Id)
        {
            return AuthorizationDecision.Deny(
                AuthorizationFailureReason.InvalidContext,
                hideResource: true);
        }

        if (request.ResourceWorkspaceId != context.Workspace.Id)
        {
            return AuthorizationDecision.Deny(
                AuthorizationFailureReason.CrossWorkspace,
                hideResource: true);
        }

        var role = context.ActiveRole;
        var isOwner = role == AccessRole.Owner;
        var isManager = role == AccessRole.Manager;
        var isManagement = isOwner || isManager;
        var hasAssignment = request.ResourceId is not null &&
            request.Assignments?.Any(assignment =>
                assignment.IsActive &&
                assignment.WorkspaceId == context.Workspace.Id &&
                assignment.ResourceId == request.ResourceId.Value &&
                assignment.StaffProfileId == context.StaffProfile.Id) == true;

        bool HasResponsibility(params AssignmentResponsibility[] responsibilities) =>
            hasAssignment && request.Assignments!.Any(assignment =>
                assignment.IsActive &&
                assignment.WorkspaceId == context.Workspace.Id &&
                assignment.ResourceId == request.ResourceId!.Value &&
                assignment.StaffProfileId == context.StaffProfile.Id &&
                responsibilities.Contains(assignment.Responsibility));

        var allowed = request.Action switch
        {
            AccessAction.Authenticated => true,
            AccessAction.WorkspaceRead => isManagement,
            AccessAction.OperationalRead =>
                isManagement ||
                role == AccessRole.Receptionist ||
                (role == AccessRole.Technician && hasAssignment),
            AccessAction.TechnicalRead =>
                isManagement ||
                (role == AccessRole.Technician && hasAssignment),
            AccessAction.AuditRead => isManagement,
            AccessAction.StaffManage => isManagement,
            AccessAction.CredentialManage => isOwner,
            AccessAction.AssignmentManage => isManagement,
            AccessAction.IntakeWrite =>
                isManagement ||
                ((role == AccessRole.Receptionist || role == AccessRole.Technician) &&
                 HasResponsibility(AssignmentResponsibility.Intake)),
            AccessAction.DiagnosisWrite =>
                isManagement ||
                (role == AccessRole.Technician &&
                 HasResponsibility(
                     AssignmentResponsibility.Diagnosis,
                     AssignmentResponsibility.PrimaryTechnician)),
            AccessAction.QuoteWrite =>
                isManagement ||
                (role == AccessRole.Technician &&
                 HasResponsibility(AssignmentResponsibility.PrimaryTechnician)),
            AccessAction.RepairWrite =>
                isManagement ||
                (role == AccessRole.Technician &&
                 HasResponsibility(AssignmentResponsibility.Repairer)),
            AccessAction.QualityCheckWrite =>
                isManagement ||
                (role == AccessRole.Technician &&
                 HasResponsibility(AssignmentResponsibility.QualityChecker)),
            AccessAction.HandoverWrite =>
                isManagement ||
                (role == AccessRole.Receptionist &&
                 HasResponsibility(AssignmentResponsibility.Handover)),
            AccessAction.CustomerLinkManage => isManagement,
            AccessAction.CustomerRead =>
                isManagement ||
                role == AccessRole.Receptionist ||
                (role == AccessRole.Technician && hasAssignment),
            AccessAction.CustomerWrite => isManagement || role == AccessRole.Receptionist,
            AccessAction.DeviceRead =>
                isManagement ||
                role == AccessRole.Receptionist ||
                (role == AccessRole.Technician && hasAssignment),
            AccessAction.DeviceWrite => isManagement || role == AccessRole.Receptionist,
            AccessAction.RepairOrderRead =>
                isManagement ||
                role == AccessRole.Receptionist ||
                (role == AccessRole.Technician && hasAssignment),
            AccessAction.RepairOrderCreate => isManagement || role == AccessRole.Receptionist,
            _ => false
        };

        var assignmentScopedAction = request.Action is
            AccessAction.OperationalRead or
            AccessAction.TechnicalRead or
            AccessAction.IntakeWrite or
            AccessAction.DiagnosisWrite or
            AccessAction.QuoteWrite or
            AccessAction.RepairWrite or
            AccessAction.QualityCheckWrite or
            AccessAction.HandoverWrite or
            AccessAction.CustomerRead or
            AccessAction.DeviceRead or
            AccessAction.RepairOrderRead;
        var assignmentRequired = role switch
        {
            AccessRole.Receptionist => request.Action is
                AccessAction.IntakeWrite or
                AccessAction.HandoverWrite,
            AccessRole.Technician => assignmentScopedAction,
            _ => false
        };

        return allowed
            ? AuthorizationDecision.Allow()
            : AuthorizationDecision.Deny(
                assignmentRequired
                    ? AuthorizationFailureReason.AssignmentRequired
                    : AuthorizationFailureReason.RoleDenied);
    }
}
