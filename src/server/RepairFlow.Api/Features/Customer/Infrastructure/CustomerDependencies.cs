using Microsoft.Extensions.DependencyInjection;
using RepairFlow.Api.Features.Customer.Application;

namespace RepairFlow.Api.Features.Customer.Infrastructure;

public static class CustomerDependencies
{
    public static IServiceCollection AddCustomerFeature(this IServiceCollection services)
    {
        services.AddScoped<ICustomerRepository, CustomerRepository>();
        services.AddScoped<CustomerService>();
        return services;
    }
}
