using RepairFlow.Api.Api.Middleware;
using RepairFlow.Api.Api.Responses;
using RepairFlow.Api.Features.Access.Application;
using RepairFlow.Api.Features.RepairOrder.Application;
using Microsoft.OpenApi.Models;

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
        endpoints.MapPost("/api/repair-orders/intake", CreateIntakeAsync)
            .WithName("CreateRepairIntake")
            .Produces<ApiResponse<RepairIntakeResponse>>(StatusCodes.Status201Created)
            .RequireAuthorization(AccessPolicies.Authenticated)
            .WithOpenApi(operation =>
            {
                operation.Parameters.Add(new OpenApiParameter
                {
                    Name = "Idempotency-Key",
                    In = ParameterLocation.Header,
                    Required = true,
                    Description = "A client-generated key that makes a retry return the original intake result."
                });
                return operation;
            });
        endpoints.MapPost(
                "/api/repair-orders/{orderId:guid}/items/{itemId:guid}/credential/reveal",
                RevealCredentialAsync)
            .WithName("RevealRepairItemCredential")
            .Produces<ApiResponse<CredentialRevealResponse>>()
            .RequireAuthorization(AccessPolicies.Authenticated)
            .WithOpenApi();
        endpoints.MapPost(
                "/api/repair-orders/{orderId:guid}/items/{itemId:guid}/credential/destroy",
                DestroyCredentialAsync)
            .WithName("DestroyRepairItemCredential")
            .Produces<ApiResponse<CredentialDestroyResponse>>()
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

    private static async Task<IResult> CreateIntakeAsync(
        HttpContext httpContext,
        CreateRepairIntakeRequest request,
        RepairOrderService service,
        CancellationToken cancellationToken)
    {
        var idempotencyKey = httpContext.Request.Headers["Idempotency-Key"].FirstOrDefault();
        if (string.IsNullOrWhiteSpace(idempotencyKey))
        {
            throw new ApiValidationException(
                "Repair-intake request is invalid.",
                new Dictionary<string, string[]> { ["Idempotency-Key"] = ["The header is required."] });
        }

        if (request.Customer is null || request.RepairOrder is null || request.RepairItems is null)
        {
            throw new ApiValidationException(
                "Repair-intake request is invalid.",
                new Dictionary<string, string[]> { ["request"] = ["Customer, repair order and repair items are required."] });
        }

        var command = new CreateRepairIntakeCommand(
            new CustomerIntakeCommand(
                request.Customer.Mode,
                request.Customer.Id,
                request.Customer.Name,
                request.Customer.Phone,
                request.Customer.Email,
                request.Customer.Note),
            request.RepairItems.Select(item => new RepairItemIntakeCommand(
                new DeviceIntakeCommand(
                    item.Device.Type,
                    item.Device.Brand,
                    item.Device.Model,
                    item.Device.SerialNumber,
                    item.Device.Identifier),
                item.ReportedIssue,
                item.HandoverCondition,
                item.Accessories,
                item.ItemNotes,
                item.Credential is null
                    ? null
                    : new CredentialIntakeCommand(
                        item.Credential.Status,
                        item.Credential.Value,
                        item.Credential.Consent))).ToArray(),
            request.RepairOrder.IntakeNotes,
            request.ExpectedCompletedAt,
            request.IntakeStaffId,
            Guid.Empty,
            idempotencyKey);

        var data = await service.CreateIntakeAsync(command, cancellationToken);
        return Results.Created(
            $"/api/repair-orders/{data.RepairOrder.Id}",
            ApiResponse<RepairIntakeResponse>.Create(data, RequestIdMiddleware.GetRequestId(httpContext)));
    }

    private static async Task<IResult> RevealCredentialAsync(
        Guid orderId,
        Guid itemId,
        HttpContext httpContext,
        RepairOrderService service,
        CancellationToken cancellationToken) =>
        Results.Ok(ApiResponse<CredentialRevealResponse>.Create(
            await service.RevealCredentialAsync(orderId, itemId, cancellationToken),
            RequestIdMiddleware.GetRequestId(httpContext)));

    private static async Task<IResult> DestroyCredentialAsync(
        Guid orderId,
        Guid itemId,
        HttpContext httpContext,
        RepairOrderService service,
        CancellationToken cancellationToken) =>
        Results.Ok(ApiResponse<CredentialDestroyResponse>.Create(
            await service.DestroyCredentialAsync(orderId, itemId, cancellationToken),
            RequestIdMiddleware.GetRequestId(httpContext)));

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
