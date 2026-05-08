import os
import sys

from sqlalchemy import inspect, text
from sqlalchemy.orm import configure_mappers

# Add current directory to path
sys.path.append(os.getcwd())

from app.database import Base, engine

# Import the package once so every model module registered in __init__ loads.
import app.models  # noqa: F401, E402


IGNORED_EXTRA_TABLES = {"alembic_version"}

KNOWN_SCHEMA_REPAIRS = [
    "UPDATE exams SET category = 'General' WHERE category IS NULL",
    "UPDATE exams SET schedule_type = 'anytime' WHERE schedule_type IS NULL",
    "UPDATE users SET failed_login_count = 0 WHERE failed_login_count IS NULL",
    "ALTER TABLE exams MODIFY COLUMN category VARCHAR(100) NOT NULL DEFAULT 'General'",
    "ALTER TABLE exams MODIFY COLUMN schedule_type VARCHAR(20) NOT NULL DEFAULT 'anytime'",
    "ALTER TABLE users MODIFY COLUMN failed_login_count INT NOT NULL DEFAULT 0",
]


def apply_known_schema_repairs() -> None:
    if engine.dialect.name not in {"mysql", "mariadb"}:
        return

    print("Applying known non-destructive schema repairs...")
    with engine.connect() as connection:
        for statement in KNOWN_SCHEMA_REPAIRS:
            try:
                connection.execute(text(statement))
                connection.commit()
            except Exception:
                connection.rollback()


def main() -> int:
    try:
        print("Checking ORM mappings...")
        configure_mappers()
        print("ORM mappings configured successfully.")

        print("Ensuring missing tables exist...")
        Base.metadata.create_all(bind=engine)
        apply_known_schema_repairs()

        inspector = inspect(engine)
        actual_tables = set(inspector.get_table_names())
        expected_tables = set(Base.metadata.tables.keys())

        missing_tables = sorted(expected_tables - actual_tables)
        extra_tables = sorted(actual_tables - expected_tables - IGNORED_EXTRA_TABLES)

        issues: list[str] = []
        if missing_tables:
            issues.append(f"Missing tables: {', '.join(missing_tables)}")
        if extra_tables:
            issues.append(f"Unexpected tables: {', '.join(extra_tables)}")
            for table_name in extra_tables:
                columns = ", ".join(
                    f"{column['name']} nullable={column.get('nullable')}"
                    for column in inspector.get_columns(table_name)
                )
                issues.append(f"{table_name}: columns: {columns}")

        for table_name, table in sorted(Base.metadata.tables.items()):
            if table_name not in actual_tables:
                continue

            actual_columns = {
                column["name"]: column for column in inspector.get_columns(table_name)
            }
            expected_columns = set(table.columns.keys())
            actual_column_names = set(actual_columns.keys())

            missing_columns = sorted(expected_columns - actual_column_names)
            extra_columns = sorted(actual_column_names - expected_columns)

            if missing_columns:
                issues.append(
                    f"{table_name}: missing columns: {', '.join(missing_columns)}"
                )
            if extra_columns:
                extra_column_details = ", ".join(
                    f"{name} nullable={actual_columns[name].get('nullable')}"
                    for name in extra_columns
                )
                issues.append(
                    f"{table_name}: unexpected columns: {extra_column_details}"
                )

            for column in table.columns:
                actual = actual_columns.get(column.name)
                if not actual:
                    continue

                expected_nullable = bool(column.nullable)
                actual_nullable = bool(actual.get("nullable"))
                if actual_nullable != expected_nullable and not column.primary_key:
                    issues.append(
                        f"{table_name}.{column.name}: nullable is {actual_nullable}, "
                        f"expected {expected_nullable}"
                    )

        print(f"Expected tables: {len(expected_tables)}")
        print(f"Actual tables: {len(actual_tables)}")

        if issues:
            print("Schema issues found:")
            for issue in issues:
                print(f"- {issue}")
            return 1

        print("Database schema matches SQLAlchemy models.")
        return 0
    except Exception as exc:
        print(f"Error checking database schema: {exc}")
        import traceback

        traceback.print_exc()
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
