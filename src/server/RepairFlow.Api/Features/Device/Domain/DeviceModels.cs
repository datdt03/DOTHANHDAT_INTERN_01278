namespace RepairFlow.Api.Features.Device.Domain;

public sealed record Device(
    Guid Id,
    Guid WorkspaceId,
    Guid CustomerId,
    string DeviceType,
    string Brand,
    string Model,
    string? SerialNumber,
    string? DeviceIdentifier,
    string? Note,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public sealed record CreateDeviceData(
    Guid CustomerId,
    string DeviceType,
    string Brand,
    string Model,
    string? SerialNumber,
    string? DeviceIdentifier,
    string? Note,
    Guid CreatedBy);
