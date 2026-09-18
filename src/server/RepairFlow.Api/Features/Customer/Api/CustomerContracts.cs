namespace RepairFlow.Api.Features.Customer.Api;

public sealed record CreateCustomerRequest(
    string Name,
    string Phone,
    string? Email = null,
    string? Note = null);

public sealed record CustomerResponse(
    Guid Id,
    string Name,
    string Phone,
    string? Email,
    string? Note,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);
