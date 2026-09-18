using Microsoft.Extensions.DependencyInjection;
using RepairFlow.Api.Features.Device.Application;

namespace RepairFlow.Api.Features.Device.Infrastructure;

public static class DeviceDependencies
{
    public static IServiceCollection AddDeviceFeature(this IServiceCollection services)
    {
        services.AddScoped<IDeviceRepository, DeviceRepository>();
        services.AddScoped<DeviceService>();
        return services;
    }
}
