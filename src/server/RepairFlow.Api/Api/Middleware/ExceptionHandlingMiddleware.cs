using System.Text.Json;
using RepairFlow.Api.Api.Responses;

namespace RepairFlow.Api.Api.Middleware;

public sealed class ExceptionHandlingMiddleware
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(
        RequestDelegate next,
        ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);

            if (context.Response.StatusCode == StatusCodes.Status404NotFound &&
                !context.Response.HasStarted)
            {
                await WriteErrorAsync(
                    context,
                    StatusCodes.Status404NotFound,
                    "not_found",
                    "The requested resource was not found.");
            }
        }
        catch (ApiException exception) when (!context.Response.HasStarted)
        {
            await WriteErrorAsync(
                context,
                exception.StatusCode,
                exception.Code,
                exception.Message,
                exception.Details);
        }
        catch (BadHttpRequestException exception) when (!context.Response.HasStarted)
        {
            await WriteErrorAsync(
                context,
                StatusCodes.Status400BadRequest,
                "bad_request",
                exception.Message);
        }
        catch (Exception exception) when (!context.Response.HasStarted)
        {
            _logger.LogError(exception, "Unhandled API exception.");
            await WriteErrorAsync(
                context,
                StatusCodes.Status500InternalServerError,
                "internal_error",
                "An unexpected error occurred.");
        }
    }

    private static async Task WriteErrorAsync(
        HttpContext context,
        int statusCode,
        string code,
        string message,
        object? details = null)
    {
        context.Response.Clear();
        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/json";
        var requestId = RequestIdMiddleware.GetRequestId(context);
        context.Response.Headers[RequestIdMiddleware.HeaderName] = requestId;

        var response = new ApiErrorResponse(
            new ApiError(code, message, details),
            requestId);

        await JsonSerializer.SerializeAsync(context.Response.Body, response, JsonOptions);
    }
}
