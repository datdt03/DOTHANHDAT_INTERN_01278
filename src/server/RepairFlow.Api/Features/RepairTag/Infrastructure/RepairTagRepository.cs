using System.Data;
using System.Data.Common;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using NpgsqlTypes;
using RepairFlow.Api.Features.RepairOrder.Domain;
using RepairFlow.Api.Features.RepairTag.Application;
using RepairFlow.Api.Features.RepairTag.Domain;
using RepairFlow.Api.Infrastructure.Database;
using RepairTagEntity = RepairFlow.Api.Features.RepairTag.Domain.RepairTag;

namespace RepairFlow.Api.Features.RepairTag.Infrastructure;

public sealed class RepairTagRepository : IRepairTagRepository
{
    private readonly RepairFlowDbContext _dbContext;

    public RepairTagRepository(RepairFlowDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<RepairTagEntity>> SearchAsync(
        Guid workspaceId,
        string? normalizedQuery,
        bool includeUnused,
        CancellationToken cancellationToken = default)
    {
        var connection = await OpenConnectionAsync(cancellationToken);
        await using var command = CreateCommand(connection, """
            SELECT wt.id, wt.workspace_id, wt.name, wt.normalized_name,
                   wt.created_by, wt.created_at, wt.updated_at
            FROM workspace_tags wt
            WHERE wt.workspace_id = @workspace_id
              AND (@include_unused OR EXISTS (
                    SELECT 1
                    FROM repair_order_item_tags oit
                    WHERE oit.tag_id = wt.id))
              AND (@query IS NULL OR position(@query in wt.normalized_name) > 0)
            ORDER BY
                CASE
                    WHEN @query IS NULL THEN 0
                    WHEN wt.normalized_name = @query THEN 0
                    WHEN left(wt.normalized_name, length(@query)) = @query THEN 1
                    ELSE 2
                END,
                wt.normalized_name,
                wt.id;
            """);
        AddParameter(command, "workspace_id", workspaceId);
        AddTextParameter(command, "query", normalizedQuery);
        AddParameter(command, "include_unused", includeUnused);

        var tags = new List<RepairTagEntity>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            tags.Add(ReadTag(reader));
        }

        return tags;
    }

    public async Task<RepairTagEntity> CreateAsync(
        RepairTagWriteRequest request,
        CancellationToken cancellationToken = default)
    {
        var connection = await OpenConnectionAsync(cancellationToken);
        var now = DateTimeOffset.UtcNow;
        try
        {
            await using var command = CreateCommand(connection, """
                INSERT INTO workspace_tags
                    (id, workspace_id, name, normalized_name, created_by, created_at, updated_at)
                VALUES
                    (@id, @workspace_id, @name, @normalized_name, @created_by, @created_at, @updated_at)
                RETURNING id, workspace_id, name, normalized_name, created_by, created_at, updated_at;
                """);
            AddParameter(command, "id", Guid.NewGuid());
            AddParameter(command, "workspace_id", request.WorkspaceId);
            AddParameter(command, "name", request.Name);
            AddParameter(command, "normalized_name", request.NormalizedName);
            AddParameter(command, "created_by", request.ActorId);
            AddParameter(command, "created_at", now);
            AddParameter(command, "updated_at", now);
            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            await reader.ReadAsync(cancellationToken);
            var tag = ReadTag(reader);
            await reader.CloseAsync();
            await InsertAuditAsync(
                connection,
                null,
                request.WorkspaceId,
                request.ActorId,
                tag.Id,
                new { name = tag.Name },
                now,
                "repair_tag_created",
                cancellationToken);
            return tag;
        }
        catch (PostgresException exception) when (IsTagNameUniqueViolation(exception))
        {
            var existing = await FindByNormalizedNameAsync(
                connection,
                request.WorkspaceId,
                request.NormalizedName,
                cancellationToken);
            throw NameExists(existing);
        }
    }

