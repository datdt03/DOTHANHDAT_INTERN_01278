using RepairFlow.Api.Api.Middleware;
using RepairFlow.Api.Api.Responses;

namespace RepairFlow.Api.Features.Health;

public static class HealthEndpoints
{
    public static IEndpointRouteBuilder MapHealthEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/health", (HttpContext context) =>
            Results.Ok(ApiResponse<HealthPayload>.Create(
                new HealthPayload("ok", "repairflow-api", "v1"),
                RequestIdMiddleware.GetRequestId(context))))
            .WithName("GetHealth")
            .Produces<ApiResponse<HealthPayload>>(StatusCodes.Status200OK)
            .WithOpenApi();

        return endpoints;
    }
}

public sealed record HealthPayload(string Status, string Service, string ApiVersion);
