using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.OpenApi.Models;
using RepairFlow.Api.Api.Middleware;
using RepairFlow.Api.Api.Responses;
using RepairFlow.Api.Features.Access.Api;
using RepairFlow.Api.Features.Access.Application;
using RepairFlow.Api.Features.Access.Infrastructure;
using RepairFlow.Api.Features.Customer.Api;
using RepairFlow.Api.Features.Customer.Infrastructure;
using RepairFlow.Api.Features.Device.Api;
using RepairFlow.Api.Features.Device.Infrastructure;
using RepairFlow.Api.Features.RepairOrder.Api;
using RepairFlow.Api.Features.RepairOrder.Infrastructure;
using RepairFlow.Api.Features.RepairTag.Api;
using RepairFlow.Api.Features.RepairTag.Infrastructure;
using RepairFlow.Api.Features.Health;
using RepairFlow.Api.Infrastructure.Database;

var builder = WebApplication.CreateBuilder(args);

var dataProtection = builder.Services
    .AddDataProtection()
    .SetApplicationName("RepairFlow.Api");
var keyRingPath = builder.Configuration["CredentialProtection:KeyRingPath"];
if (!builder.Environment.IsEnvironment("Testing"))
{
    keyRingPath ??= Path.Combine(
        builder.Environment.IsDevelopment()
            ? Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData)
            : Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData),
        "RepairFlow",
        "keys");
    if (string.IsNullOrWhiteSpace(keyRingPath))
    {
        throw new InvalidOperationException("CredentialProtection:KeyRingPath is required outside Testing.");
    }

    Directory.CreateDirectory(keyRingPath);
    dataProtection.PersistKeysToFileSystem(new DirectoryInfo(keyRingPath));
}

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
builder.Services.AddCustomerFeature();
builder.Services.AddDeviceFeature();
builder.Services.AddRepairTagFeature();
builder.Services.AddRepairOrderFeature();
builder.Services
    .AddAuthentication(AccessAuthenticationDefaults.Scheme)
    .AddScheme<AuthenticationSchemeOptions, AccessAuthenticationHandler>(
        AccessAuthenticationDefaults.Scheme,
        _ => { });
builder.Services.AddAuthorization(options =>
{
    foreach (var (policyName, action) in AccessPolicies.Definitions)
    {
        options.AddPolicy(policyName, policy =>
        {
            policy.AddAuthenticationSchemes(AccessAuthenticationDefaults.Scheme);
            policy.RequireAuthenticatedUser();
            policy.AddRequirements(new AccessPolicyRequirement(action));
        });
    }
});
builder.Services.AddScoped<IAuthorizationHandler, AccessAuthorizationHandler>();
builder.Services.AddSingleton<IAuthorizationMiddlewareResultHandler, AccessAuthorizationMiddlewareResultHandler>();

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
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var app = builder.Build();

app.UseMiddleware<RequestIdMiddleware>();
app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseCors("UiDevelopment");
app.UseMiddleware<AccessSessionMiddleware>();
app.UseAuthentication();
app.UseAuthorization();

app.UseSwagger();
if (app.Environment.IsDevelopment())
{
    app.UseSwaggerUI();
}

app.MapHealthEndpoints();
app.MapAccessEndpoints();
app.MapCustomerEndpoints();
app.MapDeviceEndpoints();
app.MapRepairOrderEndpoints();
app.MapRepairTagEndpoints();

if (app.Environment.IsEnvironment("Testing"))
{
    app.MapGet("/__test/validation", (HttpContext _) =>
        throw new ApiValidationException(
            "Validation failed.",
            new Dictionary<string, string[]> { ["field"] = ["The field is required."] }))
        .ExcludeFromDescription();
    app.MapGet("/__test/audit", () => Results.Ok(new { status = "ok" }))
        .RequireAuthorization(AccessPolicies.AuditRead)
        .ExcludeFromDescription();
    app.MapGet(
            "/__test/workspaces/{workspaceId:guid}/operational",
            () => Results.Ok(new { status = "ok" }))
        .RequireAuthorization(AccessPolicies.OperationalRead)
        .ExcludeFromDescription();
}

if (args.Any(argument => string.Equals(argument, "--seed-development-access", StringComparison.OrdinalIgnoreCase)))
{
    if (!app.Environment.IsDevelopment())
    {
        throw new InvalidOperationException("Development access seeding is only available when ASPNETCORE_ENVIRONMENT=Development.");
    }

    using var scope = app.Services.CreateScope();
    var migrationRunner = scope.ServiceProvider.GetRequiredService<IVersionedMigrationRunner>();
    await migrationRunner.ApplyPendingAsync();
    var seeder = scope.ServiceProvider.GetRequiredService<IDevelopmentAccessSeeder>();
    var seedResult = await seeder.SeedAsync();
    Console.WriteLine($"Seeded development access accounts: {string.Join(", ", seedResult.Emails)}");
    return;
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