    public async Task<RepairTagEntity> RenameAsync(
        Guid workspaceId,
        Guid tagId,
        RepairTagWriteRequest request,
        CancellationToken cancellationToken = default)
    {
        var connection = await OpenConnectionAsync(cancellationToken);
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);
        try
        {
            var current = await FindByIdAsync(
                connection,
                transaction,
                workspaceId,
                tagId,
                forUpdate: true,
                cancellationToken);
            if (current is null)
            {
                throw new RepairTagNotFoundException();
            }

            var existing = await FindByNormalizedNameAsync(
                connection,
                workspaceId,
                request.NormalizedName,
                cancellationToken,
                transaction);
            if (existing is not null && existing.Id != tagId)
            {
                throw NameExists(existing);
            }

            var now = DateTimeOffset.UtcNow;
            await using var command = CreateCommand(connection, """
                UPDATE workspace_tags
                SET name = @name,
                    normalized_name = @normalized_name,
                    updated_at = @updated_at
                WHERE workspace_id = @workspace_id AND id = @id;
                """, transaction);
            AddParameter(command, "name", request.Name);
            AddParameter(command, "normalized_name", request.NormalizedName);
            AddParameter(command, "updated_at", now);
            AddParameter(command, "workspace_id", workspaceId);
            AddParameter(command, "id", tagId);
            await command.ExecuteNonQueryAsync(cancellationToken);
            await InsertAuditAsync(
                connection,
                transaction,
                workspaceId,
                request.ActorId,
                tagId,
                new { oldName = current.Name, newName = request.Name },
                now,
                "repair_tag_renamed",
                cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            return current with
            {
                Name = request.Name,
                NormalizedName = request.NormalizedName,
                UpdatedAt = now
            };
        }
        catch (PostgresException exception) when (IsTagNameUniqueViolation(exception))
        {
            await transaction.RollbackAsync(cancellationToken);
            var existing = await FindByNormalizedNameAsync(
                connection,
                workspaceId,
                request.NormalizedName,
                cancellationToken);
            throw NameExists(existing);
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task DeleteAsync(
        Guid workspaceId,
        Guid tagId,
        Guid actorId,
        CancellationToken cancellationToken = default)
    {
        var connection = await OpenConnectionAsync(cancellationToken);
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);
        try
        {
            var tag = await FindByIdAsync(
                connection,
                transaction,
                workspaceId,
                tagId,
                forUpdate: true,
                cancellationToken);
            if (tag is null)
            {
                throw new RepairTagNotFoundException();
            }

            await using (var referenceCommand = CreateCommand(connection, """
                SELECT EXISTS (
                    SELECT 1
                    FROM repair_order_item_tags
                    WHERE tag_id = @tag_id);
                """, transaction))
            {
                AddParameter(referenceCommand, "tag_id", tagId);
                if (Convert.ToBoolean(await referenceCommand.ExecuteScalarAsync(cancellationToken)))
                {
                    throw new RepairTagConflictException(
                        "TAG_IN_USE",
                        "The tag cannot be deleted while it is assigned to a repair item.");
                }
            }

            await using var deleteCommand = CreateCommand(connection, """
                DELETE FROM workspace_tags
                WHERE workspace_id = @workspace_id AND id = @id;
                """, transaction);
            AddParameter(deleteCommand, "workspace_id", workspaceId);
            AddParameter(deleteCommand, "id", tagId);
            await deleteCommand.ExecuteNonQueryAsync(cancellationToken);
            await InsertAuditAsync(
                connection,
                transaction,
                workspaceId,
                actorId,
                tagId,
                new { name = tag.Name },
                DateTimeOffset.UtcNow,
                "repair_tag_deleted",
                cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<RepairItemTagAssignment> ReplaceItemAssignmentsAsync(
        RepairItemTagAssignmentRequest request,
        CancellationToken cancellationToken = default)
    {
        var connection = await OpenConnectionAsync(cancellationToken);
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);
        string orderStatus;
        try
        {
            if (request.TagIds.Count > 0)
            {
                await using var tagCommand = CreateCommand(connection, """
                    SELECT id
                    FROM workspace_tags
                    WHERE workspace_id = @workspace_id
                      AND id = ANY(@tag_ids)
                    ORDER BY id
                    FOR KEY SHARE;
                    """, transaction);
                AddParameter(tagCommand, "workspace_id", request.WorkspaceId);
                AddUuidArrayParameter(tagCommand, "tag_ids", request.TagIds);
                var availableTagIds = new HashSet<Guid>();
                await using var tagReader = await tagCommand.ExecuteReaderAsync(cancellationToken);
                while (await tagReader.ReadAsync(cancellationToken))
                {
                    availableTagIds.Add(tagReader.GetGuid(0));
                }

                if (availableTagIds.Count != request.TagIds.Count)
                {
                    throw new RepairTagConflictException(
                        "TAG_WORKSPACE_MISMATCH",
                        "One or more tags do not belong to the active workspace.");
                }
            }

            await using (var itemCommand = CreateCommand(connection, """
                SELECT ro.status
                FROM repair_orders ro
                INNER JOIN repair_order_items roi
                    ON roi.workspace_id = ro.workspace_id
                   AND roi.repair_order_id = ro.id
                WHERE ro.workspace_id = @workspace_id
                  AND ro.id = @order_id
                  AND roi.id = @item_id
                FOR UPDATE OF ro, roi;
                """, transaction))
            {
                AddParameter(itemCommand, "workspace_id", request.WorkspaceId);
                AddParameter(itemCommand, "order_id", request.RepairOrderId);
                AddParameter(itemCommand, "item_id", request.RepairItemId);
                await using var reader = await itemCommand.ExecuteReaderAsync(cancellationToken);
                if (!await reader.ReadAsync(cancellationToken))
                {
                    throw new RepairTagNotFoundException();
                }

                orderStatus = reader.GetString(0);
            }

            if (!RepairOrderStatusCodec.TryParse(orderStatus, out var parsedStatus))
            {
                throw new InvalidOperationException("The database contains an unsupported repair-order status.");
            }

            if (parsedStatus != RepairOrderStatus.Received)
            {
                throw new RepairTagConflictException(
                    "TAG_ASSIGNMENT_LOCKED",
                    "Tag assignments can only be changed while the repair order is received.");
            }

            await using (var deleteCommand = CreateCommand(connection, """
                DELETE FROM repair_order_item_tags
                WHERE repair_order_item_id = @item_id;
                """, transaction))
            {
                AddParameter(deleteCommand, "item_id", request.RepairItemId);
                await deleteCommand.ExecuteNonQueryAsync(cancellationToken);
            }

            foreach (var tagId in request.TagIds)
            {
                await using var insertCommand = CreateCommand(connection, """
                    INSERT INTO repair_order_item_tags
                        (repair_order_item_id, tag_id, created_by, created_at)
                    VALUES
                        (@item_id, @tag_id, @created_by, @created_at);
                    """, transaction);
                AddParameter(insertCommand, "item_id", request.RepairItemId);
                AddParameter(insertCommand, "tag_id", tagId);
                AddParameter(insertCommand, "created_by", request.ActorId);
                AddParameter(insertCommand, "created_at", DateTimeOffset.UtcNow);
                await insertCommand.ExecuteNonQueryAsync(cancellationToken);
            }

            await InsertAuditAsync(
                connection,
                transaction,
                request.WorkspaceId,
                request.ActorId,
                request.RepairItemId,
                new { tagIds = request.TagIds },
                DateTimeOffset.UtcNow,
                "repair_item_tags_replaced",
                cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        }
        catch (PostgresException exception) when (exception.SqlState == PostgresErrorCodes.ForeignKeyViolation)
        {
            await transaction.RollbackAsync(cancellationToken);
            throw new RepairTagConflictException(
                "TAG_WORKSPACE_MISMATCH",
                "One or more tags do not belong to the active workspace.");
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }

        var tags = await ReadItemTagsAsync(
            connection,
            request.WorkspaceId,
            request.RepairItemId,
            cancellationToken);
        return new RepairItemTagAssignment(
            request.RepairOrderId,
            request.RepairItemId,
            orderStatus,
            tags);
    }

    public async Task<IReadOnlyList<RepairTagEntity>> ReadItemTagsAsync(
        DbConnection connection,
        Guid workspaceId,
        Guid repairItemId,
        CancellationToken cancellationToken = default)
    {
        await using var command = CreateCommand(connection, """
            SELECT wt.id, wt.workspace_id, wt.name, wt.normalized_name,
                   wt.created_by, wt.created_at, wt.updated_at
            FROM repair_order_item_tags oit
            INNER JOIN workspace_tags wt ON wt.id = oit.tag_id
            WHERE wt.workspace_id = @workspace_id
              AND oit.repair_order_item_id = @item_id
            ORDER BY wt.normalized_name, wt.id;
            """);
        AddParameter(command, "workspace_id", workspaceId);
        AddParameter(command, "item_id", repairItemId);
        var tags = new List<RepairTagEntity>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            tags.Add(ReadTag(reader));
        }

        return tags;
    }

    private static async Task<RepairTagEntity?> FindByIdAsync(
        DbConnection connection,
        DbTransaction? transaction,
        Guid workspaceId,
        Guid tagId,
        bool forUpdate,
        CancellationToken cancellationToken)
    {
        await using var command = CreateCommand(connection, $"""
            SELECT id, workspace_id, name, normalized_name,
                   created_by, created_at, updated_at
            FROM workspace_tags
            WHERE workspace_id = @workspace_id AND id = @id
            {(forUpdate ? "FOR UPDATE" : string.Empty)};
            """, transaction);
        AddParameter(command, "workspace_id", workspaceId);
        AddParameter(command, "id", tagId);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        return await reader.ReadAsync(cancellationToken) ? ReadTag(reader) : null;
    }

    private static async Task<RepairTagEntity?> FindByNormalizedNameAsync(
        DbConnection connection,
        Guid workspaceId,
        string normalizedName,
        CancellationToken cancellationToken,
        DbTransaction? transaction = null)
    {
        await using var command = CreateCommand(connection, """
            SELECT id, workspace_id, name, normalized_name,
                   created_by, created_at, updated_at
            FROM workspace_tags
            WHERE workspace_id = @workspace_id AND normalized_name = @normalized_name;
            """, transaction);
        AddParameter(command, "workspace_id", workspaceId);
        AddParameter(command, "normalized_name", normalizedName);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        return await reader.ReadAsync(cancellationToken) ? ReadTag(reader) : null;
    }

    private static RepairTagConflictException NameExists(RepairTagEntity? existing) =>
        new(
            "TAG_NAME_EXISTS",
            "A tag with the same normalized name already exists in the workspace.",
            existing is null
                ? null
                : new
                {
                    existingTagId = existing.Id,
                    existingTag = new
                    {
                        id = existing.Id,
                        name = existing.Name,
                        createdAt = existing.CreatedAt,
                        updatedAt = existing.UpdatedAt
                    }
                });

    private static bool IsTagNameUniqueViolation(PostgresException exception) =>
        exception.SqlState == PostgresErrorCodes.UniqueViolation &&
        exception.ConstraintName?.Contains(
            "workspace_tags_workspace_normalized_unique",
            StringComparison.OrdinalIgnoreCase) == true;

    private static async Task InsertAuditAsync(
        DbConnection connection,
        DbTransaction? transaction,
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
                (@id, @workspace_id, @user_id, 'employee', @entity_type, @entity_id, @action,
                 CAST(@metadata_json AS jsonb), @created_at);
            """, transaction);
        AddParameter(command, "id", Guid.NewGuid());
        AddParameter(command, "workspace_id", workspaceId);
        AddParameter(command, "user_id", userId);
        AddParameter(command, "entity_type", action.StartsWith("repair_item_", StringComparison.Ordinal)
            ? "repair_order_item"
            : "workspace_tag");
        AddParameter(command, "entity_id", entityId);
        AddParameter(command, "action", action);
        AddParameter(command, "metadata_json", JsonSerializer.Serialize(metadata));
        AddParameter(command, "created_at", occurredAt);
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    private static RepairTagEntity ReadTag(DbDataReader reader) => new(
        reader.GetGuid(0),
        reader.GetGuid(1),
        reader.GetString(2),
        reader.GetString(3),
        reader.GetGuid(4),
        reader.GetFieldValue<DateTimeOffset>(5),
        reader.GetFieldValue<DateTimeOffset>(6));

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

    private static void AddTextParameter(DbCommand command, string name, string? value)
    {
        var parameter = command.CreateParameter();
        parameter.ParameterName = name;
        parameter.Value = (object?)value ?? DBNull.Value;
        if (parameter is NpgsqlParameter npgsqlParameter)
        {
            npgsqlParameter.NpgsqlDbType = NpgsqlDbType.Text;
        }

        command.Parameters.Add(parameter);
    }

    private static void AddUuidArrayParameter(
        DbCommand command,
        string name,
        IReadOnlyList<Guid> values)
    {
        var parameter = command.CreateParameter();
        parameter.ParameterName = name;
        parameter.Value = values.ToArray();
        if (parameter is NpgsqlParameter npgsqlParameter)
        {
            npgsqlParameter.NpgsqlDbType = NpgsqlDbType.Array | NpgsqlDbType.Uuid;
        }

        command.Parameters.Add(parameter);
    }
}
