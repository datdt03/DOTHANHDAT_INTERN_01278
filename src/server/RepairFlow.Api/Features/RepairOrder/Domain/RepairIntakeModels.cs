using RepairFlow.Api.Features.Customer.Domain;
using CustomerEntity = RepairFlow.Api.Features.Customer.Domain.Customer;
using RepairTagEntity = RepairFlow.Api.Features.RepairTag.Domain.RepairTag;

namespace RepairFlow.Api.Features.RepairOrder.Domain;

public sealed record RepairOrderItem(
    Guid Id,
    Guid RepairOrderId,
    int ItemIndex,
    Guid DeviceId,
    RepairOrderStatus Status,
    string DeviceType,
    string Brand,
    string Model,
    string? SerialNumber,
    string? DeviceIdentifier,
    string ReportedIssue,
    string? HandoverCondition,
    string? Accessories,
    string? ItemNotes,
    string CredentialStatus,
    bool CredentialConsent,
    DateTimeOffset? CredentialReceivedAt,
    DateTimeOffset? CredentialExpiresAt,
    DateTimeOffset? CredentialDestroyedAt,
    DateTimeOffset CreatedAt,
    IReadOnlyList<RepairTagEntity>? Tags = null);

public sealed record RepairIntakeResult(
    CustomerEntity Customer,
    RepairOrder Order,
    IReadOnlyList<RepairOrderItem> RepairItems);
