using System.Data;
using System.Data.Common;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using RepairFlow.Api.Features.RepairOrder.Application;
using RepairFlow.Api.Features.RepairOrder.Domain;
using RepairFlow.Api.Features.RepairTag.Domain;
using RepairFlow.Api.Infrastructure.Database;
using RepairTagEntity = RepairFlow.Api.Features.RepairTag.Domain.RepairTag;
using RepairOrderEntity = RepairFlow.Api.Features.RepairOrder.Domain.RepairOrder;

namespace RepairFlow.Api.Features.RepairOrder.Infrastructure;

public sealed class RepairOrderRepository : IRepairOrderRepository
{
    private readonly RepairFlowDbContext _dbContext;

    public RepairOrderRepository(RepairFlowDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<RepairOrderEntity>> SearchAsync(
        Guid workspaceId,
        string? status,
        Guid? customerId,
        Guid? deviceId,
        string? search,
        Guid? assignedStaffId,
        CancellationToken cancellationToken = default)
    {
        var connection = await OpenConnectionAsync(cancellationToken);
        await using var command = CreateCommand(connection, """
            SELECT ro.id, ro.workspace_id, ro.order_code, ro.customer_id, ro.device_id,
                   ro.status, ro.customer_description, ro.internal_note, ro.received_at,
                   ro.expected_completed_at, ro.completed_at, ro.cancelled_at,
                   ro.cancellation_reason, ro.created_by, ro.created_at, ro.updated_at
            FROM repair_orders ro
            WHERE ro.workspace_id = @workspace_id
              AND (CAST(@status AS text) IS NULL OR ro.status = CAST(@status AS text))
              AND (CAST(@customer_id AS uuid) IS NULL OR ro.customer_id = @customer_id)
              AND (CAST(@device_id AS uuid) IS NULL OR ro.device_id = @device_id)
              AND (CAST(@search AS text) IS NULL
                   OR ro.order_code ILIKE '%' || CAST(@search AS text) || '%'
                   OR ro.customer_description ILIKE '%' || CAST(@search AS text) || '%')
              AND (CAST(@assigned_staff_id AS uuid) IS NULL OR EXISTS (
                    SELECT 1
                    FROM repair_order_staff ros
                    WHERE ros.repair_order_id = ro.id
                      AND ros.user_id = @assigned_staff_id
                      AND ros.completed_at IS NULL))
            ORDER BY ro.updated_at DESC, ro.id
            LIMIT 100;
            """);
        AddParameter(command, "workspace_id", workspaceId);
        AddParameter(command, "status", status);
        AddParameter(command, "customer_id", customerId);
        AddParameter(command, "device_id", deviceId);
        AddParameter(command, "search", search);
        AddParameter(command, "assigned_staff_id", assignedStaffId);

        var orders = new List<RepairOrderEntity>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            orders.Add(ReadOrder(reader));
        }

        return orders;
    }

    public async Task<RepairOrderEntity?> FindAsync(
        Guid workspaceId,
        Guid orderId,
        Guid? assignedStaffId,
        CancellationToken cancellationToken = default)
    {
        var connection = await OpenConnectionAsync(cancellationToken);
        await using var command = CreateCommand(connection, """
            SELECT ro.id, ro.workspace_id, ro.order_code, ro.customer_id, ro.device_id,
                   ro.status, ro.customer_description, ro.internal_note, ro.received_at,
                   ro.expected_completed_at, ro.completed_at, ro.cancelled_at,
                   ro.cancellation_reason, ro.created_by, ro.created_at, ro.updated_at
            FROM repair_orders ro
            WHERE ro.workspace_id = @workspace_id
              AND ro.id = @order_id
              AND (CAST(@assigned_staff_id AS uuid) IS NULL OR EXISTS (
                    SELECT 1
                    FROM repair_order_staff ros
                    WHERE ros.repair_order_id = ro.id
                      AND ros.user_id = @assigned_staff_id
                      AND ros.completed_at IS NULL));
            """);
        AddParameter(command, "workspace_id", workspaceId);
        AddParameter(command, "order_id", orderId);
        AddParameter(command, "assigned_staff_id", assignedStaffId);
        RepairOrderEntity? order;
        await using (var reader = await command.ExecuteReaderAsync(cancellationToken))
        {
            order = await reader.ReadAsync(cancellationToken) ? ReadOrder(reader) : null;
        }

        if (order is null)
        {
            return null;
        }

        var assignments = await ReadAssignmentsAsync(connection, order.Id, cancellationToken);
        var history = await ReadStatusHistoryAsync(connection, order.Id, cancellationToken);
        var repairItems = await ReadRepairItemsAsync(connection, order.WorkspaceId, order.Id, cancellationToken);
        return order with
        {
            Assignments = assignments,
            StatusHistory = history,
            RepairItems = repairItems
        };
    }

