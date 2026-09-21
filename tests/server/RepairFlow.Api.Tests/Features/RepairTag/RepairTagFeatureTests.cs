using Microsoft.AspNetCore.Http;
using RepairFlow.Api.Api.Responses;
using RepairFlow.Api.Features.Access.Application;
using RepairFlow.Api.Features.Access.Domain;
using RepairFlow.Api.Features.RepairOrder.Application;
using RepairFlow.Api.Features.RepairOrder.Domain;
using RepairFlow.Api.Features.RepairTag.Api;
using RepairFlow.Api.Features.RepairTag.Application;
using RepairFlow.Api.Features.RepairTag.Domain;
using RepairFlow.Api.Tests.Features.Access;
using RepairOrderEntity = RepairFlow.Api.Features.RepairOrder.Domain.RepairOrder;
using RepairTagEntity = RepairFlow.Api.Features.RepairTag.Domain.RepairTag;

namespace RepairFlow.Api.Tests.Features.RepairTag;

public sealed class RepairTagFeatureTests
{
    [Fact]
    public void Tag_name_policy_normalizes_case_and_unicode_without_accepting_control_characters()
    {
        var accepted = RepairTagNamePolicy.TryNormalize(
            "  Điện thoại  ",
            out var name,
            out var normalized,
            out var error);

        Assert.True(accepted);
        Assert.Equal("Điện thoại", name);
        Assert.Equal("ĐIỆN THOẠI", normalized);
        Assert.Null(error);

        Assert.False(RepairTagNamePolicy.TryNormalize(
            "Android\nPhone",
            out _,
            out _,
            out error));
        Assert.Equal(RepairTagNameValidationError.Invalid, error);
    }

    [Fact]
    public void Tag_name_policy_counts_unicode_scalars_and_rejects_unsupported_symbols()
    {
        Assert.True(RepairTagNamePolicy.TryNormalize(
            "𐐀𐐀𐐀",
            out _,
            out _,
            out var unicodeError));
        Assert.Null(unicodeError);

        Assert.False(RepairTagNamePolicy.TryNormalize(
            new string('a', RepairTagNamePolicy.MaxLength + 1),
            out _,
            out _,
            out var lengthError));
        Assert.Equal(RepairTagNameValidationError.TooLong, lengthError);

        Assert.False(RepairTagNamePolicy.TryNormalize(
            "Android/Phone",
            out _,
            out _,
            out var invalidError));
        Assert.Equal(RepairTagNameValidationError.Invalid, invalidError);
    }

    [Fact]
    public async Task Receptionist_can_create_workspace_tag_but_manager_only_can_rename()
    {
        var fixture = AccessFixture.Create();
        var repository = new RecordingRepairTagRepository();
        var orderRepository = new RecordingRepairOrderRepository();
        var receptionistService = CreateService(
            fixture,
            repository,
            orderRepository,
            AccessRole.Receptionist);

        var created = await receptionistService.CreateAsync(
            new CreateRepairTagRequest(" Android "),
            CancellationToken.None);

        Assert.Equal("Android", created.Name);
        Assert.Equal(fixture.PrimaryWorkspace.Id, repository.LastWrite!.WorkspaceId);

        var managerService = CreateService(
            fixture,
            repository,
            orderRepository,
            AccessRole.Manager);
        var renamed = await managerService.RenameAsync(
            created.Id,
            new RenameRepairTagRequest("Android mới"),
            CancellationToken.None);

        Assert.Equal("Android mới", renamed.Name);
        Assert.Equal(created.Id, repository.LastRenamedId);
    }

