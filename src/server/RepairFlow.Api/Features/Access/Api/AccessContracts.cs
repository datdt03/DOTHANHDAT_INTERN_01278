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

public sealed record WorkspaceChoice(
    Guid WorkspaceId,
    string WorkspaceName,
    string Role);

public sealed record AccessContextResponse(
    Guid AccountId,
    string Email,
    Guid WorkspaceId,
    string WorkspaceName,
    string Role,
    Guid StaffProfileId,
    string StaffProfileName);
