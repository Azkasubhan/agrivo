"""Populate AGRIVO's documented static development reference data."""

from app.core.database import engine
from app.seed_data import seed_reference_data


def main() -> None:
    """Run the idempotent static reference-data seed in one transaction."""
    with engine.begin() as connection:
        seed_reference_data(connection)
    print("Static reference data seeded successfully.")


if __name__ == "__main__":
    main()
