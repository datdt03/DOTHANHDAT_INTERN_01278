using RepairFlow.Api.Api.Middleware;
using RepairFlow.Api.Api.Responses;
using RepairFlow.Api.Features.Access.Application;

namespace RepairFlow.Api.Features.Access.Api;

public static class AccessEndpoints
{
    public static IEndpointRouteBuilder MapAccessEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPost("/api/access/login", LoginAsync)
            .WithName("Login")
            .Produces<ApiResponse<LoginResponse>>(StatusCodes.Status200OK)
            .Produces<ApiErrorResponse>(StatusCodes.Status400BadRequest)
            .Produces<ApiErrorResponse>(StatusCodes.Status401Unauthorized)
            .Produces<ApiErrorResponse>(StatusCodes.Status409Conflict)
            .Produces<ApiErrorResponse>(StatusCodes.Status429TooManyRequests)
            .WithOpenApi();

        endpoints.MapGet("/api/access/context", GetCurrentContext)
            .WithName("GetAccessContext")
            .Produces<ApiResponse<CurrentSessionResponse>>(StatusCodes.Status200OK)
            .Produces<ApiErrorResponse>(StatusCodes.Status401Unauthorized)
            .RequireAuthorization(AccessPolicies.Authenticated)
            .WithOpenApi();

        endpoints.MapPost("/api/access/logout", LogoutAsync)
            .WithName("Logout")
            .Produces<ApiResponse<LogoutResponse>>(StatusCodes.Status200OK)
            .WithOpenApi();

        return endpoints;
    }

    private static async Task<IResult> LoginAsync(
        HttpContext httpContext,
        LoginRequest request,
        AuthenticationService authenticationService,
        SessionService sessionService,
        AccessService accessService,
        CancellationToken cancellationToken)
    {
        ValidateLoginRequest(request);

        var result = await authenticationService.AuthenticateAsync(
            new LoginCommand(request.Email, request.Password, request.WorkspaceId),
            httpContext.Connection.RemoteIpAddress?.ToString(),
            httpContext.Request.Headers.UserAgent.ToString(),
            DateTimeOffset.UtcNow,
            cancellationToken);

        switch (result.Kind)
        {
            case AuthenticationResultKind.RateLimited:
                throw new ApiException(
                    StatusCodes.Status429TooManyRequests,
                    "authentication_rate_limited",
                    "Too many sign-in attempts. Please try again later.");
            case AuthenticationResultKind.Failure:
                throw new ApiException(
                    StatusCodes.Status401Unauthorized,
                    "authentication_failed",
                    "Email or password is incorrect.");
            case AuthenticationResultKind.WorkspaceSelectionRequired:
                throw new ApiException(
                    StatusCodes.Status409Conflict,
                    "workspace_selection_required",
                    "Select a workspace before signing in.",
                    new
                    {
                        workspaces = result.AvailableWorkspaces!.Select(item => new WorkspaceChoice(
                            item.Workspace.Id,
                            item.Workspace.Name,
                            item.Membership.Role.ToString().ToLowerInvariant()))
                    });
            case AuthenticationResultKind.Success:
                sessionService.WriteCookie(
                    httpContext.Response,
                    result.RawToken!,
                    result.Session!.AbsoluteExpiresAt,
                    httpContext.Request.IsHttps);
                return Results.Ok(ApiResponse<LoginResponse>.Create(
                    new LoginResponse(
                        accessService.ToSafeResponse(result.Context!),
                        result.Session.AbsoluteExpiresAt),
                    RequestIdMiddleware.GetRequestId(httpContext)));
            default:
                throw new InvalidOperationException("Unknown authentication result.");
        }
    }

    private static IResult GetCurrentContext(
        HttpContext httpContext,
        IAccessContextAccessor contextAccessor,
        AccessService accessService)
    {
        var accessContext = contextAccessor.Current;
        var resolvedSession = SessionService.GetResolved(httpContext);
        if (accessContext is null || resolvedSession is null)
        {
            throw new ApiException(
                StatusCodes.Status401Unauthorized,
                "authentication_required",
                "Authentication is required.");
        }

        return Results.Ok(ApiResponse<CurrentSessionResponse>.Create(
            new CurrentSessionResponse(
                accessService.ToSafeResponse(accessContext),
                resolvedSession.ExpiresAt),
            RequestIdMiddleware.GetRequestId(httpContext)));
    }

    private static async Task<IResult> LogoutAsync(
        HttpContext httpContext,
        IAccessContextWriter contextWriter,
        SessionService sessionService,
        CancellationToken cancellationToken)
    {
        var revoked = await sessionService.RevokeAsync(
            sessionService.ReadToken(httpContext.Request),
            DateTimeOffset.UtcNow,
            "logout",
            cancellationToken);
        contextWriter.SetCurrent(null);
        sessionService.ClearCookie(httpContext.Response);

        return Results.Ok(ApiResponse<LogoutResponse>.Create(
            new LogoutResponse(revoked),
            RequestIdMiddleware.GetRequestId(httpContext)));
    }

    private static void ValidateLoginRequest(LoginRequest request)
    {
        var errors = new Dictionary<string, string[]>();
        if (string.IsNullOrWhiteSpace(request.Email))
        {
            errors["email"] = ["Email is required."];
        }

        if (string.IsNullOrWhiteSpace(request.Password))
        {
            errors["password"] = ["Password is required."];
        }

        if (errors.Count > 0)
        {
            throw new ApiValidationException("Login request is invalid.", errors);
        }
    }
}
