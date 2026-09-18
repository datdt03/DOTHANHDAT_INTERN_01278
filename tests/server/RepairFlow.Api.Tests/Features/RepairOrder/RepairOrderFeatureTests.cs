using RepairFlow.Api.Api.Responses;
using Microsoft.AspNetCore.Http;
using RepairFlow.Api.Features.Access.Application;
using RepairFlow.Api.Features.Access.Domain;
using RepairFlow.Api.Features.RepairOrder.Api;
using RepairFlow.Api.Features.RepairOrder.Application;
using RepairFlow.Api.Features.RepairOrder.Domain;
using RepairFlow.Api.Tests.Features.Access;
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

    private static RepairOrderService CreateService(
        AccessFixtureSet fixture,
        RecordingRepairOrderRepository repository,
        AccessRole role)
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
        return new RepairOrderService(accessor, new AccessAuthorizationPolicy(), repository);
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
}
