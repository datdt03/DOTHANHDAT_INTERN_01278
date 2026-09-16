using Microsoft.Extensions.Logging.Abstractions;
using RepairFlow.Api.Infrastructure.Database;

namespace RepairFlow.Api.Tests;

public sealed class MigrationRunnerTests
{
    [Fact]
    public async Task Runner_applies_each_version_once_and_keeps_order()
    {
        var store = new InMemoryMigrationStore();
        var runner = new VersionedMigrationRunner(
            store,
            [
                Definition("0002", 2, "second"),
                Definition("0001", 1, "first")
            ],
            NullLogger<VersionedMigrationRunner>.Instance);

        var firstRun = await runner.ApplyPendingAsync();
        var secondRun = await runner.ApplyPendingAsync();

        Assert.Equal(["0001", "0002"], firstRun.AppliedVersions);
        Assert.Empty(secondRun.AppliedVersions);
        Assert.Equal(["0001", "0002"], store.AppliedScripts);
    }

    [Fact]
    public async Task Runner_rejects_duplicate_versions()
    {
        var runner = new VersionedMigrationRunner(
            new InMemoryMigrationStore(),
            [
                Definition("0001", 1, "first"),
                Definition("0001", 1, "duplicate")
            ],
            NullLogger<VersionedMigrationRunner>.Instance);

        await Assert.ThrowsAsync<InvalidOperationException>(() => runner.ApplyPendingAsync());
    }

    [Fact]
    public async Task Runner_rejects_duplicate_global_sequences()
    {
        var runner = new VersionedMigrationRunner(
            new InMemoryMigrationStore(),
            [
                Definition("20260917_0001", 1, "first"),
                Definition("20260918_0001", 1, "duplicate sequence")
            ],
            NullLogger<VersionedMigrationRunner>.Instance);

        await Assert.ThrowsAsync<InvalidOperationException>(() => runner.ApplyPendingAsync());
    }

    [Fact]
    public async Task Runner_rejects_changed_checksum_for_an_applied_migration()
    {
        var store = new InMemoryMigrationStore();
        var first = Definition("0001", 1, "first");
        var changed = first with
        {
            Sql = "changed",
            Checksum = MigrationChecksum.Compute("changed")
        };
        var runner = new VersionedMigrationRunner(
            store,
            [first],
            NullLogger<VersionedMigrationRunner>.Instance);

        await runner.ApplyPendingAsync();

        var changedRunner = new VersionedMigrationRunner(
            store,
            [changed],
            NullLogger<VersionedMigrationRunner>.Instance);

        await Assert.ThrowsAsync<InvalidOperationException>(() => changedRunner.ApplyPendingAsync());
    }

    private static MigrationDefinition Definition(string id, long sequence, string sql) =>
        new(
            id,
            $"{id}.sql",
            "v0",
            sequence,
            sql,
            MigrationChecksum.Compute(sql),
            "test",
            "Test migration",
            "none");

    private sealed class InMemoryMigrationStore : IMigrationStore
    {
        private readonly Dictionary<string, AppliedMigration> _appliedMigrations =
            new(StringComparer.Ordinal);

        public List<string> AppliedScripts { get; } = [];

        public Task<MigrationRunResult> ApplyPendingAsync(
            IReadOnlyList<MigrationDefinition> migrations,
            CancellationToken cancellationToken = default)
        {
            var appliedNow = new List<string>();
            foreach (var migration in migrations)
            {
                if (_appliedMigrations.TryGetValue(migration.Id, out var existing))
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

                _appliedMigrations[migration.Id] = new AppliedMigration(
                    migration.Filename,
                    migration.SpecVersion,
                    migration.Checksum);
                AppliedScripts.Add(migration.Id);
                appliedNow.Add(migration.Id);
            }

            return Task.FromResult(new MigrationRunResult(appliedNow));
        }
    }
}
