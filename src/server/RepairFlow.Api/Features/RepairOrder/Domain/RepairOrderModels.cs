namespace RepairFlow.Api.Features.RepairOrder.Domain;

public enum RepairOrderStatus
{
    Received,
    Diagnosing,
    WaitingForApproval,
    Approved,
    Repairing,
    CancellationRequested,
    QualityCheck,
    ReadyForPickup,
    HandedOver,
    Rejected,
    ReadyForReturn,
    Returned,
    Cancelled
}

public static class RepairOrderStatusCodec
{
    public static string ToWireValue(RepairOrderStatus status) => status switch
    {
        RepairOrderStatus.Received => "received",
        RepairOrderStatus.Diagnosing => "diagnosing",
        RepairOrderStatus.WaitingForApproval => "waiting_for_approval",
        RepairOrderStatus.Approved => "approved",
        RepairOrderStatus.Repairing => "repairing",
        RepairOrderStatus.CancellationRequested => "cancellation_requested",
        RepairOrderStatus.QualityCheck => "quality_check",
        RepairOrderStatus.ReadyForPickup => "ready_for_pickup",
        RepairOrderStatus.HandedOver => "handed_over",
        RepairOrderStatus.Rejected => "rejected",
        RepairOrderStatus.ReadyForReturn => "ready_for_return",
        RepairOrderStatus.Returned => "returned",
        RepairOrderStatus.Cancelled => "cancelled",
        _ => throw new ArgumentOutOfRangeException(nameof(status), status, "Unknown repair-order status.")
    };

    public static bool TryParse(string? value, out RepairOrderStatus status)
    {
        status = value?.Trim().ToLowerInvariant() switch
        {
            "received" => RepairOrderStatus.Received,
            "diagnosing" => RepairOrderStatus.Diagnosing,
            "waiting_for_approval" => RepairOrderStatus.WaitingForApproval,
            "approved" => RepairOrderStatus.Approved,
            "repairing" => RepairOrderStatus.Repairing,
            "cancellation_requested" => RepairOrderStatus.CancellationRequested,
            "quality_check" => RepairOrderStatus.QualityCheck,
            "ready_for_pickup" => RepairOrderStatus.ReadyForPickup,
            "handed_over" => RepairOrderStatus.HandedOver,
            "rejected" => RepairOrderStatus.Rejected,
            "ready_for_return" => RepairOrderStatus.ReadyForReturn,
            "returned" => RepairOrderStatus.Returned,
            "cancelled" => RepairOrderStatus.Cancelled,
            _ => default
        };

        return value?.Trim().ToLowerInvariant() is
            "received" or "diagnosing" or "waiting_for_approval" or "approved" or
            "repairing" or "cancellation_requested" or "quality_check" or
            "ready_for_pickup" or "handed_over" or "rejected" or
            "ready_for_return" or "returned" or "cancelled";
    }
}

public enum StaffResponsibility
{
    Intake,
    Diagnosis,
    PrimaryTechnician,
    Repairer,
    QualityChecker,
    Handover
}

public static class StaffResponsibilityCodec
{
    public static string ToWireValue(StaffResponsibility responsibility) => responsibility switch
    {
        StaffResponsibility.Intake => "intake",
        StaffResponsibility.Diagnosis => "diagnosis",
        StaffResponsibility.PrimaryTechnician => "primary_technician",
        StaffResponsibility.Repairer => "repairer",
        StaffResponsibility.QualityChecker => "quality_checker",
        StaffResponsibility.Handover => "handover",
        _ => throw new ArgumentOutOfRangeException(nameof(responsibility), responsibility, "Unknown staff responsibility.")
    };

    public static bool TryParse(string? value, out StaffResponsibility responsibility)
    {
        responsibility = value?.Trim().ToLowerInvariant() switch
        {
            "intake" => StaffResponsibility.Intake,
            "diagnosis" => StaffResponsibility.Diagnosis,
            "primary_technician" => StaffResponsibility.PrimaryTechnician,
            "repairer" => StaffResponsibility.Repairer,
            "quality_checker" => StaffResponsibility.QualityChecker,
            "handover" => StaffResponsibility.Handover,
            _ => default
        };

        return value?.Trim().ToLowerInvariant() is
            "intake" or "diagnosis" or "primary_technician" or "repairer" or
            "quality_checker" or "handover";
    }
}

public sealed record Assignment(
    Guid Id,
    Guid StaffProfileId,
    string StaffProfileName,
    StaffResponsibility Responsibility,
    bool IsPrimary,
    DateTimeOffset AssignedAt,
    DateTimeOffset? CompletedAt,
    string? Note);

public sealed record StatusHistory(
    Guid Id,
    RepairOrderStatus? FromStatus,
    RepairOrderStatus ToStatus,
    Guid? ChangedBy,
    string? Reason,
    DateTimeOffset CreatedAt);

public sealed record RepairOrder(
    Guid Id,
    Guid WorkspaceId,
    string OrderCode,
    Guid CustomerId,
    Guid DeviceId,
    RepairOrderStatus Status,
    string CustomerDescription,
    string? InternalNote,
    DateTimeOffset ReceivedAt,
    DateTimeOffset? ExpectedCompletedAt,
    DateTimeOffset? CompletedAt,
    DateTimeOffset? CancelledAt,
    string? CancellationReason,
    Guid CreatedBy,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    IReadOnlyList<Assignment> Assignments,
    IReadOnlyList<StatusHistory> StatusHistory);

public sealed record CreateRepairOrderData(
    Guid CustomerId,
    Guid DeviceId,
    string CustomerDescription,
    string? InternalNote,
    DateTimeOffset? ExpectedCompletedAt,
    Guid? IntakeStaffId,
    bool ConfirmOpenOrder,
    string? OpenOrderReason,
    Guid CreatedBy,
    Guid? AutomaticIntakeStaffId);

public sealed record OpenOrderSummary(Guid Id, string OrderCode, RepairOrderStatus Status);
