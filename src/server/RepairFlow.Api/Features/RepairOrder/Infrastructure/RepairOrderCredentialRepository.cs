using System.Data;
using System.Data.Common;
using Microsoft.EntityFrameworkCore;
using RepairFlow.Api.Features.RepairOrder.Application;
using RepairFlow.Api.Infrastructure.Database;

namespace RepairFlow.Api.Features.RepairOrder.Infrastructure;

public sealed class RepairOrderCredentialRepository : IRepairOrderCredentialRepository
{
    private readonly RepairFlowDbContext _dbContext;

    public RepairOrderCredentialRepository(RepairFlowDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<StoredCredential?> FindCredentialAsync(
        Guid workspaceId,
        Guid orderId,
        Guid itemId,
        CancellationToken cancellationToken = default)
    {
        var connection = await OpenConnectionAsync(cancellationToken);
        await using var command = CreateCommand(connection, """
            SELECT repair_order_id, id, credential_status, credential_ciphertext,
                   credential_key_version, credential_expires_at, credential_destroyed_at
            FROM repair_order_items
            WHERE workspace_id = @workspace_id
              AND repair_order_id = @repair_order_id
              AND id = @item_id
              AND credential_ciphertext IS NOT NULL;
            """);
        AddParameter(command, "workspace_id", workspaceId);
        AddParameter(command, "repair_order_id", orderId);
        AddParameter(command, "item_id", itemId);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        return await reader.ReadAsync(cancellationToken)
            ? new StoredCredential(
                reader.GetGuid(0),
                reader.GetGuid(1),
                reader.GetString(2),
                reader.GetString(3),
                reader.GetString(4),
                reader.IsDBNull(5) ? null : reader.GetFieldValue<DateTimeOffset>(5),
                reader.IsDBNull(6) ? null : reader.GetFieldValue<DateTimeOffset>(6))
            : null;
    }

    public async Task RecordCredentialRevealAsync(
        Guid workspaceId,
        Guid orderId,
        Guid itemId,
        Guid actorId,
        CancellationToken cancellationToken = default)
    {
        var connection = await OpenConnectionAsync(cancellationToken);
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);
        try
        {
            var now = DateTimeOffset.UtcNow;
            await InsertAuditAsync(
                connection,
                transaction,
                workspaceId,
                actorId,
                orderId,
                new { repairItemId = itemId },
                now,
                "repair_item_credential_revealed",
                cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<DestroyedCredential?> DestroyCredentialAsync(
        Guid workspaceId,
        Guid orderId,
        Guid itemId,
        Guid actorId,
        CancellationToken cancellationToken = default)
    {
        var connection = await OpenConnectionAsync(cancellationToken);
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);
        try
        {
            var destroyedAt = DateTimeOffset.UtcNow;
            await using var command = CreateCommand(connection, """
                UPDATE repair_order_items
                SET credential_status = 'destroyed',
                    credential_ciphertext = NULL,
                    credential_key_version = NULL,
                    credential_destroyed_at = @destroyed_at
                WHERE workspace_id = @workspace_id
                  AND repair_order_id = @repair_order_id
                  AND id = @item_id
                  AND credential_ciphertext IS NOT NULL
                  AND credential_destroyed_at IS NULL
                RETURNING id;
                """, transaction);
            AddParameter(command, "destroyed_at", destroyedAt);
            AddParameter(command, "workspace_id", workspaceId);
            AddParameter(command, "repair_order_id", orderId);
            AddParameter(command, "item_id", itemId);
            var result = await command.ExecuteScalarAsync(cancellationToken);
            if (result is null)
            {
                await transaction.RollbackAsync(cancellationToken);
                return null;
            }

            await InsertAuditAsync(
                connection,
                transaction,
                workspaceId,
                actorId,
                orderId,
                new { repairItemId = itemId },
                destroyedAt,
                "repair_item_credential_destroyed",
                cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            return new DestroyedCredential(orderId, itemId, destroyedAt);
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    private static async Task InsertAuditAsync(
        DbConnection connection,
        DbTransaction transaction,
        Guid workspaceId,
        Guid userId,
        Guid entityId,
        object metadata,
        DateTimeOffset occurredAt,
        string action,
        CancellationToken cancellationToken)
    {
        await using var command = CreateCommand(connection, """
            INSERT INTO audit_logs
                (id, workspace_id, user_id, actor_type, entity_type, entity_id, action,
                 metadata_json, created_at)
            VALUES
                (@id, @workspace_id, @user_id, 'employee', 'repair_order', @entity_id, @action,
                 CAST(@metadata_json AS jsonb), @created_at);
            """, transaction);
        AddParameter(command, "id", Guid.NewGuid());
        AddParameter(command, "workspace_id", workspaceId);
        AddParameter(command, "user_id", userId);
        AddParameter(command, "entity_id", entityId);
        AddParameter(command, "action", action);
        AddParameter(command, "metadata_json", System.Text.Json.JsonSerializer.Serialize(metadata));
        AddParameter(command, "created_at", occurredAt);
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    private async Task<DbConnection> OpenConnectionAsync(CancellationToken cancellationToken)
    {
        var connection = _dbContext.Database.GetDbConnection();
        if (connection.State != ConnectionState.Open)
        {
            await connection.OpenAsync(cancellationToken);
        }

        return connection;
    }

    private static DbCommand CreateCommand(DbConnection connection, string sql, DbTransaction? transaction = null)
    {
        var command = connection.CreateCommand();
        command.CommandText = sql;
        command.Transaction = transaction;
        return command;
    }

    private static void AddParameter(DbCommand command, string name, object? value)
    {
        var parameter = command.CreateParameter();
        parameter.ParameterName = name;
        parameter.Value = value ?? DBNull.Value;
        command.Parameters.Add(parameter);
    }
}
