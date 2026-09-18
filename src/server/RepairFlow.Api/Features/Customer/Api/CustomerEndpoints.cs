using RepairFlow.Api.Api.Middleware;
using RepairFlow.Api.Api.Responses;
using RepairFlow.Api.Features.Access.Application;
using RepairFlow.Api.Features.Customer.Application;

namespace RepairFlow.Api.Features.Customer.Api;

public static class CustomerEndpoints
{
    public static IEndpointRouteBuilder MapCustomerEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/api/customers", SearchAsync)
            .WithName("SearchCustomers")
            .Produces<ApiResponse<IReadOnlyList<CustomerResponse>>>()
            .RequireAuthorization(AccessPolicies.Authenticated)
            .WithOpenApi();
        endpoints.MapGet("/api/customers/{customerId:guid}", GetAsync)
            .WithName("GetCustomer")
            .Produces<ApiResponse<CustomerResponse>>()
            .RequireAuthorization(AccessPolicies.Authenticated)
            .WithOpenApi();
        endpoints.MapPost("/api/customers", CreateAsync)
            .WithName("CreateCustomer")
            .Produces<ApiResponse<CustomerResponse>>(StatusCodes.Status201Created)
            .RequireAuthorization(AccessPolicies.Authenticated)
            .WithOpenApi();
        return endpoints;
    }

    private static async Task<IResult> SearchAsync(
        HttpContext httpContext,
        CustomerService service,
        CancellationToken cancellationToken) =>
        Results.Ok(ApiResponse<IReadOnlyList<CustomerResponse>>.Create(
            await service.SearchAsync(
                httpContext.Request.Query["query"].FirstOrDefault() ?? httpContext.Request.Query["search"],
                httpContext.Request.Query["phone"],
                httpContext.Request.Query["email"],
                cancellationToken),
            RequestIdMiddleware.GetRequestId(httpContext)));

    private static async Task<IResult> GetAsync(
        Guid customerId,
        HttpContext httpContext,
        CustomerService service,
        CancellationToken cancellationToken) =>
        Results.Ok(ApiResponse<CustomerResponse>.Create(
            await service.GetAsync(customerId, cancellationToken),
            RequestIdMiddleware.GetRequestId(httpContext)));

    private static async Task<IResult> CreateAsync(
        HttpContext httpContext,
        CreateCustomerRequest request,
        CustomerService service,
        CancellationToken cancellationToken)
    {
        var data = await service.CreateAsync(request, cancellationToken);
        return Results.Created(
            $"/api/customers/{data.Id}",
            ApiResponse<CustomerResponse>.Create(data, RequestIdMiddleware.GetRequestId(httpContext)));
    }
}
