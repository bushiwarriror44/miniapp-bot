import argparse
import os

from app import app, PROJECT_ROOT
from models import migrate_datasets_from_frontend


def main():
    parser = argparse.ArgumentParser(
        description="One-time migrate frontend JSON datasets into admin SQLite DB."
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Overwrite existing datasets in DB with JSON values.",
    )
    args = parser.parse_args()

    with app.app_context():
        result = migrate_datasets_from_frontend(
            PROJECT_ROOT, overwrite_existing=args.force
        )

    print("Migration finished.")
    print(f"Project root: {PROJECT_ROOT}")
    print(f"Migrated datasets ({len(result['migrated'])}): {', '.join(result['migrated']) or '-'}")
    print(f"Skipped datasets ({len(result['skipped'])}): {', '.join(result['skipped']) or '-'}")
    if args.force:
        print("Mode: force overwrite")
    else:
        print("Mode: only missing datasets (safe one-time import)")


if __name__ == "__main__":
    main()
