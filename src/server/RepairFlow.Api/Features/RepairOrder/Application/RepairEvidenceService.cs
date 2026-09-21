using System.Security.Cryptography;
using Microsoft.AspNetCore.Http;
using RepairFlow.Api.Api.Responses;
using RepairFlow.Api.Features.Access.Application;
using RepairFlow.Api.Features.Access.Domain;
using RepairFlow.Api.Features.RepairOrder.Api;
using RepairFlow.Api.Features.RepairOrder.Domain;

namespace RepairFlow.Api.Features.RepairOrder.Application;

public sealed class RepairEvidenceService
{
    private readonly IAccessContextAccessor _contextAccessor;
    private readonly IAccessAuthorizationPolicy _authorizationPolicy;
    private readonly IRepairOrderRepository _orderRepository;
    private readonly IRepairEvidenceRepository _repository;
    private readonly IPrivateObjectStorage _storage;
    private readonly ILogger<RepairEvidenceService> _logger;

    public RepairEvidenceService(
        IAccessContextAccessor contextAccessor,
        IAccessAuthorizationPolicy authorizationPolicy,
        IRepairOrderRepository orderRepository,
        IRepairEvidenceRepository repository,
        IPrivateObjectStorage storage,
        ILogger<RepairEvidenceService> logger)
    {
        _contextAccessor = contextAccessor;
        _authorizationPolicy = authorizationPolicy;
        _orderRepository = orderRepository;
        _repository = repository;
        _storage = storage;
        _logger = logger;
    }

    public async Task<IReadOnlyList<RepairEvidenceResponse>> ListAsync(
        Guid repairItemId,
        CancellationToken cancellationToken)
    {
        var authorizedItem = await LoadAuthorizedItemAsync(
            repairItemId,
            AccessAction.RepairEvidenceRead,
            cancellationToken);
        var evidence = await _repository.ListAsync(
            authorizedItem.WorkspaceId,
            repairItemId,
            cancellationToken);
        return evidence.Select(ToResponse).ToArray();
    }

