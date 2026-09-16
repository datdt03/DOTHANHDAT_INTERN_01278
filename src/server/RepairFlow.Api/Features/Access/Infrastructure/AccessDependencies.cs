using Microsoft.Extensions.DependencyInjection;
using RepairFlow.Api.Features.Access.Application;

namespace RepairFlow.Api.Features.Access.Infrastructure;

public static class AccessDependencies
{
    public static IServiceCollection AddAccessFoundation(this IServiceCollection services)
    {
        services.AddScoped<IAccessContextAccessor, RequestAccessContextAccessor>();
        services.AddScoped<AccessService>();
        return services;
    }
}
