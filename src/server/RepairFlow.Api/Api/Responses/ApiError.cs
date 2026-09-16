namespace RepairFlow.Api.Api.Responses;

public sealed record ApiError(string Code, string Message, object? Details = null);

public sealed record ApiErrorResponse(ApiError Error, string RequestId);

public class ApiException : Exception
{
    public ApiException(int statusCode, string code, string message, object? details = null)
        : base(message)
    {
        StatusCode = statusCode;
        Code = code;
        Details = details;
    }

    public int StatusCode { get; }

    public string Code { get; }

    public object? Details { get; }
}

public sealed class ApiValidationException : ApiException
{
    public ApiValidationException(string message, object details)
        : base(StatusCodes.Status400BadRequest, "validation_error", message, details)
    {
    }
}
