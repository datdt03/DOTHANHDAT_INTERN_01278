using RepairFlow.Api.Features.Access.Application;

namespace RepairFlow.Api.Features.Access.Api;

public sealed class AccessSessionMiddleware
{
    private readonly RequestDelegate _next;

    public AccessSessionMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(
        HttpContext context,
        IAccessContextWriter contextWriter,
        SessionService sessionService)
    {
        var rawToken = sessionService.ReadToken(context.Request);
        if (!string.IsNullOrWhiteSpace(rawToken))
        {
            var resolvedSession = await sessionService.ResolveAsync(
                rawToken,
                DateTimeOffset.UtcNow,
                context.RequestAborted);
            contextWriter.SetCurrent(resolvedSession?.Context);

            if (resolvedSession is null)
            {
                sessionService.ClearCookie(context.Response);
            }
            else
            {
                context.Items[SessionService.ResolvedSessionItemKey] = resolvedSession;
            }
        }

        await _next(context);
    }
}