    [Fact]
    public async Task Technician_cannot_read_workspace_tag_catalog()
    {
        var fixture = AccessFixture.Create();
        var technician = AccessFixture.CreateContext(
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
        var accessor = new RequestAccessContextAccessor();
        accessor.SetCurrent(technician);
        var service = new RepairTagService(
            accessor,
            new AccessAuthorizationPolicy(),
            new RecordingRepairTagRepository(),
            new RecordingRepairOrderRepository());

        var exception = await Assert.ThrowsAsync<ApiException>(() => service.SearchAsync(
            null,
            true,
            CancellationToken.None));

        Assert.Equal(StatusCodes.Status403Forbidden, exception.StatusCode);
    }

    private static RepairTagService CreateService(
        AccessFixtureSet fixture,
        RecordingRepairTagRepository repository,
        RecordingRepairOrderRepository orderRepository,
        AccessRole role)
    {
        var accessor = new RequestAccessContextAccessor();
        var context = role == AccessRole.Receptionist
            ? AccessFixture.CreateContext(
                fixture.ActiveReceptionistAccount,
                fixture.PrimaryWorkspace,
                fixture.ReceptionistMembership,
                fixture.ReceptionistStaff)
            : AccessFixture.CreateContext(
                fixture.InactiveManagerAccount with { Status = AccountStatus.Active },
                fixture.PrimaryWorkspace,
                fixture.SuspendedManagerMembership with { Status = MembershipStatus.Active },
                fixture.ManagerStaff);
        accessor.SetCurrent(context);
        return new RepairTagService(
            accessor,
            new AccessAuthorizationPolicy(),
            repository,
            orderRepository);
    }

    private sealed class RecordingRepairTagRepository : IRepairTagRepository
    {
        public RepairTagWriteRequest? LastWrite { get; private set; }
        public Guid? LastRenamedId { get; private set; }

        public Task<IReadOnlyList<RepairTagEntity>> SearchAsync(
            Guid workspaceId,
            string? normalizedQuery,
            bool includeUnused,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<RepairTagEntity>>([]);

        public Task<RepairTagEntity> CreateAsync(
            RepairTagWriteRequest request,
            CancellationToken cancellationToken = default)
        {
            LastWrite = request;
            return Task.FromResult(Tag(request.WorkspaceId, request.Name, request.NormalizedName));
        }

        public Task<RepairTagEntity> RenameAsync(
            Guid workspaceId,
            Guid tagId,
            RepairTagWriteRequest request,
            CancellationToken cancellationToken = default)
        {
            LastRenamedId = tagId;
            return Task.FromResult(new RepairTagEntity(
                tagId,
                workspaceId,
                request.Name,
                request.NormalizedName,
                request.ActorId,
                DateTimeOffset.UtcNow,
                DateTimeOffset.UtcNow));
        }

        public Task DeleteAsync(
            Guid workspaceId,
            Guid tagId,
            Guid actorId,
            CancellationToken cancellationToken = default) => Task.CompletedTask;

        public Task<RepairItemTagAssignment> ReplaceItemAssignmentsAsync(
            RepairItemTagAssignmentRequest request,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(new RepairItemTagAssignment(
                request.RepairOrderId,
                request.RepairItemId,
                "received",
                []));

        private static RepairTagEntity Tag(Guid workspaceId, string name, string normalizedName) => new(
            Guid.NewGuid(),
            workspaceId,
            name,
            normalizedName,
            Guid.NewGuid(),
            DateTimeOffset.UtcNow,
            DateTimeOffset.UtcNow);
    }

    private sealed class RecordingRepairOrderRepository : IRepairOrderRepository
    {
        public Task<IReadOnlyList<RepairOrderEntity>> SearchAsync(
            Guid workspaceId,
            string? status,
            Guid? customerId,
            Guid? deviceId,
            string? search,
            Guid? assignedStaffId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<RepairOrderEntity>>([]);

        public Task<RepairOrderEntity?> FindAsync(
            Guid workspaceId,
            Guid orderId,
            Guid? assignedStaffId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<RepairOrderEntity?>(null);

        public Task<RepairOrderEntity> CreateAsync(
            Guid workspaceId,
            CreateRepairOrderData data,
            CancellationToken cancellationToken = default) =>
            throw new NotSupportedException();
    }
}