    public async Task<RepairOrderEntity> CreateAsync(
        Guid workspaceId,
        CreateRepairOrderData data,
        CancellationToken cancellationToken = default)
    {
        var connection = await OpenConnectionAsync(cancellationToken);
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);
        try
        {
            if (!await ExistsAsync(connection, transaction, """
                SELECT 1 FROM devices
                WHERE id = @device_id
                  AND customer_id = @customer_id
                  AND workspace_id = @workspace_id;
                """, [
                    ("device_id", (object?)data.DeviceId),
                    ("customer_id", data.CustomerId),
                    ("workspace_id", workspaceId)
                ], cancellationToken))
            {
                throw new RepairOrderNotFoundException();
            }

            await LockDeviceAsync(connection, transaction, workspaceId, data.DeviceId, cancellationToken);
            var openOrders = await ReadOpenOrdersAsync(
                connection, transaction, workspaceId, data.CustomerId, data.DeviceId, cancellationToken);
            if (openOrders.Count > 0 && !data.ConfirmOpenOrder)
            {
                throw new RepairOrderConflictException(
                    "device_open_order",
                    "This device already has an open repair order.",
                    new
                    {
                        orders = openOrders.Select(item => new
                        {
                            id = item.Id,
                            orderCode = item.OrderCode,
                            status = RepairOrderStatusCodec.ToWireValue(item.Status)
                        }).ToArray()
                    });
            }

            var intakeStaffId = data.IntakeStaffId ?? data.AutomaticIntakeStaffId;
            if (intakeStaffId is not null && !await ExistsAsync(connection, transaction, """
                SELECT 1
                FROM users u
                INNER JOIN workspace_memberships wm
                    ON wm.user_id = u.id AND wm.workspace_id = @workspace_id
                WHERE u.id = @staff_id
                  AND u.status = 'active'
                  AND wm.status = 'active';
                """, [
                    ("workspace_id", (object?)workspaceId),
                    ("staff_id", intakeStaffId)
                ], cancellationToken))
            {
                throw new RepairOrderConflictException(
                    "invalid_intake_staff",
                    "The selected intake staff member is not active in the workspace.");
            }

            var sequence = await NextOrderSequenceAsync(connection, transaction, workspaceId, cancellationToken);
            var now = DateTimeOffset.UtcNow;
            var orderId = Guid.NewGuid();
            var orderCode = $"RF-{now:yyyy}-{sequence:D6}";
            await using (var command = CreateCommand(connection, """
                INSERT INTO repair_orders
                    (id, workspace_id, order_code, customer_id, device_id, status,
                     customer_description, internal_note, received_at, expected_completed_at,
                     created_by, created_at, updated_at)
                VALUES
                    (@id, @workspace_id, @order_code, @customer_id, @device_id, 'received',
                     @customer_description, @internal_note, @received_at, @expected_completed_at,
                     @created_by, @created_at, @updated_at);
                """, transaction))
            {
                AddParameter(command, "id", orderId);
                AddParameter(command, "workspace_id", workspaceId);
                AddParameter(command, "order_code", orderCode);
                AddParameter(command, "customer_id", data.CustomerId);
                AddParameter(command, "device_id", data.DeviceId);
                AddParameter(command, "customer_description", data.CustomerDescription);
                AddParameter(command, "internal_note", data.InternalNote);
                AddParameter(command, "received_at", now);
                AddParameter(command, "expected_completed_at", data.ExpectedCompletedAt);
                AddParameter(command, "created_by", data.CreatedBy);
                AddParameter(command, "created_at", now);
                AddParameter(command, "updated_at", now);
                await command.ExecuteNonQueryAsync(cancellationToken);
            }

            await using (var itemCommand = CreateCommand(connection, """
                INSERT INTO repair_order_items
                    (id, workspace_id, repair_order_id, customer_id, device_id, item_index,
                     status, reported_issue, created_at)
                VALUES
                    (@id, @workspace_id, @repair_order_id, @customer_id, @device_id, 1,
                     'received', @reported_issue, @created_at);
                """, transaction))
            {
                AddParameter(itemCommand, "id", Guid.NewGuid());
                AddParameter(itemCommand, "workspace_id", workspaceId);
                AddParameter(itemCommand, "repair_order_id", orderId);
                AddParameter(itemCommand, "customer_id", data.CustomerId);
                AddParameter(itemCommand, "device_id", data.DeviceId);
                AddParameter(itemCommand, "reported_issue", data.CustomerDescription);
                AddParameter(itemCommand, "created_at", now);
                await itemCommand.ExecuteNonQueryAsync(cancellationToken);
            }

            if (intakeStaffId is not null)
            {
                await using var assignmentCommand = CreateCommand(connection, """
                    INSERT INTO repair_order_staff
                        (id, repair_order_id, user_id, responsibility,
                         is_primary, assigned_at)
                    VALUES
                        (@id, @repair_order_id, @staff_profile_id, 'intake', true, @assigned_at);
                    """, transaction);
                AddParameter(assignmentCommand, "id", Guid.NewGuid());
                AddParameter(assignmentCommand, "repair_order_id", orderId);
                AddParameter(assignmentCommand, "staff_profile_id", intakeStaffId);
                AddParameter(assignmentCommand, "assigned_at", now);
                await assignmentCommand.ExecuteNonQueryAsync(cancellationToken);
            }

            await using (var historyCommand = CreateCommand(connection, """
                INSERT INTO status_history
                    (id, repair_order_id, from_status, to_status, changed_by, reason, created_at)
                VALUES
                    (@id, @repair_order_id, NULL, 'received', @changed_by, @reason, @created_at);
                """, transaction))
            {
                AddParameter(historyCommand, "id", Guid.NewGuid());
                AddParameter(historyCommand, "repair_order_id", orderId);
                AddParameter(historyCommand, "changed_by", data.CreatedBy);
                AddParameter(historyCommand, "reason", data.ConfirmOpenOrder ? data.OpenOrderReason : null);
                AddParameter(historyCommand, "created_at", now);
                await historyCommand.ExecuteNonQueryAsync(cancellationToken);
            }

            await InsertAuditAsync(
                connection,
                transaction,
                workspaceId,
                data.CreatedBy,
                orderId,
                new
                {
                    customerId = data.CustomerId,
                    deviceId = data.DeviceId,
                    status = "received",
                    openOrderConfirmed = data.ConfirmOpenOrder,
                    openOrderReason = data.OpenOrderReason
                },
                now,
                cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            return (await FindAsync(workspaceId, orderId, null, cancellationToken))!;
        }
        catch (PostgresException exception) when (exception.SqlState == PostgresErrorCodes.UniqueViolation)
        {
            await transaction.RollbackAsync(cancellationToken);
            throw new RepairOrderConflictException(
                exception.ConstraintName?.Contains("order_code", StringComparison.OrdinalIgnoreCase) == true
                    ? "repair_order_code_exists"
                    : "repair_order_conflict",
                "The repair order could not be created because it conflicts with existing data.");
        }
    }

