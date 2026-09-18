using RepairFlow.Api.Api.Responses;
using RepairFlow.Api.Features.Access.Application;
using RepairFlow.Api.Features.Access.Domain;
using RepairFlow.Api.Features.Customer.Api;
using RepairFlow.Api.Features.Customer.Domain;
using CustomerEntity = RepairFlow.Api.Features.Customer.Domain.Customer;

namespace RepairFlow.Api.Features.Customer.Application;

public sealed class CustomerService
{
    private readonly IAccessContextAccessor _contextAccessor;
    private readonly IAccessAuthorizationPolicy _authorizationPolicy;
    private readonly ICustomerRepository _repository;

    public CustomerService(
        IAccessContextAccessor contextAccessor,
        IAccessAuthorizationPolicy authorizationPolicy,
        ICustomerRepository repository)
    {
        _contextAccessor = contextAccessor;
        _authorizationPolicy = authorizationPolicy;
        _repository = repository;
    }

    public async Task<IReadOnlyList<CustomerResponse>> SearchAsync(
        string? search,
        string? phone,
        CancellationToken cancellationToken)
    {
        var context = RequireContext();
        EnsureListRead();
        var customers = await _repository.SearchAsync(
            context.Workspace.Id,
            NormalizeOptional(search),
            NormalizePhoneFilter(phone),
            TechnicianScope(context),
            cancellationToken);
        return customers.Select(ToResponse).ToArray();
    }

    public async Task<CustomerResponse> GetAsync(Guid customerId, CancellationToken cancellationToken)
    {
        var context = RequireContext();
        var customer = await _repository.FindAsync(
            context.Workspace.Id,
            customerId,
            TechnicianScope(context),
            cancellationToken);
        return customer is null ? throw NotFound() : ToResponse(customer);
    }

    public async Task<CustomerResponse> CreateAsync(
        CreateCustomerRequest request,
        CancellationToken cancellationToken)
    {
        var context = RequireContext();
        EnsureAction(AccessAction.CustomerWrite, context.Workspace.Id);
        var errors = new Dictionary<string, string[]>();
        var name = Required(request.Name, "name", 160, errors);
        var phone = NormalizePhone(request.Phone, errors);
        var email = Optional(request.Email, "email", 320, errors);
        var note = Optional(request.Note, "note", 4000, errors);
        ThrowValidation("Customer request is invalid.", errors);

        try
        {
            return ToResponse(await _repository.CreateAsync(
                context.Workspace.Id,
                new CreateCustomerData(name!, phone!, email, note, context.StaffProfile.Id),
                cancellationToken));
        }
        catch (CustomerConflictException exception)
        {
            throw new ApiException(StatusCodes.Status409Conflict, exception.Code, exception.Message, exception.Details);
        }
    }

    private AccessContext RequireContext() => _contextAccessor.Current ??
        throw new ApiException(StatusCodes.Status401Unauthorized, "authentication_required", "Authentication is required.");

    private void EnsureListRead()
    {
        var context = RequireContext();
        if (context.ActiveRole == AccessRole.Technician)
        {
            return;
        }

        EnsureAction(AccessAction.CustomerRead, context.Workspace.Id);
    }

    private void EnsureAction(AccessAction action, Guid workspaceId)
    {
        var decision = _authorizationPolicy.Evaluate(new AccessAuthorizationRequest(
            RequireContext(), action, workspaceId));
        if (decision.IsAllowed)
        {
            return;
        }

        throw new ApiException(
            decision.HideResource ? StatusCodes.Status404NotFound : StatusCodes.Status403Forbidden,
            decision.HideResource ? "not_found" : "forbidden",
            decision.HideResource ? "The requested resource was not found." : "You do not have permission to perform this action.");
    }

    private static CustomerResponse ToResponse(CustomerEntity customer) => new(
        customer.Id, customer.Name, customer.Phone, customer.Email, customer.Note,
        customer.CreatedAt, customer.UpdatedAt);

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

    private static string? NormalizePhone(string? value, Dictionary<string, string[]> errors)
    {
        var normalized = NormalizeOptional(value);
        if (normalized is null)
        {
            errors["phone"] = ["The field is required."];
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
            errors["phone"] = ["Enter a valid phone number."];
        }

        return normalized;
    }

    private static string? NormalizePhoneFilter(string? value)
    {
        var normalized = NormalizeOptional(value);
        return normalized?.Replace(" ", string.Empty)
            .Replace("-", string.Empty)
            .Replace("(", string.Empty)
            .Replace(")", string.Empty)
            .Replace(".", string.Empty);
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
