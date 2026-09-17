using RepairFlow.Api.Features.Access.Api;
using RepairFlow.Api.Features.Access.Domain;

namespace RepairFlow.Api.Features.Access.Application;

public sealed class AccessService
{
    public AccessContextResponse ToSafeResponse(AccessContext context) =>
        new(
            context.Principal.Id,
            context.Principal.Email,
            context.Workspace.Id,
            context.Workspace.Name,
            context.Membership.Role.ToString().ToLowerInvariant(),
            context.StaffProfile.Id,
            context.StaffProfile.Name,
            ToCapabilitiesResponse(CapabilityProjection.For(context)));

    private static AccessCapabilitiesResponse ToCapabilitiesResponse(AccessCapabilities capabilities) =>
        new(
            capabilities.CanViewWorkspace,
            capabilities.CanManageWorkspace,
            capabilities.CanManageStaff,
            capabilities.CanManageCredentials,
            capabilities.CanManageAssignments,
            capabilities.CanViewWorkspaceOperations,
            capabilities.CanViewOperationalProjection,
            capabilities.CanViewAssignedWork,
            capabilities.CanViewTechnicalDetails,
            capabilities.CanViewAudit,
            capabilities.CanWriteIntake,
            capabilities.CanWriteDiagnosis,
            capabilities.CanWriteQuoteDraft,
            capabilities.CanWriteRepair,
            capabilities.CanWriteQualityCheck,
            capabilities.CanWriteHandover,
            capabilities.WritesRequireAssignment);
}
