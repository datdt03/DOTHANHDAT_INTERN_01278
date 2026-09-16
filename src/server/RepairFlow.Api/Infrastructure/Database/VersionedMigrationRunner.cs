using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using Npgsql;

namespace RepairFlow.Api.Infrastructure.Database;

public sealed record MigrationDefinition(
    string Id,
    string Filename,
    string SpecVersion,
    long Sequence,
    string Sql,
    string Checksum,
    string Section,
    string Purpose,
    string DependsOn);

public sealed record MigrationRunResult(IReadOnlyList<string> AppliedVersions);

public sealed record AppliedMigration(
    string Filename,
    string SpecVersion,
    string Checksum);

public interface IVersionedMigrationRunner
{
    Task<MigrationRunResult> ApplyPendingAsync(CancellationToken cancellationToken = default);
}

public interface IMigrationStore
{
    Task<MigrationRunResult> ApplyPendingAsync(
        IReadOnlyList<MigrationDefinition> migrations,
        CancellationToken cancellationToken = default);
}

public sealed class VersionedMigrationRunner : IVersionedMigrationRunner
{
    private readonly IMigrationStore _store;
    private readonly IReadOnlyList<MigrationDefinition> _migrations;
    private readonly ILogger<VersionedMigrationRunner> _logger;

    public VersionedMigrationRunner(
        IMigrationStore store,
        IReadOnlyList<MigrationDefinition> migrations,
        ILogger<VersionedMigrationRunner> logger)
    {
        _store = store;
        _migrations = migrations;
        _logger = logger;
    }

    public async Task<MigrationRunResult> ApplyPendingAsync(
        CancellationToken cancellationToken = default)
    {
        var duplicateIds = _migrations
            .GroupBy(migration => migration.Id, StringComparer.Ordinal)
            .Where(group => group.Count() > 1)
            .Select(group => group.Key)
            .ToArray();

        if (duplicateIds.Length > 0)
        {
            throw new InvalidOperationException(
                $"Duplicate migration IDs: {string.Join(", ", duplicateIds)}.");
        }

        var duplicateSequences = _migrations
            .GroupBy(migration => migration.Sequence)
            .Where(group => group.Count() > 1)
            .Select(group => group.Key)
            .OrderBy(sequence => sequence)
            .ToArray();

        if (duplicateSequences.Length > 0)
        {
            throw new InvalidOperationException(
                $"Duplicate migration sequences: {string.Join(", ", duplicateSequences)}.");
        }

        var orderedMigrations = _migrations
            .OrderBy(migration => migration.Sequence)
            .ThenBy(migration => migration.Id, StringComparer.Ordinal)
            .ToArray();

        var result = await _store.ApplyPendingAsync(orderedMigrations, cancellationToken);
        foreach (var appliedVersion in result.AppliedVersions)
        {
            _logger.LogInformation("Applied database migration {MigrationVersion}.", appliedVersion);
        }

        return result;
    }
}

public static class MigrationChecksum
{
    public static string Compute(string sql)
    {
        var normalizedSql = sql.Replace("\r\n", "\n", StringComparison.Ordinal)
            .Replace('\r', '\n');
        var bytes = Encoding.UTF8.GetBytes(normalizedSql);
        return Convert.ToHexString(SHA256.HashData(bytes)).ToLowerInvariant();
    }
}