    public async Task<RepairEvidenceResponse> UploadAsync(
        Guid repairItemId,
        IFormFile? file,
        string? clientChecksum,
        string? idempotencyKey,
        CancellationToken cancellationToken)
    {
        var authorizedItem = await LoadAuthorizedItemAsync(
            repairItemId,
            AccessAction.RepairEvidenceWrite,
            cancellationToken);
        EnsureItemCanChangeEvidence(authorizedItem);

        var normalizedIdempotencyKey = NormalizeIdempotencyKey(idempotencyKey);
        if (file is null)
        {
            throw new ApiValidationException(
                "Evidence upload is invalid.",
                new Dictionary<string, string[]> { ["file"] = ["An image file is required."] });
        }

        if (!RepairEvidenceRules.TryResolveImage(
                file.ContentType,
                file.FileName,
                out var mimeType,
                out var extension))
        {
            throw new ApiException(
                StatusCodes.Status415UnsupportedMediaType,
                "EVIDENCE_IMAGE_TYPE_INVALID",
                "Only JPG, JPEG and PNG images are accepted.");
        }

        var bytes = await ReadBoundedFileAsync(file, cancellationToken);
        if (!RepairEvidenceRules.HasValidSignature(bytes, mimeType))
        {
            throw new ApiException(
                StatusCodes.Status415UnsupportedMediaType,
                "EVIDENCE_IMAGE_CONTENT_INVALID",
                "The uploaded file is not a valid image of the declared type.");
        }

        var checksum = Convert.ToHexString(SHA256.HashData(bytes)).ToLowerInvariant();
        ValidateClientChecksum(clientChecksum, checksum);

        var stage = RepairEvidenceStage.BeforeRepair;
        var duplicateByKey = await _repository.FindActiveByIdempotencyAsync(
            authorizedItem.WorkspaceId,
            repairItemId,
            stage,
            normalizedIdempotencyKey,
            cancellationToken);
        if (duplicateByKey is not null)
        {
            if (!string.Equals(duplicateByKey.Checksum, checksum, StringComparison.OrdinalIgnoreCase))
            {
                throw new ApiException(
                    StatusCodes.Status409Conflict,
                    "EVIDENCE_IDEMPOTENCY_CONFLICT",
                    "The idempotency key was already used for a different image.");
            }

            return ToResponse(duplicateByKey);
        }

        var duplicateByChecksum = await _repository.FindActiveByChecksumAsync(
            authorizedItem.WorkspaceId,
            repairItemId,
            stage,
            checksum,
            cancellationToken);
        if (duplicateByChecksum is not null)
        {
            return ToResponse(duplicateByChecksum);
        }

        var existingEvidence = await _repository.ListAsync(
            authorizedItem.WorkspaceId,
            repairItemId,
            cancellationToken);
        if (existingEvidence.Count >= RepairEvidenceRules.MaxEvidenceCountPerItem)
        {
            throw new ApiException(
                StatusCodes.Status409Conflict,
                "EVIDENCE_LIMIT_REACHED",
                "An item can have at most five active evidence images.");
        }

        var evidenceId = Guid.NewGuid();
        var objectKey = BuildObjectKey(
            authorizedItem.WorkspaceId,
            authorizedItem.OrderId,
            repairItemId,
            evidenceId,
            extension);
        var createdAt = DateTimeOffset.UtcNow;
        try
        {
            await using var content = new MemoryStream(bytes, writable: false);
            await _storage.PutAsync(
                objectKey,
                mimeType,
                content,
                bytes.LongLength,
                cancellationToken);
        }
        catch (Exception exception) when (exception is not OperationCanceledException)
        {
            throw new ApiException(
                StatusCodes.Status503ServiceUnavailable,
                "EVIDENCE_STORAGE_UNAVAILABLE",
                "Evidence storage is temporarily unavailable.");
        }

        try
        {
            var result = await _repository.CreateAsync(
                new RepairEvidenceCreateData(
                    evidenceId,
                    authorizedItem.WorkspaceId,
                    authorizedItem.OrderId,
                    repairItemId,
                    stage,
                    objectKey,
                    RepairEvidenceRules.SafeOriginalFilename(file.FileName),
                    mimeType,
                    bytes.LongLength,
                    checksum,
                    normalizedIdempotencyKey,
                    RequireContext().StaffProfile.Id,
                    createdAt),
                cancellationToken);

            if (result.AlreadyExisted)
            {
                await CleanupObjectAsync(objectKey, evidenceId, cancellationToken);
            }

            return ToResponse(result.Evidence);
        }
        catch (RepairEvidenceConflictException exception)
        {
            await CleanupObjectAsync(objectKey, evidenceId, cancellationToken);
            throw ToApiException(exception);
        }
        catch (RepairEvidenceNotFoundException)
        {
            await CleanupObjectAsync(objectKey, evidenceId, cancellationToken);
            throw NotFound();
        }
        catch (ApiException)
        {
            await CleanupObjectAsync(objectKey, evidenceId, cancellationToken);
            throw;
        }
        catch (Exception exception) when (exception is not OperationCanceledException)
        {
            await CleanupObjectAsync(objectKey, evidenceId, cancellationToken);
            throw new ApiException(
                StatusCodes.Status503ServiceUnavailable,
                "EVIDENCE_METADATA_UNAVAILABLE",
                "Evidence metadata could not be saved.");
        }
    }

    public async Task DeleteAsync(
        Guid repairItemId,
        Guid evidenceId,
        CancellationToken cancellationToken)
    {
        var authorizedItem = await LoadAuthorizedItemAsync(
            repairItemId,
            AccessAction.RepairEvidenceWrite,
            cancellationToken);
        EnsureItemCanChangeEvidence(authorizedItem);

        RepairEvidenceDeleteResult? deleted;
        try
        {
            deleted = await _repository.SoftDeleteAsync(
                authorizedItem.WorkspaceId,
                repairItemId,
                evidenceId,
                RequireContext().StaffProfile.Id,
                cancellationToken);
        }
        catch (RepairEvidenceConflictException exception)
        {
            throw ToApiException(exception);
        }

        if (deleted is null)
        {
            throw NotFound();
        }

        try
        {
            await _storage.DeleteAsync(deleted.ObjectKey, cancellationToken);
        }
        catch (Exception exception) when (exception is not OperationCanceledException)
        {
            _logger.LogError(
                exception,
                "Evidence object cleanup failed after metadata soft-delete. EvidenceId={EvidenceId}",
                evidenceId);
            throw new ApiException(
                StatusCodes.Status503ServiceUnavailable,
                "EVIDENCE_CLEANUP_PENDING",
                "The evidence was hidden, but storage cleanup is pending.");
        }
    }

