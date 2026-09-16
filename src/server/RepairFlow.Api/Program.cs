using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using RepairFlow.Api.Api.Middleware;
using RepairFlow.Api.Api.Responses;
using RepairFlow.Api.Features.Access.Api;
using RepairFlow.Api.Features.Access.Infrastructure;
using RepairFlow.Api.Features.Health;
using RepairFlow.Api.Infrastructure.Database;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "RepairFlow API",
        Version = "v1",
        Description = "RepairFlow modular-monolith API foundation."
    });
});

var postgresConnection = builder.Configuration.GetConnectionString("Postgres")
    ?? throw new InvalidOperationException("ConnectionStrings:Postgres is required.");

builder.Services.AddDbContext<RepairFlowDbContext>(options =>
    options.UseNpgsql(postgresConnection));
builder.Services.AddAccessFoundation();

builder.Services.AddSingleton<IMigrationStore>(_ => new NpgsqlMigrationStore(postgresConnection));
builder.Services.AddSingleton<IVersionedMigrationRunner>(serviceProvider =>
{
    var migrationDirectory = builder.Configuration["Database:MigrationDirectory"]
        ?? "Infrastructure/Database/Migrations";
    var absoluteDirectory = Path.IsPathRooted(migrationDirectory)
        ? migrationDirectory
        : Path.Combine(builder.Environment.ContentRootPath, migrationDirectory);

    return new VersionedMigrationRunner(
        serviceProvider.GetRequiredService<IMigrationStore>(),
        MigrationLoader.Load(absoluteDirectory),
        serviceProvider.GetRequiredService<ILogger<VersionedMigrationRunner>>());
});

var allowedOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .GetChildren()
    .Select(section => section.Value)
    .Where(value => !string.IsNullOrWhiteSpace(value))
    .Cast<string>()
    .ToArray();

builder.Services.AddCors(options =>
{
    options.AddPolicy("UiDevelopment", policy =>
    {
        policy.WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

app.UseMiddleware<RequestIdMiddleware>();
app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseCors("UiDevelopment");

app.UseSwagger();
if (app.Environment.IsDevelopment())
{
    app.UseSwaggerUI();
}

app.MapHealthEndpoints();
app.MapAccessEndpoints();

if (app.Environment.IsEnvironment("Testing"))
{
    app.MapGet("/__test/validation", (HttpContext _) =>
        throw new ApiValidationException(
            "Validation failed.",
            new Dictionary<string, string[]> { ["field"] = ["The field is required."] }))
        .ExcludeFromDescription();
}

if (args.Any(argument => string.Equals(argument, "--migrate", StringComparison.OrdinalIgnoreCase)))
{
    using var scope = app.Services.CreateScope();
    var migrationRunner = scope.ServiceProvider.GetRequiredService<IVersionedMigrationRunner>();
    var migrationResult = await migrationRunner.ApplyPendingAsync();
    Console.WriteLine($"Applied migrations: {string.Join(", ", migrationResult.AppliedVersions)}");
    return;
}

app.Run();

public partial class Program;
