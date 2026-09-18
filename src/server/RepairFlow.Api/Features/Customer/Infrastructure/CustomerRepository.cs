using System.Data;
using System.Data.Common;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using RepairFlow.Api.Features.Customer.Application;
using RepairFlow.Api.Features.Customer.Domain;
using RepairFlow.Api.Infrastructure.Database;
using CustomerEntity = RepairFlow.Api.Features.Customer.Domain.Customer;

namespace RepairFlow.Api.Features.Customer.Infrastructure;

public sealed class CustomerRepository : ICustomerRepository
{
    private readonly RepairFlowDbContext _dbContext;

    public CustomerRepository(RepairFlowDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<CustomerEntity>> SearchAsync(
        Guid workspaceId,
        string? search,
        string? phone,
        Guid? assignedStaffId,
        CancellationToken cancellationToken = default)
    {
        var connection = await OpenConnectionAsync(cancellationToken);
        await using var command = CreateCommand(connection, """
            SELECT c.id, c.workspace_id, c.name, c.phone, c.email, c.note,
                   c.created_at, c.updated_at
            FROM customers c
            WHERE c.workspace_id = @workspace_id
              AND (CAST(@search AS text) IS NULL
                   OR c.name ILIKE '%' || CAST(@search AS text) || '%'
                   OR c.phone ILIKE '%' || CAST(@search AS text) || '%')
              AND (CAST(@phone AS text) IS NULL OR c.phone = CAST(@phone AS text))
              AND (CAST(@assigned_staff_id AS uuid) IS NULL OR EXISTS (
                    SELECT 1
                    FROM repair_orders ro
                    INNER JOIN repair_order_staff ros ON ros.repair_order_id = ro.id
                    WHERE ro.workspace_id = c.workspace_id
                      AND ro.customer_id = c.id
                      AND ros.user_id = @assigned_staff_id
                      AND ros.completed_at IS NULL))
            ORDER BY c.updated_at DESC, c.id
            LIMIT 100;
            """);
        AddParameter(command, "workspace_id", workspaceId);
        AddParameter(command, "search", search);
        AddParameter(command, "phone", phone);
        AddParameter(command, "assigned_staff_id", assignedStaffId);

        var customers = new List<CustomerEntity>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            customers.Add(ReadCustomer(reader));
        }

        return customers;
    }

    public async Task<CustomerEntity?> FindAsync(
        Guid workspaceId,
        Guid customerId,
        Guid? assignedStaffId,
        CancellationToken cancellationToken = default)
    {
        var connection = await OpenConnectionAsync(cancellationToken);
        await using var command = CreateCommand(connection, """
            SELECT c.id, c.workspace_id, c.name, c.phone, c.email, c.note,
                   c.created_at, c.updated_at
            FROM customers c
            WHERE c.workspace_id = @workspace_id
              AND c.id = @customer_id
              AND (CAST(@assigned_staff_id AS uuid) IS NULL OR EXISTS (
                    SELECT 1
                    FROM repair_orders ro
                    INNER JOIN repair_order_staff ros ON ros.repair_order_id = ro.id
                    WHERE ro.workspace_id = c.workspace_id
                      AND ro.customer_id = c.id
                      AND ros.user_id = @assigned_staff_id
                      AND ros.completed_at IS NULL));
            """);
        AddParameter(command, "workspace_id", workspaceId);
        AddParameter(command, "customer_id", customerId);
        AddParameter(command, "assigned_staff_id", assignedStaffId);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        return await reader.ReadAsync(cancellationToken) ? ReadCustomer(reader) : null;
    }

    public async Task<CustomerEntity> CreateAsync(
        Guid workspaceId,
        CreateCustomerData data,
        CancellationToken cancellationToken = default)
    {
        var connection = await OpenConnectionAsync(cancellationToken);
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);
        try
        {
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
                AddParameter(command, "name", data.Name);
                AddParameter(command, "phone", data.Phone);
                AddParameter(command, "email", data.Email);
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
                customerId,
                new { },
                now,
                cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            return new CustomerEntity(customerId, workspaceId, data.Name, data.Phone, data.Email, data.Note, now, now);
        }
        catch (PostgresException exception) when (exception.SqlState == PostgresErrorCodes.UniqueViolation)
        {
            await transaction.RollbackAsync(cancellationToken);
            throw new CustomerConflictException(
                "customer_phone_exists",
                "A customer with this phone number already exists in the workspace.");
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
        CancellationToken cancellationToken)
    {
        await using var command = CreateCommand(connection, """
            INSERT INTO audit_logs
                (id, workspace_id, user_id, actor_type, entity_type, entity_id, action,
                 metadata_json, created_at)
            VALUES
                (@id, @workspace_id, @user_id, 'employee', 'customer', @entity_id, 'customer_created',
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

    private static CustomerEntity ReadCustomer(DbDataReader reader) => new(
        reader.GetGuid(0),
        reader.GetGuid(1),
        reader.GetString(2),
        reader.GetString(3),
        reader.IsDBNull(4) ? null : reader.GetString(4),
        reader.IsDBNull(5) ? null : reader.GetString(5),
        reader.GetFieldValue<DateTimeOffset>(6),
        reader.GetFieldValue<DateTimeOffset>(7));
}
