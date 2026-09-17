using RepairFlow.Api.Features.Access.Domain;

namespace RepairFlow.Api.Features.Access.Application;

/// <summary>
/// Persistence port for the access feature. The concrete database implementation
/// belongs to c1-003, where the credential and session schema is introduced.
/// </summary>
public interface IAccessRepository
{
    Task<AccessAccount?> FindAccountByEmailAsync(
        string normalizedEmail,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AccessWorkspaceMembership>> FindMembershipsAsync(
        Guid staffProfileId,
        CancellationToken cancellationToken = default);

    Task<AccessSessionSnapshot?> FindSessionByTokenHashAsync(
        string tokenHash,
        CancellationToken cancellationToken = default);

    Task CreateSessionAsync(
        AccessSession session,
        CancellationToken cancellationToken = default);

    Task TouchSessionAsync(
        Guid sessionId,
        DateTimeOffset accessedAt,
        CancellationToken cancellationToken = default);

    Task<bool> RevokeSessionAsync(
        string tokenHash,
        DateTimeOffset revokedAt,
        string reason,
        CancellationToken cancellationToken = default);
}
