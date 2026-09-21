using System.Data;
using System.Data.Common;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using NpgsqlTypes;
using RepairFlow.Api.Features.Customer.Domain;
using RepairFlow.Api.Features.RepairOrder.Application;
using RepairFlow.Api.Features.RepairOrder.Domain;
using RepairFlow.Api.Features.RepairTag.Domain;
using RepairFlow.Api.Infrastructure.Database;
using RepairTagEntity = RepairFlow.Api.Features.RepairTag.Domain.RepairTag;
using CustomerEntity = RepairFlow.Api.Features.Customer.Domain.Customer;
using RepairOrderEntity = RepairFlow.Api.Features.RepairOrder.Domain.RepairOrder;

namespace RepairFlow.Api.Features.RepairOrder.Infrastructure;

public sealed class RepairOrderIntakeRepository : IRepairOrderIntakeRepository
{
    private readonly RepairFlowDbContext _dbContext;

    public RepairOrderIntakeRepository(RepairFlowDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<RepairIntakeResult> CreateAsync(
        Guid workspaceId,
        CreateRepairIntakeData data,
        CancellationToken cancellationToken = default)
    {
        var connection = await OpenConnectionAsync(cancellationToken);
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);
        Guid? resultOrderId = null;
        var committed = false;
        try
        {
            await LockIdempotencyKeyAsync(connection, transaction, workspaceId, data.IdempotencyKey, cancellationToken);
            var existing = await FindIdempotencyAsync(
                connection,
                transaction,
                workspaceId,
                data.IdempotencyKey,
                cancellationToken);
            if (existing is not null)
            {
                if (!string.Equals(existing.Value.RequestHash, data.RequestHash, StringComparison.Ordinal))
                {
                    throw new RepairIntakeConflictException(
                        "idempotency_key_reused",
                        "The idempotency key was already used with a different request.");
                }

                resultOrderId = existing.Value.OrderId;
            }
            else
            {
                await EnsureTagsBelongToWorkspaceAsync(
                    connection,
                    transaction,
                    workspaceId,
                    data.RepairItems.SelectMany(item => item.TagIds ?? []).Distinct().ToArray(),
                    cancellationToken);
                var customer = await ResolveCustomerAsync(connection, transaction, workspaceId, data, cancellationToken);
                var devices = new List<(Guid Id, RepairItemIntakeData Data)>();
                foreach (var item in data.RepairItems)
                {
                    var device = await CreateDeviceAsync(
                        connection,
                        transaction,
                        workspaceId,
                        customer.Id,
                        item,
                        data.CreatedBy,
                        cancellationToken);
                    devices.Add((device, item));
                }

                var intakeStaffId = data.IntakeStaffId;
                if (intakeStaffId is not null)
                {
                    await EnsureActiveWorkspaceStaffAsync(
                        connection,
                        transaction,
                        workspaceId,
                        intakeStaffId.Value,
                        cancellationToken);
                }

                var now = DateTimeOffset.UtcNow;
                var orderId = Guid.NewGuid();
                var orderCode = $"RF-{now:yyyy}-{await NextOrderSequenceAsync(connection, transaction, workspaceId, cancellationToken):D6}";
                var primaryDeviceId = devices[0].Id;
                await InsertOrderAsync(
                    connection,
                    transaction,
                    workspaceId,
                    orderId,
                    orderCode,
                    customer.Id,
                    primaryDeviceId,
                    data,
                    now,
                    cancellationToken);

                var repairItems = new List<RepairOrderItem>(devices.Count);
                for (var index = 0; index < devices.Count; index++)
                {
                    repairItems.Add(await InsertRepairItemAsync(
                        connection,
                        transaction,
                        workspaceId,
                        orderId,
                        customer.Id,
                        index + 1,
                        devices[index].Id,
                        devices[index].Data,
                        data.CreatedBy,
                        now,
                        cancellationToken));
                }

                if (intakeStaffId is not null)
                {
                    await InsertAssignmentAsync(
                        connection,
                        transaction,
                        orderId,
                        intakeStaffId.Value,
                        now,
                        cancellationToken);
                }

                await InsertStatusHistoryAsync(
                    connection,
                    transaction,
                    orderId,
                    data.CreatedBy,
                    now,
                    cancellationToken);
                await InsertAuditAsync(
                    connection,
                    transaction,
                    workspaceId,
                    data.CreatedBy,
                    orderId,
                    new
                    {
                        customerId = customer.Id,
                        deviceIds = devices.Select(item => item.Id).ToArray(),
                        repairItemCount = repairItems.Count,
                        status = "received"
                    },
                    now,
                    "repair_order_intake_created",
                    cancellationToken);
                await InsertIdempotencyAsync(
                    connection,
                    transaction,
                    workspaceId,
                    data.IdempotencyKey,
                    data.RequestHash,
                    orderId,
                    now,
                    cancellationToken);

                resultOrderId = orderId;
            }
            await transaction.CommitAsync(cancellationToken);
            committed = true;
        }
        catch (PostgresException exception) when (exception.SqlState == PostgresErrorCodes.UniqueViolation)
        {
            if (!committed)
            {
                await transaction.RollbackAsync(cancellationToken);
            }
            throw ToConflict(exception);
        }
        catch
        {
            if (!committed)
            {
                await transaction.RollbackAsync(cancellationToken);
            }
            throw;
        }

        return await LoadIntakeAsync(connection, workspaceId, resultOrderId!.Value, cancellationToken);
    }

