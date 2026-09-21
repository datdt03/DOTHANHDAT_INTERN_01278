using RepairFlow.Api.Features.Access.Domain;

namespace RepairFlow.Api.Features.Access.Application;

public sealed record AccessCapabilities(
    bool CanViewWorkspace,
    bool CanManageWorkspace,
    bool CanManageStaff,
    bool CanManageCredentials,
    bool CanManageAssignments,
    bool CanViewWorkspaceOperations,
    bool CanViewOperationalProjection,
    bool CanViewAssignedWork,
    bool CanViewTechnicalDetails,
    bool CanViewAudit,
    bool CanWriteIntake,
    bool CanWriteDiagnosis,
    bool CanWriteQuoteDraft,
    bool CanWriteRepair,
    bool CanWriteQualityCheck,
    bool CanWriteHandover,
    bool WritesRequireAssignment,
    bool CanReadWorkspaceTags,
    bool CanCreateWorkspaceTags,
    bool CanManageWorkspaceTags,
    bool CanAssignRepairItemTags);

public static class CapabilityProjection
{
    public static AccessCapabilities For(AccessContext context)
    {
        var role = context.ActiveRole;
        var isOwner = role == AccessRole.Owner;
        var isManager = role == AccessRole.Manager;
        var isManagement = isOwner || isManager;
        var isReceptionist = role == AccessRole.Receptionist;
        var isTechnician = role == AccessRole.Technician;

        return new AccessCapabilities(
            CanViewWorkspace: isManagement,
            CanManageWorkspace: isOwner,
            CanManageStaff: isManagement,
            CanManageCredentials: isOwner,
            CanManageAssignments: isManagement,
            CanViewWorkspaceOperations: isManagement,
            CanViewOperationalProjection: isManagement || isReceptionist,
            CanViewAssignedWork: isTechnician,
            CanViewTechnicalDetails: isManagement || isTechnician,
            CanViewAudit: isManagement,
            CanWriteIntake: isManagement || isReceptionist,
            CanWriteDiagnosis: isManagement || isTechnician,
            CanWriteQuoteDraft: isManagement || isTechnician,
            CanWriteRepair: isManagement || isTechnician,
            CanWriteQualityCheck: isManagement || isTechnician,
            CanWriteHandover: isManagement || isReceptionist,
            WritesRequireAssignment: isReceptionist || isTechnician,
            CanReadWorkspaceTags: isManagement || isReceptionist,
            CanCreateWorkspaceTags: isManagement || isReceptionist,
            CanManageWorkspaceTags: isManagement,
            CanAssignRepairItemTags: isManagement || isReceptionist);
    }
}
