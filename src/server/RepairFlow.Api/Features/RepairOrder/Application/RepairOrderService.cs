using RepairFlow.Api.Api.Responses;
using RepairFlow.Api.Features.Access.Application;
using RepairFlow.Api.Features.Access.Domain;
using RepairFlow.Api.Features.RepairOrder.Api;
using RepairFlow.Api.Features.RepairOrder.Domain;
using RepairOrderEntity = RepairFlow.Api.Features.RepairOrder.Domain.RepairOrder;

namespace RepairFlow.Api.Features.RepairOrder.Application;

public sealed class RepairOrderService
{
    private readonly IAccessContextAccessor _contextAccessor;
    private readonly IAccessAuthorizationPolicy _authorizationPolicy;
    private readonly IRepairOrderRepository _repository;

    public RepairOrderService(
        IAccessContextAccessor contextAccessor,
        IAccessAuthorizationPolicy authorizationPolicy,
        IRepairOrderRepository repository)
    {
        _contextAccessor = contextAccessor;
        _authorizationPolicy = authorizationPolicy;
        _repository = repository;
    }

    public async Task<IReadOnlyList<RepairOrderResponse>> SearchAsync(
        string? status,
        Guid? customerId,
        Guid? deviceId,
        string? search,
        CancellationToken cancellationToken)
    {
        var context = RequireContext();
        EnsureListRead();
        var orders = await _repository.SearchAsync(
            context.Workspace.Id,
            NormalizeStatus(status),
            customerId,
            deviceId,
            NormalizeOptional(search),
            TechnicianScope(context),
            cancellationToken);
        return orders.Select(ToResponse).ToArray();
    }

    public async Task<RepairOrderResponse> GetAsync(Guid orderId, CancellationToken cancellationToken)
    {
        var context = RequireContext();
        var order = await _repository.FindAsync(
            context.Workspace.Id,
            orderId,
            TechnicianScope(context),
            cancellationToken);
        if (order is null)
        {
            throw NotFound();
        }

        var assignments = order.Assignments
            .Select(assignment => ToAssignmentScope(order.WorkspaceId, order.Id, assignment))
            .ToArray();
        EnsureAction(AccessAction.RepairOrderRead, order.WorkspaceId, order.Id, assignments);
        return ToResponse(order);
    }

    public async Task<RepairOrderResponse> CreateAsync(
        CreateRepairOrderRequest request,
        CancellationToken cancellationToken)
    {
        var context = RequireContext();
        EnsureAction(AccessAction.RepairOrderCreate, context.Workspace.Id);
        var errors = new Dictionary<string, string[]>();
        var description = Required(request.CustomerDescription, "customerDescription", 8000, errors);
        var internalNote = Optional(request.InternalNote, "internalNote", 8000, errors);
        if (request.ConfirmOpenOrder && string.IsNullOrWhiteSpace(request.OpenOrderReason))
        {
            errors["openOrderReason"] = ["A reason is required when confirming an open order."];
        }

        if (request.IntakeStaffId is not null &&
            context.ActiveRole == AccessRole.Receptionist &&
            request.IntakeStaffId != context.StaffProfile.Id)
        {
            throw new ApiException(
                StatusCodes.Status403Forbidden,
                "forbidden",
                "A receptionist can only assign intake to their own staff profile.");
        }

        var openOrderReason = Optional(request.OpenOrderReason, "openOrderReason", 2000, errors);
        ThrowValidation("Repair-order request is invalid.", errors);

        try
        {
            var order = await _repository.CreateAsync(
                context.Workspace.Id,
                new CreateRepairOrderData(
                    request.CustomerId,
                    request.DeviceId,
                    description!,
                    internalNote,
                    request.ExpectedCompletedAt,
                    request.IntakeStaffId,
                    request.ConfirmOpenOrder,
                    openOrderReason,
                    context.StaffProfile.Id,
                    context.ActiveRole == AccessRole.Receptionist ? context.StaffProfile.Id : null),
                cancellationToken);
            return ToResponse(order);
        }
        catch (RepairOrderConflictException exception)
        {
            throw new ApiException(StatusCodes.Status409Conflict, exception.Code, exception.Message, exception.Details);
        }
        catch (RepairOrderNotFoundException)
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

        EnsureAction(AccessAction.RepairOrderRead, context.Workspace.Id);
    }

    private void EnsureAction(
        AccessAction action,
        Guid workspaceId,
        Guid? resourceId = null,
        IReadOnlyCollection<AssignmentScope>? assignments = null)
    {
        var decision = _authorizationPolicy.Evaluate(new AccessAuthorizationRequest(
            RequireContext(), action, workspaceId, resourceId, assignments));
        if (decision.IsAllowed)
        {
            return;
        }

        throw new ApiException(
            decision.HideResource ? StatusCodes.Status404NotFound : StatusCodes.Status403Forbidden,
            decision.HideResource ? "not_found" : "forbidden",
            decision.HideResource ? "The requested resource was not found." : "You do not have permission to perform this action.");
    }

    private static RepairOrderResponse ToResponse(RepairOrderEntity order) => new(
        order.Id,
        order.OrderCode,
        order.CustomerId,
        order.DeviceId,
        RepairOrderStatusCodec.ToWireValue(order.Status),
        order.CustomerDescription,
        order.ReceivedAt,
        order.ExpectedCompletedAt,
        order.CompletedAt,
        order.CancelledAt,
        order.CreatedBy,
        order.CreatedAt,
        order.UpdatedAt,
        order.Assignments.Select(assignment => new AssignmentResponse(
            assignment.Id,
            assignment.StaffProfileId,
            assignment.StaffProfileName,
            StaffResponsibilityCodec.ToWireValue(assignment.Responsibility),
            assignment.IsPrimary,
            assignment.AssignedAt,
            assignment.CompletedAt,
            assignment.Note)).ToArray(),
        order.StatusHistory.Select(history => new StatusHistoryResponse(
            history.Id,
            history.FromStatus is null ? null : RepairOrderStatusCodec.ToWireValue(history.FromStatus.Value),
            RepairOrderStatusCodec.ToWireValue(history.ToStatus),
            history.ChangedBy,
            history.Reason,
            history.CreatedAt)).ToArray());

    private static AssignmentScope ToAssignmentScope(
        Guid workspaceId,
        Guid orderId,
        Assignment assignment) => new(
        workspaceId,
        orderId,
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
        assignment.CompletedAt is null);

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

    private static string? NormalizeStatus(string? status)
    {
        if (string.IsNullOrWhiteSpace(status))
        {
            return null;
        }

        if (!RepairOrderStatusCodec.TryParse(status, out var parsed))
        {
            throw new ApiValidationException(
                "Repair-order filters are invalid.",
                new Dictionary<string, string[]> { ["status"] = ["A valid repair-order status is required."] });
        }

        return RepairOrderStatusCodec.ToWireValue(parsed);
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