    private async Task<CustomerEntity> ResolveCustomerAsync(
        DbConnection connection,
        DbTransaction transaction,
        Guid workspaceId,
        CreateRepairIntakeData data,
        CancellationToken cancellationToken)
    {
        if (data.Customer.Mode == "existing")
        {
            await using var existingCommand = CreateCommand(connection, """
                SELECT id, workspace_id, name, phone, email, note, created_at, updated_at
                FROM customers
                WHERE workspace_id = @workspace_id AND id = @customer_id;
                """, transaction);
            AddParameter(existingCommand, "workspace_id", workspaceId);
            AddParameter(existingCommand, "customer_id", data.Customer.Id);
            await using var reader = await existingCommand.ExecuteReaderAsync(cancellationToken);
            if (!await reader.ReadAsync(cancellationToken))
            {
                throw new RepairOrderNotFoundException();
            }

            return ReadCustomer(reader);
        }

        await LockValueAsync(
            connection,
            transaction,
            $"customer:{workspaceId}:{data.Customer.Phone}",
            cancellationToken);
        await using (var duplicateCommand = CreateCommand(connection, """
            SELECT id
            FROM customers
            WHERE workspace_id = @workspace_id AND phone = @phone;
            """, transaction))
        {
            AddParameter(duplicateCommand, "workspace_id", workspaceId);
            AddParameter(duplicateCommand, "phone", data.Customer.Phone);
            var duplicateId = await duplicateCommand.ExecuteScalarAsync(cancellationToken);
            if (duplicateId is Guid existingId)
            {
                throw new RepairIntakeConflictException(
                    "customer_phone_exists",
                    "A customer with this phone number already exists in the workspace.",
                    new { customerId = existingId });
            }
        }

        var customerId = Guid.NewGuid();
        var now = DateTimeOffset.UtcNow;
        await using (var command = CreateCommand(connection, """
            INSERT INTO customers
                (id, workspace_id, name, phone, email, note, created_at, updated_at)
            VALUES
                (@id, @workspace_id, @name, @phone, @email, @note, @created_at, @updated_at);
            """, transaction))
        {
            AddParameter(command, "id", customerId);
            AddParameter(command, "workspace_id", workspaceId);
            AddParameter(command, "name", data.Customer.Name);
            AddParameter(command, "phone", data.Customer.Phone);
            AddParameter(command, "email", data.Customer.Email);
            AddParameter(command, "note", data.Customer.Note);
            AddParameter(command, "created_at", now);
            AddParameter(command, "updated_at", now);
            await command.ExecuteNonQueryAsync(cancellationToken);
        }

        await InsertAuditAsync(
            connection,
            transaction,
            workspaceId,
            data.CreatedBy,
            customerId,
            new { },
            now,
            "customer_created",
            cancellationToken);
        return new CustomerEntity(
            customerId,
            workspaceId,
            data.Customer.Name!,
            data.Customer.Phone!,
            data.Customer.Email,
            data.Customer.Note,
            now,
            now);
    }

