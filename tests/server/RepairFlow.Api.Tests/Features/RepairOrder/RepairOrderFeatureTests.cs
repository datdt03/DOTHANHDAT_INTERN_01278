using RepairFlow.Api.Api.Responses;
using Microsoft.AspNetCore.Http;
using RepairFlow.Api.Features.Access.Application;
using RepairFlow.Api.Features.Access.Domain;
using RepairFlow.Api.Features.RepairOrder.Api;
using RepairFlow.Api.Features.RepairOrder.Application;
using RepairFlow.Api.Features.RepairOrder.Domain;
using RepairFlow.Api.Tests.Features.Access;
using CustomerEntity = RepairFlow.Api.Features.Customer.Domain.Customer;
using RepairOrderEntity = RepairFlow.Api.Features.RepairOrder.Domain.RepairOrder;

namespace RepairFlow.Api.Tests.Features.RepairOrder;

public sealed class RepairOrderFeatureTests
{
    [Fact]
    public async Task Create_returns_received_order_with_initial_history_and_safe_response()
    {
        var fixture = AccessFixture.Create();
        var repository = new RecordingRepairOrderRepository();
        var service = CreateService(fixture, repository, AccessRole.Manager);

        var response = await service.CreateAsync(
            new CreateRepairOrderRequest(
                Guid.NewGuid(),
                Guid.NewGuid(),
                "Screen is cracked",
                "technician-only note"),
            CancellationToken.None);

        Assert.Equal("received", response.Status);
        Assert.Single(response.StatusHistory);
        Assert.Equal("received", response.StatusHistory[0].ToStatus);
        Assert.DoesNotContain("InternalNote", response.GetType().GetProperties().Select(property => property.Name));
        Assert.Equal("technician-only note", repository.Created!.InternalNote);
    }

    [Fact]
    public async Task Open_order_conflict_preserves_safe_details()
    {
        var fixture = AccessFixture.Create();
        var repository = new RecordingRepairOrderRepository
        {
            CreateException = new RepairOrderConflictException(
                "device_open_order",
                "This device already has an open repair order.",
                new { orders = Array.Empty<object>() })
        };
        var service = CreateService(fixture, repository, AccessRole.Manager);

        var exception = await Assert.ThrowsAsync<ApiException>(() => service.CreateAsync(
            new CreateRepairOrderRequest(Guid.NewGuid(), Guid.NewGuid(), "Another issue"),
            CancellationToken.None));

        Assert.Equal(StatusCodes.Status409Conflict, exception.StatusCode);
        Assert.Equal("device_open_order", exception.Code);
    }

    [Fact]
    public async Task Technician_cannot_read_unassigned_order()
    {
        var fixture = AccessFixture.Create();
        var accessor = new RequestAccessContextAccessor();
        var technicianMembership = new WorkspaceMembership(
            Guid.Parse("00000000-0000-0000-0000-000000000306"),
            fixture.PrimaryWorkspace.Id,
            fixture.TechnicianStaff.Id,
            AccessRole.Technician,
            MembershipStatus.Active);
        accessor.SetCurrent(AccessFixture.CreateContext(
            new AccessPrincipal(
                Guid.Parse("00000000-0000-0000-0000-000000000206"),
                "technician@example.test",
                fixture.TechnicianStaff.Id,
                AccountStatus.Active),
            fixture.PrimaryWorkspace,
            technicianMembership,
            fixture.TechnicianStaff));
        var repository = new RecordingRepairOrderRepository();
        var service = new RepairOrderService(accessor, new AccessAuthorizationPolicy(), repository);

        var exception = await Assert.ThrowsAsync<ApiException>(() => service.GetAsync(
            Guid.NewGuid(),
            CancellationToken.None));

        Assert.Equal(StatusCodes.Status404NotFound, exception.StatusCode);
        Assert.Equal(fixture.TechnicianStaff.Id, repository.LastAssignedStaffId);
    }

