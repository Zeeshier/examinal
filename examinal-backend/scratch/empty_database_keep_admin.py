import os
import sys

from sqlalchemy import func, select, text

sys.path.append(os.getcwd())

from app.config import settings
from app.database import Base, SessionLocal, engine
from app.models.user import User

import app.models  # noqa: F401, E402


def count_table(db, table) -> int:
    return db.execute(select(func.count()).select_from(table)).scalar_one()


def reset_auto_increment(table_name: str) -> None:
    if engine.dialect.name in {"mysql", "mariadb"}:
        with engine.connect() as connection:
            try:
                connection.execute(text(f"ALTER TABLE `{table_name}` AUTO_INCREMENT = 1"))
                connection.commit()
            except Exception:
                connection.rollback()


def clear_vector_store() -> None:
    try:
        import chromadb
        from chromadb.config import Settings as ChromaSettings

        client = chromadb.PersistentClient(
            path=settings.VECTOR_STORE_DIR,
            settings=ChromaSettings(anonymized_telemetry=False),
        )
        collections = client.list_collections()
        for collection in collections:
            name = collection.name if hasattr(collection, "name") else str(collection)
            client.delete_collection(name)
        print(f"Cleared vector store collections: {len(collections)}")
    except Exception as exc:
        print(f"Vector store cleanup skipped: {exc}")


def main() -> int:
    with SessionLocal() as db:
        default_admin = db.execute(
            select(User.id, User.username, User.email).where(User.username == "admin")
        ).first()
        admin_users = db.execute(
            select(User.id, User.username, User.email).where(User.role == "admin")
        ).all()
        if not admin_users:
            print("No admin users found. Aborting so admin login credentials are not lost.")
            return 1

        preserved_users = [default_admin] if default_admin else admin_users
        preserved_ids = [user_id for user_id, _username, _email in preserved_users]

        print("Admin login credentials preserved:")
        for user_id, username, email in preserved_users:
            print(f"- id={user_id}, username={username}, email={email}")

        before_counts = {
            table.name: count_table(db, table)
            for table in sorted(Base.metadata.tables.values(), key=lambda item: item.name)
        }

        for table in reversed(Base.metadata.sorted_tables):
            if table.name == "users":
                result = db.execute(table.delete().where(table.c.id.not_in(preserved_ids)))
                print(f"Deleted {result.rowcount or 0} non-preserved users")
                continue

            result = db.execute(table.delete())
            print(f"Deleted {result.rowcount or 0} rows from {table.name}")

        db.commit()

        for table in Base.metadata.tables.values():
            if table.name != "users":
                reset_auto_increment(table.name)

        after_counts = {
            table.name: count_table(db, table)
            for table in sorted(Base.metadata.tables.values(), key=lambda item: item.name)
        }

        print("Remaining table counts:")
        for table_name, count in after_counts.items():
            print(f"- {table_name}: {count}")

        kept_users = after_counts.get("users", 0)
        if kept_users != len(preserved_users):
            print(
                f"Warning: expected {len(preserved_users)} preserved users, "
                f"found {kept_users} users after cleanup."
            )
            return 1

        deleted_rows = sum(before_counts.values()) - sum(after_counts.values())
        print(f"Deleted total app DB rows: {deleted_rows}")

    clear_vector_store()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
