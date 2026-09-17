using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using RepairFlow.Api.Api.Middleware;
using RepairFlow.Api.Features.Access.Api;

namespace RepairFlow.Api.Tests.Features.Access;

public sealed class AuthApiTests : IClassFixture<ApiTestFactory>
{
    private readonly HttpClient _client;
    private readonly AccessFixtureSet _fixture;

    public AuthApiTests(ApiTestFactory factory)
    {
        _client = factory.CreateClient();
        _fixture = factory.Fixture;
    }

    [Fact]
    public async Task Login_sets_http_only_cookie_and_current_context_returns_safe_fields()
    {
        using var login = await _client.PostAsJsonAsync(
            "/api/access/login",
            new LoginRequest(
                _fixture.ActiveReceptionistAccount.Email,
                AccessFixture.KnownPassword));

        Assert.Equal(HttpStatusCode.OK, login.StatusCode);
        var setCookie = GetSetCookie(login);
        var cookie = setCookie.Split(';', 2)[0];
        Assert.Contains("HttpOnly", setCookie, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("SameSite=Lax", setCookie, StringComparison.OrdinalIgnoreCase);

        var loginJson = await login.Content.ReadAsStringAsync();
        Assert.DoesNotContain("password", loginJson, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("token", loginJson, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("hash", loginJson, StringComparison.OrdinalIgnoreCase);

        using var currentRequest = new HttpRequestMessage(
            HttpMethod.Get,
            "/api/access/context");
        currentRequest.Headers.Add("Cookie", cookie);
        using var current = await _client.SendAsync(currentRequest);

        Assert.Equal(HttpStatusCode.OK, current.StatusCode);
        using var currentJson = JsonDocument.Parse(await current.Content.ReadAsStringAsync());
        var data = currentJson.RootElement.GetProperty("data");
        Assert.Equal(
            _fixture.ActiveReceptionistAccount.Id.ToString(),
            data.GetProperty("context").GetProperty("accountId").GetString());
        Assert.Equal(
            _fixture.PrimaryWorkspace.Id.ToString(),
            data.GetProperty("context").GetProperty("workspaceId").GetString());
        Assert.Equal("receptionist", data.GetProperty("context").GetProperty("role").GetString());
        Assert.True(data.TryGetProperty("expiresAt", out _));
    }

    [Fact]
    public async Task Multiple_workspace_login_returns_choices_without_creating_a_cookie()
    {
        using var response = await _client.PostAsJsonAsync(
            "/api/access/login",
            new LoginRequest(
                _fixture.ActiveOwnerAccount.Email,
                AccessFixture.KnownPassword));

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        var root = document.RootElement;
        Assert.Equal(
            "workspace_selection_required",
            root.GetProperty("error").GetProperty("code").GetString());
        Assert.Equal(2, root.GetProperty("error").GetProperty("details").GetProperty("workspaces").GetArrayLength());
        Assert.DoesNotContain("password", root.GetRawText(), StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("token", root.GetRawText(), StringComparison.OrdinalIgnoreCase);
        Assert.False(response.Headers.TryGetValues("Set-Cookie", out _));
    }

    [Fact]
    public async Task Wrong_password_returns_generic_unauthorized_error_without_a_cookie()
    {
        using var response = await _client.PostAsJsonAsync(
            "/api/access/login",
            new LoginRequest(
                _fixture.ActiveReceptionistAccount.Email,
                "wrong-password"));

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        var root = document.RootElement;
        Assert.Equal("authentication_failed", root.GetProperty("error").GetProperty("code").GetString());
        Assert.Equal("Email or password is incorrect.", root.GetProperty("error").GetProperty("message").GetString());
        Assert.DoesNotContain("receptionist", root.GetRawText(), StringComparison.OrdinalIgnoreCase);
        Assert.False(response.Headers.TryGetValues("Set-Cookie", out _));
    }

    [Fact]
    public async Task Logout_revokes_cookie_session_and_repeated_logout_is_safe()
    {
        using var login = await _client.PostAsJsonAsync(
            "/api/access/login",
            new LoginRequest(
                _fixture.ActiveReceptionistAccount.Email,
                AccessFixture.KnownPassword));
        var cookie = GetSetCookie(login).Split(';', 2)[0];

        using var logoutRequest = new HttpRequestMessage(HttpMethod.Post, "/api/access/logout");
        logoutRequest.Headers.Add("Cookie", cookie);
        using var logout = await _client.SendAsync(logoutRequest);
        Assert.Equal(HttpStatusCode.OK, logout.StatusCode);
        Assert.True(await ReadBooleanAsync(logout, "revoked"));

        using var repeatedLogoutRequest = new HttpRequestMessage(HttpMethod.Post, "/api/access/logout");
        repeatedLogoutRequest.Headers.Add("Cookie", cookie);
        using var repeatedLogout = await _client.SendAsync(repeatedLogoutRequest);
        Assert.Equal(HttpStatusCode.OK, repeatedLogout.StatusCode);
        Assert.False(await ReadBooleanAsync(repeatedLogout, "revoked"));
    }

    [Fact]
    public async Task Direct_audit_api_call_returns_a_safe_forbidden_envelope_for_receptionist()
    {
        var cookie = await LoginAndGetCookieAsync(
            new LoginRequest(
                _fixture.ActiveReceptionistAccount.Email,
                AccessFixture.KnownPassword));
        using var request = new HttpRequestMessage(HttpMethod.Get, "/__test/audit");
        request.Headers.Add("Cookie", cookie);

        using var response = await _client.SendAsync(request);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        var requestId = response.Headers.GetValues(RequestIdMiddleware.HeaderName).Single();
        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.Equal("forbidden", document.RootElement.GetProperty("error").GetProperty("code").GetString());
        Assert.Equal(requestId, document.RootElement.GetProperty("requestId").GetString());
        Assert.DoesNotContain("password", document.RootElement.GetRawText(), StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("token", document.RootElement.GetRawText(), StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Direct_cross_workspace_api_call_returns_not_found_without_leaking_tenant_state()
    {
        var cookie = await LoginAndGetCookieAsync(
            new LoginRequest(
                _fixture.ActiveReceptionistAccount.Email,
                AccessFixture.KnownPassword));
        using var request = new HttpRequestMessage(
            HttpMethod.Get,
            $"/__test/workspaces/{_fixture.SecondaryWorkspace.Id}/operational");
        request.Headers.Add("Cookie", cookie);

        using var response = await _client.SendAsync(request);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.Equal("not_found", document.RootElement.GetProperty("error").GetProperty("code").GetString());
        Assert.DoesNotContain(_fixture.SecondaryWorkspace.Name, document.RootElement.GetRawText(), StringComparison.Ordinal);
    }

    private async Task<string> LoginAndGetCookieAsync(LoginRequest request)
    {
        using var response = await _client.PostAsJsonAsync("/api/access/login", request);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        return GetSetCookie(response).Split(';', 2)[0];
    }

    private static string GetSetCookie(HttpResponseMessage response) =>
        response.Headers
            .GetValues("Set-Cookie")
            .First(value => value.StartsWith("repairflow_session=", StringComparison.Ordinal))
            ;

    private static async Task<bool> ReadBooleanAsync(
        HttpResponseMessage response,
        string propertyName)
    {
        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        return document.RootElement
            .GetProperty("data")
            .GetProperty(propertyName)
            .GetBoolean();
    }
}
