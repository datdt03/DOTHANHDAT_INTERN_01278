using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using RepairFlow.Api.Api.Middleware;
using RepairFlow.Api.Features.Access.Api;

namespace RepairFlow.Api.Tests.Features.Access;

public sealed class C1AcceptanceTests : IClassFixture<ApiTestFactory>
{
    private readonly HttpClient _client;
    private readonly AccessFixtureSet _fixture;

    public C1AcceptanceTests(ApiTestFactory factory)
    {
        _client = factory.CreateClient();
        _fixture = factory.Fixture;
    }

    [Fact]
    public async Task Manager_login_context_and_logout_complete_the_internal_access_slice()
    {
        using var login = await _client.PostAsJsonAsync(
            "/api/access/login",
            new LoginRequest("manager.integration@example.test", AccessFixture.KnownPassword));

        Assert.Equal(HttpStatusCode.OK, login.StatusCode);
        var loginJson = await login.Content.ReadAsStringAsync();
        using var loginDocument = JsonDocument.Parse(loginJson);
        var loginData = loginDocument.RootElement.GetProperty("data");
        var context = loginData.GetProperty("context");
        Assert.Equal("manager", context.GetProperty("role").GetString());
        Assert.Equal(_fixture.PrimaryWorkspace.Id.ToString(), context.GetProperty("workspaceId").GetString());
        Assert.True(context.GetProperty("capabilities").GetProperty("canManageStaff").GetBoolean());
        Assert.True(context.GetProperty("capabilities").GetProperty("canManageAssignments").GetBoolean());
        Assert.DoesNotContain("password", loginJson, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("token", loginJson, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("hash", loginJson, StringComparison.OrdinalIgnoreCase);

        var cookie = GetSetCookie(login).Split(';', 2)[0];
        using var contextRequest = new HttpRequestMessage(HttpMethod.Get, "/api/access/context");
        contextRequest.Headers.Add("Cookie", cookie);
        using var currentContext = await _client.SendAsync(contextRequest);
        Assert.Equal(HttpStatusCode.OK, currentContext.StatusCode);

        using var logoutRequest = new HttpRequestMessage(HttpMethod.Post, "/api/access/logout");
        logoutRequest.Headers.Add("Cookie", cookie);
        using var logout = await _client.SendAsync(logoutRequest);
        Assert.Equal(HttpStatusCode.OK, logout.StatusCode);

        using var revokedContextRequest = new HttpRequestMessage(HttpMethod.Get, "/api/access/context");
        revokedContextRequest.Headers.Add("Cookie", cookie);
        using var revokedContext = await _client.SendAsync(revokedContextRequest);
        Assert.Equal(HttpStatusCode.Unauthorized, revokedContext.StatusCode);
        Assert.Equal(
            "authentication_required",
            await ReadErrorCodeAsync(revokedContext));
    }

    [Fact]
    public async Task Receptionist_can_use_operational_projection_but_direct_sensitive_access_is_denied()
    {
        var cookie = await LoginAndGetCookieAsync(_fixture.ActiveReceptionistAccount.Email);

        using var operationalRequest = new HttpRequestMessage(
            HttpMethod.Get,
            $"/__test/workspaces/{_fixture.PrimaryWorkspace.Id}/operational");
        operationalRequest.Headers.Add("Cookie", cookie);
        using var operational = await _client.SendAsync(operationalRequest);
        Assert.Equal(HttpStatusCode.OK, operational.StatusCode);

        using var auditRequest = new HttpRequestMessage(HttpMethod.Get, "/__test/audit");
        auditRequest.Headers.Add("Cookie", cookie);
        using var audit = await _client.SendAsync(auditRequest);
        Assert.Equal(HttpStatusCode.Forbidden, audit.StatusCode);
        Assert.Equal("forbidden", await ReadErrorCodeAsync(audit));
    }

    [Fact]
    public async Task Technician_cannot_use_workspace_operational_route_without_an_assignment()
    {
        var cookie = await LoginAndGetCookieAsync("technician.integration@example.test");

        using var request = new HttpRequestMessage(
            HttpMethod.Get,
            $"/__test/workspaces/{_fixture.PrimaryWorkspace.Id}/operational");
        request.Headers.Add("Cookie", cookie);

        using var response = await _client.SendAsync(request);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        var requestId = response.Headers.GetValues(RequestIdMiddleware.HeaderName).Single();
        Assert.Equal("forbidden", await ReadErrorCodeAsync(response));
        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.Equal(requestId, document.RootElement.GetProperty("requestId").GetString());
    }

    private async Task<string> LoginAndGetCookieAsync(string email)
    {
        using var response = await _client.PostAsJsonAsync(
            "/api/access/login",
            new LoginRequest(email, AccessFixture.KnownPassword));
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        return GetSetCookie(response).Split(';', 2)[0];
    }

    private static string GetSetCookie(HttpResponseMessage response) =>
        response.Headers
            .GetValues("Set-Cookie")
            .First(value => value.StartsWith("repairflow_session=", StringComparison.Ordinal));

    private static async Task<string?> ReadErrorCodeAsync(HttpResponseMessage response)
    {
        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        return document.RootElement.GetProperty("error").GetProperty("code").GetString();
    }
}
