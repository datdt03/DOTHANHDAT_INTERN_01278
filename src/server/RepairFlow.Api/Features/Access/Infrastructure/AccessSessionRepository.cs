using System.Data.Common;
using Microsoft.EntityFrameworkCore;
using RepairFlow.Api.Features.Access.Application;
using RepairFlow.Api.Features.Access.Domain;
using RepairFlow.Api.Infrastructure.Database;

namespace RepairFlow.Api.Features.Access.Infrastructure;

public sealed class AccessSessionRepository : IAccessRepository
{
    private readonly RepairFlowDbContext _dbContext;

    public AccessSessionRepository(RepairFlowDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<AccessAccount?> FindAccountByEmailAsync(
        string normalizedEmail,
        CancellationToken cancellationToken = default)
    {
        var connection = await OpenConnectionAsync(cancellationToken);
        await using var command = connection.CreateCommand();
        command.CommandText = """
            SELECT ap.id, ap.email, ap.staff_profile_id, ap.status, ap.credential_hash,
                   u.id, u.name, u.phone, u.status
            FROM access_principals ap
            INNER JOIN users u ON u.id = ap.staff_profile_id
            WHERE lower(ap.email) = lower(@email)
            LIMIT 1;
            """;
        AddParameter(command, "email", normalizedEmail);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
        {
            return null;
        }

        return new AccessAccount(
            new AccessPrincipal(
                reader.GetGuid(0),
                reader.GetString(1),
                reader.GetGuid(2),
                ParseAccountStatus(reader.GetString(3))),
            new StaffProfile(
                reader.GetGuid(5),
                reader.GetString(6),
                reader.IsDBNull(7) ? null : reader.GetString(7),
                ParseStaffStatus(reader.GetString(8))),
            reader.GetString(4));
    }

    public async Task<IReadOnlyList<AccessWorkspaceMembership>> FindMembershipsAsync(
        Guid staffProfileId,
        CancellationToken cancellationToken = default)
    {
        var connection = await OpenConnectionAsync(cancellationToken);
        await using var command = connection.CreateCommand();
        command.CommandText = """
            SELECT wm.id, wm.workspace_id, wm.user_id, wm.role, wm.status,
                   w.id, w.name, w.timezone,
                   COALESCE(
                       array_agg(wmr.role ORDER BY wmr.is_default DESC, wmr.created_at)
                           FILTER (WHERE wmr.role IS NOT NULL),
                       ARRAY[wm.role]::varchar[]
                   ) AS roles
            FROM workspace_memberships wm
            INNER JOIN workspaces w ON w.id = wm.workspace_id
            LEFT JOIN workspace_membership_roles wmr ON wmr.membership_id = wm.id
            WHERE wm.user_id = @staff_profile_id
            GROUP BY wm.id, wm.workspace_id, wm.user_id, wm.role, wm.status,
                     w.id, w.name, w.timezone
            ORDER BY w.name;
            """;
        AddParameter(command, "staff_profile_id", staffProfileId);

        var memberships = new List<AccessWorkspaceMembership>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            if (!TryParseRole(reader.GetString(3), out var role) ||
                !TryParseMembershipStatus(reader.GetString(4), out var status))
            {
                continue;
            }

            var roles = ParseRoles(reader.GetFieldValue<string[]>(8));
            if (roles.Count == 0 && TryParseRole(reader.GetString(3), out var fallbackRole))
            {
                roles = [fallbackRole];
            }

            memberships.Add(new AccessWorkspaceMembership(
                new Workspace(reader.GetGuid(5), reader.GetString(6), reader.GetString(7)),
                new WorkspaceMembership(
                    reader.GetGuid(0),
                    reader.GetGuid(1),
                    reader.GetGuid(2),
                    role,
                    status)
                {
                    Roles = roles
                }));
        }

        return memberships;
    }

