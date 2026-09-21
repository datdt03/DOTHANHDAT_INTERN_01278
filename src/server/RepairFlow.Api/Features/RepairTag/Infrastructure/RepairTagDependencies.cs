using Microsoft.Extensions.DependencyInjection;
using RepairFlow.Api.Features.RepairTag.Application;

namespace RepairFlow.Api.Features.RepairTag.Infrastructure;

public static class RepairTagDependencies
{
    public static IServiceCollection AddRepairTagFeature(this IServiceCollection services)
    {
        services.AddScoped<IRepairTagRepository, RepairTagRepository>();
        services.AddScoped<RepairTagService>();
        return services;
    }
}
