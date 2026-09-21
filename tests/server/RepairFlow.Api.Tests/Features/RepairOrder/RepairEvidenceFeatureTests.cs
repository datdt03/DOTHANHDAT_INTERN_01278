using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;
using RepairFlow.Api.Api.Responses;
using RepairFlow.Api.Features.Access.Application;
using RepairFlow.Api.Features.Access.Domain;
using RepairFlow.Api.Features.RepairOrder.Api;
using RepairFlow.Api.Features.RepairOrder.Application;
using RepairFlow.Api.Features.RepairOrder.Domain;
using RepairFlow.Api.Tests.Features.Access;
using RepairOrderEntity = RepairFlow.Api.Features.RepairOrder.Domain.RepairOrder;

namespace RepairFlow.Api.Tests.Features.RepairOrder;

public sealed class RepairEvidenceFeatureTests
{
    [Fact]
    public async Task Upload_validates_image_signature_and_keeps_storage_key_out_of_response()
    {
        var fixture = AccessFixture.Create();
        var orderId = Guid.Parse("00000000-0000-0000-0000-000000000701");
        var itemId = Guid.Parse("00000000-0000-0000-0000-000000000702");
        var repository = new RecordingEvidenceRepository(orderId, itemId, "Condition recorded.");
        var storage = new RecordingObjectStorage();
        var service = CreateService(fixture, repository, storage, orderId, itemId);

        var response = await service.UploadAsync(
            itemId,
            FormFile(PngBytes(), "condition.png", "image/png"),
            null,
            "evidence-1",
            CancellationToken.None);

        Assert.Equal(itemId, response.RepairItemId);
        Assert.Equal("before_repair", response.Stage);
        Assert.Equal("image/png", response.MimeType);
        Assert.DoesNotContain("workspaces/", response.ToString(), StringComparison.OrdinalIgnoreCase);
        Assert.Single(storage.Objects);
        Assert.Single(repository.Evidence);
    }

    [Fact]
    public async Task Upload_rejects_wrong_extension_or_content_signature()
    {
        var fixture = AccessFixture.Create();
        var orderId = Guid.Parse("00000000-0000-0000-0000-000000000711");
        var itemId = Guid.Parse("00000000-0000-0000-0000-000000000712");
        var repository = new RecordingEvidenceRepository(orderId, itemId, "Condition recorded.");
        var service = CreateService(fixture, repository, new RecordingObjectStorage(), orderId, itemId);

        var exception = await Assert.ThrowsAsync<ApiException>(() => service.UploadAsync(
            itemId,
            FormFile([1, 2, 3], "condition.exe", "application/octet-stream"),
            null,
            "evidence-invalid",
            CancellationToken.None));

        Assert.Equal(StatusCodes.Status415UnsupportedMediaType, exception.StatusCode);
        Assert.Equal("EVIDENCE_IMAGE_TYPE_INVALID", exception.Code);
    }

    [Fact]
    public async Task Upload_requires_general_condition_description_and_is_idempotent()
    {
        var fixture = AccessFixture.Create();
        var orderId = Guid.Parse("00000000-0000-0000-0000-000000000721");
        var itemId = Guid.Parse("00000000-0000-0000-0000-000000000722");
        var emptyConditionRepository = new RecordingEvidenceRepository(orderId, itemId, " ");
        var emptyConditionStorage = new RecordingObjectStorage();
        var emptyConditionService = CreateService(
            fixture,
            emptyConditionRepository,
            emptyConditionStorage,
            orderId,
            itemId);

        var conditionException = await Assert.ThrowsAsync<ApiException>(() => emptyConditionService.UploadAsync(
            itemId,
            FormFile(PngBytes(), "condition.png", "image/png"),
            null,
            "evidence-condition",
            CancellationToken.None));
        Assert.Equal("EVIDENCE_CONDITION_REQUIRED", conditionException.Code);
        Assert.Empty(emptyConditionStorage.Objects);

        var repository = new RecordingEvidenceRepository(orderId, itemId, "Condition recorded.");
        var storage = new RecordingObjectStorage();
        var service = CreateService(fixture, repository, storage, orderId, itemId);
        var first = await service.UploadAsync(
            itemId,
            FormFile(PngBytes(), "condition.png", "image/png"),
            null,
            "evidence-retry",
            CancellationToken.None);
        var retry = await service.UploadAsync(
            itemId,
            FormFile(PngBytes(), "renamed.png", "image/png"),
            null,
            "evidence-retry",
            CancellationToken.None);

        Assert.Equal(first.Id, retry.Id);
        Assert.Single(repository.Evidence);
        Assert.Single(storage.PutKeys);
    }

