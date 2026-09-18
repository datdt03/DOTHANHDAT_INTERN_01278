using RepairFlow.Api.Api.Responses;
using RepairFlow.Api.Features.Access.Application;
using RepairFlow.Api.Features.Access.Domain;
using RepairFlow.Api.Features.Device.Api;
using RepairFlow.Api.Features.Device.Domain;
using DeviceEntity = RepairFlow.Api.Features.Device.Domain.Device;

namespace RepairFlow.Api.Features.Device.Application;

public sealed class DeviceService
{
    private readonly IAccessContextAccessor _contextAccessor;
    private readonly IAccessAuthorizationPolicy _authorizationPolicy;
    private readonly IDeviceRepository _repository;

    public DeviceService(
        IAccessContextAccessor contextAccessor,
        IAccessAuthorizationPolicy authorizationPolicy,
        IDeviceRepository repository)
    {
        _contextAccessor = contextAccessor;
        _authorizationPolicy = authorizationPolicy;
        _repository = repository;
    }

    public async Task<IReadOnlyList<DeviceResponse>> SearchAsync(
        Guid? customerId,
        string? search,
        string? serialNumber,
        CancellationToken cancellationToken)
    {
        var context = RequireContext();
        EnsureListRead();
        var devices = await _repository.SearchAsync(
            context.Workspace.Id,
            customerId,
            NormalizeOptional(search),
            NormalizeOptional(serialNumber),
            TechnicianScope(context),
            cancellationToken);
        return devices.Select(ToResponse).ToArray();
    }

    public async Task<DeviceResponse> GetAsync(Guid deviceId, CancellationToken cancellationToken)
    {
        var context = RequireContext();
        var device = await _repository.FindAsync(
            context.Workspace.Id,
            deviceId,
            TechnicianScope(context),
            cancellationToken);
        return device is null ? throw NotFound() : ToResponse(device);
    }

    public async Task<DeviceResponse> CreateAsync(
        CreateDeviceRequest request,
        CancellationToken cancellationToken)
    {
        var context = RequireContext();
        EnsureAction(AccessAction.DeviceWrite, context.Workspace.Id);
        var errors = new Dictionary<string, string[]>();
        var deviceType = Required(request.DeviceType, "deviceType", 80, errors);
        var brand = Required(request.Brand, "brand", 120, errors);
        var model = Required(request.Model, "model", 160, errors);
        var serial = Optional(request.SerialNumber, "serialNumber", 160, errors);
        var identifier = Optional(request.DeviceIdentifier, "deviceIdentifier", 160, errors);
        var note = Optional(request.Note, "note", 4000, errors);
        if (string.IsNullOrWhiteSpace(serial) && string.IsNullOrWhiteSpace(identifier))
        {
            errors["serialNumber"] = ["Serial number or device identifier is required."];
        }

        ThrowValidation("Device request is invalid.", errors);
        try
        {
            return ToResponse(await _repository.CreateAsync(
                context.Workspace.Id,
                new CreateDeviceData(
                    request.CustomerId, deviceType!, brand!, model!, serial, identifier, note,
                    context.StaffProfile.Id),
                cancellationToken));
        }
        catch (DeviceConflictException exception)
        {
            throw new ApiException(StatusCodes.Status409Conflict, exception.Code, exception.Message, exception.Details);
        }
        catch (DeviceNotFoundException)
        {
            throw NotFound();
        }
    }

    private AccessContext RequireContext() => _contextAccessor.Current ??
        throw new ApiException(StatusCodes.Status401Unauthorized, "authentication_required", "Authentication is required.");

    private void EnsureListRead()
    {
        var context = RequireContext();
        if (context.ActiveRole == AccessRole.Technician)
        {
            return;
        }

        EnsureAction(AccessAction.DeviceRead, context.Workspace.Id);
    }

    private void EnsureAction(AccessAction action, Guid workspaceId)
    {
        var decision = _authorizationPolicy.Evaluate(new AccessAuthorizationRequest(
            RequireContext(), action, workspaceId));
        if (decision.IsAllowed)
        {
            return;
        }

        throw new ApiException(
            decision.HideResource ? StatusCodes.Status404NotFound : StatusCodes.Status403Forbidden,
            decision.HideResource ? "not_found" : "forbidden",
            decision.HideResource ? "The requested resource was not found." : "You do not have permission to perform this action.");
    }

    private static DeviceResponse ToResponse(DeviceEntity device) => new(
        device.Id, device.CustomerId, device.DeviceType, device.Brand, device.Model,
        device.SerialNumber, device.DeviceIdentifier, device.Note, device.CreatedAt, device.UpdatedAt);

    private static string? NormalizeOptional(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static string? Required(string? value, string field, int maxLength, Dictionary<string, string[]> errors)
    {
        var normalized = NormalizeOptional(value);
        if (normalized is null)
        {
            errors[field] = ["The field is required."];
        }
        else if (normalized.Length > maxLength)
        {
            errors[field] = [$"The field must be {maxLength} characters or fewer."];
        }

        return normalized;
    }

    private static string? Optional(string? value, string field, int maxLength, Dictionary<string, string[]> errors)
    {
        var normalized = NormalizeOptional(value);
        if (normalized is not null && normalized.Length > maxLength)
        {
            errors[field] = [$"The field must be {maxLength} characters or fewer."];
        }

        return normalized;
    }

    private static void ThrowValidation(string message, Dictionary<string, string[]> errors)
    {
        if (errors.Count > 0)
        {
            throw new ApiValidationException(message, errors);
        }
    }

    private static ApiException NotFound() =>
        new(StatusCodes.Status404NotFound, "not_found", "The requested resource was not found.");

    private static Guid? TechnicianScope(AccessContext context) =>
        context.ActiveRole == AccessRole.Technician ? context.StaffProfile.Id : null;
}
