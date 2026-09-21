using RepairFlow.Api.Api.Middleware;
using RepairFlow.Api.Api.Responses;
using RepairFlow.Api.Features.Access.Application;
using RepairFlow.Api.Features.RepairTag.Application;

namespace RepairFlow.Api.Features.RepairTag.Api;

public static class RepairTagEndpoints
{
    public static IEndpointRouteBuilder MapRepairTagEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/api/tags", SearchAsync)
            .WithName("SearchRepairTags")
            .Produces<ApiResponse<IReadOnlyList<RepairTagResponse>>>()
            .RequireAuthorization(AccessPolicies.WorkspaceTagRead)
            .WithOpenApi();
        endpoints.MapPost("/api/tags", CreateAsync)
            .WithName("CreateRepairTag")
            .Produces<ApiResponse<RepairTagResponse>>(StatusCodes.Status201Created)
            .RequireAuthorization(AccessPolicies.WorkspaceTagCreate)
            .WithOpenApi();
        endpoints.MapPatch("/api/tags/{tagId:guid}", RenameAsync)
            .WithName("RenameRepairTag")
            .Produces<ApiResponse<RepairTagResponse>>()
            .RequireAuthorization(AccessPolicies.WorkspaceTagManage)
            .WithOpenApi();
        endpoints.MapDelete("/api/tags/{tagId:guid}", DeleteAsync)
            .WithName("DeleteRepairTag")
            .Produces(StatusCodes.Status204NoContent)
            .RequireAuthorization(AccessPolicies.WorkspaceTagManage)
            .WithOpenApi();
        endpoints.MapPut(
                "/api/repair-orders/{orderId:guid}/items/{itemId:guid}/tags",
                ReplaceItemAssignmentsAsync)
            .WithName("ReplaceRepairItemTags")
            .Produces<ApiResponse<RepairItemTagsResponse>>()
            // The order assignment scope is resolved in RepairTagService after
            // loading the order assignments; the route policy only authenticates.
            .RequireAuthorization(AccessPolicies.Authenticated)
            .WithOpenApi();
        return endpoints;
    }

    private static async Task<IResult> SearchAsync(
        HttpContext httpContext,
        RepairTagService service,
        CancellationToken cancellationToken)
    {
        var includeUnused = ParseIncludeUnused(httpContext.Request.Query["includeUnused"]);
        var tags = await service.SearchAsync(
            httpContext.Request.Query["query"].FirstOrDefault(),
            includeUnused,
            cancellationToken);
        return Results.Ok(ApiResponse<IReadOnlyList<RepairTagResponse>>.Create(
            tags,
            RequestIdMiddleware.GetRequestId(httpContext)));
    }

    private static async Task<IResult> CreateAsync(
        HttpContext httpContext,
        CreateRepairTagRequest request,
        RepairTagService service,
        CancellationToken cancellationToken)
    {
        var tag = await service.CreateAsync(request, cancellationToken);
        return Results.Created(
            $"/api/tags/{tag.Id}",
            ApiResponse<RepairTagResponse>.Create(
                tag,
                RequestIdMiddleware.GetRequestId(httpContext)));
    }

    private static async Task<IResult> RenameAsync(
        Guid tagId,
        HttpContext httpContext,
        RenameRepairTagRequest request,
        RepairTagService service,
        CancellationToken cancellationToken)
    {
        var tag = await service.RenameAsync(tagId, request, cancellationToken);
        return Results.Ok(ApiResponse<RepairTagResponse>.Create(
            tag,
            RequestIdMiddleware.GetRequestId(httpContext)));
    }

    private static async Task<IResult> DeleteAsync(
        Guid tagId,
        RepairTagService service,
        CancellationToken cancellationToken)
    {
        await service.DeleteAsync(tagId, cancellationToken);
        return Results.NoContent();
    }

    private static async Task<IResult> ReplaceItemAssignmentsAsync(
        Guid orderId,
        Guid itemId,
        HttpContext httpContext,
        ReplaceRepairItemTagsRequest request,
        RepairTagService service,
        CancellationToken cancellationToken)
    {
        var result = await service.ReplaceItemAssignmentsAsync(
            orderId,
            itemId,
            request,
            cancellationToken);
        return Results.Ok(ApiResponse<RepairItemTagsResponse>.Create(
            result,
            RequestIdMiddleware.GetRequestId(httpContext)));
    }

    private static bool ParseIncludeUnused(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            return true;
        }

        if (bool.TryParse(raw, out var value))
        {
            return value;
        }

        throw new ApiValidationException(
            "The tag query is invalid.",
            new Dictionary<string, string[]> { ["includeUnused"] = ["A boolean value is required."] });
    }
}
