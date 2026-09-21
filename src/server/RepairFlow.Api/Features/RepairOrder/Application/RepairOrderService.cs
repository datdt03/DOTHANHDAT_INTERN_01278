using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using RepairFlow.Api.Api.Responses;
using RepairFlow.Api.Features.Access.Application;
using RepairFlow.Api.Features.Access.Domain;
using RepairFlow.Api.Features.Customer.Api;
using RepairFlow.Api.Features.Customer.Domain;
using RepairFlow.Api.Features.RepairOrder.Api;
using RepairFlow.Api.Features.RepairOrder.Domain;
using RepairFlow.Api.Features.RepairTag.Api;
using CustomerEntity = RepairFlow.Api.Features.Customer.Domain.Customer;
using RepairOrderEntity = RepairFlow.Api.Features.RepairOrder.Domain.RepairOrder;

namespace RepairFlow.Api.Features.RepairOrder.Application;

public sealed class RepairOrderService
{
    private readonly IAccessContextAccessor _contextAccessor;
    private readonly IAccessAuthorizationPolicy _authorizationPolicy;
    private readonly IRepairOrderRepository _repository;
    private readonly IRepairOrderIntakeRepository? _intakeRepository;
    private readonly IRepairOrderCredentialRepository? _credentialRepository;
    private readonly ICredentialProtector? _credentialProtector;

    public RepairOrderService(
        IAccessContextAccessor contextAccessor,
        IAccessAuthorizationPolicy authorizationPolicy,
        IRepairOrderRepository repository,
        IRepairOrderIntakeRepository? intakeRepository = null,
        IRepairOrderCredentialRepository? credentialRepository = null,
        ICredentialProtector? credentialProtector = null)
    {
        _contextAccessor = contextAccessor;
        _authorizationPolicy = authorizationPolicy;
        _repository = repository;
        _intakeRepository = intakeRepository;
        _credentialRepository = credentialRepository;
        _credentialProtector = credentialProtector;
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

    public async Task<RepairIntakeResponse> CreateIntakeAsync(
        CreateRepairIntakeCommand command,
        CancellationToken cancellationToken)
    {
        if (_intakeRepository is null || _credentialProtector is null)
        {
            throw new InvalidOperationException("Repair intake dependencies are not configured.");
        }

        var context = RequireContext();
        EnsureAction(AccessAction.RepairOrderCreate, context.Workspace.Id);
        var normalized = NormalizeIntake(command);
        var intakeStaffId = normalized.IntakeStaffId;
        if (context.ActiveRole == AccessRole.Receptionist)
        {
            if (intakeStaffId is not null && intakeStaffId != context.StaffProfile.Id)
            {
                throw new ApiException(
                    StatusCodes.Status403Forbidden,
                    "forbidden",
                    "A receptionist can only assign intake to their own staff profile.");
            }

            intakeStaffId ??= context.StaffProfile.Id;
        }

        var requestHash = ComputeRequestHash(normalized);
        var receivedAt = DateTimeOffset.UtcNow;
        var items = normalized.RepairItems
            .Select(item => new RepairItemIntakeData(
                item.Device,
                item.ReportedIssue,
                item.HandoverCondition,
                item.Accessories,
                item.ItemNotes,
                ProtectCredential(item.Credential, receivedAt),
                item.TagIds ?? []))
            .ToArray();

        try
        {
            var result = await _intakeRepository.CreateAsync(
                context.Workspace.Id,
                new CreateRepairIntakeData(
                    normalized.Customer,
                    items,
                    normalized.IntakeNotes,
                    normalized.ExpectedCompletedAt,
                    intakeStaffId,
                    context.StaffProfile.Id,
                    normalized.IdempotencyKey,
                    requestHash),
                cancellationToken);
            return ToIntakeResponse(result);
        }
        catch (RepairIntakeConflictException exception)
        {
            throw new ApiException(StatusCodes.Status409Conflict, exception.Code, exception.Message, exception.Details);
        }
        catch (RepairOrderNotFoundException)
        {
            throw NotFound();
        }
    }

    public async Task<CredentialRevealResponse> RevealCredentialAsync(
        Guid orderId,
        Guid itemId,
        CancellationToken cancellationToken)
    {
        EnsureCredentialDependencies();
        var context = await RequireCredentialAccessAsync(orderId, cancellationToken);
        var credential = await _credentialRepository!.FindCredentialAsync(
            context.Workspace.Id,
            orderId,
            itemId,
            cancellationToken);
        if (credential is null)
        {
            throw NotFound();
        }

        if (credential.DestroyedAt is not null ||
            credential.ExpiresAt is null ||
            credential.ExpiresAt <= DateTimeOffset.UtcNow)
        {
            throw new ApiException(
                StatusCodes.Status409Conflict,
                "credential_unavailable",
                "The device credential is no longer available.");
        }

        string value;
        try
        {
            value = _credentialProtector!.Unprotect(credential.Ciphertext, credential.KeyVersion);
        }
        catch (Exception exception) when (exception is CryptographicException or InvalidOperationException)
        {
            throw new ApiException(
                StatusCodes.Status503ServiceUnavailable,
                "credential_unavailable",
                "The device credential is temporarily unavailable.");
        }

        await _credentialRepository.RecordCredentialRevealAsync(
            context.Workspace.Id,
            orderId,
            itemId,
            context.StaffProfile.Id,
            cancellationToken);
        return new CredentialRevealResponse(orderId, itemId, value, credential.ExpiresAt.Value);
    }

    public async Task<CredentialDestroyResponse> DestroyCredentialAsync(
        Guid orderId,
        Guid itemId,
        CancellationToken cancellationToken)
    {
        EnsureCredentialDependencies();
        var context = await RequireCredentialAccessAsync(orderId, cancellationToken);
        var destroyed = await _credentialRepository!.DestroyCredentialAsync(
            context.Workspace.Id,
            orderId,
            itemId,
            context.StaffProfile.Id,
            cancellationToken);
        if (destroyed is null)
        {
            throw NotFound();
        }

        return new CredentialDestroyResponse(orderId, itemId, destroyed.DestroyedAt);
    }

    private async Task<AccessContext> RequireCredentialAccessAsync(
        Guid orderId,
        CancellationToken cancellationToken)
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
        EnsureAction(AccessAction.TechnicalRead, order.WorkspaceId, order.Id, assignments);
        return context;
    }