    [Fact]
    public async Task Upload_and_delete_are_rejected_after_item_lock()
    {
        var fixture = AccessFixture.Create();
        var orderId = Guid.Parse("00000000-0000-0000-0000-000000000731");
        var itemId = Guid.Parse("00000000-0000-0000-0000-000000000732");
        var lockedAt = DateTimeOffset.UtcNow.AddMinutes(-1);
        var repository = new RecordingEvidenceRepository(
            orderId,
            itemId,
            "Condition recorded.",
            lockedAt,
            fixture.ReceptionistStaff.Id);
        var service = CreateService(fixture, repository, new RecordingObjectStorage(), orderId, itemId);

        var exception = await Assert.ThrowsAsync<ApiException>(() => service.UploadAsync(
            itemId,
            FormFile(PngBytes(), "condition.png", "image/png"),
            null,
            "evidence-locked",
            CancellationToken.None));

        Assert.Equal("EVIDENCE_LOCKED", exception.Code);
    }

    private static RepairEvidenceService CreateService(
        AccessFixtureSet fixture,
        RecordingEvidenceRepository repository,
        RecordingObjectStorage storage,
        Guid orderId,
        Guid itemId)
    {
        var accessor = new RequestAccessContextAccessor();
        accessor.SetCurrent(AccessFixture.CreateContext(
            fixture.ActiveReceptionistAccount,
            fixture.PrimaryWorkspace,
            fixture.ReceptionistMembership,
            fixture.ReceptionistStaff));
        return new RepairEvidenceService(
            accessor,
            new AccessAuthorizationPolicy(),
            new RecordingOrderRepository(repository.Order),
            repository,
            storage,
            NullLogger<RepairEvidenceService>.Instance);
    }

    private static IFormFile FormFile(byte[] bytes, string filename, string contentType)
    {
        var file = new FormFile(new MemoryStream(bytes), 0, bytes.Length, "file", filename)
        {
            Headers = new HeaderDictionary(),
            ContentType = contentType
        };
        return file;
    }

    private static byte[] PngBytes() => [137, 80, 78, 71, 13, 10, 26, 10, 0, 1, 2, 3];

    private sealed class RecordingObjectStorage : IPrivateObjectStorage
    {
        public Dictionary<string, byte[]> Objects { get; } = new(StringComparer.Ordinal);
        public List<string> PutKeys { get; } = [];
        public TimeSpan SignedReadLifetime => TimeSpan.FromMinutes(5);

        public async Task PutAsync(
            string objectKey,
            string contentType,
            Stream content,
            long contentLength,
            CancellationToken cancellationToken = default)
        {
            await using var buffer = new MemoryStream();
            await content.CopyToAsync(buffer, cancellationToken);
            Objects[objectKey] = buffer.ToArray();
            PutKeys.Add(objectKey);
        }

        public Task DeleteAsync(string objectKey, CancellationToken cancellationToken = default)
        {
            Objects.Remove(objectKey);
            return Task.CompletedTask;
        }

        public Task<string> CreateReadUrlAsync(
            string objectKey,
            DateTimeOffset expiresAt,
            CancellationToken cancellationToken = default) =>
            Task.FromResult($"https://storage.test/signed/{Uri.EscapeDataString(objectKey)}");
    }

    private sealed class RecordingEvidenceRepository : IRepairEvidenceRepository
    {
        private readonly DateTimeOffset? _lockedAt;
        private readonly Guid? _lockedBy;

        public RecordingEvidenceRepository(
            Guid orderId,
            Guid itemId,
            string? handoverCondition,
            DateTimeOffset? lockedAt = null,
            Guid? lockedBy = null)
        {
            Order = BuildOrder(orderId, itemId, handoverCondition, lockedAt, lockedBy);
            _lockedAt = lockedAt;
            _lockedBy = lockedBy;
        }

        public RepairOrderEntity Order { get; }
        public List<RepairEvidence> Evidence { get; } = [];

