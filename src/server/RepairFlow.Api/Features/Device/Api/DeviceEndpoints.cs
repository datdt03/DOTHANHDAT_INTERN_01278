using RepairFlow.Api.Api.Middleware;
using RepairFlow.Api.Api.Responses;
using RepairFlow.Api.Features.Access.Application;
using RepairFlow.Api.Features.Device.Application;

namespace RepairFlow.Api.Features.Device.Api;

public static class DeviceEndpoints
{
    public static IEndpointRouteBuilder MapDeviceEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/api/customers/{customerId:guid}/devices", SearchCustomerAsync)
            .WithName("SearchCustomerDevices")
            .Produces<ApiResponse<IReadOnlyList<DeviceResponse>>>()
            .RequireAuthorization(AccessPolicies.Authenticated)
            .WithOpenApi();
        endpoints.MapGet("/api/devices", SearchAsync)
            .WithName("SearchDevices")
            .Produces<ApiResponse<IReadOnlyList<DeviceResponse>>>()
            .RequireAuthorization(AccessPolicies.Authenticated)
            .WithOpenApi();
        endpoints.MapGet("/api/devices/{deviceId:guid}", GetAsync)
            .WithName("GetDevice")
            .Produces<ApiResponse<DeviceResponse>>()
            .RequireAuthorization(AccessPolicies.Authenticated)
            .WithOpenApi();
        endpoints.MapPost("/api/devices", CreateAsync)
            .WithName("CreateDevice")
            .Produces<ApiResponse<DeviceResponse>>(StatusCodes.Status201Created)
            .RequireAuthorization(AccessPolicies.Authenticated)
            .WithOpenApi();
        return endpoints;
    }

    private static async Task<IResult> SearchCustomerAsync(
        Guid customerId,
        HttpContext httpContext,
        DeviceService service,
        CancellationToken cancellationToken) =>
        Results.Ok(ApiResponse<IReadOnlyList<DeviceResponse>>.Create(
            await service.SearchAsync(
                customerId,
                httpContext.Request.Query["query"].FirstOrDefault() ?? httpContext.Request.Query["search"],
                httpContext.Request.Query["serialNumber"],
                cancellationToken),
            RequestIdMiddleware.GetRequestId(httpContext)));

    private static async Task<IResult> SearchAsync(
        HttpContext httpContext,
        DeviceService service,
        CancellationToken cancellationToken)
    {
        var customerId = ParseOptionalGuid(httpContext.Request.Query["customerId"], "customerId");
        return Results.Ok(ApiResponse<IReadOnlyList<DeviceResponse>>.Create(
            await service.SearchAsync(
                customerId,
                httpContext.Request.Query["query"].FirstOrDefault() ?? httpContext.Request.Query["search"],
                httpContext.Request.Query["serialNumber"],
                cancellationToken),
            RequestIdMiddleware.GetRequestId(httpContext)));
    }

    private static async Task<IResult> GetAsync(
        Guid deviceId,
        HttpContext httpContext,
        DeviceService service,
        CancellationToken cancellationToken) =>
        Results.Ok(ApiResponse<DeviceResponse>.Create(
            await service.GetAsync(deviceId, cancellationToken),
            RequestIdMiddleware.GetRequestId(httpContext)));

    private static async Task<IResult> CreateAsync(
        HttpContext httpContext,
        CreateDeviceRequest request,
        DeviceService service,
        CancellationToken cancellationToken)
    {
        var data = await service.CreateAsync(request, cancellationToken);
        return Results.Created(
            $"/api/devices/{data.Id}",
            ApiResponse<DeviceResponse>.Create(data, RequestIdMiddleware.GetRequestId(httpContext)));
    }

    private static Guid? ParseOptionalGuid(string? raw, string field)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            return null;
        }

        if (Guid.TryParse(raw, out var value))
        {
            return value;
        }

        throw new ApiValidationException(
            "The query string is invalid.",
            new Dictionary<string, string[]> { [field] = ["A valid UUID is required."] });
    }
}
