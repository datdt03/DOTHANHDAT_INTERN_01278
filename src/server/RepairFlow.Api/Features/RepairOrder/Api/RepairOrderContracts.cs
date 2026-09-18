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
    IReadOnlyList<OpenOrderResponse>? OpenOrderWarnings = null);
