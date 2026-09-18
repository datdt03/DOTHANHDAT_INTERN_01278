using RepairFlow.Api.Features.RepairOrder.Domain;
using RepairOrderEntity = RepairFlow.Api.Features.RepairOrder.Domain.RepairOrder;

namespace RepairFlow.Api.Features.RepairOrder.Application;

public interface IRepairOrderRepository
{
    Task<IReadOnlyList<RepairOrderEntity>> SearchAsync(
        Guid workspaceId,
        string? status,
        Guid? customerId,
        Guid? deviceId,
        string? search,
        Guid? assignedStaffId,
        CancellationToken cancellationToken = default);

    Task<RepairOrderEntity?> FindAsync(
        Guid workspaceId,
        Guid orderId,
        Guid? assignedStaffId,
        CancellationToken cancellationToken = default);

    Task<RepairOrderEntity> CreateAsync(
        Guid workspaceId,
        CreateRepairOrderData data,
        CancellationToken cancellationToken = default);
}

public sealed class RepairOrderConflictException : Exception
{
    public RepairOrderConflictException(string code, string message, object? details = null)
        : base(message)
    {
        Code = code;
        Details = details;
    }

    public string Code { get; }

    public object? Details { get; }
}

public sealed class RepairOrderNotFoundException : Exception
{
}
