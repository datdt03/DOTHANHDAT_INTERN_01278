using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Options;
using RepairFlow.Api.Configuration;
using RepairFlow.Api.Features.Access.Application;
using RepairFlow.Api.Tests.Features.Access;

namespace RepairFlow.Api.Tests;

public sealed class ApiTestFactory : WebApplicationFactory<Program>
{
    public AccessFixtureSet Fixture { get; } = AccessFixture.Create();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.ConfigureServices(services =>
        {
            var testOptions = new AuthOptions
            {
                PasswordHashIterations = 10_000
            };
            var credentialHasher = new CredentialHasher(Options.Create(testOptions));
            var repository = TestAccessRepository.Create(Fixture, credentialHasher);

            services.RemoveAll<IAccessRepository>();
            services.AddSingleton<IAccessRepository>(repository);
            services.RemoveAll<IAccessAuditSink>();
            services.AddSingleton<IAccessAuditSink, RecordingAccessAuditSink>();
            services.PostConfigure<AuthOptions>(options =>
            {
                options.PasswordHashIterations = testOptions.PasswordHashIterations;
            });
        });
    }
}
