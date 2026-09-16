using System.Net;
using System.Text.Json;
using RepairFlow.Api.Api.Middleware;

namespace RepairFlow.Api.Tests;

public sealed class ErrorContractTests : IClassFixture<ApiTestFactory>
{
    private readonly HttpClient _client;

    public ErrorContractTests(ApiTestFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Missing_route_returns_json_not_found_envelope()
    {
        using var response = await _client.GetAsync("/does-not-exist");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal("application/json", response.Content.Headers.ContentType?.MediaType);
        await AssertErrorEnvelopeAsync(response, "not_found");
    }

    [Fact]
    public async Task Validation_errors_use_the_same_error_envelope()
    {
        using var response = await _client.GetAsync("/__test/validation");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        await AssertErrorEnvelopeAsync(response, "validation_error");
    }

    private static async Task AssertErrorEnvelopeAsync(HttpResponseMessage response, string expectedCode)
    {
        var requestId = response.Headers.GetValues(RequestIdMiddleware.HeaderName).Single();
        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        var root = document.RootElement;

        Assert.Equal(expectedCode, root.GetProperty("error").GetProperty("code").GetString());
        Assert.Equal(requestId, root.GetProperty("requestId").GetString());
        Assert.False(root.GetRawText().Contains("<!DOCTYPE html>", StringComparison.OrdinalIgnoreCase));
    }
}
