using System.Data;
using System.Data.Common;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using RepairFlow.Api.Features.Device.Application;
using RepairFlow.Api.Features.Device.Domain;
using RepairFlow.Api.Infrastructure.Database;
using DeviceEntity = RepairFlow.Api.Features.Device.Domain.Device;

namespace RepairFlow.Api.Features.Device.Infrastructure;

public sealed class DeviceRepository : IDeviceRepository
{
    private readonly RepairFlowDbContext _dbContext;

    public DeviceRepository(RepairFlowDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<DeviceEntity>> SearchAsync(
        Guid workspaceId,
        Guid? customerId,
        string? search,
        string? serialNumber,
        Guid? assignedStaffId,
        CancellationToken cancellationToken = default)
    {
        var connection = await OpenConnectionAsync(cancellationToken);
        await using var command = CreateCommand(connection, """
            SELECT d.id, d.workspace_id, d.customer_id, d.device_type, d.brand, d.model,
                   d.serial_number, d.device_identifier, d.note, d.created_at, d.updated_at
            FROM devices d
            WHERE d.workspace_id = @workspace_id
              AND (CAST(@customer_id AS uuid) IS NULL OR d.customer_id = @customer_id)
              AND (CAST(@search AS text) IS NULL
                   OR d.device_type ILIKE '%' || CAST(@search AS text) || '%'
                   OR d.brand ILIKE '%' || CAST(@search AS text) || '%'
                   OR d.model ILIKE '%' || CAST(@search AS text) || '%'
                   OR COALESCE(d.serial_number, '') ILIKE '%' || CAST(@search AS text) || '%'
                   OR COALESCE(d.device_identifier, '') ILIKE '%' || CAST(@search AS text) || '%')
              AND (CAST(@serial_number AS text) IS NULL OR d.serial_number = CAST(@serial_number AS text))
              AND (CAST(@assigned_staff_id AS uuid) IS NULL OR EXISTS (
                    SELECT 1
                    FROM repair_orders ro
                    INNER JOIN repair_order_staff ros ON ros.repair_order_id = ro.id
                    WHERE ro.workspace_id = d.workspace_id
                      AND ro.device_id = d.id
                      AND ros.user_id = @assigned_staff_id
                      AND ros.completed_at IS NULL))
            ORDER BY d.updated_at DESC, d.id
            LIMIT 100;
            """);
        AddParameter(command, "workspace_id", workspaceId);
        AddParameter(command, "customer_id", customerId);
        AddParameter(command, "search", search);
        AddParameter(command, "serial_number", serialNumber);
        AddParameter(command, "assigned_staff_id", assignedStaffId);

        var devices = new List<DeviceEntity>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            devices.Add(ReadDevice(reader));
        }

        return devices;
    }

    public async Task<DeviceEntity?> FindAsync(
        Guid workspaceId,
        Guid deviceId,
        Guid? assignedStaffId,
        CancellationToken cancellationToken = default)
    {
        var connection = await OpenConnectionAsync(cancellationToken);
        await using var command = CreateCommand(connection, """
            SELECT d.id, d.workspace_id, d.customer_id, d.device_type, d.brand, d.model,
                   d.serial_number, d.device_identifier, d.note, d.created_at, d.updated_at
            FROM devices d
            WHERE d.workspace_id = @workspace_id
              AND d.id = @device_id
              AND (CAST(@assigned_staff_id AS uuid) IS NULL OR EXISTS (
                    SELECT 1
                    FROM repair_orders ro
                    INNER JOIN repair_order_staff ros ON ros.repair_order_id = ro.id
                    WHERE ro.workspace_id = d.workspace_id
                      AND ro.device_id = d.id
                      AND ros.user_id = @assigned_staff_id
                      AND ros.completed_at IS NULL));
            """);
        AddParameter(command, "workspace_id", workspaceId);
        AddParameter(command, "device_id", deviceId);
        AddParameter(command, "assigned_staff_id", assignedStaffId);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        return await reader.ReadAsync(cancellationToken) ? ReadDevice(reader) : null;
    }

    public async Task<DeviceEntity> CreateAsync(
        Guid workspaceId,
        CreateDeviceData data,
        CancellationToken cancellationToken = default)
    {
        var connection = await OpenConnectionAsync(cancellationToken);
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);
        try
        {
            if (!await ExistsAsync(connection, transaction, """
                SELECT 1 FROM customers
                WHERE id = @customer_id AND workspace_id = @workspace_id;
                """, [
                    ("customer_id", (object?)data.CustomerId),
                    ("workspace_id", workspaceId)
                ], cancellationToken))
            {
                throw new DeviceNotFoundException();
            }

            var deviceId = Guid.NewGuid();
            var now = DateTimeOffset.UtcNow;
            await using (var command = CreateCommand(connection, """
                INSERT INTO devices
                    (id, workspace_id, customer_id, device_type, brand, model,
                     serial_number, device_identifier, note, created_at, updated_at)
                VALUES
                    (@id, @workspace_id, @customer_id, @device_type, @brand, @model,
                     @serial_number, @device_identifier, @note, @created_at, @updated_at);
                """, transaction))
            {
                AddParameter(command, "id", deviceId);
                AddParameter(command, "workspace_id", workspaceId);
                AddParameter(command, "customer_id", data.CustomerId);
                AddParameter(command, "device_type", data.DeviceType);
                AddParameter(command, "brand", data.Brand);
                AddParameter(command, "model", data.Model);
                AddParameter(command, "serial_number", data.SerialNumber);
                AddParameter(command, "device_identifier", data.DeviceIdentifier);
                AddParameter(command, "note", data.Note);
                AddParameter(command, "created_at", now);
                AddParameter(command, "updated_at", now);
                await command.ExecuteNonQueryAsync(cancellationToken);
            }

            await InsertAuditAsync(
                connection,
                transaction,
                workspaceId,
                data.CreatedBy,
                deviceId,
                new { customerId = data.CustomerId },
                now,
                cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            return new DeviceEntity(deviceId, workspaceId, data.CustomerId, data.DeviceType, data.Brand, data.Model,
                data.SerialNumber, data.DeviceIdentifier, data.Note, now, now);
        }
        catch (PostgresException exception) when (exception.SqlState == PostgresErrorCodes.UniqueViolation)
        {
            await transaction.RollbackAsync(cancellationToken);
            throw new DeviceConflictException(
                "device_serial_exists",
                "A device with this serial number already exists in the workspace.");
        }
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
                (@id, @workspace_id, @user_id, 'employee', 'device', @entity_id, 'device_created',
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

    private static DeviceEntity ReadDevice(DbDataReader reader) => new(
        reader.GetGuid(0),
        reader.GetGuid(1),
        reader.GetGuid(2),
        reader.GetString(3),
        reader.GetString(4),
        reader.GetString(5),
        reader.IsDBNull(6) ? null : reader.GetString(6),
        reader.IsDBNull(7) ? null : reader.GetString(7),
        reader.IsDBNull(8) ? null : reader.GetString(8),
        reader.GetFieldValue<DateTimeOffset>(9),
        reader.GetFieldValue<DateTimeOffset>(10));
}
