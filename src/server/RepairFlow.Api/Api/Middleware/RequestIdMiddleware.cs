namespace RepairFlow.Api.Api.Middleware;

public sealed class RequestIdMiddleware
{
    public const string HeaderName = "X-Request-ID";
    private const string ContextItemKey = "RepairFlow.RequestId";

    private readonly RequestDelegate _next;

    public RequestIdMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var requestedId = context.Request.Headers[HeaderName].FirstOrDefault();
        var requestId = Guid.TryParse(requestedId, out _)
            ? requestedId!
            : Guid.NewGuid().ToString("D");

        context.Items[ContextItemKey] = requestId;
        context.Response.Headers[HeaderName] = requestId;

        await _next(context);
    }

    public static string GetRequestId(HttpContext context) =>
        context.Items.TryGetValue(ContextItemKey, out var requestId)
            ? requestId?.ToString() ?? string.Empty
            : string.Empty;
}