    [Fact]
    public async Task Technician_can_read_an_order_with_an_active_assignment()
    {
        var fixture = AccessFixture.Create();
        var orderId = Guid.NewGuid();
        var now = DateTimeOffset.UtcNow;
        var repository = new RecordingRepairOrderRepository
        {
            FindResult = new RepairOrderEntity(
                orderId,
                fixture.PrimaryWorkspace.Id,
                "RF-2026-000001",
                Guid.NewGuid(),
                Guid.NewGuid(),
                RepairOrderStatus.Received,
                "Assigned issue",
                null,
                now,
                null,
                null,
                null,
                null,
                fixture.TechnicianStaff.Id,
                now,
                now,
                [new Assignment(
                    Guid.NewGuid(),
                    fixture.TechnicianStaff.Id,
                    fixture.TechnicianStaff.Name,
                    StaffResponsibility.Diagnosis,
                    true,
                    now,
                    null,
                    null)],
                [new StatusHistory(Guid.NewGuid(), null, RepairOrderStatus.Received, fixture.TechnicianStaff.Id, null, now)])
        };
        var accessor = new RequestAccessContextAccessor();
        accessor.SetCurrent(CreateTechnicianContext(fixture));
        var service = new RepairOrderService(accessor, new AccessAuthorizationPolicy(), repository);

        var response = await service.GetAsync(orderId, CancellationToken.None);

        Assert.Equal(orderId, response.Id);
        Assert.Equal(fixture.TechnicianStaff.Id, repository.LastAssignedStaffId);
    }

    [Fact]
    public async Task Intake_normalizes_new_customer_and_keeps_multiple_items_atomic()
    {
        var fixture = AccessFixture.Create();
        var repository = new RecordingRepairOrderRepository();
        var intakeRepository = new RecordingRepairOrderIntakeRepository(fixture.PrimaryWorkspace.Id);
        var service = CreateService(
            fixture,
            repository,
            AccessRole.Manager,
            intakeRepository,
            new RecordingCredentialRepository(),
            new StubCredentialProtector());

        var response = await service.CreateIntakeAsync(
            new CreateRepairIntakeCommand(
                new CustomerIntakeCommand("new", null, " Nguyen Van B ", "+84 123-456-789", "b@example.test", null),
                [
                    new RepairItemIntakeCommand(
                        new DeviceIntakeCommand("phone", "Apple", "iPhone 13", "SN-001", null),
                        "Máy không lên nguồn",
                        "Xước nhẹ",
                        "Cáp sạc",
                        "Giữ nguyên dữ liệu",
                        new CredentialIntakeCommand("passcode_provided", "1234", true)),
                    new RepairItemIntakeCommand(
                        new DeviceIntakeCommand("tablet", "Samsung", "Tab S8", null, "IMEI-002"),
                        "Màn hình bị sọc",
                        null,
                        null,
                        null,
                        null)
                ],
                "Tiếp nhận tại quầy",
                null,
                null,
                fixture.ManagerStaff.Id,
                "intake-001"),
            CancellationToken.None);

        Assert.Equal("+84123456789", intakeRepository.Created!.Customer.Phone);
        Assert.Equal(2, intakeRepository.Created.RepairItems.Count);
        Assert.Equal("ciphertext", intakeRepository.Created.RepairItems[0].Credential!.Ciphertext);
        Assert.Equal("received", response.RepairOrder.Status);
        Assert.Equal(2, response.RepairItems.Count);
        Assert.Equal("passcode_provided", response.RepairItems[0].CredentialStatus);
    }

    [Fact]
    public async Task Intake_rejects_empty_items_before_persistence()
    {
        var fixture = AccessFixture.Create();
        var intakeRepository = new RecordingRepairOrderIntakeRepository(fixture.PrimaryWorkspace.Id);
        var service = CreateService(
            fixture,
            new RecordingRepairOrderRepository(),
            AccessRole.Manager,
            intakeRepository,
            new RecordingCredentialRepository(),
            new StubCredentialProtector());

        await Assert.ThrowsAsync<ApiValidationException>(() => service.CreateIntakeAsync(
            new CreateRepairIntakeCommand(
                new CustomerIntakeCommand("existing", Guid.NewGuid(), null, null, null, null),
                [],
                null,
                null,
                null,
                fixture.ManagerStaff.Id,
                "intake-002"),
            CancellationToken.None));

        Assert.False(intakeRepository.CreateCalled);
    }

