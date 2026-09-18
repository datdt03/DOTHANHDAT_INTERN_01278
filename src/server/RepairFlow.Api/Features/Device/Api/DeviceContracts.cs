namespace RepairFlow.Api.Features.Device.Api;

public sealed record CreateDeviceRequest(
    Guid CustomerId,
    string DeviceType,
    string Brand,
    string Model,
    string? SerialNumber = null,
    string? DeviceIdentifier = null,
    string? Note = null);

public sealed record DeviceResponse(
    Guid Id,
    Guid CustomerId,
    string DeviceType,
    string Brand,
    string Model,
    string? SerialNumber,
    string? DeviceIdentifier,
    string? Note,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);
