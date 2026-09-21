using System.Data;
using System.Data.Common;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using RepairFlow.Api.Features.RepairOrder.Application;
using RepairFlow.Api.Features.RepairOrder.Domain;
using RepairFlow.Api.Infrastructure.Database;

namespace RepairFlow.Api.Features.RepairOrder.Infrastructure;

public sealed class RepairEvidenceRepository : IRepairEvidenceRepository
{
    private readonly RepairFlowDbContext _dbContext;

    public RepairEvidenceRepository(RepairFlowDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<RepairEvidenceItemContext?> FindItemContextAsync(
        Guid workspaceId,
        Guid repairItemId,
        CancellationToken cancellationToken = default)
    {
        var connection = await OpenConnectionAsync(cancellationToken);
        await using var command = CreateCommand(connection, """
            SELECT repair_order_id, id, handover_condition, evidence_locked_at, evidence_locked_by
            FROM repair_order_items
            WHERE workspace_id = @workspace_id AND id = @item_id;
            """);
        AddParameter(command, "workspace_id", workspaceId);
        AddParameter(command, "item_id", repairItemId);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        return await reader.ReadAsync(cancellationToken)
            ? new RepairEvidenceItemContext(
                reader.GetGuid(0),
                reader.GetGuid(1),
                reader.IsDBNull(2) ? null : reader.GetString(2),
                reader.IsDBNull(3) ? null : reader.GetFieldValue<DateTimeOffset>(3),
                reader.IsDBNull(4) ? null : reader.GetGuid(4))
            : null;
    }

    public async Task<IReadOnlyList<RepairEvidence>> ListAsync(
        Guid workspaceId,
        Guid repairItemId,
        CancellationToken cancellationToken = default)
    {
        var connection = await OpenConnectionAsync(cancellationToken);
        await using var command = CreateCommand(connection, EvidenceSelectSql + """
            WHERE re.workspace_id = @workspace_id
              AND re.repair_order_item_id = @item_id
              AND re.deleted_at IS NULL
            ORDER BY re.created_at, re.id;
            """);
        AddParameter(command, "workspace_id", workspaceId);
        AddParameter(command, "item_id", repairItemId);
        return await ReadEvidenceListAsync(command, cancellationToken);
    }

    public async Task<RepairEvidence?> FindAsync(
        Guid workspaceId,
        Guid evidenceId,
        CancellationToken cancellationToken = default)
    {
        var connection = await OpenConnectionAsync(cancellationToken);
        await using var command = CreateCommand(connection, EvidenceSelectSql + """
            WHERE re.workspace_id = @workspace_id
              AND re.id = @evidence_id
              AND re.deleted_at IS NULL;
            """);
        AddParameter(command, "workspace_id", workspaceId);
        AddParameter(command, "evidence_id", evidenceId);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        return await reader.ReadAsync(cancellationToken) ? ReadEvidence(reader) : null;
    }

    public async Task<RepairEvidence?> FindActiveByIdempotencyAsync(
        Guid workspaceId,
        Guid repairItemId,
        RepairEvidenceStage stage,
        string idempotencyKey,
        CancellationToken cancellationToken = default)
    {
        var connection = await OpenConnectionAsync(cancellationToken);
        await using var command = CreateCommand(connection, EvidenceSelectSql + """
            WHERE re.workspace_id = @workspace_id
              AND re.repair_order_item_id = @item_id
              AND re.stage = @stage
              AND re.idempotency_key = @idempotency_key
              AND re.deleted_at IS NULL;
            """);
        AddParameter(command, "workspace_id", workspaceId);
        AddParameter(command, "item_id", repairItemId);
        AddParameter(command, "stage", RepairEvidenceStageCodec.ToWireValue(stage));
        AddParameter(command, "idempotency_key", idempotencyKey);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        return await reader.ReadAsync(cancellationToken) ? ReadEvidence(reader) : null;
    }

    public async Task<RepairEvidence?> FindActiveByChecksumAsync(
        Guid workspaceId,
        Guid repairItemId,
        RepairEvidenceStage stage,
        string checksum,
        CancellationToken cancellationToken = default)
    {
        var connection = await OpenConnectionAsync(cancellationToken);
        await using var command = CreateCommand(connection, EvidenceSelectSql + """
            WHERE re.workspace_id = @workspace_id
              AND re.repair_order_item_id = @item_id
              AND re.stage = @stage
              AND re.checksum = @checksum
              AND re.deleted_at IS NULL;
            """);
        AddParameter(command, "workspace_id", workspaceId);
        AddParameter(command, "item_id", repairItemId);
        AddParameter(command, "stage", RepairEvidenceStageCodec.ToWireValue(stage));
        AddParameter(command, "checksum", checksum);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        return await reader.ReadAsync(cancellationToken) ? ReadEvidence(reader) : null;
    }

    public async Task<RepairEvidenceCreateResult> CreateAsync(
        RepairEvidenceCreateData data,
        CancellationToken cancellationToken = default)
    {
        var connection = await OpenConnectionAsync(cancellationToken);
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);
        try
        {
            var item = await ReadLockedItemAsync(
                connection,
                transaction,
                data.WorkspaceId,
                data.RepairOrderId,
                data.RepairItemId,
                cancellationToken);
            if (item is null)
            {
                throw new RepairEvidenceNotFoundException();
            }

            if (item.Value.EvidenceLockedAt is not null)
            {
                throw LockedConflict();
            }

            var existingByKey = await FindActiveAsync(
                connection,
                transaction,
                data.WorkspaceId,
                data.RepairItemId,
                data.Stage,
                data.IdempotencyKey,
                checksum: null,
                cancellationToken);
            if (existingByKey is not null)
            {
                if (!string.Equals(existingByKey.Checksum, data.Checksum, StringComparison.OrdinalIgnoreCase))
                {
                    throw new RepairEvidenceConflictException(
                        "EVIDENCE_IDEMPOTENCY_CONFLICT",
                        "The idempotency key was already used for a different image.");
                }

                await transaction.CommitAsync(cancellationToken);
                return new RepairEvidenceCreateResult(existingByKey, true);
            }

            var existingByChecksum = await FindActiveAsync(
                connection,
                transaction,
                data.WorkspaceId,
                data.RepairItemId,
                data.Stage,
                idempotencyKey: null,
                data.Checksum,
                cancellationToken);
            if (existingByChecksum is not null)
            {
                await transaction.CommitAsync(cancellationToken);
                return new RepairEvidenceCreateResult(existingByChecksum, true);
            }

            await using (var countCommand = CreateCommand(connection, """
                SELECT count(*)
                FROM repair_evidence
                WHERE workspace_id = @workspace_id
                  AND repair_order_item_id = @item_id
                  AND stage = @stage
                  AND deleted_at IS NULL;
                """, transaction))
            {
                AddParameter(countCommand, "workspace_id", data.WorkspaceId);
                AddParameter(countCommand, "item_id", data.RepairItemId);
                AddParameter(countCommand, "stage", RepairEvidenceStageCodec.ToWireValue(data.Stage));
                if (Convert.ToInt32(await countCommand.ExecuteScalarAsync(cancellationToken)) >=
                    RepairEvidenceRules.MaxEvidenceCountPerItem)
                {
                    throw new RepairEvidenceConflictException(
                        "EVIDENCE_LIMIT_REACHED",
                        "An item can have at most five active evidence images.");
                }
            }

            await using (var command = CreateCommand(connection, """
                INSERT INTO repair_evidence
                    (id, workspace_id, repair_order_item_id, stage, object_key,
                     original_filename, mime_type, size_bytes, checksum, idempotency_key,
                     created_by, created_at)
                VALUES
                    (@id, @workspace_id, @item_id, @stage, @object_key,
                     @original_filename, @mime_type, @size_bytes, @checksum, @idempotency_key,
                     @created_by, @created_at);
                """, transaction))
            {
                AddParameter(command, "id", data.Id);
                AddParameter(command, "workspace_id", data.WorkspaceId);
                AddParameter(command, "item_id", data.RepairItemId);
                AddParameter(command, "stage", RepairEvidenceStageCodec.ToWireValue(data.Stage));
                AddParameter(command, "object_key", data.ObjectKey);
                AddParameter(command, "original_filename", data.OriginalFilename);
                AddParameter(command, "mime_type", data.MimeType);
                AddParameter(command, "size_bytes", data.SizeBytes);
                AddParameter(command, "checksum", data.Checksum);
                AddParameter(command, "idempotency_key", data.IdempotencyKey);
                AddParameter(command, "created_by", data.CreatedBy);
                AddParameter(command, "created_at", data.CreatedAt);
                await command.ExecuteNonQueryAsync(cancellationToken);
            }

            await InsertAuditAsync(
                connection,
                transaction,
                data.WorkspaceId,
                data.CreatedBy,
                data.Id,
                new { stage = RepairEvidenceStageCodec.ToWireValue(data.Stage), data.MimeType, data.SizeBytes },
                data.CreatedAt,
                "repair_evidence_uploaded",
                cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            return new RepairEvidenceCreateResult(
                new RepairEvidence(
                    data.Id,
                    data.WorkspaceId,
                    data.RepairOrderId,
                    data.RepairItemId,
                    data.Stage,
                    data.ObjectKey,
                    data.OriginalFilename,
                    data.MimeType,
                    data.SizeBytes,
                    data.Checksum,
                    data.IdempotencyKey,
                    data.CreatedBy,
                    data.CreatedAt),
                false);
        }
        catch (PostgresException exception) when (exception.SqlState == PostgresErrorCodes.UniqueViolation)
        {
            await transaction.RollbackAsync(cancellationToken);
            var existing = await FindActiveByIdempotencyAsync(
                data.WorkspaceId,
                data.RepairItemId,
                data.Stage,
                data.IdempotencyKey,
                cancellationToken);
            existing ??= await FindActiveByChecksumAsync(
                data.WorkspaceId,
                data.RepairItemId,
                data.Stage,
                data.Checksum,
                cancellationToken);
            if (existing is not null)
            {
                if (!string.Equals(existing.Checksum, data.Checksum, StringComparison.OrdinalIgnoreCase))
                {
                    throw new RepairEvidenceConflictException(
                        "EVIDENCE_IDEMPOTENCY_CONFLICT",
                        "The idempotency key was already used for a different image.");
                }

                return new RepairEvidenceCreateResult(existing, true);
            }

            throw;
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<RepairEvidenceDeleteResult?> SoftDeleteAsync(
        Guid workspaceId,
        Guid repairItemId,
        Guid evidenceId,
        Guid actorId,
        CancellationToken cancellationToken = default)
    {
        var connection = await OpenConnectionAsync(cancellationToken);
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);
        try
        {
            var evidence = await FindForUpdateAsync(
                connection,
                transaction,
                workspaceId,
                repairItemId,
                evidenceId,
                cancellationToken);
            if (evidence is null)
            {
                await transaction.CommitAsync(cancellationToken);
                return null;
            }

            if (evidence.LockedAt is not null)
            {
                throw LockedConflict();
            }

            var deletedAt = DateTimeOffset.UtcNow;
            await using (var command = CreateCommand(connection, """
                UPDATE repair_evidence
                SET deleted_at = @deleted_at, deleted_by = @deleted_by
                WHERE workspace_id = @workspace_id
                  AND repair_order_item_id = @item_id
                  AND id = @evidence_id
                  AND deleted_at IS NULL;
                """, transaction))
            {
                AddParameter(command, "deleted_at", deletedAt);
                AddParameter(command, "deleted_by", actorId);
                AddParameter(command, "workspace_id", workspaceId);
                AddParameter(command, "item_id", repairItemId);
                AddParameter(command, "evidence_id", evidenceId);
                await command.ExecuteNonQueryAsync(cancellationToken);
            }

            await InsertAuditAsync(
                connection,
                transaction,
                workspaceId,
                actorId,
                evidenceId,
                new { stage = RepairEvidenceStageCodec.ToWireValue(evidence.Evidence.Stage) },
                deletedAt,
                "repair_evidence_deleted",
                cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            return new RepairEvidenceDeleteResult(
                evidence.Evidence with { DeletedAt = deletedAt, DeletedBy = actorId },
                evidence.Evidence.ObjectKey);
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<RepairEvidenceLockResult?> LockItemAsync(
        Guid workspaceId,
        Guid repairOrderId,
        Guid repairItemId,
        Guid actorId,
        CancellationToken cancellationToken = default)
    {
        var connection = await OpenConnectionAsync(cancellationToken);
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);
        try
        {
            await using var readCommand = CreateCommand(connection, """
                SELECT evidence_locked_at, evidence_locked_by
                FROM repair_order_items
                WHERE workspace_id = @workspace_id
                  AND repair_order_id = @order_id
                  AND id = @item_id
                FOR UPDATE;
                """, transaction);
            AddParameter(readCommand, "workspace_id", workspaceId);
            AddParameter(readCommand, "order_id", repairOrderId);
            AddParameter(readCommand, "item_id", repairItemId);
            DateTimeOffset? lockedAt;
            Guid? lockedBy;
            await using (var reader = await readCommand.ExecuteReaderAsync(cancellationToken))
            {
                if (!await reader.ReadAsync(cancellationToken))
                {
                    await transaction.CommitAsync(cancellationToken);
                    return null;
                }

                lockedAt = reader.IsDBNull(0) ? null : reader.GetFieldValue<DateTimeOffset>(0);
                lockedBy = reader.IsDBNull(1) ? null : reader.GetGuid(1);
            }

            if (lockedAt is not null && lockedBy is not null)
            {
                await transaction.CommitAsync(cancellationToken);
                return new RepairEvidenceLockResult(
                    repairOrderId,
                    repairItemId,
                    lockedAt.Value,
                    lockedBy.Value,
                    true);
            }

            lockedAt = DateTimeOffset.UtcNow;
            lockedBy = actorId;
            await using (var updateCommand = CreateCommand(connection, """
                UPDATE repair_order_items
                SET evidence_locked_at = @locked_at,
                    evidence_locked_by = @locked_by
                WHERE workspace_id = @workspace_id
                  AND repair_order_id = @order_id
                  AND id = @item_id;
                """, transaction))
            {
                AddParameter(updateCommand, "locked_at", lockedAt.Value);
                AddParameter(updateCommand, "locked_by", lockedBy.Value);
                AddParameter(updateCommand, "workspace_id", workspaceId);
                AddParameter(updateCommand, "order_id", repairOrderId);
                AddParameter(updateCommand, "item_id", repairItemId);
                await updateCommand.ExecuteNonQueryAsync(cancellationToken);
            }

            await InsertAuditAsync(
                connection,
                transaction,
                workspaceId,
                actorId,
                repairItemId,
                new { repairOrderId, action = "technician_handover_acceptance" },
                lockedAt.Value,
                "repair_evidence_locked",
                cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            return new RepairEvidenceLockResult(
                repairOrderId,
                repairItemId,
                lockedAt.Value,
                lockedBy.Value,
                false);
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    private static readonly string EvidenceSelectSql = """
        SELECT re.id, re.workspace_id, roi.repair_order_id, re.repair_order_item_id,
               re.stage, re.object_key, re.original_filename, re.mime_type,
               re.size_bytes, re.checksum, re.idempotency_key, re.created_by,
               re.created_at, re.deleted_at, re.deleted_by
        FROM repair_evidence re
        INNER JOIN repair_order_items roi
            ON roi.workspace_id = re.workspace_id
           AND roi.id = re.repair_order_item_id
        """;

    private static async Task<IReadOnlyList<RepairEvidence>> ReadEvidenceListAsync(
        DbCommand command,
        CancellationToken cancellationToken)
    {
        var evidence = new List<RepairEvidence>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            evidence.Add(ReadEvidence(reader));
        }

        return evidence;
    }

    private static async Task<(DateTimeOffset? EvidenceLockedAt, Guid? EvidenceLockedBy)?> ReadLockedItemAsync(
        DbConnection connection,
        DbTransaction transaction,
        Guid workspaceId,
        Guid orderId,
        Guid itemId,
        CancellationToken cancellationToken)
    {
        await using var command = CreateCommand(connection, """
            SELECT evidence_locked_at, evidence_locked_by
            FROM repair_order_items
            WHERE workspace_id = @workspace_id
              AND repair_order_id = @order_id
              AND id = @item_id
            FOR UPDATE;
            """, transaction);
        AddParameter(command, "workspace_id", workspaceId);
        AddParameter(command, "order_id", orderId);
        AddParameter(command, "item_id", itemId);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        return await reader.ReadAsync(cancellationToken)
            ? (
                reader.IsDBNull(0) ? null : reader.GetFieldValue<DateTimeOffset>(0),
                reader.IsDBNull(1) ? null : reader.GetGuid(1))
            : null;
    }

    private static async Task<RepairEvidence?> FindActiveAsync(
        DbConnection connection,
        DbTransaction transaction,
        Guid workspaceId,
        Guid itemId,
        RepairEvidenceStage stage,
        string? idempotencyKey,
        string? checksum,
        CancellationToken cancellationToken)
    {
        await using var command = CreateCommand(connection, """
            SELECT re.id, re.workspace_id, roi.repair_order_id, re.repair_order_item_id,
                   re.stage, re.object_key, re.original_filename, re.mime_type,
                   re.size_bytes, re.checksum, re.idempotency_key, re.created_by,
                   re.created_at, re.deleted_at, re.deleted_by
            FROM repair_evidence re
            INNER JOIN repair_order_items roi
                ON roi.workspace_id = re.workspace_id
               AND roi.id = re.repair_order_item_id
            WHERE re.workspace_id = @workspace_id
              AND re.repair_order_item_id = @item_id
              AND re.stage = @stage
              AND re.deleted_at IS NULL
              AND ((@idempotency_key IS NOT NULL AND re.idempotency_key = @idempotency_key)
                   OR (@checksum IS NOT NULL AND re.checksum = @checksum))
            FOR UPDATE OF re;
            """, transaction);
        AddParameter(command, "workspace_id", workspaceId);
        AddParameter(command, "item_id", itemId);
        AddParameter(command, "stage", RepairEvidenceStageCodec.ToWireValue(stage));
        AddParameter(command, "idempotency_key", idempotencyKey);
        AddParameter(command, "checksum", checksum);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        return await reader.ReadAsync(cancellationToken) ? ReadEvidence(reader) : null;
    }

    private static async Task<LockedEvidence?> FindForUpdateAsync(
        DbConnection connection,
        DbTransaction transaction,
        Guid workspaceId,
        Guid itemId,
        Guid evidenceId,
        CancellationToken cancellationToken)
    {
        await using var command = CreateCommand(connection, """
            SELECT re.id, re.workspace_id, roi.repair_order_id, re.repair_order_item_id,
                   re.stage, re.object_key, re.original_filename, re.mime_type,
                   re.size_bytes, re.checksum, re.idempotency_key, re.created_by,
                   re.created_at, re.deleted_at, re.deleted_by,
                   roi.evidence_locked_at
            FROM repair_evidence re
            INNER JOIN repair_order_items roi
                ON roi.workspace_id = re.workspace_id
               AND roi.id = re.repair_order_item_id
            WHERE re.workspace_id = @workspace_id
              AND re.repair_order_item_id = @item_id
              AND re.id = @evidence_id
              AND re.deleted_at IS NULL
            FOR UPDATE OF re, roi;
            """, transaction);
        AddParameter(command, "workspace_id", workspaceId);
        AddParameter(command, "item_id", itemId);
        AddParameter(command, "evidence_id", evidenceId);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        return await reader.ReadAsync(cancellationToken)
            ? new LockedEvidence(
                ReadEvidence(reader),
                reader.IsDBNull(15) ? null : reader.GetFieldValue<DateTimeOffset>(15))
            : null;
    }

    private static RepairEvidence ReadEvidence(DbDataReader reader) => new(
        reader.GetGuid(0),
        reader.GetGuid(1),
        reader.GetGuid(2),
        reader.GetGuid(3),
        ParseStage(reader.GetString(4)),
        reader.GetString(5),
        reader.GetString(6),
        reader.GetString(7),
        reader.GetInt64(8),
        reader.GetString(9),
        reader.GetString(10),
        reader.GetGuid(11),
        reader.GetFieldValue<DateTimeOffset>(12),
        reader.IsDBNull(13) ? null : reader.GetFieldValue<DateTimeOffset>(13),
        reader.IsDBNull(14) ? null : reader.GetGuid(14));

    private static RepairEvidenceStage ParseStage(string value) =>
        value == "before_repair"
            ? RepairEvidenceStage.BeforeRepair
            : throw new InvalidOperationException("The database contains an unsupported evidence stage.");

    private static RepairEvidenceConflictException LockedConflict() => new(
        "EVIDENCE_LOCKED",
        "Evidence is locked after the technician accepted handover for this item.");

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
                (@id, @workspace_id, @user_id, 'employee', @entity_type, @entity_id, @action,
                 CAST(@metadata_json AS jsonb), @created_at);
            """, transaction);
        AddParameter(command, "id", Guid.NewGuid());
        AddParameter(command, "workspace_id", workspaceId);
        AddParameter(command, "user_id", userId);
        AddParameter(command, "entity_type", action == "repair_evidence_locked" ? "repair_order_item" : "repair_evidence");
        AddParameter(command, "entity_id", entityId);
        AddParameter(command, "action", action);
        AddParameter(command, "metadata_json", JsonSerializer.Serialize(metadata));
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

    private static DbCommand CreateCommand(
        DbConnection connection,
        string sql,
        DbTransaction? transaction = null)
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

    private sealed record LockedEvidence(RepairEvidence Evidence, DateTimeOffset? LockedAt);
}
