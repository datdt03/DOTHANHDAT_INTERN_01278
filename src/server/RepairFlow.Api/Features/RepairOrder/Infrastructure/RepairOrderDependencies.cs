using Microsoft.Extensions.DependencyInjection;
using RepairFlow.Api.Features.RepairOrder.Application;

namespace RepairFlow.Api.Features.RepairOrder.Infrastructure;

public static class RepairOrderDependencies
{
    public static IServiceCollection AddRepairOrderFeature(this IServiceCollection services)
    {
        services.AddScoped<IRepairOrderRepository, RepairOrderRepository>();
        services.AddScoped<RepairOrderService>();
        return services;
    }
}
