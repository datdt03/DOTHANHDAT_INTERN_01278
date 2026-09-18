using RepairFlow.Api.Features.Customer.Api;

namespace RepairFlow.Api.Features.RepairOrder.Api;

public sealed record CreateRepairOrderRequest(
    Guid CustomerId,
    Guid DeviceId,
    string CustomerDescription,
    string? InternalNote = null,
    DateTimeOffset? ExpectedCompletedAt = null,
    Guid? IntakeStaffId = null,
    bool ConfirmOpenOrder = false,
    string? OpenOrderReason = null);

public sealed record CreateRepairIntakeRequest(
    CustomerIntakeRequest Customer,
    IReadOnlyList<RepairItemIntakeRequest> RepairItems,
    RepairOrderIntakeRequest RepairOrder,
    Guid? IntakeStaffId = null,
    DateTimeOffset? ExpectedCompletedAt = null);

public sealed record CustomerIntakeRequest(
    string Mode,
    Guid? Id = null,
    string? Name = null,
    string? Phone = null,
    string? Email = null,
    string? Note = null);

public sealed record RepairItemIntakeRequest(
    DeviceIntakeRequest Device,
    string ReportedIssue,
    string? HandoverCondition = null,
    string? Accessories = null,
    string? ItemNotes = null,
    CredentialIntakeRequest? Credential = null);

public sealed record DeviceIntakeRequest(
    string Type,
    string Brand,
    string Model,
    string? SerialNumber = null,
    string? Identifier = null);

public sealed record CredentialIntakeRequest(
    string Status,
    string? Value = null,
    bool Consent = false);

public sealed record RepairOrderIntakeRequest(string? IntakeNotes = null);

public sealed record AssignmentResponse(
    Guid Id,
    Guid StaffProfileId,
    string StaffProfileName,
    string Responsibility,
    bool IsPrimary,
    DateTimeOffset AssignedAt,
    DateTimeOffset? CompletedAt,
    string? Note);

public sealed record StatusHistoryResponse(
    Guid Id,
    string? FromStatus,
    string ToStatus,
    Guid? ChangedBy,
    string? Reason,
    DateTimeOffset CreatedAt);

public sealed record OpenOrderResponse(Guid Id, string OrderCode, string Status);

public sealed record RepairOrderResponse(
    Guid Id,
    string OrderCode,
    Guid CustomerId,
    Guid DeviceId,
    string Status,
    string CustomerDescription,
    DateTimeOffset ReceivedAt,
    DateTimeOffset? ExpectedCompletedAt,
    DateTimeOffset? CompletedAt,
    DateTimeOffset? CancelledAt,
    Guid CreatedBy,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    IReadOnlyList<AssignmentResponse> Assignments,
    IReadOnlyList<StatusHistoryResponse> StatusHistory,
    IReadOnlyList<OpenOrderResponse>? OpenOrderWarnings = null,
    IReadOnlyList<RepairItemResponse>? RepairItems = null);

public sealed record RepairIntakeResponse(
    CustomerResponse Customer,
    RepairOrderResponse RepairOrder,
    IReadOnlyList<RepairItemResponse> RepairItems);

public sealed record RepairItemResponse(
    Guid Id,
    int ItemIndex,
    Guid DeviceId,
    string Status,
    string DeviceType,
    string Brand,
    string Model,
    string? SerialNumber,
    string? Identifier,
    string ReportedIssue,
    string? HandoverCondition,
    string? Accessories,
    string? ItemNotes,
    string CredentialStatus,
    bool CredentialConsent,
    DateTimeOffset? CredentialReceivedAt,
    DateTimeOffset? CredentialExpiresAt,
    DateTimeOffset? CredentialDestroyedAt);

public sealed record CredentialRevealResponse(
    Guid RepairOrderId,
    Guid RepairItemId,
    string Value,
    DateTimeOffset ExpiresAt);

public sealed record CredentialDestroyResponse(
    Guid RepairOrderId,
    Guid RepairItemId,
    DateTimeOffset DestroyedAt);
