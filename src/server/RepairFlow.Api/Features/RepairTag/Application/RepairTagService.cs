using RepairFlow.Api.Api.Responses;
using RepairFlow.Api.Features.Access.Application;
using RepairFlow.Api.Features.Access.Domain;
using RepairFlow.Api.Features.RepairOrder.Application;
using RepairFlow.Api.Features.RepairOrder.Domain;
using RepairFlow.Api.Features.RepairTag.Api;
using RepairFlow.Api.Features.RepairTag.Domain;
using RepairTagEntity = RepairFlow.Api.Features.RepairTag.Domain.RepairTag;

namespace RepairFlow.Api.Features.RepairTag.Application;

public sealed class RepairTagService
{
    private readonly IAccessContextAccessor _contextAccessor;
    private readonly IAccessAuthorizationPolicy _authorizationPolicy;
    private readonly IRepairTagRepository _repository;
    private readonly IRepairOrderRepository _repairOrderRepository;

    public RepairTagService(
        IAccessContextAccessor contextAccessor,
        IAccessAuthorizationPolicy authorizationPolicy,
        IRepairTagRepository repository,
        IRepairOrderRepository repairOrderRepository)
    {
        _contextAccessor = contextAccessor;
        _authorizationPolicy = authorizationPolicy;
        _repository = repository;
        _repairOrderRepository = repairOrderRepository;
    }

    public async Task<IReadOnlyList<RepairTagResponse>> SearchAsync(
        string? query,
        bool includeUnused,
        CancellationToken cancellationToken)
    {
        var context = RequireContext();
        EnsureAction(AccessAction.WorkspaceTagRead, context.Workspace.Id);
        var normalizedQuery = RepairTagNamePolicy.NormalizeSearch(query);
        var tags = await _repository.SearchAsync(
            context.Workspace.Id,
            normalizedQuery.Length == 0 ? null : normalizedQuery,
            includeUnused,
            cancellationToken);
        return tags.Select(ToResponse).ToArray();
    }

    public async Task<RepairTagResponse> CreateAsync(
        CreateRepairTagRequest request,
        CancellationToken cancellationToken)
    {
        var context = RequireContext();
        EnsureAction(AccessAction.WorkspaceTagCreate, context.Workspace.Id);
        var name = NormalizeName(request.Name, "name");

        try
        {
            return ToResponse(await _repository.CreateAsync(
                new RepairTagWriteRequest(
                    context.Workspace.Id,
                    name.DisplayName,
                    name.NormalizedName,
                    context.StaffProfile.Id),
                cancellationToken));
        }
        catch (RepairTagConflictException exception)
        {
            throw ToApiConflict(exception);
        }
    }

    public async Task<RepairTagResponse> RenameAsync(
        Guid tagId,
        RenameRepairTagRequest request,
        CancellationToken cancellationToken)
    {
        var context = RequireContext();
        EnsureAction(AccessAction.WorkspaceTagManage, context.Workspace.Id);
        var name = NormalizeName(request.Name, "name");

        try
        {
            return ToResponse(await _repository.RenameAsync(
                context.Workspace.Id,
                tagId,
                new RepairTagWriteRequest(
                    context.Workspace.Id,
                    name.DisplayName,
                    name.NormalizedName,
                    context.StaffProfile.Id),
                cancellationToken));
        }
        catch (RepairTagConflictException exception)
        {
            throw ToApiConflict(exception);
        }
        catch (RepairTagNotFoundException)
        {
            throw NotFound();
        }
    }

    public async Task DeleteAsync(Guid tagId, CancellationToken cancellationToken)
    {
        var context = RequireContext();
        EnsureAction(AccessAction.WorkspaceTagManage, context.Workspace.Id);

        try
        {
            await _repository.DeleteAsync(
                context.Workspace.Id,
                tagId,
                context.StaffProfile.Id,
                cancellationToken);
        }
        catch (RepairTagConflictException exception)
        {
            throw ToApiConflict(exception);
        }
        catch (RepairTagNotFoundException)
        {
            throw NotFound();
        }
    }

