using RepairFlow.Api.Features.RepairTag.Domain;
using RepairTagEntity = RepairFlow.Api.Features.RepairTag.Domain.RepairTag;

namespace RepairFlow.Api.Features.RepairTag.Application;

public sealed record RepairTagWriteRequest(
    Guid WorkspaceId,
    string Name,
    string NormalizedName,
    Guid ActorId);

public sealed record RepairItemTagAssignmentRequest(
    Guid WorkspaceId,
    Guid RepairOrderId,
    Guid RepairItemId,
    IReadOnlyList<Guid> TagIds,
    Guid ActorId);

public interface IRepairTagRepository
{
        Task<IReadOnlyList<RepairTagEntity>> SearchAsync(
        Guid workspaceId,
        string? normalizedQuery,
        bool includeUnused,
        CancellationToken cancellationToken = default);

    Task<RepairTagEntity> CreateAsync(
        RepairTagWriteRequest request,
        CancellationToken cancellationToken = default);

    Task<RepairTagEntity> RenameAsync(
        Guid workspaceId,
        Guid tagId,
        RepairTagWriteRequest request,
        CancellationToken cancellationToken = default);

    Task DeleteAsync(
        Guid workspaceId,
        Guid tagId,
        Guid actorId,
        CancellationToken cancellationToken = default);

    Task<RepairItemTagAssignment> ReplaceItemAssignmentsAsync(
        RepairItemTagAssignmentRequest request,
        CancellationToken cancellationToken = default);
}

public sealed class RepairTagNotFoundException : Exception
{
}

public sealed class RepairTagConflictException : Exception
{
    public RepairTagConflictException(string code, string message, object? details = null)
        : base(message)
    {
        Code = code;
        Details = details;
    }

    public string Code { get; }

    public object? Details { get; }
}