    public async Task<AccessSessionSnapshot?> FindSessionByTokenHashAsync(
        string tokenHash,
        CancellationToken cancellationToken = default)
    {
        var connection = await OpenConnectionAsync(cancellationToken);
        await using var command = connection.CreateCommand();
        command.CommandText = """
            SELECT s.id, s.principal_id, s.staff_profile_id, s.workspace_id, s.token_hash,
                   s.issued_at, s.last_accessed_at, s.absolute_expires_at, s.revoked_at,
                   s.revoke_reason, s.ip_hash, s.user_agent,
                   s.active_role,
                   ap.email, ap.credential_hash, ap.status,
                   u.name, u.phone, u.status,
                   w.name, w.timezone,
                   wm.id, wm.role, wm.status,
                   COALESCE(
                       array_agg(wmr.role ORDER BY wmr.is_default DESC, wmr.created_at)
                           FILTER (WHERE wmr.role IS NOT NULL),
                       ARRAY[wm.role]::varchar[]
                   ) AS roles
            FROM access_sessions s
            INNER JOIN access_principals ap ON ap.id = s.principal_id
            INNER JOIN users u ON u.id = s.staff_profile_id
            INNER JOIN workspaces w ON w.id = s.workspace_id
            INNER JOIN workspace_memberships wm
                ON wm.workspace_id = s.workspace_id
               AND wm.user_id = s.staff_profile_id
            LEFT JOIN workspace_membership_roles wmr ON wmr.membership_id = wm.id
            WHERE s.token_hash = @token_hash
            GROUP BY s.id, s.principal_id, s.staff_profile_id, s.workspace_id, s.token_hash,
                     s.issued_at, s.last_accessed_at, s.absolute_expires_at, s.revoked_at,
                     s.revoke_reason, s.ip_hash, s.user_agent, s.active_role,
                     ap.email, ap.credential_hash, ap.status,
                     u.name, u.phone, u.status,
                     w.name, w.timezone,
                     wm.id, wm.role, wm.status
            LIMIT 1;
            """;
        AddParameter(command, "token_hash", tokenHash);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken) ||
            !TryParseRole(reader.GetString(22), out var role) ||
            !TryParseMembershipStatus(reader.GetString(23), out var membershipStatus) ||
            !TryParseRole(reader.GetString(12), out var activeRole))
        {
            return null;
        }

        var session = new AccessSession(
            reader.GetGuid(0),
            reader.GetGuid(1),
            reader.GetGuid(2),
            reader.GetGuid(3),
            reader.GetString(4),
            ReadTimestamp(reader, 5),
            ReadTimestamp(reader, 6),
            ReadTimestamp(reader, 7),
            ReadNullableTimestamp(reader, 8),
            reader.IsDBNull(9) ? null : reader.GetString(9),
            reader.IsDBNull(10) ? null : reader.GetString(10),
            reader.IsDBNull(11) ? null : reader.GetString(11),
            activeRole);
        var principal = new AccessPrincipal(
            session.PrincipalId,
            reader.GetString(13),
            session.StaffProfileId,
            ParseAccountStatus(reader.GetString(15)));
        var staffProfile = new StaffProfile(
            session.StaffProfileId,
            reader.GetString(16),
            reader.IsDBNull(17) ? null : reader.GetString(17),
            ParseStaffStatus(reader.GetString(18)));
        var workspace = new Workspace(
            session.WorkspaceId,
            reader.GetString(19),
            reader.GetString(20));
        var roles = ParseRoles(reader.GetFieldValue<string[]>(24));
        if (roles.Count == 0)
        {
            roles = [role];
        }
        var membership = new WorkspaceMembership(
            reader.GetGuid(21),
            session.WorkspaceId,
            session.StaffProfileId,
            role,
            membershipStatus)
        {
            Roles = roles
        };

        return new AccessSessionSnapshot(
            session,
            new AccessAccount(principal, staffProfile, reader.GetString(13)),
            new AccessWorkspaceMembership(workspace, membership));
    }

    public async Task CreateSessionAsync(
        AccessSession session,
        CancellationToken cancellationToken = default)
    {
        var connection = await OpenConnectionAsync(cancellationToken);
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);

        await using (var command = connection.CreateCommand())
        {
            command.Transaction = transaction;
            command.CommandText = """
                INSERT INTO access_sessions
                    (id, principal_id, staff_profile_id, workspace_id, token_hash,
                     issued_at, last_accessed_at, absolute_expires_at, revoked_at,
                     revoke_reason, ip_hash, user_agent, active_role)
                VALUES
                    (@id, @principal_id, @staff_profile_id, @workspace_id, @token_hash,
                     @issued_at, @last_accessed_at, @absolute_expires_at, @revoked_at,
                     @revoke_reason, @ip_hash, @user_agent, @active_role);
                """;
            AddParameter(command, "id", session.Id);
            AddParameter(command, "principal_id", session.PrincipalId);
            AddParameter(command, "staff_profile_id", session.StaffProfileId);
            AddParameter(command, "workspace_id", session.WorkspaceId);
            AddParameter(command, "token_hash", session.TokenHash);
            AddParameter(command, "issued_at", session.IssuedAt);
            AddParameter(command, "last_accessed_at", session.LastAccessedAt);
            AddParameter(command, "absolute_expires_at", session.AbsoluteExpiresAt);
            AddParameter(command, "revoked_at", session.RevokedAt);
            AddParameter(command, "revoke_reason", session.RevokeReason);
            AddParameter(command, "ip_hash", session.IpHash);
            AddParameter(command, "user_agent", session.UserAgent);
            AddParameter(command, "active_role", AccessRoleCodec.ToWireValue(session.ActiveRole));
            await command.ExecuteNonQueryAsync(cancellationToken);
        }

        await using (var command = connection.CreateCommand())
        {
            command.Transaction = transaction;
            command.CommandText = """
                UPDATE access_principals
                SET last_login_at = @last_login_at, updated_at = @last_login_at
                WHERE id = @principal_id;

                UPDATE users
                SET last_login_at = @last_login_at, updated_at = @last_login_at
                WHERE id = @staff_profile_id;
                """;
            AddParameter(command, "last_login_at", session.IssuedAt);
            AddParameter(command, "principal_id", session.PrincipalId);
            AddParameter(command, "staff_profile_id", session.StaffProfileId);
            await command.ExecuteNonQueryAsync(cancellationToken);
        }

        await transaction.CommitAsync(cancellationToken);
    }

    public async Task TouchSessionAsync(
        Guid sessionId,
        DateTimeOffset accessedAt,
        CancellationToken cancellationToken = default)
    {
        var connection = await OpenConnectionAsync(cancellationToken);
        await using var command = connection.CreateCommand();
        command.CommandText = """
            UPDATE access_sessions
            SET last_accessed_at = @last_accessed_at
            WHERE id = @id AND revoked_at IS NULL;
            """;
        AddParameter(command, "last_accessed_at", accessedAt);
        AddParameter(command, "id", sessionId);
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    public async Task<bool> UpdateSessionActiveRoleAsync(
        Guid sessionId,
        AccessRole activeRole,
        DateTimeOffset changedAt,
        CancellationToken cancellationToken = default)
    {
        var connection = await OpenConnectionAsync(cancellationToken);
        await using var command = connection.CreateCommand();
        command.CommandText = """
            UPDATE access_sessions
            SET active_role = @active_role,
                last_accessed_at = @changed_at
            WHERE id = @id AND revoked_at IS NULL;
            """;
        AddParameter(command, "active_role", AccessRoleCodec.ToWireValue(activeRole));
        AddParameter(command, "changed_at", changedAt);
        AddParameter(command, "id", sessionId);
        return await command.ExecuteNonQueryAsync(cancellationToken) > 0;
    }

    public async Task<bool> RevokeSessionAsync(
        string tokenHash,
        DateTimeOffset revokedAt,
        string reason,
        CancellationToken cancellationToken = default)
    {
        var connection = await OpenConnectionAsync(cancellationToken);
        await using var command = connection.CreateCommand();
        command.CommandText = """
            UPDATE access_sessions
            SET revoked_at = @revoked_at, revoke_reason = @revoke_reason
            WHERE token_hash = @token_hash AND revoked_at IS NULL;
            """;
        AddParameter(command, "revoked_at", revokedAt);
        AddParameter(command, "revoke_reason", reason);
        AddParameter(command, "token_hash", tokenHash);
        return await command.ExecuteNonQueryAsync(cancellationToken) > 0;
    }

    private async Task<DbConnection> OpenConnectionAsync(CancellationToken cancellationToken)
    {
        var connection = _dbContext.Database.GetDbConnection();
        if (connection.State != System.Data.ConnectionState.Open)
        {
            await connection.OpenAsync(cancellationToken);
        }

        return connection;
    }

    private static void AddParameter(DbCommand command, string name, object? value)
    {
        var parameter = command.CreateParameter();
        parameter.ParameterName = name;
        parameter.Value = value ?? DBNull.Value;
        command.Parameters.Add(parameter);
    }

    private static DateTimeOffset ReadTimestamp(DbDataReader reader, int ordinal) =>
        new(DateTime.SpecifyKind(reader.GetDateTime(ordinal), DateTimeKind.Utc));

    private static DateTimeOffset? ReadNullableTimestamp(DbDataReader reader, int ordinal) =>
        reader.IsDBNull(ordinal) ? null : ReadTimestamp(reader, ordinal);

    private static AccountStatus ParseAccountStatus(string value) => value switch
    {
        "active" => AccountStatus.Active,
        "inactive" => AccountStatus.Inactive,
        "locked" => AccountStatus.Locked,
        _ => throw new InvalidOperationException($"Unknown account status '{value}'.")
    };

    private static StaffProfileStatus ParseStaffStatus(string value) => value switch
    {
        "active" => StaffProfileStatus.Active,
        "inactive" => StaffProfileStatus.Inactive,
        "locked" => StaffProfileStatus.Locked,
        _ => throw new InvalidOperationException($"Unknown staff status '{value}'.")
    };

    private static bool TryParseRole(string value, out AccessRole role) =>
        AccessRoleCodec.TryParse(value, out role);

    private static List<AccessRole> ParseRoles(IEnumerable<string> values) =>
        values
            .Where(value => AccessRoleCodec.TryParse(value, out _))
            .Select(value =>
            {
                AccessRoleCodec.TryParse(value, out var role);
                return role;
            })
            .Distinct()
            .ToList();

    private static bool TryParseMembershipStatus(string value, out MembershipStatus status) =>
        value switch
        {
            "invited" => SetStatus(MembershipStatus.Invited, out status),
            "active" => SetStatus(MembershipStatus.Active, out status),
            "suspended" => SetStatus(MembershipStatus.Suspended, out status),
            "removed" => SetStatus(MembershipStatus.Removed, out status),
            _ => SetStatus(default, out status, false)
        };

    private static bool SetRole(AccessRole value, out AccessRole role, bool success = true)
    {
        role = value;
        return success;
    }

    private static bool SetStatus(
        MembershipStatus value,
        out MembershipStatus status,
        bool success = true)
    {
        status = value;
        return success;
    }
}
