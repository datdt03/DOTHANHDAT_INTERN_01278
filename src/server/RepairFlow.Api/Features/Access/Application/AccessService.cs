using RepairFlow.Api.Features.Access.Api;
using RepairFlow.Api.Features.Access.Domain;

namespace RepairFlow.Api.Features.Access.Application;

public sealed class AccessService
{
    public AccessContextResponse ToSafeResponse(AccessContext context)
    {
        var capabilities = ToCapabilitiesResponse(CapabilityProjection.For(context));
        var roles = context.Membership.Roles
            .Distinct()
            .Select(AccessRoleCodec.ToWireValue)
            .ToArray();
        var activeRole = AccessRoleCodec.ToWireValue(context.ActiveRole);

        return new(
            context.Principal.Id,
            context.Principal.Email,
            context.Workspace.Id,
            context.Workspace.Name,
            activeRole,
            context.StaffProfile.Id,
            context.StaffProfile.Name,
            capabilities,
            roles,
            activeRole,
            capabilities);
    }

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