    private async Task<long> NextOrderSequenceAsync(
        DbConnection connection,
        DbTransaction transaction,
        Guid workspaceId,
        CancellationToken cancellationToken)
    {
        await using var command = CreateCommand(connection, """
            INSERT INTO repair_order_code_counters (workspace_id, next_value)
            VALUES (@workspace_id, 2)
            ON CONFLICT (workspace_id)
            DO UPDATE SET next_value = repair_order_code_counters.next_value + 1
            RETURNING next_value - 1;
            """, transaction);
        AddParameter(command, "workspace_id", workspaceId);
        return Convert.ToInt64(await command.ExecuteScalarAsync(cancellationToken));
    }

    private static async Task LockDeviceAsync(
        DbConnection connection,
        DbTransaction transaction,
        Guid workspaceId,
        Guid deviceId,
        CancellationToken cancellationToken)
    {
        await using var command = CreateCommand(connection, """
            SELECT pg_advisory_xact_lock(
                hashtextextended(
                    CAST(@workspace_id AS text) || ':' || CAST(@device_id AS text),
                    0));
            """, transaction);
        AddParameter(command, "workspace_id", workspaceId);
        AddParameter(command, "device_id", deviceId);
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    private static async Task<IReadOnlyList<OpenOrderSummary>> ReadOpenOrdersAsync(
        DbConnection connection,
        DbTransaction transaction,
        Guid workspaceId,
        Guid customerId,
        Guid deviceId,
        CancellationToken cancellationToken)
    {
        await using var command = CreateCommand(connection, """
            SELECT id, order_code, status
            FROM repair_orders
            WHERE workspace_id = @workspace_id
              AND customer_id = @customer_id
              AND device_id = @device_id
              AND status IN (
                    'received', 'diagnosing', 'waiting_for_approval', 'approved',
                    'repairing', 'cancellation_requested', 'quality_check', 'ready_for_pickup')
            FOR SHARE;
            """, transaction);
        AddParameter(command, "workspace_id", workspaceId);
        AddParameter(command, "customer_id", customerId);
        AddParameter(command, "device_id", deviceId);
        var orders = new List<OpenOrderSummary>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            if (RepairOrderStatusCodec.TryParse(reader.GetString(2), out var status))
            {
                orders.Add(new OpenOrderSummary(reader.GetGuid(0), reader.GetString(1), status));
            }
        }

        return orders;
    }

