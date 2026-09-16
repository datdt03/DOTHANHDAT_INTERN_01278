using RepairFlow.Api.Features.Access.Domain;

namespace RepairFlow.Api.Features.Access.Api;

public sealed record AccessContextResponse(
    Guid AccountId,
    string Email,
    Guid WorkspaceId,
    string WorkspaceName,
    string Role,
    Guid StaffProfileId,
    string StaffProfileName);
