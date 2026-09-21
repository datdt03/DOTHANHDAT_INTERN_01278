namespace RepairFlow.Api.Features.RepairOrder.Api;

public sealed record RepairEvidenceResponse(
    Guid Id,
    Guid RepairOrderId,
    Guid RepairItemId,
    string Stage,
    string OriginalFilename,
    string MimeType,
    long SizeBytes,
    string Checksum,
    DateTimeOffset CreatedAt);

public sealed record RepairEvidenceAccessResponse(
    Guid Id,
    string Stage,
    string OriginalFilename,
    string MimeType,
    long SizeBytes,
    string Checksum,
    DateTimeOffset CreatedAt,
    string AccessUrl,
    DateTimeOffset ExpiresAt);

public sealed record RepairEvidenceLockResponse(
    Guid RepairOrderId,
    Guid RepairItemId,
    DateTimeOffset LockedAt,
    Guid LockedBy,
    bool AlreadyLocked);
