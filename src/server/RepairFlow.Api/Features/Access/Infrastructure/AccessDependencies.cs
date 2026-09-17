using Microsoft.Extensions.DependencyInjection;
using RepairFlow.Api.Configuration;
using RepairFlow.Api.Features.Access.Application;

namespace RepairFlow.Api.Features.Access.Infrastructure;

public static class AccessDependencies
{
    public static IServiceCollection AddAccessFoundation(this IServiceCollection services)
    {
        services.AddOptions<AuthOptions>()
            .BindConfiguration(AuthOptions.SectionName)
            .Validate(options =>
            {
                options.Validate();
                return true;
            }, "Auth configuration is invalid.")
            .ValidateOnStart();
        services.AddScoped<RequestAccessContextAccessor>();
        services.AddScoped<IAccessContextAccessor>(provider =>
            provider.GetRequiredService<RequestAccessContextAccessor>());
        services.AddScoped<IAccessContextWriter>(provider =>
            provider.GetRequiredService<RequestAccessContextAccessor>());
        services.AddScoped<AccessService>();
        services.AddSingleton<ICredentialHasher, CredentialHasher>();
        services.AddSingleton<IAccessRateLimiter, InMemoryAccessRateLimiter>();
        services.AddScoped<IAccessAuditSink, DatabaseAccessAuditSink>();
        services.AddScoped<IAccessRepository, AccessSessionRepository>();
        services.AddScoped<IDevelopmentAccessSeeder, DevelopmentAccessSeeder>();
        services.AddScoped<AuthenticationService>();
        services.AddScoped<SessionService>();
        return services;
    }
}
