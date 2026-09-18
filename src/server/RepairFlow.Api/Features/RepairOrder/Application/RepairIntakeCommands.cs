using RepairFlow.Api.Features.RepairOrder.Domain;

namespace RepairFlow.Api.Features.RepairOrder.Application;

public sealed record CreateRepairIntakeCommand(
    CustomerIntakeCommand Customer,
    IReadOnlyList<RepairItemIntakeCommand> RepairItems,
    string? IntakeNotes,
    DateTimeOffset? ExpectedCompletedAt,
    Guid? IntakeStaffId,
    Guid CreatedBy,
    string IdempotencyKey);

public sealed record CustomerIntakeCommand(
    string Mode,
    Guid? Id,
    string? Name,
    string? Phone,
    string? Email,
    string? Note);

public sealed record RepairItemIntakeCommand(
    DeviceIntakeCommand Device,
    string ReportedIssue,
    string? HandoverCondition,
    string? Accessories,
    string? ItemNotes,
    CredentialIntakeCommand? Credential);

public sealed record DeviceIntakeCommand(
    string DeviceType,
    string Brand,
    string Model,
    string? SerialNumber,
    string? DeviceIdentifier);

public sealed record CredentialIntakeCommand(
    string Status,
    string? Value,
    bool Consent);

public sealed record CreateRepairIntakeData(
    CustomerIntakeCommand Customer,
    IReadOnlyList<RepairItemIntakeData> RepairItems,
    string? IntakeNotes,
    DateTimeOffset? ExpectedCompletedAt,
    Guid? IntakeStaffId,
    Guid CreatedBy,
    string IdempotencyKey,
    string RequestHash);

public sealed record RepairItemIntakeData(
    DeviceIntakeCommand Device,
    string ReportedIssue,
    string? HandoverCondition,
    string? Accessories,
    string? ItemNotes,
    ProtectedCredentialData? Credential);

public sealed record ProtectedCredentialData(
    string Status,
    string Ciphertext,
    string KeyVersion,
    bool Consent,
    DateTimeOffset ReceivedAt,
    DateTimeOffset ExpiresAt);

public sealed record StoredCredential(
    Guid RepairOrderId,
    Guid RepairItemId,
    string Status,
    string Ciphertext,
    string KeyVersion,
    DateTimeOffset? ExpiresAt,
    DateTimeOffset? DestroyedAt);

public sealed record DestroyedCredential(
    Guid RepairOrderId,
    Guid RepairItemId,
    DateTimeOffset DestroyedAt);

public interface IRepairOrderIntakeRepository
{
    Task<RepairIntakeResult> CreateAsync(
        Guid workspaceId,
        CreateRepairIntakeData data,
        CancellationToken cancellationToken = default);
}

public interface IRepairOrderCredentialRepository
{
    Task<StoredCredential?> FindCredentialAsync(
        Guid workspaceId,
        Guid orderId,
        Guid itemId,
        CancellationToken cancellationToken = default);

    Task RecordCredentialRevealAsync(
        Guid workspaceId,
        Guid orderId,
        Guid itemId,
        Guid actorId,
        CancellationToken cancellationToken = default);

    Task<DestroyedCredential?> DestroyCredentialAsync(
        Guid workspaceId,
        Guid orderId,
        Guid itemId,
        Guid actorId,
        CancellationToken cancellationToken = default);
}

public interface ICredentialProtector
{
    ProtectedCredential Protect(string value, DateTimeOffset receivedAt, TimeSpan lifetime);

    string Unprotect(string ciphertext, string keyVersion);
}

public sealed record ProtectedCredential(
    string Ciphertext,
    string KeyVersion,
    DateTimeOffset ReceivedAt,
    DateTimeOffset ExpiresAt);

public sealed class RepairIntakeConflictException : Exception
{
    public RepairIntakeConflictException(string code, string message, object? details = null)
        : base(message)
    {
        Code = code;
        Details = details;
    }

    public string Code { get; }

    public object? Details { get; }
}