        public Task<RepairEvidenceItemContext?> FindItemContextAsync(
            Guid workspaceId,
            Guid repairItemId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<RepairEvidenceItemContext?>(new(
                Order.Id,
                repairItemId,
                Order.RepairItems![0].HandoverCondition,
                _lockedAt,
                _lockedBy));

        public Task<IReadOnlyList<RepairEvidence>> ListAsync(
            Guid workspaceId,
            Guid repairItemId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<RepairEvidence>>(
                Evidence.Where(item => item.DeletedAt is null).ToArray());

        public Task<RepairEvidence?> FindAsync(
            Guid workspaceId,
            Guid evidenceId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<RepairEvidence?>(Evidence.SingleOrDefault(item => item.Id == evidenceId && item.DeletedAt is null));

        public Task<RepairEvidence?> FindActiveByIdempotencyAsync(
            Guid workspaceId,
            Guid repairItemId,
            RepairEvidenceStage stage,
            string idempotencyKey,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<RepairEvidence?>(Evidence.SingleOrDefault(item =>
                item.IdempotencyKey == idempotencyKey && item.DeletedAt is null));

        public Task<RepairEvidence?> FindActiveByChecksumAsync(
            Guid workspaceId,
            Guid repairItemId,
            RepairEvidenceStage stage,
            string checksum,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<RepairEvidence?>(Evidence.SingleOrDefault(item =>
                item.Checksum == checksum && item.DeletedAt is null));

        public Task<RepairEvidenceCreateResult> CreateAsync(
            RepairEvidenceCreateData data,
            CancellationToken cancellationToken = default)
        {
            var existing = Evidence.SingleOrDefault(item =>
                item.IdempotencyKey == data.IdempotencyKey || item.Checksum == data.Checksum);
            if (existing is not null)
            {
                return Task.FromResult(new RepairEvidenceCreateResult(existing, true));
            }

            var created = new RepairEvidence(
                data.Id,
                data.WorkspaceId,
                data.RepairOrderId,
                data.RepairItemId,
                data.Stage,
                data.ObjectKey,
                data.OriginalFilename,
                data.MimeType,
                data.SizeBytes,
                data.Checksum,
                data.IdempotencyKey,
                data.CreatedBy,
                data.CreatedAt);
            Evidence.Add(created);
            return Task.FromResult(new RepairEvidenceCreateResult(created, false));
        }

        public Task<RepairEvidenceDeleteResult?> SoftDeleteAsync(
            Guid workspaceId,
            Guid repairItemId,
            Guid evidenceId,
            Guid actorId,
            CancellationToken cancellationToken = default)
        {
            var evidence = Evidence.SingleOrDefault(item => item.Id == evidenceId && item.DeletedAt is null);
            if (evidence is null)
            {
                return Task.FromResult<RepairEvidenceDeleteResult?>(null);
            }

            var deleted = evidence with { DeletedAt = DateTimeOffset.UtcNow, DeletedBy = actorId };
            Evidence[Evidence.IndexOf(evidence)] = deleted;
            return Task.FromResult<RepairEvidenceDeleteResult?>(new(deleted, evidence.ObjectKey));
        }

        public Task<RepairEvidenceLockResult?> LockItemAsync(
            Guid workspaceId,
            Guid repairOrderId,
            Guid repairItemId,
            Guid actorId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<RepairEvidenceLockResult?>(new(
                repairOrderId,
                repairItemId,
                _lockedAt ?? DateTimeOffset.UtcNow,
                _lockedBy ?? actorId,
                _lockedAt is not null));

        private static RepairOrderEntity BuildOrder(
            Guid orderId,
            Guid itemId,
            string? handoverCondition,
            DateTimeOffset? lockedAt,
            Guid? lockedBy) =>
            new(
                orderId,
                Guid.Parse("00000000-0000-0000-0000-000000000001"),
                "RF-0001",
                Guid.Parse("00000000-0000-0000-0000-000000000801"),
                Guid.Parse("00000000-0000-0000-0000-000000000802"),
                RepairOrderStatus.Received,
                "Screen issue",
                null,
                DateTimeOffset.UtcNow,
                null,
                null,
                null,
                null,
                Guid.Parse("00000000-0000-0000-0000-000000000201"),
                DateTimeOffset.UtcNow,
                DateTimeOffset.UtcNow,
                [new Assignment(
                    Guid.Parse("00000000-0000-0000-0000-000000000803"),
                    Guid.Parse("00000000-0000-0000-0000-000000000103"),
                    "Receptionist Demo",
                    StaffResponsibility.Intake,
                    true,
                    DateTimeOffset.UtcNow,
                    null,
                    null)],
                [],
                [new RepairOrderItem(
                    itemId,
                    orderId,
                    1,
                    Guid.Parse("00000000-0000-0000-0000-000000000802"),
                    RepairOrderStatus.Received,
                    "phone",
                    "Demo",
                    "Device",
                    null,
                    null,
                    "Screen issue",
                    handoverCondition,
                    null,
                    null,
                    "not_required",
                    false,
                    null,
                    null,
                    null,
                    DateTimeOffset.UtcNow,
                    [],
                    lockedAt,
                    lockedBy)]);
    }

    private sealed class RecordingOrderRepository : IRepairOrderRepository
    {
        private readonly RepairOrderEntity _order;

        public RecordingOrderRepository(RepairOrderEntity order)
        {
            _order = order;
        }

        public Task<IReadOnlyList<RepairOrderEntity>> SearchAsync(
            Guid workspaceId,
            string? status,
            Guid? customerId,
            Guid? deviceId,
            string? search,
            Guid? assignedStaffId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<RepairOrderEntity>>([_order]);

        public Task<RepairOrderEntity?> FindAsync(
            Guid workspaceId,
            Guid orderId,
            Guid? assignedStaffId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<RepairOrderEntity?>(_order.Id == orderId ? _order : null);

        public Task<RepairOrderEntity> CreateAsync(
            Guid workspaceId,
            CreateRepairOrderData data,
            CancellationToken cancellationToken = default) =>
            throw new NotSupportedException();
    }
}