    public async Task<RepairEvidenceAccessResponse> CreateAccessAsync(
        Guid evidenceId,
        CancellationToken cancellationToken)
    {
        var context = RequireContext();
        var evidence = await _repository.FindAsync(
            context.Workspace.Id,
            evidenceId,
            cancellationToken);
        if (evidence is null)
        {
            throw NotFound();
        }

        await EnsureAuthorizedItemAsync(
            evidence.RepairOrderId,
            evidence.RepairItemId,
            AccessAction.RepairEvidenceRead,
            cancellationToken);
        var expiresAt = DateTimeOffset.UtcNow.Add(_storage.SignedReadLifetime);
        var accessUrl = await _storage.CreateReadUrlAsync(
            evidence.ObjectKey,
            expiresAt,
            cancellationToken);
        return new RepairEvidenceAccessResponse(
            evidence.Id,
            RepairEvidenceStageCodec.ToWireValue(evidence.Stage),
            evidence.OriginalFilename,
            evidence.MimeType,
            evidence.SizeBytes,
            evidence.Checksum,
            evidence.CreatedAt,
            accessUrl,
            expiresAt);
    }

    public async Task<RepairEvidenceLockResponse> LockAsync(
        Guid repairItemId,
        CancellationToken cancellationToken)
    {
        var authorizedItem = await LoadAuthorizedItemAsync(
            repairItemId,
            AccessAction.RepairEvidenceLock,
            cancellationToken);
        var result = await _repository.LockItemAsync(
            authorizedItem.WorkspaceId,
            authorizedItem.OrderId,
            repairItemId,
            RequireContext().StaffProfile.Id,
            cancellationToken);
        if (result is null)
        {
            throw NotFound();
        }

        return new RepairEvidenceLockResponse(
            result.RepairOrderId,
            result.RepairItemId,
            result.LockedAt,
            result.LockedBy,
            result.AlreadyLocked);
    }

    private async Task<AuthorizedRepairItem> LoadAuthorizedItemAsync(
        Guid repairItemId,
        AccessAction action,
        CancellationToken cancellationToken)
    {
        var context = RequireContext();
        var itemContext = await _repository.FindItemContextAsync(
            context.Workspace.Id,
            repairItemId,
            cancellationToken);
        if (itemContext is null)
        {
            throw NotFound();
        }

        return await EnsureAuthorizedItemAsync(
            itemContext.RepairOrderId,
            repairItemId,
            action,
            cancellationToken);
    }

    private async Task<AuthorizedRepairItem> EnsureAuthorizedItemAsync(
        Guid orderId,
        Guid itemId,
        AccessAction action,
        CancellationToken cancellationToken)
    {
        var context = RequireContext();
        var order = await _orderRepository.FindAsync(
            context.Workspace.Id,
            orderId,
            TechnicianScope(context),
            cancellationToken);
        var item = order?.RepairItems?.SingleOrDefault(candidate => candidate.Id == itemId);
        if (order is null || item is null)
        {
            throw NotFound();
        }

        var assignments = order.Assignments
            .Select(assignment => ToAssignmentScope(order.WorkspaceId, order.Id, assignment))
            .ToArray();
        EnsureAction(action, order.WorkspaceId, order.Id, assignments);
        return new AuthorizedRepairItem(
            order.WorkspaceId,
            order.Id,
            item.Id,
            item.HandoverCondition,
            item.EvidenceLockedAt,
            item.EvidenceLockedBy);
    }

    private void EnsureItemCanChangeEvidence(AuthorizedRepairItem item)
    {
        if (item.EvidenceLockedAt is not null)
        {
            throw new ApiException(
                StatusCodes.Status409Conflict,
                "EVIDENCE_LOCKED",
                "Evidence is locked after the technician accepted handover for this item.");
        }

        if (string.IsNullOrWhiteSpace(item.HandoverCondition))
        {
            throw new ApiException(
                StatusCodes.Status422UnprocessableEntity,
                "EVIDENCE_CONDITION_REQUIRED",
                "A general handover-condition description is required before adding evidence.");
        }
    }

    private static async Task<byte[]> ReadBoundedFileAsync(
        IFormFile file,
        CancellationToken cancellationToken)
    {
        await using var input = file.OpenReadStream();
        await using var output = new MemoryStream();
        var buffer = new byte[64 * 1024];
        var total = 0L;
        int read;
        while ((read = await input.ReadAsync(buffer, cancellationToken)) > 0)
        {
            total += read;
            if (total > RepairEvidenceRules.MaxSizeBytes)
            {
                throw new ApiException(
                    StatusCodes.Status413PayloadTooLarge,
                    "EVIDENCE_IMAGE_TOO_LARGE",
                    "Each evidence image must be 1 MB or smaller.");
            }

            await output.WriteAsync(buffer.AsMemory(0, read), cancellationToken);
        }

        if (total == 0)
        {
            throw new ApiException(
                StatusCodes.Status400BadRequest,
                "EVIDENCE_IMAGE_EMPTY",
                "The evidence image cannot be empty.");
        }

        return output.ToArray();
    }