    private static async Task<bool> ExistsAsync(
        DbConnection connection,
        DbTransaction transaction,
        string sql,
        IReadOnlyList<(string Name, object? Value)> parameters,
        CancellationToken cancellationToken)
    {
        await using var command = CreateCommand(connection, sql, transaction);
        foreach (var parameter in parameters)
        {
            AddParameter(command, parameter.Name, parameter.Value);
        }

        return await command.ExecuteScalarAsync(cancellationToken) is not null;
    }

    private static async Task InsertAuditAsync(
        DbConnection connection,
        DbTransaction transaction,
        Guid workspaceId,
        Guid userId,
        Guid entityId,
        object metadata,
        DateTimeOffset occurredAt,
        CancellationToken cancellationToken)
    {
        await using var command = CreateCommand(connection, """
            INSERT INTO audit_logs
                (id, workspace_id, user_id, actor_type, entity_type, entity_id, action,
                 metadata_json, created_at)
            VALUES
                (@id, @workspace_id, @user_id, 'employee', 'repair_order', @entity_id, 'repair_order_created',
                 CAST(@metadata_json AS jsonb), @created_at);
            """, transaction);
        AddParameter(command, "id", Guid.NewGuid());
        AddParameter(command, "workspace_id", workspaceId);
        AddParameter(command, "user_id", userId);
        AddParameter(command, "entity_id", entityId);
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

    private static RepairOrderEntity ReadOrder(DbDataReader reader)
    {
        if (!RepairOrderStatusCodec.TryParse(reader.GetString(5), out var status))
        {
            throw new InvalidOperationException("The database contains an unsupported repair-order status.");
        }

        return new RepairOrderEntity(
            reader.GetGuid(0),
            reader.GetGuid(1),
            reader.GetString(2),
            reader.GetGuid(3),
            reader.GetGuid(4),
            status,
            reader.GetString(6),
            reader.IsDBNull(7) ? null : reader.GetString(7),
            reader.GetFieldValue<DateTimeOffset>(8),
            reader.IsDBNull(9) ? null : reader.GetFieldValue<DateTimeOffset>(9),
            reader.IsDBNull(10) ? null : reader.GetFieldValue<DateTimeOffset>(10),
            reader.IsDBNull(11) ? null : reader.GetFieldValue<DateTimeOffset>(11),
            reader.IsDBNull(12) ? null : reader.GetString(12),
            reader.GetGuid(13),
            reader.GetFieldValue<DateTimeOffset>(14),
            reader.GetFieldValue<DateTimeOffset>(15),
            Array.Empty<Assignment>(),
            Array.Empty<StatusHistory>());
    }

    private static async Task<IReadOnlyList<Assignment>> ReadAssignmentsAsync(
        DbConnection connection,
        Guid orderId,
        CancellationToken cancellationToken)
    {
        await using var command = CreateCommand(connection, """
            SELECT ros.id, ros.user_id, u.name, ros.responsibility,
                   ros.is_primary, ros.assigned_at, ros.completed_at, ros.note
            FROM repair_order_staff ros
            INNER JOIN users u ON u.id = ros.user_id
            WHERE ros.repair_order_id = @repair_order_id
            ORDER BY ros.is_primary DESC, ros.assigned_at, ros.id;
            """);
        AddParameter(command, "repair_order_id", orderId);
        var assignments = new List<Assignment>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            if (!StaffResponsibilityCodec.TryParse(reader.GetString(3), out var responsibility))
            {
                continue;
            }

            assignments.Add(new Assignment(
                reader.GetGuid(0),
                reader.GetGuid(1),
                reader.GetString(2),
                responsibility,
                reader.GetBoolean(4),
                reader.GetFieldValue<DateTimeOffset>(5),
                reader.IsDBNull(6) ? null : reader.GetFieldValue<DateTimeOffset>(6),
                reader.IsDBNull(7) ? null : reader.GetString(7)));
        }

        return assignments;
    }

