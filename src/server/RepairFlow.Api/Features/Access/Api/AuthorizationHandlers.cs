using System.Security.Claims;
using System.Text.Json;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authorization.Policy;
using Microsoft.Extensions.Options;
using RepairFlow.Api.Api.Middleware;
using RepairFlow.Api.Api.Responses;
using RepairFlow.Api.Features.Access.Application;
using RepairFlow.Api.Features.Access.Domain;

namespace RepairFlow.Api.Features.Access.Api;

public static class AccessAuthenticationDefaults
{
    public const string Scheme = "RepairFlowAccess";
}

public sealed class AccessAuthenticationHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
    public AccessAuthenticationHandler(
        IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder)
        : base(options, logger, encoder)
    {
    }

    protected override async Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var resolvedSession = SessionService.GetResolved(Context);
        if (resolvedSession is null)
        {
            var sessionService = Context.RequestServices.GetRequiredService<SessionService>();
            var rawToken = sessionService.ReadToken(Request);
            if (string.IsNullOrWhiteSpace(rawToken))
            {
                return AuthenticateResult.NoResult();
            }

            resolvedSession = await sessionService.ResolveAsync(
                rawToken,
                DateTimeOffset.UtcNow,
                Context.RequestAborted);
            if (resolvedSession is null)
            {
                sessionService.ClearCookie(Response);
                return AuthenticateResult.Fail("The access session is not valid.");
            }

            Context.RequestServices
                .GetRequiredService<IAccessContextWriter>()
                .SetCurrent(resolvedSession.Context);
            Context.Items[SessionService.ResolvedSessionItemKey] = resolvedSession;
        }

        var identity = new ClaimsIdentity(
            [
                new Claim(ClaimTypes.NameIdentifier, resolvedSession.Context.Principal.Id.ToString()),
                new Claim(ClaimTypes.Name, resolvedSession.Context.StaffProfile.Name),
                new Claim(ClaimTypes.Email, resolvedSession.Context.Principal.Email),
                new Claim("workspace_id", resolvedSession.Context.Workspace.Id.ToString()),
                new Claim("staff_profile_id", resolvedSession.Context.StaffProfile.Id.ToString()),
                new Claim(ClaimTypes.Role, AccessRoleCodec.ToWireValue(resolvedSession.Context.ActiveRole))
            ],
            Scheme.Name);

        return AuthenticateResult.Success(
            new AuthenticationTicket(new ClaimsPrincipal(identity), Scheme.Name));
    }
}

public sealed class AccessAuthorizationHandler : AuthorizationHandler<AccessPolicyRequirement>
{
    public const string DecisionItemKey = "RepairFlow.AuthorizationDecision";

    private readonly IAccessContextAccessor _contextAccessor;
    private readonly IAccessAuthorizationPolicy _policy;

    public AccessAuthorizationHandler(
        IAccessContextAccessor contextAccessor,
        IAccessAuthorizationPolicy policy)
    {
        _contextAccessor = contextAccessor;
        _policy = policy;
    }

    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        AccessPolicyRequirement requirement)
    {
        var resource = ResolveResource(context.Resource, _contextAccessor.Current);
        var decision = _policy.Evaluate(
            new AccessAuthorizationRequest(
                _contextAccessor.Current,
                requirement.Action,
                resource.WorkspaceId,
                resource.ResourceId,
                resource.Assignments));

        if (decision.IsAllowed)
        {
            context.Succeed(requirement);
        }

        if (context.Resource is HttpContext httpContext)
        {
            httpContext.Items[DecisionItemKey] = decision;
        }

        return Task.CompletedTask;
    }

    private static AccessAuthorizationResource ResolveResource(
        object? resource,
        Domain.AccessContext? accessContext)
    {
        if (resource is AccessAuthorizationResource accessResource)
        {
            return accessResource;
        }

        if (resource is HttpContext httpContext)
        {
            var workspaceId = accessContext?.Workspace.Id ?? Guid.Empty;
            if (httpContext.Request.RouteValues.TryGetValue("workspaceId", out var routeValue) &&
                Guid.TryParse(routeValue?.ToString(), out var routeWorkspaceId))
            {
                workspaceId = routeWorkspaceId;
            }

            Guid? resourceId = null;
            if (httpContext.Request.RouteValues.TryGetValue("resourceId", out var resourceValue) &&
                Guid.TryParse(resourceValue?.ToString(), out var parsedResourceId))
            {
                resourceId = parsedResourceId;
            }

            return new AccessAuthorizationResource(workspaceId, resourceId);
        }

        return new AccessAuthorizationResource(accessContext?.Workspace.Id ?? Guid.Empty);
    }
}

public sealed class AccessAuthorizationMiddlewareResultHandler : IAuthorizationMiddlewareResultHandler
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public async Task HandleAsync(
        RequestDelegate next,
        HttpContext context,
        AuthorizationPolicy policy,
        PolicyAuthorizationResult authorizeResult)
    {
        if (!authorizeResult.Challenged && !authorizeResult.Forbidden)
        {
            await next(context);
            return;
        }

        var decision = context.Items.TryGetValue(
                AccessAuthorizationHandler.DecisionItemKey,
                out var value)
            ? value as AuthorizationDecision
            : null;
        var isHidden = decision?.HideResource == true;
        var statusCode = authorizeResult.Challenged
            ? StatusCodes.Status401Unauthorized
            : isHidden
                ? StatusCodes.Status404NotFound
                : StatusCodes.Status403Forbidden;
        var code = authorizeResult.Challenged
            ? "authentication_required"
            : isHidden
                ? "not_found"
                : "forbidden";
        var message = authorizeResult.Challenged
            ? "Authentication is required."
            : isHidden
                ? "The requested resource was not found."
                : "You do not have permission to perform this action.";

        context.Response.Clear();
        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/json";
        var requestId = RequestIdMiddleware.GetRequestId(context);
        context.Response.Headers[RequestIdMiddleware.HeaderName] = requestId;
        await JsonSerializer.SerializeAsync(
            context.Response.Body,
            new ApiErrorResponse(new ApiError(code, message), requestId),
            JsonOptions,
            context.RequestAborted);
    }
}
