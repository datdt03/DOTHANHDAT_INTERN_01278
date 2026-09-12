from pathlib import Path

from src.db.migrate import discover_migrations


ROOT = Path(__file__).resolve().parents[1]
MIGRATION_DIR = ROOT / "src" / "db" / "migrations" / "versions"


def test_migrations_are_ordered_sql_versions() -> None:
    migrations = discover_migrations()

    assert [migration.path.name for migration in migrations] == [
        "0001_identity.sql",
        "0002_customers_devices_orders.sql",
        "0003_evidence_diagnosis_quotes.sql",
        "0004_public_links_decisions.sql",
        "0005_execution_handover.sql",
        "0006_status_audit_indexes.sql",
    ]


def test_migrations_contain_postgresql_ddl() -> None:
    for migration_path in sorted(MIGRATION_DIR.glob("*.sql")):
        content = migration_path.read_text(encoding="utf-8").lower()

        assert "create table" in content

    assert "create extension" in (MIGRATION_DIR / "0001_identity.sql").read_text(encoding="utf-8").lower()
