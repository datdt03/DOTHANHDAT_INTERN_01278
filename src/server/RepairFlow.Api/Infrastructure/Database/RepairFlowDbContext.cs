using Microsoft.EntityFrameworkCore;

namespace RepairFlow.Api.Infrastructure.Database;

public sealed class RepairFlowDbContext : DbContext
{
    public RepairFlowDbContext(DbContextOptions<RepairFlowDbContext> options)
        : base(options)
    {
    }
}