    private void EnsureCredentialDependencies()
    {
        if (_credentialRepository is null || _credentialProtector is null)
        {
            throw new InvalidOperationException("Credential dependencies are not configured.");
        }
    }

    private static CreateRepairIntakeCommand NormalizeIntake(CreateRepairIntakeCommand command)
    {
        var errors = new Dictionary<string, string[]>();
        var idempotencyKey = Required(command.IdempotencyKey, "idempotencyKey", 128, errors);
        var mode = NormalizeOptional(command.Customer.Mode)?.ToLowerInvariant();
        if (mode is not ("existing" or "new"))
        {
            errors["customer.mode"] = ["The customer mode must be existing or new."];
        }

        CustomerIntakeCommand customer;
        if (mode == "existing")
        {
            if (command.Customer.Id is null || command.Customer.Id == Guid.Empty)
            {
                errors["customer.id"] = ["A customer id is required when selecting an existing customer."];
            }

            customer = command.Customer with { Mode = mode };
        }
        else
        {
            var name = Required(command.Customer.Name, "customer.name", 160, errors);
            var phone = NormalizePhone(command.Customer.Phone, "customer.phone", errors);
            customer = command.Customer with
            {
                Mode = mode ?? string.Empty,
                Name = name,
                Phone = phone,
                Email = Optional(command.Customer.Email, "customer.email", 320, errors),
                Note = Optional(command.Customer.Note, "customer.note", 4000, errors)
            };
        }

        if (command.RepairItems is null || command.RepairItems.Count == 0)
        {
            errors["repairItems"] = ["At least one repair item is required."];
        }
        else if (command.RepairItems.Count > 20)
        {
            errors["repairItems"] = ["A maximum of 20 repair items is allowed."];
        }

        var items = new List<RepairItemIntakeCommand>();
        if (command.RepairItems is not null)
        {
            for (var index = 0; index < command.RepairItems.Count; index++)
            {
                var item = command.RepairItems[index];
                if (item is null)
                {
                    errors[$"repairItems[{index}]"] = ["The repair item is required."];
                    continue;
                }

                var prefix = $"repairItems[{index}]";
                var device = item.Device;
                if (device is null)
                {
                    errors[$"{prefix}.device"] = ["The device is required."];
                    continue;
                }

                var deviceType = Required(device.DeviceType, $"{prefix}.device.type", 32, errors);
                var brand = Required(device.Brand, $"{prefix}.device.brand", 80, errors);
                var model = Required(device.Model, $"{prefix}.device.model", 120, errors);
                var serial = Optional(device.SerialNumber, $"{prefix}.device.serialNumber", 160, errors);
                var identifier = Optional(device.DeviceIdentifier, $"{prefix}.device.identifier", 160, errors);
                if (serial is null && identifier is null)
                {
                    errors[$"{prefix}.device.identity"] = ["Serial number or device identifier is required."];
                }

                var reportedIssue = Required(item.ReportedIssue, $"{prefix}.reportedIssue", 8000, errors);
                var credential = NormalizeCredential(item.Credential, prefix, errors);
                items.Add(item with
                {
                    Device = device with
                    {
                        DeviceType = deviceType ?? string.Empty,
                        Brand = brand ?? string.Empty,
                        Model = model ?? string.Empty,
                        SerialNumber = serial,
                        DeviceIdentifier = identifier
                    },
                    ReportedIssue = reportedIssue ?? string.Empty,
                    HandoverCondition = Optional(item.HandoverCondition, $"{prefix}.handoverCondition", 4000, errors),
                    Accessories = Optional(item.Accessories, $"{prefix}.accessories", 4000, errors),
                    ItemNotes = Optional(item.ItemNotes, $"{prefix}.itemNotes", 4000, errors),
                    Credential = credential,
                    TagIds = NormalizeTagIds(item.TagIds, $"{prefix}.tagIds", errors)
                });
            }
        }

        var intakeNotes = Optional(command.IntakeNotes, "repairOrder.intakeNotes", 8000, errors);
        if (command.IntakeStaffId == Guid.Empty)
        {
            errors["intakeStaffId"] = ["A valid staff id is required."];
        }

        ThrowValidation("Repair-intake request is invalid.", errors);
        return command with
        {
            Customer = customer,
            RepairItems = items,
            IntakeNotes = intakeNotes,
            IdempotencyKey = idempotencyKey!
        };
    }

