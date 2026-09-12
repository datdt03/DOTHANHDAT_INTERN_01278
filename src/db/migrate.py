"""Run versioned PostgreSQL migrations stored as SQL files."""

from dataclasses import dataclass
from pathlib import Path
import re

from sqlalchemy import create_engine
from sqlalchemy.engine import Connection

from src.app.core.config import get_settings


MIGRATION_DIR = Path(__file__).resolve().parent / "migrations" / "versions"
MIGRATION_PATTERN = re.compile(r"^(?P<version>\d{4})_(?P<name>[a-z0-9_]+)\.sql$")


@dataclass(frozen=True)
class Migration:
    version: str
    name: str
    path: Path


def discover_migrations() -> list[Migration]:
    migrations: list[Migration] = []
    for path in sorted(MIGRATION_DIR.glob("*.sql")):
        match = MIGRATION_PATTERN.match(path.name)
        if match is None:
            raise ValueError(f"Invalid migration filename: {path.name}")
        migrations.append(
            Migration(
                version=f"{match.group('version')}_{match.group('name')}",
                name=match.group("name"),
                path=path,
            )
        )
    if not migrations:
        raise RuntimeError(f"No SQL migrations found in {MIGRATION_DIR}")
    return migrations


def ensure_history_table(connection: Connection) -> None:
    connection.exec_driver_sql(
        """
        CREATE TABLE IF NOT EXISTS schema_migrations (
            version varchar(128) PRIMARY KEY,
            name varchar(255) NOT NULL,
            applied_at timestamptz NOT NULL DEFAULT now()
        )
        """
    )
    connection.commit()


def get_applied_versions(connection: Connection) -> set[str]:
    rows = connection.exec_driver_sql(
        "SELECT version FROM schema_migrations ORDER BY version"
    ).fetchall()
    return {row[0] for row in rows}


def get_legacy_alembic_version(connection: Connection) -> str | None:
    exists = connection.exec_driver_sql(
        """
        SELECT EXISTS (
            SELECT 1
            FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = 'alembic_version'
        )
        """
    ).fetchone()[0]
    if not exists:
        return None
    row = connection.exec_driver_sql(
        "SELECT version_num FROM alembic_version LIMIT 1"
    ).fetchone()
    return row[0] if row else None


def baseline_legacy_database(
    connection: Connection,
    migrations: list[Migration],
    legacy_version: str,
) -> None:
    known_versions = {migration.version for migration in migrations}
    if legacy_version not in known_versions:
        raise RuntimeError(
            "Unsupported legacy alembic_version: "
            f"{legacy_version}. Expected one of {sorted(known_versions)}."
        )

    legacy_number = int(legacy_version.split("_", maxsplit=1)[0])
    with connection.begin():
        for migration in migrations:
            migration_number = int(migration.version.split("_", maxsplit=1)[0])
            if migration_number <= legacy_number:
                connection.exec_driver_sql(
                    """
                    INSERT INTO schema_migrations (version, name)
                    VALUES (%s, %s)
                    ON CONFLICT (version) DO NOTHING
                    """,
                    (migration.version, migration.name),
                )


def apply_migrations(connection: Connection, migrations: list[Migration]) -> int:
    applied = get_applied_versions(connection)
    connection.commit()
    legacy_version = get_legacy_alembic_version(connection)
    connection.commit()
    if not applied and legacy_version:
        baseline_legacy_database(connection, migrations, legacy_version)
        applied = get_applied_versions(connection)
        connection.commit()
        print(f"Baselined legacy Alembic database at {legacy_version}.")

    applied_count = 0
    for migration in migrations:
        if migration.version in applied:
            continue
        sql = migration.path.read_text(encoding="utf-8")
        with connection.begin():
            connection.exec_driver_sql(sql)
            connection.exec_driver_sql(
                """
                INSERT INTO schema_migrations (version, name)
                VALUES (%s, %s)
                """,
                (migration.version, migration.name),
            )
        applied_count += 1
        print(f"Applied {migration.version}.")
    return applied_count


def main() -> None:
    settings = get_settings()
    migrations = discover_migrations()
    engine = create_engine(settings.database_url, pool_pre_ping=True)
    with engine.connect() as connection:
        connection.exec_driver_sql(
            "SELECT pg_advisory_lock(hashtext('repairflow:schema_migrations'))"
        )
        try:
            ensure_history_table(connection)
            applied_count = apply_migrations(connection, migrations)
        finally:
            connection.exec_driver_sql(
                "SELECT pg_advisory_unlock(hashtext('repairflow:schema_migrations'))"
            )
    engine.dispose()
    if applied_count == 0:
        print("Database is already up to date.")


if __name__ == "__main__":
    main()