    [Fact]
    public async Task Credential_reveal_returns_secret_only_to_authorized_context_and_records_access()
    {
        var fixture = AccessFixture.Create();
        var credentialRepository = new RecordingCredentialRepository
        {
            Credential = new StoredCredential(
                Guid.NewGuid(),
                Guid.NewGuid(),
                "passcode_provided",
                "ciphertext",
                "v1",
                DateTimeOffset.UtcNow.AddHours(1),
                null)
        };
        var service = CreateService(
            fixture,
            new RecordingRepairOrderRepository
            {
                FindResult = new RepairOrderEntity(
                    credentialRepository.Credential.RepairOrderId,
                    fixture.PrimaryWorkspace.Id,
                    "RF-2026-000001",
                    Guid.NewGuid(),
                    Guid.NewGuid(),
                    RepairOrderStatus.Received,
                    "Issue",
                    null,
                    DateTimeOffset.UtcNow,
                    null,
                    null,
                    null,
                    null,
                    fixture.ManagerStaff.Id,
                    DateTimeOffset.UtcNow,
                    DateTimeOffset.UtcNow,
                    [],
                    [])
            },
            AccessRole.Manager,
            new RecordingRepairOrderIntakeRepository(fixture.PrimaryWorkspace.Id),
            credentialRepository,
            new StubCredentialProtector());

        var response = await service.RevealCredentialAsync(
            credentialRepository.Credential.RepairOrderId,
            credentialRepository.Credential.RepairItemId,
            CancellationToken.None);

        Assert.Equal("secret", response.Value);
        Assert.True(credentialRepository.RevealRecorded);
    }

    private static RepairOrderService CreateService(
        AccessFixtureSet fixture,
        RecordingRepairOrderRepository repository,
        AccessRole role,
        IRepairOrderIntakeRepository? intakeRepository = null,
        IRepairOrderCredentialRepository? credentialRepository = null,
        ICredentialProtector? credentialProtector = null)
    {
        var accessor = new RequestAccessContextAccessor();
        var membership = role == AccessRole.Manager
            ? fixture.SuspendedManagerMembership with { Status = MembershipStatus.Active }
            : fixture.ReceptionistMembership;
        var principal = role == AccessRole.Manager
            ? fixture.InactiveManagerAccount with { Status = AccountStatus.Active }
            : fixture.ActiveReceptionistAccount;
        var staff = role == AccessRole.Manager ? fixture.ManagerStaff : fixture.ReceptionistStaff;
        accessor.SetCurrent(AccessFixture.CreateContext(principal, fixture.PrimaryWorkspace, membership, staff));
        return new RepairOrderService(
            accessor,
            new AccessAuthorizationPolicy(),
            repository,
            intakeRepository,
            credentialRepository,
            credentialProtector);
    }

    private static AccessContext CreateTechnicianContext(AccessFixtureSet fixture) =>
        AccessFixture.CreateContext(
            new AccessPrincipal(
                Guid.Parse("00000000-0000-0000-0000-000000000206"),
                "technician@example.test",
                fixture.TechnicianStaff.Id,
                AccountStatus.Active),
            fixture.PrimaryWorkspace,
            new WorkspaceMembership(
                Guid.Parse("00000000-0000-0000-0000-000000000306"),
                fixture.PrimaryWorkspace.Id,
                fixture.TechnicianStaff.Id,
                AccessRole.Technician,
                MembershipStatus.Active),
            fixture.TechnicianStaff);

    private sealed class RecordingRepairOrderRepository : IRepairOrderRepository
    {
        public CreateRepairOrderData? Created { get; private set; }
        public RepairOrderConflictException? CreateException { get; init; }
        public Guid? LastAssignedStaffId { get; private set; }
        public RepairOrderEntity? FindResult { get; init; }

        public Task<IReadOnlyList<RepairOrderEntity>> SearchAsync(
            Guid workspaceId,
            string? status,
            Guid? customerId,
            Guid? deviceId,
            string? search,
            Guid? assignedStaffId,
            CancellationToken cancellationToken = default)
        {
            LastAssignedStaffId = assignedStaffId;
            IReadOnlyList<RepairOrderEntity> result = [];
            return Task.FromResult(result);
        }

        public Task<RepairOrderEntity?> FindAsync(
            Guid workspaceId,
            Guid orderId,
            Guid? assignedStaffId,
            CancellationToken cancellationToken = default)
        {
            LastAssignedStaffId = assignedStaffId;
            return Task.FromResult(FindResult);
        }

