using Microsoft.Extensions.DependencyInjection;
using RepairFlow.Api.Infrastructure.Database;

namespace RepairFlow.Api.Tests;

public sealed class DatabaseBoundaryTests : IClassFixture<ApiTestFactory>
{
    private readonly ApiTestFactory _factory;

    public DatabaseBoundaryTests(ApiTestFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public void Api_registers_ef_core_with_the_postgresql_provider()
    {
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<RepairFlowDbContext>();

        Assert.Equal("Npgsql.EntityFrameworkCore.PostgreSQL", context.Database.ProviderName);
    }
}