    private static async Task<IReadOnlyList<StatusHistory>> ReadStatusHistoryAsync(
        DbConnection connection,
        Guid orderId,
        CancellationToken cancellationToken)
    {
        await using var command = CreateCommand(connection, """
            SELECT id, from_status, to_status, changed_by, reason, created_at
            FROM status_history
            WHERE repair_order_id = @repair_order_id
            ORDER BY created_at, id;
            """);
        AddParameter(command, "repair_order_id", orderId);
        var history = new List<StatusHistory>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            var fromStatus = reader.IsDBNull(1) ? (RepairOrderStatus?)null : ParseStatus(reader.GetString(1));
            history.Add(new StatusHistory(
                reader.GetGuid(0),
                fromStatus,
                ParseStatus(reader.GetString(2)),
                reader.IsDBNull(3) ? null : reader.GetGuid(3),
                reader.IsDBNull(4) ? null : reader.GetString(4),
                reader.GetFieldValue<DateTimeOffset>(5)));
        }

        return history;
    }

    private static async Task<IReadOnlyList<RepairOrderItem>> ReadRepairItemsAsync(
        DbConnection connection,
        Guid workspaceId,
        Guid orderId,
        CancellationToken cancellationToken)
    {
        await using var command = CreateCommand(connection, """
            SELECT roi.id, roi.repair_order_id, roi.item_index, roi.device_id, roi.status,
                   d.device_type, d.brand, d.model, d.serial_number, d.device_identifier,
                   roi.reported_issue, roi.handover_condition, roi.accessories, roi.item_notes,
                   roi.credential_status, roi.credential_consent, roi.credential_received_at,
                   roi.credential_expires_at, roi.credential_destroyed_at, roi.created_at
            FROM repair_order_items roi
            INNER JOIN devices d
                ON d.workspace_id = roi.workspace_id
               AND d.customer_id = roi.customer_id
               AND d.id = roi.device_id
            WHERE roi.workspace_id = @workspace_id AND roi.repair_order_id = @order_id
            ORDER BY roi.item_index;
            """);
        AddParameter(command, "workspace_id", workspaceId);
        AddParameter(command, "order_id", orderId);
        var items = new List<RepairOrderItem>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            if (!RepairOrderStatusCodec.TryParse(reader.GetString(4), out var status))
            {
                throw new InvalidOperationException("The database contains an unsupported repair-item status.");
            }

            items.Add(new RepairOrderItem(
                reader.GetGuid(0),
                reader.GetGuid(1),
                reader.GetInt32(2),
                reader.GetGuid(3),
                status,
                reader.GetString(5),
                reader.GetString(6),
                reader.GetString(7),
                reader.IsDBNull(8) ? null : reader.GetString(8),
                reader.IsDBNull(9) ? null : reader.GetString(9),
                reader.GetString(10),
                reader.IsDBNull(11) ? null : reader.GetString(11),
                reader.IsDBNull(12) ? null : reader.GetString(12),
                reader.IsDBNull(13) ? null : reader.GetString(13),
                reader.GetString(14),
                reader.GetBoolean(15),
                reader.IsDBNull(16) ? null : reader.GetFieldValue<DateTimeOffset>(16),
                reader.IsDBNull(17) ? null : reader.GetFieldValue<DateTimeOffset>(17),
                reader.IsDBNull(18) ? null : reader.GetFieldValue<DateTimeOffset>(18),
                reader.GetFieldValue<DateTimeOffset>(19)));
        }

        for (var index = 0; index < items.Count; index++)
        {
            items[index] = items[index] with
            {
                Tags = await ReadItemTagsAsync(
                    connection,
                    workspaceId,
                    items[index].Id,
                    cancellationToken)
            };
        }

        return items;
    }

    private static async Task<IReadOnlyList<RepairTagEntity>> ReadItemTagsAsync(
        DbConnection connection,
        Guid workspaceId,
        Guid itemId,
        CancellationToken cancellationToken)
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
        AddParameter(command, "item_id", itemId);
        var tags = new List<RepairTagEntity>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            tags.Add(new RepairTagEntity(
                reader.GetGuid(0),
                reader.GetGuid(1),
                reader.GetString(2),
                reader.GetString(3),
                reader.GetGuid(4),
                reader.GetFieldValue<DateTimeOffset>(5),
                reader.GetFieldValue<DateTimeOffset>(6)));
        }

        return tags;
    }

    private static RepairOrderStatus ParseStatus(string value) =>
        RepairOrderStatusCodec.TryParse(value, out var status)
            ? status
            : throw new InvalidOperationException("The database contains an unsupported repair-order status.");
}
