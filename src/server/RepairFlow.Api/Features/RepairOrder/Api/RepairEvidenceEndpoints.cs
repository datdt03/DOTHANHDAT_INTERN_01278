using Microsoft.OpenApi.Models;
using RepairFlow.Api.Api.Middleware;
using RepairFlow.Api.Api.Responses;
using RepairFlow.Api.Features.Access.Application;
using RepairFlow.Api.Features.RepairOrder.Application;

namespace RepairFlow.Api.Features.RepairOrder.Api;

public static class RepairEvidenceEndpoints
{
    public static IEndpointRouteBuilder MapRepairEvidenceEndpoints(
        this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet(
                "/api/repair-order-items/{itemId:guid}/evidence",
                ListAsync)
            .WithName("ListRepairItemEvidence")
            .Produces<ApiResponse<IReadOnlyList<RepairEvidenceResponse>>>()
            .RequireAuthorization(AccessPolicies.Authenticated)
            .WithOpenApi();

        endpoints.MapPost(
                "/api/repair-order-items/{itemId:guid}/evidence",
                UploadAsync)
            .WithName("UploadRepairItemEvidence")
            .Accepts<IFormFile>("multipart/form-data")
            .Produces<ApiResponse<RepairEvidenceResponse>>(StatusCodes.Status201Created)
            .RequireAuthorization(AccessPolicies.Authenticated)
            .WithOpenApi(operation =>
            {
                operation.Parameters.Add(new OpenApiParameter
                {
                    Name = "Idempotency-Key",
                    In = ParameterLocation.Header,
                    Required = true,
                    Description = "A client-generated key that makes a retry return the original evidence result."
                });
                operation.Parameters.Add(new OpenApiParameter
                {
                    Name = "X-Content-SHA256",
                    In = ParameterLocation.Header,
                    Required = false,
                    Description = "Optional client checksum hint. The server always calculates and verifies its own checksum."
                });
                operation.RequestBody = new OpenApiRequestBody
                {
                    Required = true,
                    Content = new Dictionary<string, OpenApiMediaType>
                    {
                        ["multipart/form-data"] = new()
                        {
                            Schema = new OpenApiSchema
                            {
                                Type = "object",
                                Required = new HashSet<string>(StringComparer.Ordinal) { "file" },
                                Properties = new Dictionary<string, OpenApiSchema>
                                {
                                    ["file"] = new()
                                    {
                                        Type = "string",
                                        Format = "binary",
                                        Description = "JPG/JPEG/PNG, maximum 1 MB."
                                    }
                                }
                            }
                        }
                    }
                };
                return operation;
            });

        endpoints.MapDelete(
                "/api/repair-order-items/{itemId:guid}/evidence/{evidenceId:guid}",
                DeleteAsync)
            .WithName("DeleteRepairItemEvidence")
            .Produces(StatusCodes.Status204NoContent)
            .RequireAuthorization(AccessPolicies.Authenticated)
            .WithOpenApi();

        endpoints.MapGet(
                "/api/evidence/{evidenceId:guid}/access",
                CreateAccessAsync)
            .WithName("CreateRepairEvidenceAccess")
            .Produces<ApiResponse<RepairEvidenceAccessResponse>>()
            .RequireAuthorization(AccessPolicies.Authenticated)
            .WithOpenApi();

        endpoints.MapPost(
                "/api/repair-order-items/{itemId:guid}/evidence-lock",
                LockAsync)
            .WithName("LockRepairItemEvidence")
            .Produces<ApiResponse<RepairEvidenceLockResponse>>()
            .RequireAuthorization(AccessPolicies.Authenticated)
            .WithOpenApi();

        return endpoints;
    }

    private static async Task<IResult> ListAsync(
        Guid itemId,
        HttpContext httpContext,
        RepairEvidenceService service,
        CancellationToken cancellationToken) =>
        Results.Ok(ApiResponse<IReadOnlyList<RepairEvidenceResponse>>.Create(
            await service.ListAsync(itemId, cancellationToken),
            RequestIdMiddleware.GetRequestId(httpContext)));

    private static async Task<IResult> UploadAsync(
        Guid itemId,
        HttpContext httpContext,
        RepairEvidenceService service,
        CancellationToken cancellationToken)
    {
        if (!httpContext.Request.HasFormContentType)
        {
            throw new ApiValidationException(
                "Evidence upload is invalid.",
                new Dictionary<string, string[]> { ["Content-Type"] = ["multipart/form-data is required."] });
        }

        var form = await httpContext.Request.ReadFormAsync(cancellationToken);
        var file = form.Files.GetFile("file") ??
                   (form.Files.Count == 1 ? form.Files[0] : null);
        var idempotencyKey = httpContext.Request.Headers["Idempotency-Key"].FirstOrDefault();
        var clientChecksum = httpContext.Request.Headers["X-Content-SHA256"].FirstOrDefault();
        var evidence = await service.UploadAsync(
            itemId,
            file,
            clientChecksum,
            idempotencyKey,
            cancellationToken);
        return Results.Created(
            $"/api/evidence/{evidence.Id}/access",
            ApiResponse<RepairEvidenceResponse>.Create(
                evidence,
                RequestIdMiddleware.GetRequestId(httpContext)));
    }

    private static async Task<IResult> DeleteAsync(
        Guid itemId,
        Guid evidenceId,
        RepairEvidenceService service,
        CancellationToken cancellationToken)
    {
        await service.DeleteAsync(itemId, evidenceId, cancellationToken);
        return Results.NoContent();
    }

    private static async Task<IResult> CreateAccessAsync(
        Guid evidenceId,
        HttpContext httpContext,
        RepairEvidenceService service,
        CancellationToken cancellationToken) =>
        Results.Ok(ApiResponse<RepairEvidenceAccessResponse>.Create(
            await service.CreateAccessAsync(evidenceId, cancellationToken),
            RequestIdMiddleware.GetRequestId(httpContext)));

    private static async Task<IResult> LockAsync(
        Guid itemId,
        HttpContext httpContext,
        RepairEvidenceService service,
        CancellationToken cancellationToken) =>
        Results.Ok(ApiResponse<RepairEvidenceLockResponse>.Create(
            await service.LockAsync(itemId, cancellationToken),
            RequestIdMiddleware.GetRequestId(httpContext)));
}
