using System.Text.Json;

namespace RepairFlow.Api.Tests;

public sealed class OpenApiContractTests : IClassFixture<ApiTestFactory>
{
    private readonly HttpClient _client;

    public OpenApiContractTests(ApiTestFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Swagger_document_is_openapi_3_and_does_not_expose_secrets()
    {
        using var response = await _client.GetAsync("/swagger/v1/swagger.json");

        response.EnsureSuccessStatusCode();
        var json = await response.Content.ReadAsStringAsync();
        using var document = JsonDocument.Parse(json);
        var openApiVersion = document.RootElement.GetProperty("openapi").GetString();

        Assert.StartsWith("3.0", openApiVersion, StringComparison.Ordinal);
        Assert.DoesNotContain("change-me-local-only", json, StringComparison.Ordinal);
        Assert.DoesNotContain("ConnectionStrings:Postgres", json, StringComparison.Ordinal);
        Assert.True(document.RootElement.GetProperty("paths").TryGetProperty(
            "/api/access/context",
            out _));
        Assert.DoesNotContain("password", json, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("token", json, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("token hash", json, StringComparison.OrdinalIgnoreCase);
    }
}
