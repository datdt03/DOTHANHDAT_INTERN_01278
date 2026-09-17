using Microsoft.EntityFrameworkCore;
using Npgsql;
using RepairFlow.Api.Features.Access.Application;
using RepairFlow.Api.Infrastructure.Database;

namespace RepairFlow.Api.Features.Access.Infrastructure;

public interface IDevelopmentAccessSeeder
{
    Task<DevelopmentAccessSeedResult> SeedAsync(CancellationToken cancellationToken = default);
}

public sealed record DevelopmentAccessSeedResult(IReadOnlyList<string> Emails);

public sealed class DevelopmentAccessSeeder : IDevelopmentAccessSeeder
{
    private const string DefaultInitialPassword = "123456";

    private static readonly Guid WorkspaceId = Guid.Parse("30000000-0000-0000-0000-000000000001");

    private static readonly SeedAccount[] Accounts =
    [
        new(
            Guid.Parse("30000000-0000-0000-0000-000000000101"),
            Guid.Parse("30000000-0000-0000-0000-000000000201"),
            Guid.Parse("30000000-0000-0000-0000-000000000301"),
            "Quản lý RepairFlow",
            "manager@repairflow.vn",
            "manager",
            "+84900000001"),
        new(
            Guid.Parse("30000000-0000-0000-0000-000000000102"),
            Guid.Parse("30000000-0000-0000-0000-000000000202"),
            Guid.Parse("30000000-0000-0000-0000-000000000302"),
            "Lễ tân RepairFlow",
            "receptionist@repairflow.vn",
            "receptionist",
            "+84900000002"),
        new(
            Guid.Parse("30000000-0000-0000-0000-000000000103"),
            Guid.Parse("30000000-0000-0000-0000-000000000203"),
            Guid.Parse("30000000-0000-0000-0000-000000000303"),
            "Kỹ thuật viên RepairFlow",
            "technician@repairflow.vn",
            "technician",
            "+84900000003"),
    ];

    private readonly RepairFlowDbContext _dbContext;
    private readonly ICredentialHasher _credentialHasher;
    private readonly IConfiguration _configuration;

    public DevelopmentAccessSeeder(
        RepairFlowDbContext dbContext,
        ICredentialHasher credentialHasher,
        IConfiguration configuration)
    {
        _dbContext = dbContext;
        _credentialHasher = credentialHasher;
        _configuration = configuration;
    }

    public async Task<DevelopmentAccessSeedResult> SeedAsync(CancellationToken cancellationToken = default)
    {
        var initialPassword = _configuration["DevelopmentAccess:InitialPassword"]
            ?? DefaultInitialPassword;
        if (initialPassword.Length < 6)
        {
            throw new InvalidOperationException("DevelopmentAccess:InitialPassword must contain at least 6 characters.");
        }

        var connection = (NpgsqlConnection)_dbContext.Database.GetDbConnection();
        if (connection.State != System.Data.ConnectionState.Open)
        {
            await connection.OpenAsync(cancellationToken);
        }

        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);
        await ExecuteAsync(
            connection,
            transaction,
            """
            INSERT INTO workspaces (id, name, timezone)
            VALUES (@id, @name, @timezone)
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                timezone = EXCLUDED.timezone,
                updated_at = now();
            """,
            cancellationToken,
            ("id", WorkspaceId),
            ("name", "Minh Tâm Store"),
            ("timezone", "Asia/Ho_Chi_Minh"));

        foreach (var account in Accounts)
        {
            var credentialHash = _credentialHasher.Hash(initialPassword);

            await ExecuteAsync(
                connection,
                transaction,
                """
                INSERT INTO users (id, name, email, phone, status)
                VALUES (@id, @name, @email, @phone, 'active')
                ON CONFLICT (id) DO UPDATE SET
                    name = EXCLUDED.name,
                    email = EXCLUDED.email,
                    phone = EXCLUDED.phone,
                    status = 'active',
                    updated_at = now();
                """,
                cancellationToken,
                ("id", account.StaffId),
                ("name", account.Name),
                ("email", account.Email),
                ("phone", account.Phone));

            await ExecuteAsync(
                connection,
                transaction,
                """
                INSERT INTO workspace_memberships
                    (id, workspace_id, user_id, role, status, invited_at, joined_at)
                VALUES
                    (@id, @workspace_id, @user_id, @role, 'active', now(), now())
                ON CONFLICT (workspace_id, user_id) DO UPDATE SET
                    role = EXCLUDED.role,
                    status = 'active',
                    joined_at = COALESCE(workspace_memberships.joined_at, EXCLUDED.joined_at),
                    updated_at = now();
                """,
                cancellationToken,
                ("id", account.MembershipId),
                ("workspace_id", WorkspaceId),
                ("user_id", account.StaffId),
                ("role", account.Role));

            await ExecuteAsync(
                connection,
                transaction,
                """
                INSERT INTO access_principals (id, staff_profile_id, email, credential_hash, status)
                VALUES (@id, @staff_profile_id, @email, @credential_hash, 'active')
                ON CONFLICT (id) DO UPDATE SET
                    staff_profile_id = EXCLUDED.staff_profile_id,
                    email = EXCLUDED.email,
                    credential_hash = EXCLUDED.credential_hash,
                    status = 'active',
                    updated_at = now();
                """,
                cancellationToken,
                ("id", account.PrincipalId),
                ("staff_profile_id", account.StaffId),
                ("email", account.Email),
                ("credential_hash", credentialHash));
        }

        await transaction.CommitAsync(cancellationToken);
        return new DevelopmentAccessSeedResult(Accounts.Select(account => account.Email).ToArray());
    }

    private static async Task ExecuteAsync(
        NpgsqlConnection connection,
        NpgsqlTransaction transaction,
        string sql,
        CancellationToken cancellationToken,
        params (string Name, object Value)[] parameters)
    {
        await using var command = new NpgsqlCommand(sql, connection, transaction);
        foreach (var (name, value) in parameters)
        {
            command.Parameters.AddWithValue(name, value);
        }

        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    private sealed record SeedAccount(
        Guid StaffId,
        Guid PrincipalId,
        Guid MembershipId,
        string Name,
        string Email,
        string Role,
        string Phone);
}