    private async Task<Guid> CreateDeviceAsync(
        DbConnection connection,
        DbTransaction transaction,
        Guid workspaceId,
        Guid customerId,
        RepairItemIntakeData item,
        Guid createdBy,
        CancellationToken cancellationToken)
    {
        var device = item.Device;
        var identity = device.SerialNumber ?? device.DeviceIdentifier!;
        await LockValueAsync(connection, transaction, $"device:{workspaceId}:{identity}", cancellationToken);
        await using (var duplicateCommand = CreateCommand(connection, """
            SELECT id
            FROM devices
            WHERE workspace_id = @workspace_id
              AND ((CAST(@serial_number AS text) IS NOT NULL
                    AND serial_number = CAST(@serial_number AS text))
                   OR (CAST(@device_identifier AS text) IS NOT NULL
                       AND device_identifier = CAST(@device_identifier AS text)));
            """, transaction))
        {
            AddParameter(duplicateCommand, "workspace_id", workspaceId);
            AddParameter(duplicateCommand, "serial_number", device.SerialNumber);
            AddParameter(duplicateCommand, "device_identifier", device.DeviceIdentifier);
            var duplicateId = await duplicateCommand.ExecuteScalarAsync(cancellationToken);
            if (duplicateId is Guid existingId)
            {
                throw new RepairIntakeConflictException(
                    "device_identifier_exists",
                    "A device with this serial number or identifier already exists in the workspace.",
                    new { deviceId = existingId });
            }
        }

        var deviceId = Guid.NewGuid();
        var now = DateTimeOffset.UtcNow;
        await using (var command = CreateCommand(connection, """
            INSERT INTO devices
                (id, workspace_id, customer_id, device_type, brand, model,
                 serial_number, device_identifier, created_at, updated_at)
            VALUES
                (@id, @workspace_id, @customer_id, @device_type, @brand, @model,
                 @serial_number, @device_identifier, @created_at, @updated_at);
            """, transaction))
        {
            AddParameter(command, "id", deviceId);
            AddParameter(command, "workspace_id", workspaceId);
            AddParameter(command, "customer_id", customerId);
            AddParameter(command, "device_type", device.DeviceType);
            AddParameter(command, "brand", device.Brand);
            AddParameter(command, "model", device.Model);
            AddParameter(command, "serial_number", device.SerialNumber);
            AddParameter(command, "device_identifier", device.DeviceIdentifier);
            AddParameter(command, "created_at", now);
            AddParameter(command, "updated_at", now);
            await command.ExecuteNonQueryAsync(cancellationToken);
        }

        await InsertAuditAsync(
            connection,
            transaction,
            workspaceId,
            createdBy,
            deviceId,
            new { customerId },
            now,
            "device_created",
            cancellationToken);
        return deviceId;
    }

