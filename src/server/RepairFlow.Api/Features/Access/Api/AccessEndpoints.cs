using RepairFlow.Api.Api.Middleware;
using RepairFlow.Api.Api.Responses;
using RepairFlow.Api.Features.Access.Application;

namespace RepairFlow.Api.Features.Access.Api;

public static class AccessEndpoints
{
    public static IEndpointRouteBuilder MapAccessEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/api/access/context", GetCurrentContext)
            .WithName("GetAccessContext")
            .Produces<ApiResponse<AccessContextResponse>>(StatusCodes.Status200OK)
            .Produces<ApiErrorResponse>(StatusCodes.Status401Unauthorized)
            .WithOpenApi();

        return endpoints;
    }

    private static IResult GetCurrentContext(
        HttpContext httpContext,
        IAccessContextAccessor contextAccessor,
        AccessService accessService)
    {
        var accessContext = contextAccessor.Current;
        if (accessContext is null)
        {
            throw new ApiException(
                StatusCodes.Status401Unauthorized,
                "authentication_required",
                "Authentication is required.");
        }

        return Results.Ok(ApiResponse<AccessContextResponse>.Create(
            accessService.ToSafeResponse(accessContext),
            RequestIdMiddleware.GetRequestId(httpContext)));
    }
}
