using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using RepairFlow.Api.Infrastructure.Database;

namespace RepairFlow.Api.Features.Access.Application;

public sealed record AccessAuditEvent(
    string Action,
    string ActorType,
    Guid? WorkspaceId,
    Guid? UserId,
    Guid? EntityId,
    string? Reason,
    string? IpHash,
    string? UserAgent,
    DateTimeOffset OccurredAt);

public interface IAccessAuditSink
{
    Task RecordAsync(AccessAuditEvent auditEvent, CancellationToken cancellationToken = default);
}

public sealed class DatabaseAccessAuditSink : IAccessAuditSink
{
    private readonly RepairFlowDbContext _dbContext;
    private readonly ILogger<DatabaseAccessAuditSink> _logger;

    public DatabaseAccessAuditSink(
        RepairFlowDbContext dbContext,
        ILogger<DatabaseAccessAuditSink> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task RecordAsync(
        AccessAuditEvent auditEvent,
        CancellationToken cancellationToken = default)
    {
        if (auditEvent.WorkspaceId is null || auditEvent.EntityId is null)
        {
            _logger.LogInformation(
                "Access audit event {Action} recorded without a workspace entity.",
                auditEvent.Action);
            return;
        }

        try
        {
            var connection = _dbContext.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open)
            {
                await connection.OpenAsync(cancellationToken);
            }

            await using var command = connection.CreateCommand();
            command.CommandText = """
                INSERT INTO audit_logs
                    (id, workspace_id, user_id, actor_type, entity_type, entity_id, action,
                     metadata_json, ip_hash, user_agent, created_at)
                VALUES
                    (@id, @workspace_id, @user_id, @actor_type, @entity_type, @entity_id, @action,
                     CAST(@metadata_json AS jsonb), @ip_hash, @user_agent, @created_at);
                """;
            AddParameter(command, "id", Guid.NewGuid());
            AddParameter(command, "workspace_id", auditEvent.WorkspaceId.Value);
            AddParameter(command, "user_id", auditEvent.UserId);
            AddParameter(command, "actor_type", auditEvent.ActorType);
            AddParameter(command, "entity_type", "access");
            AddParameter(command, "entity_id", auditEvent.EntityId.Value);
            AddParameter(command, "action", auditEvent.Action);
            AddParameter(
                command,
                "metadata_json",
                JsonSerializer.Serialize(new { reason = auditEvent.Reason }));
            AddParameter(command, "ip_hash", auditEvent.IpHash);
            AddParameter(command, "user_agent", auditEvent.UserAgent);
            AddParameter(command, "created_at", auditEvent.OccurredAt);
            await command.ExecuteNonQueryAsync(cancellationToken);
        }
        catch (Exception exception)
        {
            _logger.LogWarning(
                exception,
                "Could not persist access audit event {Action}; keeping the event sanitized.",
                auditEvent.Action);
        }
    }

    private static void AddParameter(System.Data.Common.DbCommand command, string name, object? value)
    {
        var parameter = command.CreateParameter();
        parameter.ParameterName = name;
        parameter.Value = value ?? DBNull.Value;
        command.Parameters.Add(parameter);
    }
}
