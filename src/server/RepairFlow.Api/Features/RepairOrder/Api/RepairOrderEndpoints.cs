using RepairFlow.Api.Api.Middleware;
using RepairFlow.Api.Api.Responses;
using RepairFlow.Api.Features.Access.Application;
using RepairFlow.Api.Features.RepairOrder.Application;

namespace RepairFlow.Api.Features.RepairOrder.Api;

public static class RepairOrderEndpoints
{
    public static IEndpointRouteBuilder MapRepairOrderEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/api/repair-orders", SearchAsync)
            .WithName("SearchRepairOrders")
            .Produces<ApiResponse<IReadOnlyList<RepairOrderResponse>>>()
            .RequireAuthorization(AccessPolicies.Authenticated)
            .WithOpenApi();
        endpoints.MapGet("/api/repair-orders/{orderId:guid}", GetAsync)
            .WithName("GetRepairOrder")
            .Produces<ApiResponse<RepairOrderResponse>>()
            .RequireAuthorization(AccessPolicies.Authenticated)
            .WithOpenApi();
        endpoints.MapPost("/api/repair-orders", CreateAsync)
            .WithName("CreateRepairOrder")
            .Produces<ApiResponse<RepairOrderResponse>>(StatusCodes.Status201Created)
            .RequireAuthorization(AccessPolicies.Authenticated)
            .WithOpenApi();
        return endpoints;
    }

    private static async Task<IResult> SearchAsync(
        HttpContext httpContext,
        RepairOrderService service,
        CancellationToken cancellationToken)
    {
        var customerId = ParseOptionalGuid(httpContext.Request.Query["customerId"], "customerId");
        var deviceId = ParseOptionalGuid(httpContext.Request.Query["deviceId"], "deviceId");
        return Results.Ok(ApiResponse<IReadOnlyList<RepairOrderResponse>>.Create(
            await service.SearchAsync(
                httpContext.Request.Query["status"],
                customerId,
                deviceId,
                httpContext.Request.Query["query"].FirstOrDefault() ?? httpContext.Request.Query["search"],
                cancellationToken),
            RequestIdMiddleware.GetRequestId(httpContext)));
    }

    private static async Task<IResult> GetAsync(
        Guid orderId,
        HttpContext httpContext,
        RepairOrderService service,
        CancellationToken cancellationToken) =>
        Results.Ok(ApiResponse<RepairOrderResponse>.Create(
            await service.GetAsync(orderId, cancellationToken),
            RequestIdMiddleware.GetRequestId(httpContext)));

    private static async Task<IResult> CreateAsync(
        HttpContext httpContext,
        CreateRepairOrderRequest request,
        RepairOrderService service,
        CancellationToken cancellationToken)
    {
        var data = await service.CreateAsync(request, cancellationToken);
        return Results.Created(
            $"/api/repair-orders/{data.Id}",
            ApiResponse<RepairOrderResponse>.Create(data, RequestIdMiddleware.GetRequestId(httpContext)));
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
