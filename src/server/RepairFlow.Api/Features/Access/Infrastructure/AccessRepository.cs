using RepairFlow.Api.Features.Access.Domain;

namespace RepairFlow.Api.Features.Access.Infrastructure;

/// <summary>
/// Persistence port for the access feature. The concrete database implementation
/// belongs to c1-003, where the credential and session schema is introduced.
/// </summary>
public interface IAccessRepository
{
    Task<AccessPrincipal?> FindPrincipalByEmailAsync(
        string normalizedEmail,
        CancellationToken cancellationToken = default);

    Task<AccessPrincipal?> FindPrincipalByIdAsync(
        Guid principalId,
        CancellationToken cancellationToken = default);

    Task<StaffProfile?> FindStaffProfileAsync(
        Guid staffProfileId,
        CancellationToken cancellationToken = default);

    Task<Workspace?> FindWorkspaceAsync(
        Guid workspaceId,
        CancellationToken cancellationToken = default);

    Task<WorkspaceMembership?> FindMembershipAsync(
        Guid staffProfileId,
        Guid workspaceId,
        CancellationToken cancellationToken = default);
}
