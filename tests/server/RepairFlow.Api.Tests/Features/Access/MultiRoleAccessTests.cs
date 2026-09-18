using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using RepairFlow.Api.Features.Access.Api;
using RepairFlow.Api.Features.Access.Application;
using RepairFlow.Api.Features.Access.Domain;

namespace RepairFlow.Api.Tests.Features.Access;

public sealed class MultiRoleAccessTests : IClassFixture<ApiTestFactory>
{
    private readonly ApiTestFactory _factory;
    private readonly HttpClient _client;
    private readonly AccessFixtureSet _fixture;

    public MultiRoleAccessTests(ApiTestFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
        _fixture = factory.Fixture;
    }

    [Fact]
    public async Task Account_can_switch_assigned_role_without_changing_identity_or_workspace()
    {
        _factory.Repository.SetMembershipRoles(
            _fixture.ReceptionistMembership.Id,
            AccessRole.Manager,
            AccessRole.Technician);

        using var login = await _client.PostAsJsonAsync(
            "/api/access/login",
            new LoginRequest(
                _fixture.ActiveReceptionistAccount.Email,
                AccessFixture.KnownPassword));

        Assert.Equal(HttpStatusCode.OK, login.StatusCode);
        var cookie = GetSetCookie(login).Split(';', 2)[0];

        using var loginJson = JsonDocument.Parse(await login.Content.ReadAsStringAsync());
        var loginContext = loginJson.RootElement
            .GetProperty("data")
            .GetProperty("context");
        var accountId = loginContext.GetProperty("accountId").GetString();
        var workspaceId = loginContext.GetProperty("workspaceId").GetString();
        Assert.Equal("manager", loginContext.GetProperty("activeRole").GetString());
        Assert.Equal(
            ["manager", "technician"],
            loginContext.GetProperty("roles").EnumerateArray().Select(item => item.GetString()).ToArray());

        using var switchRequest = new HttpRequestMessage(
            HttpMethod.Post,
            "/api/access/active-role")
        {
            Content = JsonContent.Create(new ActiveRoleRequest("technician"))
        };
        switchRequest.Headers.Add("Cookie", cookie);

        using var switched = await _client.SendAsync(switchRequest);

        Assert.Equal(HttpStatusCode.OK, switched.StatusCode);
        using var switchedJson = JsonDocument.Parse(await switched.Content.ReadAsStringAsync());
        var switchedContext = switchedJson.RootElement
            .GetProperty("data")
            .GetProperty("context");
        Assert.Equal(accountId, switchedContext.GetProperty("accountId").GetString());
        Assert.Equal(workspaceId, switchedContext.GetProperty("workspaceId").GetString());
        Assert.Equal("technician", switchedContext.GetProperty("role").GetString());
        Assert.Equal("technician", switchedContext.GetProperty("activeRole").GetString());
        Assert.True(switchedContext.GetProperty("effectiveCapabilities").GetProperty("canWriteRepair").GetBoolean());

        using var currentRequest = new HttpRequestMessage(HttpMethod.Get, "/api/access/context");
        currentRequest.Headers.Add("Cookie", cookie);
        using var current = await _client.SendAsync(currentRequest);
        Assert.Equal(HttpStatusCode.OK, current.StatusCode);
        using var currentJson = JsonDocument.Parse(await current.Content.ReadAsStringAsync());
        Assert.Equal(
            "technician",
            currentJson.RootElement
                .GetProperty("data")
                .GetProperty("context")
                .GetProperty("activeRole")
                .GetString());
    }

    [Fact]
    public async Task Unassigned_role_is_rejected_with_request_id_and_does_not_change_session()
    {
        _factory.Repository.SetMembershipRoles(
            _fixture.ReceptionistMembership.Id,
            AccessRole.Manager,
            AccessRole.Technician);

        using var login = await _client.PostAsJsonAsync(
            "/api/access/login",
            new LoginRequest(
                _fixture.ActiveReceptionistAccount.Email,
                AccessFixture.KnownPassword));
        var cookie = GetSetCookie(login).Split(';', 2)[0];

        using var switchRequest = new HttpRequestMessage(
            HttpMethod.Post,
            "/api/access/active-role")
        {
            Content = JsonContent.Create(new ActiveRoleRequest("owner"))
        };
        switchRequest.Headers.Add("Cookie", cookie);

        using var response = await _client.SendAsync(switchRequest);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        Assert.True(response.Headers.TryGetValues("X-Request-ID", out var requestIds));
        Assert.False(string.IsNullOrWhiteSpace(requestIds.Single()));
        using var currentRequest = new HttpRequestMessage(HttpMethod.Get, "/api/access/context");
        currentRequest.Headers.Add("Cookie", cookie);
        using var current = await _client.SendAsync(currentRequest);
        using var currentJson = JsonDocument.Parse(await current.Content.ReadAsStringAsync());
        Assert.Equal(
            "manager",
            currentJson.RootElement
                .GetProperty("data")
                .GetProperty("context")
                .GetProperty("activeRole")
                .GetString());
    }

    [Fact]
    public void Authorization_uses_active_role_while_membership_retains_all_assigned_roles()
    {
        var fixture = AccessFixture.Create();
        var membership = fixture.OwnerMembership with
        {
            Role = AccessRole.Manager,
            Roles = [AccessRole.Manager, AccessRole.Technician]
        };
        var context = AccessFixture.CreateContext(
            fixture.ActiveOwnerAccount,
            fixture.PrimaryWorkspace,
            membership,
            fixture.OwnerStaff) with
        {
            ActiveRole = AccessRole.Technician
        };
        var policy = new AccessAuthorizationPolicy();

        var decision = policy.Evaluate(
            new AccessAuthorizationRequest(
                context,
                AccessAction.StaffManage,
                fixture.PrimaryWorkspace.Id));

        Assert.False(decision.IsAllowed);
        Assert.Equal(AuthorizationFailureReason.RoleDenied, decision.FailureReason);
    }

    private static string GetSetCookie(HttpResponseMessage response)
    {
        Assert.True(response.Headers.TryGetValues("Set-Cookie", out var values));
        return values.Single();
    }
}
