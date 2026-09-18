namespace RepairFlow.Api.Features.Customer.Domain;

public sealed record Customer(
    Guid Id,
    Guid WorkspaceId,
    string Name,
    string Phone,
    string? Email,
    string? Note,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public sealed record CreateCustomerData(
    string Name,
    string Phone,
    string? Email,
    string? Note,
    Guid CreatedBy);
