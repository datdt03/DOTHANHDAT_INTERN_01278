using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;
using RepairFlow.Api.Api.Middleware;

namespace RepairFlow.Api.Tests.Api.Middleware;

public sealed class ExceptionHandlingMiddlewareTests
{
    [Fact]
    public async Task Client_cancellation_is_not_converted_to_internal_error()
    {
        using var cancellationSource = new CancellationTokenSource();
        cancellationSource.Cancel();

        var context = new DefaultHttpContext
        {
            RequestAborted = cancellationSource.Token
        };
        var middleware = new ExceptionHandlingMiddleware(
            _ => throw new OperationCanceledException(cancellationSource.Token),
            NullLogger<ExceptionHandlingMiddleware>.Instance);

        await middleware.InvokeAsync(context);

        Assert.Equal(StatusCodes.Status200OK, context.Response.StatusCode);
    }
}
