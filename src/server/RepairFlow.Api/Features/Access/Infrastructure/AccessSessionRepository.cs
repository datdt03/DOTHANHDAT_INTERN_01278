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
                   w.id, w.name, w.timezone
            FROM workspace_memberships wm
            INNER JOIN workspaces w ON w.id = wm.workspace_id
            WHERE wm.user_id = @staff_profile_id
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

            memberships.Add(new AccessWorkspaceMembership(
                new Workspace(reader.GetGuid(5), reader.GetString(6), reader.GetString(7)),
                new WorkspaceMembership(
                    reader.GetGuid(0),
                    reader.GetGuid(1),
                    reader.GetGuid(2),
                    role,
                    status)));
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
                   ap.email, ap.credential_hash, ap.status,
                   u.name, u.phone, u.status,
                   w.name, w.timezone,
                   wm.id, wm.role, wm.status
            FROM access_sessions s
            INNER JOIN access_principals ap ON ap.id = s.principal_id
            INNER JOIN users u ON u.id = s.staff_profile_id
            INNER JOIN workspaces w ON w.id = s.workspace_id
            INNER JOIN workspace_memberships wm
                ON wm.workspace_id = s.workspace_id
               AND wm.user_id = s.staff_profile_id
            WHERE s.token_hash = @token_hash
            LIMIT 1;
            """;
        AddParameter(command, "token_hash", tokenHash);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken) ||
            !TryParseRole(reader.GetString(21), out var role) ||
            !TryParseMembershipStatus(reader.GetString(22), out var membershipStatus))
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
            reader.IsDBNull(11) ? null : reader.GetString(11));
        var principal = new AccessPrincipal(
            session.PrincipalId,
            reader.GetString(12),
            session.StaffProfileId,
            ParseAccountStatus(reader.GetString(14)));
        var staffProfile = new StaffProfile(
            session.StaffProfileId,
            reader.GetString(15),
            reader.IsDBNull(16) ? null : reader.GetString(16),
            ParseStaffStatus(reader.GetString(17)));
        var workspace = new Workspace(
            session.WorkspaceId,
            reader.GetString(18),
            reader.GetString(19));
        var membership = new WorkspaceMembership(
            reader.GetGuid(20),
            session.WorkspaceId,
            session.StaffProfileId,
            role,
            membershipStatus);

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
                     revoke_reason, ip_hash, user_agent)
                VALUES
                    (@id, @principal_id, @staff_profile_id, @workspace_id, @token_hash,
                     @issued_at, @last_accessed_at, @absolute_expires_at, @revoked_at,
                     @revoke_reason, @ip_hash, @user_agent);
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
        value switch
        {
            "owner" => SetRole(AccessRole.Owner, out role),
            "manager" => SetRole(AccessRole.Manager, out role),
            "receptionist" => SetRole(AccessRole.Receptionist, out role),
            "technician" => SetRole(AccessRole.Technician, out role),
            _ => SetRole(default, out role, false)
        };

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
