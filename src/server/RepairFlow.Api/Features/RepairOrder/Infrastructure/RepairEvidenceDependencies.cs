using Amazon.S3;
using Microsoft.Extensions.DependencyInjection;
using RepairFlow.Api.Features.RepairOrder.Application;

namespace RepairFlow.Api.Features.RepairOrder.Infrastructure;

public static class RepairEvidenceDependencies
{
    public static IServiceCollection AddRepairEvidenceFeature(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddOptions<RepairEvidenceStorageOptions>()
            .Bind(configuration.GetSection(RepairEvidenceStorageOptions.SectionName));
        services.AddScoped<RepairEvidenceService>();
        services.AddScoped<IRepairEvidenceRepository, RepairEvidenceRepository>();
        services.AddSingleton<IPrivateObjectStorage, S3PrivateObjectStorage>();
        return services;
    }
}
