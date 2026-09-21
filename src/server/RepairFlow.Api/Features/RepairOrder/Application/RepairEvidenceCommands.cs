using System.IO;
using RepairFlow.Api.Features.RepairOrder.Domain;

namespace RepairFlow.Api.Features.RepairOrder.Application;

public sealed record RepairEvidenceItemContext(
    Guid RepairOrderId,
    Guid RepairItemId,
    string? HandoverCondition,
    DateTimeOffset? EvidenceLockedAt,
    Guid? EvidenceLockedBy);

public interface IRepairEvidenceRepository
{
    Task<RepairEvidenceItemContext?> FindItemContextAsync(
        Guid workspaceId,
        Guid repairItemId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<RepairEvidence>> ListAsync(
        Guid workspaceId,
        Guid repairItemId,
        CancellationToken cancellationToken = default);

    Task<RepairEvidence?> FindAsync(
        Guid workspaceId,
        Guid evidenceId,
        CancellationToken cancellationToken = default);

    Task<RepairEvidence?> FindActiveByIdempotencyAsync(
        Guid workspaceId,
        Guid repairItemId,
        RepairEvidenceStage stage,
        string idempotencyKey,
        CancellationToken cancellationToken = default);

    Task<RepairEvidence?> FindActiveByChecksumAsync(
        Guid workspaceId,
        Guid repairItemId,
        RepairEvidenceStage stage,
        string checksum,
        CancellationToken cancellationToken = default);

    Task<RepairEvidenceCreateResult> CreateAsync(
        RepairEvidenceCreateData data,
        CancellationToken cancellationToken = default);

    Task<RepairEvidenceDeleteResult?> SoftDeleteAsync(
        Guid workspaceId,
        Guid repairItemId,
        Guid evidenceId,
        Guid actorId,
        CancellationToken cancellationToken = default);

    Task<RepairEvidenceLockResult?> LockItemAsync(
        Guid workspaceId,
        Guid repairOrderId,
        Guid repairItemId,
        Guid actorId,
        CancellationToken cancellationToken = default);
}

public interface IPrivateObjectStorage
{
    TimeSpan SignedReadLifetime { get; }

    Task PutAsync(
        string objectKey,
        string contentType,
        Stream content,
        long contentLength,
        CancellationToken cancellationToken = default);

    Task DeleteAsync(
        string objectKey,
        CancellationToken cancellationToken = default);

    Task<string> CreateReadUrlAsync(
        string objectKey,
        DateTimeOffset expiresAt,
        CancellationToken cancellationToken = default);
}

public sealed class RepairEvidenceConflictException : Exception
{
    public RepairEvidenceConflictException(string code, string message, object? details = null)
        : base(message)
    {
        Code = code;
        Details = details;
    }

    public string Code { get; }

    public object? Details { get; }
}

public sealed class RepairEvidenceNotFoundException : Exception
{
}
