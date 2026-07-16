"""seed_reference_data

Revision ID: b12a3fcacce1
Revises: 81d27c6359d2
Create Date: 2026-07-17 00:27:32.614136

"""

from collections.abc import Sequence

from alembic import op
from app.models.education_content import EducationContent
from app.models.field import RiceVariety
from app.models.regional_climate_baseline import RegionalClimateBaseline
from app.seed_data import (
    EDUCATION_CONTENT,
    REGIONAL_CLIMATE_BASELINES,
    RICE_VARIETIES,
    seed_reference_data,
)

# revision identifiers, used by Alembic.
revision: str = "b12a3fcacce1"
down_revision: str | None = "81d27c6359d2"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    seed_reference_data(op.get_bind())


def downgrade() -> None:
    connection = op.get_bind()
    for table, rows in (
        (EducationContent.__table__, EDUCATION_CONTENT),
        (RegionalClimateBaseline.__table__, REGIONAL_CLIMATE_BASELINES),
        (RiceVariety.__table__, RICE_VARIETIES),
    ):
        connection.execute(table.delete().where(table.c.id.in_([row["id"] for row in rows])))