public static class MigrationLoader
{
    private static readonly Regex MigrationFilePattern = new(
        "^(?<date>[0-9]{8})_(?<sequence>[0-9]{4,})__spec-v(?<specVersion>[0-9]+)__(?<description>[a-z0-9]+(?:-[a-z0-9]+)*)\\.sql$",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private static readonly Regex HeaderValuePattern = new(
        "(?im)^--\\s*(?<name>[a-z_]+)\\s*:\\s*(?<value>\\S.*)$",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private static readonly Regex SpecPathPattern = new(
        "^docs/v(?<version>[0-9]+)(?:/|$)",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    public static IReadOnlyList<MigrationDefinition> Load(string directory)
    {
        if (!Directory.Exists(directory))
        {
            return [];
        }

        return Directory.EnumerateFiles(directory, "*.sql", SearchOption.TopDirectoryOnly)
            .Select(ParseFile)
            .OrderBy(migration => migration.Sequence)
            .ThenBy(migration => migration.Id, StringComparer.Ordinal)
            .ToArray();
    }

    private static MigrationDefinition ParseFile(string path)
    {
        var filename = Path.GetFileName(path);
        var match = MigrationFilePattern.Match(filename);
        if (!match.Success)
        {
            throw new InvalidOperationException(
                $"Migration file '{filename}' must use YYYYMMDD_GLOBAL_SEQUENCE__spec-vX__description.sql.");
        }

        if (!long.TryParse(match.Groups["sequence"].Value, out var sequence) || sequence <= 0)
        {
            throw new InvalidOperationException(
                $"Migration file '{filename}' must have a positive global sequence.");
        }

        var sql = File.ReadAllText(path);
        var id = $"{match.Groups["date"].Value}_{match.Groups["sequence"].Value}";
        var specVersion = $"v{match.Groups["specVersion"].Value}";
        var headerMigrationId = RequiredHeader(sql, "migration_id", filename);
        var headerSpec = RequiredHeader(sql, "spec", filename);
        var section = RequiredHeader(sql, "section", filename);
        var purpose = RequiredHeader(sql, "purpose", filename);
        var dependsOn = RequiredHeader(sql, "depends_on", filename);

        if (!string.Equals(headerMigrationId, id, StringComparison.Ordinal))
        {
            throw new InvalidOperationException(
                $"Migration file '{filename}' has header migration_id '{headerMigrationId}', expected '{id}'.");
        }

        var specPathMatch = SpecPathPattern.Match(headerSpec);
        if (!specPathMatch.Success ||
            !string.Equals($"v{specPathMatch.Groups["version"].Value}", specVersion, StringComparison.Ordinal))
        {
            throw new InvalidOperationException(
                $"Migration file '{filename}' must reference a docs path for {specVersion} in its spec header.");
        }

        return new MigrationDefinition(
            id,
            filename,
            specVersion,
            sequence,
            sql,
            MigrationChecksum.Compute(sql),
            section,
            purpose,
            dependsOn);
    }

    private static string RequiredHeader(string sql, string name, string filename)
    {
        var header = HeaderValuePattern.Matches(sql)
            .FirstOrDefault(match =>
                string.Equals(match.Groups["name"].Value, name, StringComparison.OrdinalIgnoreCase));

        if (header is null)
        {
            throw new InvalidOperationException(
                $"Migration file '{filename}' must include '-- {name}: ...' in its header.");
        }

        return header.Groups["value"].Value.Trim();
    }
}

public sealed class NpgsqlMigrationStore : IMigrationStore
{
    private const string MigrationLockSql =
        "SELECT pg_advisory_xact_lock(hashtextextended('repairflow:schema_migrations', 0));";

    private readonly string _connectionString;

    public NpgsqlMigrationStore(string connectionString)
    {
        _connectionString = connectionString;
    }

    public async Task<MigrationRunResult> ApplyPendingAsync(
        IReadOnlyList<MigrationDefinition> migrations,
        CancellationToken cancellationToken = default)
    {
        await using var connection = new NpgsqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);

        await using (var lockCommand = new NpgsqlCommand(MigrationLockSql, connection, transaction))
        {
            await lockCommand.ExecuteNonQueryAsync(cancellationToken);
        }

        await EnsureLedgerAsync(connection, transaction, cancellationToken);
        var applied = await LoadAppliedAsync(connection, transaction, cancellationToken);
        var appliedNow = new List<string>();

        foreach (var migration in migrations)
        {
            if (applied.TryGetValue(migration.Id, out var existing))
            {
                if (!string.Equals(existing.Filename, migration.Filename, StringComparison.Ordinal) ||
                    !string.Equals(existing.SpecVersion, migration.SpecVersion, StringComparison.Ordinal) ||
                    !string.Equals(existing.Checksum, migration.Checksum, StringComparison.Ordinal))
                {
                    throw new InvalidOperationException(
                        $"Applied migration '{migration.Id}' no longer matches its ledger metadata or checksum.");
                }

                continue;
            }

            await using (var migrationCommand = new NpgsqlCommand(migration.Sql, connection, transaction))
            {
                await migrationCommand.ExecuteNonQueryAsync(cancellationToken);
            }

            await using (var ledgerCommand = new NpgsqlCommand(
                             "INSERT INTO schema_migrations(migration_id, filename, spec_version, checksum) VALUES (@migration_id, @filename, @spec_version, @checksum);",
                             connection,
                             transaction))
            {
                ledgerCommand.Parameters.AddWithValue("migration_id", migration.Id);
                ledgerCommand.Parameters.AddWithValue("filename", migration.Filename);
                ledgerCommand.Parameters.AddWithValue("spec_version", migration.SpecVersion);
                ledgerCommand.Parameters.AddWithValue("checksum", migration.Checksum);
                await ledgerCommand.ExecuteNonQueryAsync(cancellationToken);
            }

            appliedNow.Add(migration.Id);
        }

        await transaction.CommitAsync(cancellationToken);
        return new MigrationRunResult(appliedNow);
    }

    private static async Task<Dictionary<string, AppliedMigration>> LoadAppliedAsync(
        NpgsqlConnection connection,
        NpgsqlTransaction transaction,
        CancellationToken cancellationToken)
    {
        await using var command = new NpgsqlCommand(
            "SELECT migration_id, filename, spec_version, checksum FROM schema_migrations ORDER BY migration_id;",
            connection,
            transaction);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        var applied = new Dictionary<string, AppliedMigration>(StringComparer.Ordinal);
        while (await reader.ReadAsync(cancellationToken))
        {
            applied.Add(
                reader.GetString(0),
                new AppliedMigration(reader.GetString(1), reader.GetString(2), reader.GetString(3)));
        }

        return applied;
    }

    private static async Task EnsureLedgerAsync(
        NpgsqlConnection connection,
        NpgsqlTransaction transaction,
        CancellationToken cancellationToken)
    {
        await using var command = new NpgsqlCommand(
            "CREATE TABLE IF NOT EXISTS schema_migrations (migration_id varchar(64) PRIMARY KEY, filename varchar(255) NOT NULL UNIQUE, spec_version varchar(32) NOT NULL, checksum char(64) NOT NULL, applied_at timestamptz NOT NULL DEFAULT now());",
            connection,
            transaction);
        await command.ExecuteNonQueryAsync(cancellationToken);
    }
}
