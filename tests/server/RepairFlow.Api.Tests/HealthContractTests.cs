using System.Net;
using System.Text.Json;
using RepairFlow.Api.Api.Middleware;

namespace RepairFlow.Api.Tests;

public sealed class HealthContractTests : IClassFixture<ApiTestFactory>
{
    private readonly HttpClient _client;

    public HealthContractTests(ApiTestFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Health_returns_the_c0_success_envelope_and_request_id()
    {
        using var response = await _client.GetAsync("/health");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var requestId = response.Headers.GetValues(RequestIdMiddleware.HeaderName).Single();
        Assert.True(Guid.TryParse(requestId, out _));

        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        var root = document.RootElement;

        Assert.Equal("ok", root.GetProperty("data").GetProperty("status").GetString());
        Assert.Equal("repairflow-api", root.GetProperty("data").GetProperty("service").GetString());
        Assert.Equal("v1", root.GetProperty("data").GetProperty("apiVersion").GetString());
        Assert.Equal(requestId, root.GetProperty("meta").GetProperty("requestId").GetString());
    }

    [Fact]
    public async Task Health_preserves_a_valid_incoming_request_id()
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, "/health");
        request.Headers.Add(RequestIdMiddleware.HeaderName, "11111111-1111-1111-1111-111111111111");

        using var response = await _client.SendAsync(request);

        Assert.Equal("11111111-1111-1111-1111-111111111111",
            response.Headers.GetValues(RequestIdMiddleware.HeaderName).Single());
    }
}
