using RepairFlow.Api.Features.Device.Domain;
using DeviceEntity = RepairFlow.Api.Features.Device.Domain.Device;

namespace RepairFlow.Api.Features.Device.Application;

public interface IDeviceRepository
{
    Task<IReadOnlyList<DeviceEntity>> SearchAsync(
        Guid workspaceId,
        Guid? customerId,
        string? search,
        string? serialNumber,
        Guid? assignedStaffId,
        CancellationToken cancellationToken = default);

    Task<DeviceEntity?> FindAsync(
        Guid workspaceId,
        Guid deviceId,
        Guid? assignedStaffId,
        CancellationToken cancellationToken = default);

    Task<DeviceEntity> CreateAsync(
        Guid workspaceId,
        CreateDeviceData data,
        CancellationToken cancellationToken = default);
}

public sealed class DeviceConflictException : Exception
{
    public DeviceConflictException(string code, string message, object? details = null)
        : base(message)
    {
        Code = code;
        Details = details;
    }

    public string Code { get; }

    public object? Details { get; }
}

public sealed class DeviceNotFoundException : Exception
{
}
