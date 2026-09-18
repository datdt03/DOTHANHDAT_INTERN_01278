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
        var paths = document.RootElement.GetProperty("paths");
        foreach (var path in new[]
                 {
                     "/api/customers",
                     "/api/customers/{customerId}",
                     "/api/customers/{customerId}/devices",
                     "/api/devices",
                     "/api/devices/{deviceId}",
                     "/api/repair-orders",
                     "/api/repair-orders/{orderId}"
                 })
        {
            Assert.True(paths.TryGetProperty(path, out _), $"Missing OpenAPI path: {path}");
        }

        var schemas = document.RootElement
            .GetProperty("components")
            .GetProperty("schemas");
        var loginRequest = schemas.GetProperty("LoginRequest");
        Assert.True(loginRequest.GetProperty("properties").TryGetProperty("password", out _));
        var repairOrderResponse = schemas.GetProperty("RepairOrderResponse");
        Assert.False(repairOrderResponse.GetProperty("properties").TryGetProperty("internalNote", out _));

        foreach (var schemaName in new[]
                 {
                     "AccessContextResponse",
                     "LoginResponse",
                     "CurrentSessionResponse",
                     "LogoutResponse"
                 })
        {
            if (!schemas.TryGetProperty(schemaName, out var schema))
            {
                continue;
            }

            var safeSchema = schema.GetRawText();
            Assert.DoesNotContain("password", safeSchema, StringComparison.OrdinalIgnoreCase);
            Assert.DoesNotContain("token", safeSchema, StringComparison.OrdinalIgnoreCase);
            Assert.DoesNotContain("hash", safeSchema, StringComparison.OrdinalIgnoreCase);
        }
    }
}
