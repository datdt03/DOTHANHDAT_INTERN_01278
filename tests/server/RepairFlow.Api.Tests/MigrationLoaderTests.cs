using RepairFlow.Api.Infrastructure.Database;

namespace RepairFlow.Api.Tests;

public sealed class MigrationLoaderTests
{
    [Fact]
    public void Loader_parses_the_decided_filename_and_header_convention()
    {
        var directory = CreateTemporaryDirectory();
        try
        {
            File.WriteAllText(
                Path.Combine(directory, "20260917_0002__spec-v0__create-users.sql"),
                Header("20260917_0002", "v0") + "SELECT 2;");
            File.WriteAllText(
                Path.Combine(directory, "20260917_0001__spec-v0__create-workspaces.sql"),
                Header("20260917_0001", "v0") + "SELECT 1;");

            var migrations = MigrationLoader.Load(directory);

            Assert.Equal(["20260917_0001", "20260917_0002"], migrations.Select(migration => migration.Id));
            Assert.Equal("v0", migrations[0].SpecVersion);
            Assert.Equal("20260917_0001__spec-v0__create-workspaces.sql", migrations[0].Filename);
            Assert.Equal(MigrationChecksum.Compute(migrations[0].Sql), migrations[0].Checksum);
        }
        finally
        {
            Directory.Delete(directory, recursive: true);
        }
    }

    [Fact]
    public void Loader_rejects_a_filename_outside_the_decided_convention()
    {
        var directory = CreateTemporaryDirectory();
        try
        {
            File.WriteAllText(Path.Combine(directory, "0001_identity.sql"), "SELECT 1;");

            var exception = Assert.Throws<InvalidOperationException>(() => MigrationLoader.Load(directory));

            Assert.Contains("YYYYMMDD_GLOBAL_SEQUENCE__spec-vX__description.sql", exception.Message);
        }
        finally
        {
            Directory.Delete(directory, recursive: true);
        }
    }

    private static string CreateTemporaryDirectory()
    {
        var directory = Path.Combine(Path.GetTempPath(), "repairflow-migration-tests", Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(directory);
        return directory;
    }

    private static string Header(string migrationId, string specVersion) =>
        $"-- migration_id: {migrationId}{Environment.NewLine}" +
        $"-- spec: docs/{specVersion}/05-database-requirements.md{Environment.NewLine}" +
        $"-- section: 12.0{Environment.NewLine}" +
        $"-- purpose: Test migration{Environment.NewLine}" +
        $"-- depends_on: none{Environment.NewLine}";
}