    private static CredentialIntakeCommand NormalizeCredential(
        CredentialIntakeCommand? credential,
        string prefix,
        Dictionary<string, string[]> errors)
    {
        if (credential is null)
        {
            return new CredentialIntakeCommand("not_required", null, false);
        }

        var status = NormalizeOptional(credential.Status)?.ToLowerInvariant();
        if (status is not ("not_required" or "customer_unlocked_device" or "passcode_provided"))
        {
            errors[$"{prefix}.credential.status"] = ["The credential status is invalid."];
            status = "not_required";
        }

        var value = NormalizeOptional(credential.Value);
        if (status == "passcode_provided" && value is null)
        {
            errors[$"{prefix}.credential.value"] = ["A credential value is required."];
        }

        if (status == "passcode_provided" && !credential.Consent)
        {
            errors[$"{prefix}.credential.consent"] = ["Consent is required when a credential is provided."];
        }

        if (status != "passcode_provided" && value is not null)
        {
            errors[$"{prefix}.credential.value"] = ["A credential value is only allowed when passcode is provided."];
        }

        return new CredentialIntakeCommand(status, value, credential.Consent);
    }

    private static IReadOnlyList<Guid> NormalizeTagIds(
        IReadOnlyList<Guid>? tagIds,
        string field,
        Dictionary<string, string[]> errors)
    {
        var values = (tagIds ?? []).Distinct().OrderBy(id => id).ToArray();
        if (values.Any(id => id == Guid.Empty))
        {
            errors[field] = ["Every tag id must be a valid UUID."];
            return [];
        }

        return values;
    }

    private ProtectedCredentialData? ProtectCredential(
        CredentialIntakeCommand? credential,
        DateTimeOffset receivedAt)
    {
        if (credential is null || credential.Status != "passcode_provided")
        {
            return null;
        }

        var protectedCredential = _credentialProtector!.Protect(
            credential.Value!,
            receivedAt,
            TimeSpan.FromHours(24));
        return new ProtectedCredentialData(
            credential.Status,
            protectedCredential.Ciphertext,
            protectedCredential.KeyVersion,
            credential.Consent,
            protectedCredential.ReceivedAt,
            protectedCredential.ExpiresAt);
    }

    private static string ComputeRequestHash(CreateRepairIntakeCommand command)
    {
        var json = JsonSerializer.Serialize(command);
        return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(json))).ToLowerInvariant();
    }

    private static RepairIntakeResponse ToIntakeResponse(RepairIntakeResult result) => new(
        ToCustomerResponse(result.Customer),
        ToResponse(result.Order with { RepairItems = null }),
        result.RepairItems.Select(ToItemResponse).ToArray());

    private static CustomerResponse ToCustomerResponse(CustomerEntity customer) => new(
        customer.Id,
        customer.Name,
        customer.Phone,
        customer.Email,
        customer.Note,
        customer.CreatedAt,
        customer.UpdatedAt);

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
            history.CreatedAt)).ToArray(),
        null,
        order.RepairItems?.Select(ToItemResponse).ToArray());

    private static RepairItemResponse ToItemResponse(RepairOrderItem item) => new(
        item.Id,
        item.ItemIndex,
        item.DeviceId,
        RepairOrderStatusCodec.ToWireValue(item.Status),
        item.DeviceType,
        item.Brand,
        item.Model,
        item.SerialNumber,
        item.DeviceIdentifier,
        item.ReportedIssue,
        item.HandoverCondition,
        item.Accessories,
        item.ItemNotes,
        item.CredentialStatus,
        item.CredentialConsent,
        item.CredentialReceivedAt,
        item.CredentialExpiresAt,
        item.CredentialDestroyedAt,
        (item.Tags ?? []).Select(tag => new RepairTagResponse(
            tag.Id,
            tag.Name,
            tag.CreatedAt,
            tag.UpdatedAt)).ToArray());

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

    private static string? NormalizePhone(
        string? value,
        string field,
        Dictionary<string, string[]> errors)
    {
        var normalized = NormalizeOptional(value);
        if (normalized is null)
        {
            errors[field] = ["The field is required."];
            return null;
        }

        normalized = normalized.Replace(" ", string.Empty)
            .Replace("-", string.Empty)
            .Replace("(", string.Empty)
            .Replace(")", string.Empty)
            .Replace(".", string.Empty);
        var digits = normalized.Count(char.IsDigit);
        if (digits < 6 || normalized.Any(character => !char.IsDigit(character) && character != '+') ||
            normalized.IndexOf('+', 1) >= 0)
        {
            errors[field] = ["Enter a valid phone number."];
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
