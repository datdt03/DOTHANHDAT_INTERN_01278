using System.Net;
using System.Text.Json;
using RepairFlow.Api.Api.Middleware;

namespace RepairFlow.Api.Tests.Features.Access;

public sealed class AccessApiTests : IClassFixture<ApiTestFactory>
{
    private readonly HttpClient _client;

    public AccessApiTests(ApiTestFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Anonymous_access_context_returns_safe_unauthorized_envelope()
    {
        using var response = await _client.GetAsync("/api/access/context");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        var requestId = response.Headers.GetValues(RequestIdMiddleware.HeaderName).Single();
        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        var root = document.RootElement;

        Assert.Equal("authentication_required", root.GetProperty("error").GetProperty("code").GetString());
        Assert.Equal(requestId, root.GetProperty("requestId").GetString());
        Assert.DoesNotContain("password", root.GetRawText(), StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("token", root.GetRawText(), StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Access_foundation_does_not_expose_business_endpoints()
    {
        using var response = await _client.GetAsync("/api/customers");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
