using RepairFlow.Api.Features.Customer.Domain;
using CustomerEntity = RepairFlow.Api.Features.Customer.Domain.Customer;

namespace RepairFlow.Api.Features.Customer.Application;

public interface ICustomerRepository
{
    Task<IReadOnlyList<CustomerEntity>> SearchAsync(
        Guid workspaceId,
        string? search,
        string? phone,
        string? email,
        Guid? assignedStaffId,
        CancellationToken cancellationToken = default);

    Task<CustomerEntity?> FindAsync(
        Guid workspaceId,
        Guid customerId,
        Guid? assignedStaffId,
        CancellationToken cancellationToken = default);

    Task<CustomerEntity> CreateAsync(
        Guid workspaceId,
        CreateCustomerData data,
        CancellationToken cancellationToken = default);
}

public sealed class CustomerConflictException : Exception
{
    public CustomerConflictException(string code, string message, object? details = null)
        : base(message)
    {
        Code = code;
        Details = details;
    }

    public string Code { get; }

    public object? Details { get; }
}