        public Task<RepairOrderEntity> CreateAsync(
            Guid workspaceId,
            CreateRepairOrderData data,
            CancellationToken cancellationToken = default)
        {
            if (CreateException is not null)
            {
                throw CreateException;
            }

            Created = data;
            var now = DateTimeOffset.UtcNow;
            var order = new RepairOrderEntity(
                Guid.NewGuid(),
                workspaceId,
                "RF-2026-000001",
                data.CustomerId,
                data.DeviceId,
                RepairOrderStatus.Received,
                data.CustomerDescription,
                data.InternalNote,
                now,
                data.ExpectedCompletedAt,
                null,
                null,
                null,
                data.CreatedBy,
                now,
                now,
                [],
                [new StatusHistory(Guid.NewGuid(), null, RepairOrderStatus.Received, data.CreatedBy, null, now)]);
            return Task.FromResult(order);
        }
    }

    private sealed class RecordingRepairOrderIntakeRepository(Guid workspaceId) : IRepairOrderIntakeRepository
    {
        public CreateRepairIntakeData? Created { get; private set; }
        public bool CreateCalled { get; private set; }

        public Task<RepairIntakeResult> CreateAsync(
            Guid requestedWorkspaceId,
            CreateRepairIntakeData data,
            CancellationToken cancellationToken = default)
        {
            CreateCalled = true;
            Created = data;
            var now = DateTimeOffset.UtcNow;
            var customerId = data.Customer.Id ?? Guid.NewGuid();
            var customer = new CustomerEntity(
                customerId,
                workspaceId,
                data.Customer.Name ?? "Existing Customer",
                data.Customer.Phone ?? "+84123456789",
                data.Customer.Email,
                data.Customer.Note,
                now,
                now);
            var orderId = Guid.NewGuid();
            var items = data.RepairItems.Select((item, index) => new RepairOrderItem(
                Guid.NewGuid(),
                orderId,
                index + 1,
                Guid.NewGuid(),
                RepairOrderStatus.Received,
                item.Device.DeviceType,
                item.Device.Brand,
                item.Device.Model,
                item.Device.SerialNumber,
                item.Device.DeviceIdentifier,
                item.ReportedIssue,
                item.HandoverCondition,
                item.Accessories,
                item.ItemNotes,
                item.Credential?.Status ?? "not_required",
                item.Credential?.Consent ?? false,
                item.Credential?.ReceivedAt,
                item.Credential?.ExpiresAt,
                null,
                now)).ToArray();
            var order = new RepairOrderEntity(
                orderId,
                workspaceId,
                "RF-2026-000001",
                customerId,
                items[0].DeviceId,
                RepairOrderStatus.Received,
                items[0].ReportedIssue,
                data.IntakeNotes,
                now,
                data.ExpectedCompletedAt,
                null,
                null,
                null,
                data.CreatedBy,
                now,
                now,
                [],
                [new StatusHistory(Guid.NewGuid(), null, RepairOrderStatus.Received, data.CreatedBy, null, now)]);
            return Task.FromResult(new RepairIntakeResult(customer, order, items));
        }
    }

    private sealed class RecordingCredentialRepository : IRepairOrderCredentialRepository
    {
        public StoredCredential Credential { get; init; } = new(
            Guid.NewGuid(),
            Guid.NewGuid(),
            "passcode_provided",
            "ciphertext",
            "v1",
            DateTimeOffset.UtcNow.AddHours(1),
            null);

        public bool RevealRecorded { get; private set; }

        public Task<StoredCredential?> FindCredentialAsync(
            Guid workspaceId,
            Guid orderId,
            Guid itemId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<StoredCredential?>(Credential);

        public Task RecordCredentialRevealAsync(
            Guid workspaceId,
            Guid orderId,
            Guid itemId,
            Guid actorId,
            CancellationToken cancellationToken = default)
        {
            RevealRecorded = true;
            return Task.CompletedTask;
        }

        public Task<DestroyedCredential?> DestroyCredentialAsync(
            Guid workspaceId,
            Guid orderId,
            Guid itemId,
            Guid actorId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<DestroyedCredential?>(new DestroyedCredential(orderId, itemId, DateTimeOffset.UtcNow));
    }

    private sealed class StubCredentialProtector : ICredentialProtector
    {
        public ProtectedCredential Protect(string value, DateTimeOffset receivedAt, TimeSpan lifetime) =>
            new("ciphertext", "v1", receivedAt, receivedAt.Add(lifetime));

        public string Unprotect(string ciphertext, string keyVersion) => "secret";
    }
}
