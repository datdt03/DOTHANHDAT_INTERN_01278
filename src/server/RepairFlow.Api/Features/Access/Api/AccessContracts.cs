namespace RepairFlow.Api.Features.Access.Api;

public sealed record LoginRequest(
    string Email,
    string Password,
    Guid? WorkspaceId = null);

public sealed record LoginResponse(
    AccessContextResponse Context,
    DateTimeOffset ExpiresAt);

public sealed record CurrentSessionResponse(
    AccessContextResponse Context,
    DateTimeOffset ExpiresAt);

public sealed record LogoutResponse(bool Revoked);

public sealed record ActiveRoleRequest(string Role);

public sealed record WorkspaceChoice(
    Guid WorkspaceId,
    string WorkspaceName,
    string Role,
    IReadOnlyList<string>? Roles = null);

public sealed record AccessCapabilitiesResponse(
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

public sealed record AccessContextResponse(
    Guid AccountId,
    string Email,
    Guid WorkspaceId,
    string WorkspaceName,
    string Role,
    Guid StaffProfileId,
    string StaffProfileName,
    AccessCapabilitiesResponse Capabilities,
    IReadOnlyList<string> Roles,
    string ActiveRole,
    AccessCapabilitiesResponse EffectiveCapabilities);