    public async Task<RepairItemTagsResponse> ReplaceItemAssignmentsAsync(
        Guid orderId,
        Guid itemId,
        ReplaceRepairItemTagsRequest request,
        CancellationToken cancellationToken)
    {
        var context = RequireContext();
        var order = await _repairOrderRepository.FindAsync(
            context.Workspace.Id,
            orderId,
            AssignmentScopeStaffId(context),
            cancellationToken);
        if (order is null)
        {
            throw NotFound();
        }

        var assignments = order.Assignments
            .Select(assignment => new AssignmentScope(
                order.WorkspaceId,
                order.Id,
                assignment.StaffProfileId,
                assignment.Responsibility switch
                {
                    StaffResponsibility.Intake => AssignmentResponsibility.Intake,
                    StaffResponsibility.Diagnosis => AssignmentResponsibility.Diagnosis,
                    StaffResponsibility.PrimaryTechnician => AssignmentResponsibility.PrimaryTechnician,
                    StaffResponsibility.Repairer => AssignmentResponsibility.Repairer,
                    StaffResponsibility.QualityChecker => AssignmentResponsibility.QualityChecker,
                    StaffResponsibility.Handover => AssignmentResponsibility.Handover,
                    _ => throw new ArgumentOutOfRangeException()
                },
                assignment.CompletedAt is null))
            .ToArray();
        EnsureAction(AccessAction.RepairItemTagWrite, order.WorkspaceId, order.Id, assignments);

        var tagIds = NormalizeTagIds(request.TagIds, "tagIds");
        try
        {
            var result = await _repository.ReplaceItemAssignmentsAsync(
                new RepairItemTagAssignmentRequest(
                    context.Workspace.Id,
                    orderId,
                    itemId,
                    tagIds,
                    context.StaffProfile.Id),
                cancellationToken);
            return new RepairItemTagsResponse(
                result.RepairOrderId,
                result.RepairItemId,
                result.OrderStatus,
                result.Tags.Select(ToResponse).ToArray());
        }
        catch (RepairTagConflictException exception)
        {
            throw ToApiConflict(exception);
        }
        catch (RepairTagNotFoundException)
        {
            throw NotFound();
        }
    }

    private static (string DisplayName, string NormalizedName) NormalizeName(
        string? value,
        string field)
    {
        if (RepairTagNamePolicy.TryNormalize(value, out var name, out var normalized, out var error))
        {
            return (name, normalized);
        }

        var (code, message) = error switch
        {
            RepairTagNameValidationError.Required =>
                ("TAG_NAME_REQUIRED", "A tag name is required."),
            RepairTagNameValidationError.TooLong =>
                ("TAG_NAME_TOO_LONG", "A tag name must be 64 Unicode characters or fewer."),
            _ => ("TAG_NAME_INVALID", "A tag name contains an unsupported character.")
        };

        throw new ApiException(
            StatusCodes.Status400BadRequest,
            code,
            message,
            new { field });
    }

    private static IReadOnlyList<Guid> NormalizeTagIds(
        IReadOnlyList<Guid>? values,
        string field)
    {
        var tagIds = (values ?? []).Distinct().OrderBy(id => id).ToArray();
        if (tagIds.Any(id => id == Guid.Empty))
        {
            throw new ApiException(
                StatusCodes.Status400BadRequest,
                "TAG_ID_INVALID",
                "Every tag id must be a valid UUID.",
                new { field });
        }

        return tagIds;
    }

    private AccessContext RequireContext() => _contextAccessor.Current ??
        throw new ApiException(
            StatusCodes.Status401Unauthorized,
            "authentication_required",
            "Authentication is required.");

    private void EnsureAction(
        AccessAction action,
        Guid workspaceId,
        Guid? resourceId = null,
        IReadOnlyCollection<AssignmentScope>? assignments = null)
    {
        var decision = _authorizationPolicy.Evaluate(new AccessAuthorizationRequest(
            RequireContext(),
            action,
            workspaceId,
            resourceId,
            assignments));
        if (decision.IsAllowed)
        {
            return;
        }

        throw new ApiException(
            decision.HideResource ? StatusCodes.Status404NotFound : StatusCodes.Status403Forbidden,
            decision.HideResource ? "not_found" : "forbidden",
            decision.HideResource
                ? "The requested resource was not found."
                : "You do not have permission to perform this action.");
    }

    private static Guid? AssignmentScopeStaffId(AccessContext context) =>
        context.ActiveRole is AccessRole.Receptionist or AccessRole.Technician
            ? context.StaffProfile.Id
            : null;

    private static ApiException ToApiConflict(RepairTagConflictException exception) =>
        new(StatusCodes.Status409Conflict, exception.Code, exception.Message, exception.Details);

    private static ApiException NotFound() =>
        new(StatusCodes.Status404NotFound, "not_found", "The requested resource was not found.");

    private static RepairTagResponse ToResponse(RepairTagEntity tag) =>
        new(tag.Id, tag.Name, tag.CreatedAt, tag.UpdatedAt);
}