    private static void ValidateClientChecksum(string? clientChecksum, string serverChecksum)
    {
        if (string.IsNullOrWhiteSpace(clientChecksum))
        {
            return;
        }

        var normalized = clientChecksum.Trim().ToLowerInvariant();
        if (normalized.Length != 64 || normalized.Any(character => !Uri.IsHexDigit(character)))
        {
            throw new ApiException(
                StatusCodes.Status400BadRequest,
                "EVIDENCE_CHECKSUM_INVALID",
                "The client checksum must be a SHA-256 hexadecimal value.");
        }

        if (!string.Equals(normalized, serverChecksum, StringComparison.Ordinal))
        {
            throw new ApiException(
                StatusCodes.Status400BadRequest,
                "EVIDENCE_CHECKSUM_MISMATCH",
                "The client checksum does not match the uploaded content.");
        }
    }

    private static string NormalizeIdempotencyKey(string? idempotencyKey)
    {
        var normalized = idempotencyKey?.Trim();
        if (string.IsNullOrWhiteSpace(normalized) || normalized.Length > RepairEvidenceRules.MaxIdempotencyKeyLength)
        {
            throw new ApiValidationException(
                "Evidence upload is invalid.",
                new Dictionary<string, string[]> { ["Idempotency-Key"] = ["A non-empty key up to 128 characters is required."] });
        }

        return normalized;
    }

    private async Task CleanupObjectAsync(
        string objectKey,
        Guid evidenceId,
        CancellationToken cancellationToken)
    {
        try
        {
            await _storage.DeleteAsync(objectKey, cancellationToken);
        }
        catch (Exception exception) when (exception is not OperationCanceledException)
        {
            _logger.LogError(
                exception,
                "Evidence object cleanup failed. EvidenceId={EvidenceId}",
                evidenceId);
            throw new ApiException(
                StatusCodes.Status503ServiceUnavailable,
                "EVIDENCE_CLEANUP_FAILED",
                "Evidence storage cleanup failed; the upload was not completed.");
        }
    }

    private void EnsureAction(
        AccessAction action,
        Guid workspaceId,
        Guid orderId,
        IReadOnlyCollection<AssignmentScope> assignments)
    {
        var decision = _authorizationPolicy.Evaluate(new AccessAuthorizationRequest(
            RequireContext(),
            action,
            workspaceId,
            orderId,
            assignments));
        if (!decision.IsAllowed)
        {
            throw new ApiException(
                decision.HideResource ? StatusCodes.Status404NotFound : StatusCodes.Status403Forbidden,
                decision.HideResource ? "not_found" : "forbidden",
                decision.HideResource
                    ? "The requested resource was not found."
                    : "You do not have permission to perform this action.");
        }
    }

    private AccessContext RequireContext() =>
        _contextAccessor.Current ?? throw new ApiException(
            StatusCodes.Status401Unauthorized,
            "authentication_required",
            "Authentication is required.");

    private static string BuildObjectKey(
        Guid workspaceId,
        Guid orderId,
        Guid itemId,
        Guid evidenceId,
        string extension) =>
        $"workspaces/{workspaceId:D}/repair-orders/{orderId:D}/items/{itemId:D}/evidence/before-repair/{evidenceId:D}{extension}";

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

    private static RepairEvidenceResponse ToResponse(RepairEvidence evidence) => new(
        evidence.Id,
        evidence.RepairOrderId,
        evidence.RepairItemId,
        RepairEvidenceStageCodec.ToWireValue(evidence.Stage),
        evidence.OriginalFilename,
        evidence.MimeType,
        evidence.SizeBytes,
        evidence.Checksum,
        evidence.CreatedAt);

    private static ApiException ToApiException(RepairEvidenceConflictException exception) =>
        new(StatusCodes.Status409Conflict, exception.Code, exception.Message, exception.Details);

    private static ApiException NotFound() =>
        new(StatusCodes.Status404NotFound, "not_found", "The requested resource was not found.");

    private static Guid? TechnicianScope(AccessContext context) =>
        context.ActiveRole == AccessRole.Technician ? context.StaffProfile.Id : null;

    private sealed record AuthorizedRepairItem(
        Guid WorkspaceId,
        Guid OrderId,
        Guid ItemId,
        string? HandoverCondition,
        DateTimeOffset? EvidenceLockedAt,
        Guid? EvidenceLockedBy);
}
