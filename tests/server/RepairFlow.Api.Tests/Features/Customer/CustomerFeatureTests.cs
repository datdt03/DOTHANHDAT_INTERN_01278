using RepairFlow.Api.Api.Responses;
using Microsoft.AspNetCore.Http;
using RepairFlow.Api.Features.Access.Application;
using RepairFlow.Api.Features.Access.Api;
using RepairFlow.Api.Features.Access.Domain;
using RepairFlow.Api.Features.Customer.Api;
using RepairFlow.Api.Features.Customer.Application;
using CustomerEntity = RepairFlow.Api.Features.Customer.Domain.Customer;
using RepairFlow.Api.Features.Customer.Domain;
using RepairFlow.Api.Tests.Features.Access;

namespace RepairFlow.Api.Tests.Features.Customer;

public sealed class CustomerFeatureTests
{
    [Fact]
    public async Task Create_normalizes_phone_before_persisting()
    {
        var fixture = AccessFixture.Create();
        var repository = new RecordingCustomerRepository();
        var service = CreateService(fixture, repository);

        var response = await service.CreateAsync(
            new CreateCustomerRequest("  Nguyen Van A  ", "+84 123-456-789"),
            CancellationToken.None);

        Assert.Equal("+84123456789", repository.Created!.Phone);
        Assert.Equal("Nguyen Van A", repository.Created.Name);
        Assert.NotEqual(Guid.Empty, response.Id);
    }

    [Fact]
    public async Task Duplicate_phone_is_exposed_as_conflict_without_leaking_database_details()
    {
        var fixture = AccessFixture.Create();
        var repository = new RecordingCustomerRepository
        {
            CreateException = new CustomerConflictException(
                "customer_phone_exists",
                "A customer with this phone number already exists in the workspace.")
        };
        var service = CreateService(fixture, repository);

        var exception = await Assert.ThrowsAsync<ApiException>(() => service.CreateAsync(
            new CreateCustomerRequest("Duplicate", "+84123456789"),
            CancellationToken.None));

        Assert.Equal(StatusCodes.Status409Conflict, exception.StatusCode);
        Assert.Equal("customer_phone_exists", exception.Code);
        Assert.DoesNotContain("constraint", exception.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Technician_search_is_scoped_to_assigned_staff()
    {
        var fixture = AccessFixture.Create();
        var technicianPrincipal = new AccessPrincipal(
            Guid.Parse("00000000-0000-0000-0000-000000000206"),
            "technician@example.test",
            fixture.TechnicianStaff.Id,
            AccountStatus.Active);
        var technicianMembership = new WorkspaceMembership(
            Guid.Parse("00000000-0000-0000-0000-000000000306"),
            fixture.PrimaryWorkspace.Id,
            fixture.TechnicianStaff.Id,
            AccessRole.Technician,
            MembershipStatus.Active);
        var context = AccessFixture.CreateContext(
            technicianPrincipal,
            fixture.PrimaryWorkspace,
            technicianMembership,
            fixture.TechnicianStaff);
        var accessor = new RequestAccessContextAccessor();
        accessor.SetCurrent(context);
        var repository = new RecordingCustomerRepository();
        var service = new CustomerService(accessor, new AccessAuthorizationPolicy(), repository);

        await service.SearchAsync("phone", null, CancellationToken.None);

        Assert.Equal(fixture.TechnicianStaff.Id, repository.LastAssignedStaffId);
    }

    private static CustomerService CreateService(
        AccessFixtureSet fixture,
        RecordingCustomerRepository repository)
    {
        var accessor = new RequestAccessContextAccessor();
        accessor.SetCurrent(AccessFixture.CreateContext(
            fixture.ActiveOwnerAccount,
            fixture.PrimaryWorkspace,
            fixture.OwnerMembership,
            fixture.OwnerStaff));
        return new CustomerService(accessor, new AccessAuthorizationPolicy(), repository);
    }

    private sealed class RecordingCustomerRepository : ICustomerRepository
    {
        public CreateCustomerData? Created { get; private set; }
        public CustomerConflictException? CreateException { get; init; }
        public Guid? LastAssignedStaffId { get; private set; }

        public Task<IReadOnlyList<CustomerEntity>> SearchAsync(
            Guid workspaceId,
            string? search,
            string? phone,
            string? email,
            Guid? assignedStaffId,
            CancellationToken cancellationToken = default)
        {
            LastAssignedStaffId = assignedStaffId;
            IReadOnlyList<CustomerEntity> result = [];
            return Task.FromResult(result);
        }

        public Task<CustomerEntity?> FindAsync(
            Guid workspaceId,
            Guid customerId,
            Guid? assignedStaffId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<CustomerEntity?>(null);

        public Task<CustomerEntity> CreateAsync(
            Guid workspaceId,
            CreateCustomerData data,
            CancellationToken cancellationToken = default)
        {
            if (CreateException is not null)
            {
                throw CreateException;
            }

            Created = data;
            var now = DateTimeOffset.UtcNow;
            return Task.FromResult(new CustomerEntity(
                Guid.NewGuid(), workspaceId, data.Name, data.Phone, data.Email, data.Note, now, now));
        }
    }
}