    private static async Task InsertOrderAsync(
        DbConnection connection,
        DbTransaction transaction,
        Guid workspaceId,
        Guid orderId,
        string orderCode,
        Guid customerId,
        Guid primaryDeviceId,
        CreateRepairIntakeData data,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        await using var command = CreateCommand(connection, """
            INSERT INTO repair_orders
                (id, workspace_id, order_code, customer_id, device_id, status,
                 customer_description, internal_note, received_at, expected_completed_at,
                 created_by, created_at, updated_at)
            VALUES
                (@id, @workspace_id, @order_code, @customer_id, @device_id, 'received',
                 @customer_description, @internal_note, @received_at, @expected_completed_at,
                 @created_by, @created_at, @updated_at);
            """, transaction);
        AddParameter(command, "id", orderId);
        AddParameter(command, "workspace_id", workspaceId);
        AddParameter(command, "order_code", orderCode);
        AddParameter(command, "customer_id", customerId);
        AddParameter(command, "device_id", primaryDeviceId);
        AddParameter(command, "customer_description", data.RepairItems[0].ReportedIssue);
        AddParameter(command, "internal_note", data.IntakeNotes);
        AddParameter(command, "received_at", now);
        AddParameter(command, "expected_completed_at", data.ExpectedCompletedAt);
        AddParameter(command, "created_by", data.CreatedBy);
        AddParameter(command, "created_at", now);
        AddParameter(command, "updated_at", now);
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    private static async Task<RepairOrderItem> InsertRepairItemAsync(
        DbConnection connection,
        DbTransaction transaction,
        Guid workspaceId,
        Guid orderId,
        Guid customerId,
        int itemIndex,
        Guid deviceId,
        RepairItemIntakeData item,
        Guid createdBy,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        var itemId = Guid.NewGuid();
        var credential = item.Credential;
        await using var command = CreateCommand(connection, """
            INSERT INTO repair_order_items
                (id, workspace_id, repair_order_id, customer_id, device_id, item_index,
                 status, reported_issue, handover_condition, accessories, item_notes,
                 credential_status, credential_ciphertext, credential_key_version,
                 credential_consent, credential_received_at, credential_expires_at, created_at)
            VALUES
                (@id, @workspace_id, @repair_order_id, @customer_id, @device_id, @item_index,
                 'received', @reported_issue, @handover_condition, @accessories, @item_notes,
                 @credential_status, @credential_ciphertext, @credential_key_version,
                 @credential_consent, @credential_received_at, @credential_expires_at, @created_at);
            """, transaction);
        AddParameter(command, "id", itemId);
        AddParameter(command, "workspace_id", workspaceId);
        AddParameter(command, "repair_order_id", orderId);
        AddParameter(command, "customer_id", customerId);
        AddParameter(command, "device_id", deviceId);
        AddParameter(command, "item_index", itemIndex);
        AddParameter(command, "reported_issue", item.ReportedIssue);
        AddParameter(command, "handover_condition", item.HandoverCondition);
        AddParameter(command, "accessories", item.Accessories);
        AddParameter(command, "item_notes", item.ItemNotes);
        AddParameter(command, "credential_status", credential?.Status ?? "not_required");
        AddParameter(command, "credential_ciphertext", credential?.Ciphertext);
        AddParameter(command, "credential_key_version", credential?.KeyVersion);
        AddParameter(command, "credential_consent", credential?.Consent ?? false);
        AddParameter(command, "credential_received_at", credential?.ReceivedAt);
        AddParameter(command, "credential_expires_at", credential?.ExpiresAt);
        AddParameter(command, "created_at", now);
        await command.ExecuteNonQueryAsync(cancellationToken);

        foreach (var tagId in item.TagIds ?? [])
        {
            await using var tagCommand = CreateCommand(connection, """
                INSERT INTO repair_order_item_tags
                    (repair_order_item_id, tag_id, created_by, created_at)
                VALUES
                    (@item_id, @tag_id, @created_by, @created_at);
                """, transaction);
            AddParameter(tagCommand, "item_id", itemId);
            AddParameter(tagCommand, "tag_id", tagId);
            AddParameter(tagCommand, "created_by", createdBy);
            AddParameter(tagCommand, "created_at", now);
            await tagCommand.ExecuteNonQueryAsync(cancellationToken);
        }

        return new RepairOrderItem(
            itemId,
            orderId,
            itemIndex,
            deviceId,
            RepairOrderStatus.Received,
            item.Device.DeviceType,
            item.Device.Brand,
            item.Device.Model,
            item.Device.SerialNumber,
            item.Device.DeviceIdentifier,
            item.ReportedIssue,
            item.HandoverCondition,
            item.Accessories,
            item.ItemNotes,
            credential?.Status ?? "not_required",
            credential?.Consent ?? false,
            credential?.ReceivedAt,
            credential?.ExpiresAt,
            null,
            now,
            []);
    }

    private static async Task EnsureTagsBelongToWorkspaceAsync(
        DbConnection connection,
        DbTransaction transaction,
        Guid workspaceId,
        IReadOnlyList<Guid> tagIds,
        CancellationToken cancellationToken)
    {
        if (tagIds.Count == 0)
        {
            return;
        }

        await using var command = CreateCommand(connection, """
            SELECT count(*)
            FROM workspace_tags
            WHERE workspace_id = @workspace_id
              AND id = ANY(@tag_ids);
            """, transaction);
        AddParameter(command, "workspace_id", workspaceId);
        AddUuidArrayParameter(command, "tag_ids", tagIds);
        var availableCount = Convert.ToInt32(await command.ExecuteScalarAsync(cancellationToken));
        if (availableCount != tagIds.Count)
        {
            throw new RepairIntakeConflictException(
                "TAG_WORKSPACE_MISMATCH",
                "One or more tags do not belong to the active workspace.");
        }
    }

    private static async Task InsertAssignmentAsync(
        DbConnection connection,
        DbTransaction transaction,
        Guid orderId,
        Guid staffId,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        await using var command = CreateCommand(connection, """
            INSERT INTO repair_order_staff
                (id, repair_order_id, user_id, responsibility, is_primary, assigned_at)
            VALUES
                (@id, @repair_order_id, @user_id, 'intake', true, @assigned_at);
            """, transaction);
        AddParameter(command, "id", Guid.NewGuid());
        AddParameter(command, "repair_order_id", orderId);
        AddParameter(command, "user_id", staffId);
        AddParameter(command, "assigned_at", now);
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    private static async Task InsertStatusHistoryAsync(
        DbConnection connection,
        DbTransaction transaction,
        Guid orderId,
        Guid changedBy,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        await using var command = CreateCommand(connection, """
            INSERT INTO status_history
                (id, repair_order_id, from_status, to_status, changed_by, reason, created_at)
            VALUES
                (@id, @repair_order_id, NULL, 'received', @changed_by, 'repair_intake_created', @created_at);
            """, transaction);
        AddParameter(command, "id", Guid.NewGuid());
        AddParameter(command, "repair_order_id", orderId);
        AddParameter(command, "changed_by", changedBy);
        AddParameter(command, "created_at", now);
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    private static async Task InsertIdempotencyAsync(
        DbConnection connection,
        DbTransaction transaction,
        Guid workspaceId,
        string idempotencyKey,
        string requestHash,
        Guid orderId,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        await using var command = CreateCommand(connection, """
            INSERT INTO repair_order_intake_idempotency
                (workspace_id, idempotency_key, request_hash, repair_order_id, created_at)
            VALUES
                (@workspace_id, @idempotency_key, @request_hash, @repair_order_id, @created_at);
            """, transaction);
        AddParameter(command, "workspace_id", workspaceId);
        AddParameter(command, "idempotency_key", idempotencyKey);
        AddParameter(command, "request_hash", requestHash);
        AddParameter(command, "repair_order_id", orderId);
        AddParameter(command, "created_at", now);
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    private static async Task EnsureActiveWorkspaceStaffAsync(
        DbConnection connection,
        DbTransaction transaction,
        Guid workspaceId,
        Guid staffId,
        CancellationToken cancellationToken)
    {
        await using var command = CreateCommand(connection, """
            SELECT 1
            FROM users u
            INNER JOIN workspace_memberships wm
                ON wm.user_id = u.id AND wm.workspace_id = @workspace_id
            WHERE u.id = @staff_id
              AND u.status = 'active'
              AND wm.status = 'active';
            """, transaction);
        AddParameter(command, "workspace_id", workspaceId);
        AddParameter(command, "staff_id", staffId);
        if (await command.ExecuteScalarAsync(cancellationToken) is null)
        {
            throw new RepairIntakeConflictException(
                "invalid_intake_staff",
                "The selected intake staff member is not active in the workspace.");
        }
    }

    private static async Task<long> NextOrderSequenceAsync(
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

    private static async Task LockIdempotencyKeyAsync(
        DbConnection connection,
        DbTransaction transaction,
        Guid workspaceId,
        string idempotencyKey,
        CancellationToken cancellationToken) =>
        await LockValueAsync(connection, transaction, $"intake:{workspaceId}:{idempotencyKey}", cancellationToken);

    private static async Task LockValueAsync(
        DbConnection connection,
        DbTransaction transaction,
        string value,
        CancellationToken cancellationToken)
    {
        await using var command = CreateCommand(connection, """
            SELECT pg_advisory_xact_lock(hashtextextended(@lock_key, 0));
            """, transaction);
        AddParameter(command, "lock_key", value);
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    private static async Task<(string RequestHash, Guid OrderId)?> FindIdempotencyAsync(
        DbConnection connection,
        DbTransaction transaction,
        Guid workspaceId,
        string idempotencyKey,
        CancellationToken cancellationToken)
    {
        await using var command = CreateCommand(connection, """
            SELECT request_hash, repair_order_id
            FROM repair_order_intake_idempotency
            WHERE workspace_id = @workspace_id AND idempotency_key = @idempotency_key;
            """, transaction);
        AddParameter(command, "workspace_id", workspaceId);
        AddParameter(command, "idempotency_key", idempotencyKey);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        return await reader.ReadAsync(cancellationToken)
            ? (reader.GetString(0), reader.GetGuid(1))
            : null;
    }

    private static async Task<RepairIntakeResult> LoadIntakeAsync(
        DbConnection connection,
        Guid workspaceId,
        Guid orderId,
        CancellationToken cancellationToken)
    {
        CustomerEntity? customer = null;
        RepairOrderEntity? order = null;
        await using (var command = CreateCommand(connection, """
            SELECT c.id, c.workspace_id, c.name, c.phone, c.email, c.note,
                   c.created_at, c.updated_at,
                   ro.id, ro.workspace_id, ro.order_code, ro.customer_id, ro.device_id,
                   ro.status, ro.customer_description, ro.internal_note, ro.received_at,
                   ro.expected_completed_at, ro.completed_at, ro.cancelled_at,
                   ro.cancellation_reason, ro.created_by, ro.created_at, ro.updated_at
            FROM repair_orders ro
            INNER JOIN customers c ON c.workspace_id = ro.workspace_id AND c.id = ro.customer_id
            WHERE ro.workspace_id = @workspace_id AND ro.id = @order_id;
            """))
        {
            AddParameter(command, "workspace_id", workspaceId);
            AddParameter(command, "order_id", orderId);
            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            if (!await reader.ReadAsync(cancellationToken))
            {
                throw new RepairOrderNotFoundException();
            }

            customer = new CustomerEntity(
                reader.GetGuid(0),
                reader.GetGuid(1),
                reader.GetString(2),
                reader.GetString(3),
                reader.IsDBNull(4) ? null : reader.GetString(4),
                reader.IsDBNull(5) ? null : reader.GetString(5),
                reader.GetFieldValue<DateTimeOffset>(6),
                reader.GetFieldValue<DateTimeOffset>(7));
            order = ReadOrder(reader, 8);
        }

        var assignments = await ReadAssignmentsAsync(connection, orderId, cancellationToken);
        var history = await ReadStatusHistoryAsync(connection, orderId, cancellationToken);
        var items = await ReadItemsAsync(connection, workspaceId, orderId, cancellationToken);
        order = order with
        {
            Assignments = assignments,
            StatusHistory = history,
            RepairItems = items
        };
        return new RepairIntakeResult(customer!, order, items);
    }

    private static async Task<IReadOnlyList<RepairOrderItem>> ReadItemsAsync(
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
        await using (var reader = await command.ExecuteReaderAsync(cancellationToken))
        {
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
        }

        var tagsByItemId = await ReadItemTagsAsync(
            connection,
            workspaceId,
            items.Select(item => item.Id).ToArray(),
            cancellationToken);

        for (var index = 0; index < items.Count; index++)
        {
            items[index] = items[index] with
            {
                Tags = tagsByItemId.TryGetValue(items[index].Id, out var tags) ? tags : []
            };
        }

        return items;
    }

    private static async Task<IReadOnlyDictionary<Guid, IReadOnlyList<RepairTagEntity>>> ReadItemTagsAsync(
        DbConnection connection,
        Guid workspaceId,
        IReadOnlyList<Guid> itemIds,
        CancellationToken cancellationToken)
    {
        if (itemIds.Count == 0)
        {
            return new Dictionary<Guid, IReadOnlyList<RepairTagEntity>>();
        }

        await using var command = CreateCommand(connection, """
            SELECT oit.repair_order_item_id,
                   wt.id, wt.workspace_id, wt.name, wt.normalized_name,
                   wt.created_by, wt.created_at, wt.updated_at
            FROM repair_order_item_tags oit
            INNER JOIN workspace_tags wt ON wt.id = oit.tag_id
            WHERE wt.workspace_id = @workspace_id
              AND oit.repair_order_item_id = ANY(@item_ids)
            ORDER BY oit.repair_order_item_id, wt.normalized_name, wt.id;
            """);
        AddParameter(command, "workspace_id", workspaceId);
        AddUuidArrayParameter(command, "item_ids", itemIds);
        var tagsByItemId = new Dictionary<Guid, List<RepairTagEntity>>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            var itemId = reader.GetGuid(0);
            if (!tagsByItemId.TryGetValue(itemId, out var tags))
            {
                tags = [];
                tagsByItemId[itemId] = tags;
            }

            tags.Add(new RepairTagEntity(
                reader.GetGuid(1),
                reader.GetGuid(2),
                reader.GetString(3),
                reader.GetString(4),
                reader.GetGuid(5),
                reader.GetFieldValue<DateTimeOffset>(6),
                reader.GetFieldValue<DateTimeOffset>(7)));
        }

        return tagsByItemId.ToDictionary(
            pair => pair.Key,
            pair => (IReadOnlyList<RepairTagEntity>)pair.Value);
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
            if (StaffResponsibilityCodec.TryParse(reader.GetString(3), out var responsibility))
            {
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

    private static RepairOrderEntity ReadOrder(DbDataReader reader, int offset)
    {
        if (!RepairOrderStatusCodec.TryParse(reader.GetString(offset + 5), out var status))
        {
            throw new InvalidOperationException("The database contains an unsupported repair-order status.");
        }

        return new RepairOrderEntity(
            reader.GetGuid(offset),
            reader.GetGuid(offset + 1),
            reader.GetString(offset + 2),
            reader.GetGuid(offset + 3),
            reader.GetGuid(offset + 4),
            status,
            reader.GetString(offset + 6),
            reader.IsDBNull(offset + 7) ? null : reader.GetString(offset + 7),
            reader.GetFieldValue<DateTimeOffset>(offset + 8),
            reader.IsDBNull(offset + 9) ? null : reader.GetFieldValue<DateTimeOffset>(offset + 9),
            reader.IsDBNull(offset + 10) ? null : reader.GetFieldValue<DateTimeOffset>(offset + 10),
            reader.IsDBNull(offset + 11) ? null : reader.GetFieldValue<DateTimeOffset>(offset + 11),
            reader.IsDBNull(offset + 12) ? null : reader.GetString(offset + 12),
            reader.GetGuid(offset + 13),
            reader.GetFieldValue<DateTimeOffset>(offset + 14),
            reader.GetFieldValue<DateTimeOffset>(offset + 15),
            [],
            []);
    }

    private static CustomerEntity ReadCustomer(DbDataReader reader) => new(
        reader.GetGuid(0),
        reader.GetGuid(1),
        reader.GetString(2),
        reader.GetString(3),
        reader.IsDBNull(4) ? null : reader.GetString(4),
        reader.IsDBNull(5) ? null : reader.GetString(5),
        reader.GetFieldValue<DateTimeOffset>(6),
        reader.GetFieldValue<DateTimeOffset>(7));

    private static RepairIntakeConflictException ToConflict(PostgresException exception) =>
        exception.ConstraintName?.Contains("devices_workspace_serial_unique", StringComparison.OrdinalIgnoreCase) == true ||
        exception.ConstraintName?.Contains("devices_workspace_identifier_unique", StringComparison.OrdinalIgnoreCase) == true
            ? new RepairIntakeConflictException(
                "device_identifier_exists",
                "A device with this serial number or identifier already exists in the workspace.")
            : exception.ConstraintName?.Contains("customers_workspace_phone_unique", StringComparison.OrdinalIgnoreCase) == true
                ? new RepairIntakeConflictException(
                    "customer_phone_exists",
                    "A customer with this phone number already exists in the workspace.")
                : new RepairIntakeConflictException(
                    "repair_intake_conflict",
                    "The repair intake conflicts with existing data.");

    private static RepairOrderStatus ParseStatus(string value) =>
        RepairOrderStatusCodec.TryParse(value, out var status)
            ? status
            : throw new InvalidOperationException("The database contains an unsupported repair-order status.");

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
        AddParameter(command, "entity_type", action.StartsWith("customer_", StringComparison.Ordinal) ? "customer" :
            action.StartsWith("device_", StringComparison.Ordinal) ? "device" : "repair_order");
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
