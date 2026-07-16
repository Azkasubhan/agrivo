"""Canonical static development reference data for AGRIVO."""

from collections.abc import Iterable
from typing import Any

from sqlalchemy import Connection
from sqlalchemy.dialects.postgresql import insert

from app.models.education_content import EducationContent
from app.models.field import RiceVariety
from app.models.regional_climate_baseline import RegionalClimateBaseline

PHASE_BREAKDOWN_PERCENT = {
    "land_preparation": [0, 9],
    "vegetative": [9, 45],
    "reproductive": [45, 65],
    "ripening": [65, 100],
}

RICE_VARIETIES: tuple[dict[str, Any], ...] = (
    {
        "id": "00000000-0000-0000-0000-000000000101",
        "code": "CIHERANG",
        "display_name": "Ciherang",
        "total_duration_days": 116,
        "phase_breakdown_percent": PHASE_BREAKDOWN_PERCENT,
    },
    {
        "id": "00000000-0000-0000-0000-000000000102",
        "code": "IR64",
        "display_name": "IR64",
        "total_duration_days": 115,
        "phase_breakdown_percent": PHASE_BREAKDOWN_PERCENT,
    },
    {
        "id": "00000000-0000-0000-0000-000000000103",
        "code": "INPARI_32",
        "display_name": "Inpari 32",
        "total_duration_days": 112,
        "phase_breakdown_percent": PHASE_BREAKDOWN_PERCENT,
    },
    {
        "id": "00000000-0000-0000-0000-000000000104",
        "code": "INPARI_42_AGRITAN_GSR",
        "display_name": "Inpari 42 Agritan GSR",
        "total_duration_days": 103,
        "phase_breakdown_percent": PHASE_BREAKDOWN_PERCENT,
    },
    {
        "id": "00000000-0000-0000-0000-000000000105",
        "code": "MEKONGGA",
        "display_name": "Mekongga",
        "total_duration_days": 120,
        "phase_breakdown_percent": PHASE_BREAKDOWN_PERCENT,
    },
)

REGIONAL_CLIMATE_BASELINES: tuple[dict[str, Any], ...] = (
    {
        "id": "00000000-0000-0000-0000-000000000201",
        "province_code": "ID-JB",
        "avg_daily_rainfall_mm": 8.50,
        "avg_temperature_c": 24.5,
        "avg_et0_mm": 3.80,
    },
    {
        "id": "00000000-0000-0000-0000-000000000202",
        "province_code": "ID-JT",
        "avg_daily_rainfall_mm": 7.20,
        "avg_temperature_c": 25.0,
        "avg_et0_mm": 4.10,
    },
    {
        "id": "00000000-0000-0000-0000-000000000203",
        "province_code": "ID-JI",
        "avg_daily_rainfall_mm": 6.80,
        "avg_temperature_c": 25.5,
        "avg_et0_mm": 4.20,
    },
    {
        "id": "00000000-0000-0000-0000-000000000204",
        "province_code": "ID-SS",
        "avg_daily_rainfall_mm": 9.10,
        "avg_temperature_c": 26.0,
        "avg_et0_mm": 3.90,
    },
    {
        "id": "00000000-0000-0000-0000-000000000205",
        "province_code": "ID-SN",
        "avg_daily_rainfall_mm": 8.00,
        "avg_temperature_c": 26.5,
        "avg_et0_mm": 4.30,
    },
)

EDUCATION_CONTENT: tuple[dict[str, Any], ...] = (
    {
        "id": "00000000-0000-0000-0000-000000000301",
        "related_strategy": None,
        "display_order": 0,
        "title": "Memilih strategi irigasi",
        "body_markdown": (
            "AGRIVO memberi rekomendasi sesuai kondisi lahan, bukan satu metode untuk semua "
            "kondisi. Perhatikan fase tanam, jenis tanah, dan risiko cuaca sebelum menerapkan "
            "strategi."
        ),
    },
    {
        "id": "00000000-0000-0000-0000-000000000302",
        "related_strategy": "CONTINUOUS_FLOODING_MODIFIED",
        "display_order": 10,
        "title": "Penggenangan termodifikasi",
        "body_markdown": (
            "Pertahankan genangan dangkal sekitar 2–5 cm dan izinkan jeda kering singkat "
            "bila kondisi lahan memungkinkan. Strategi ini membantu mengurangi penggunaan air "
            "tanpa siklus kering-basah penuh."
        ),
    },
    {
        "id": "00000000-0000-0000-0000-000000000303",
        "related_strategy": "AWD_MILD",
        "display_order": 20,
        "title": "AWD ringan",
        "body_markdown": (
            "Biarkan muka air turun hingga sekitar 15 cm di bawah permukaan tanah sebelum irigasi "
            "ulang. Jangan menerapkan AWD pada fase reproduktif dan koordinasikan jadwal bila "
            "irigasi dikelola bersama."
        ),
    },
    {
        "id": "00000000-0000-0000-0000-000000000304",
        "related_strategy": "DELAYED_IRRIGATION",
        "display_order": 30,
        "title": "Irigasi tertunda",
        "body_markdown": (
            "Tunda penggenangan awal setelah tanam untuk membantu perkembangan akar. Terapkan "
            "hanya pada fase persiapan lahan dan saat pasokan air dapat dipantau."
        ),
    },
    {
        "id": "00000000-0000-0000-0000-000000000305",
        "related_strategy": "PARTIAL_IRRIGATION",
        "display_order": 40,
        "title": "Irigasi parsial",
        "body_markdown": (
            "Berikan air dalam volume terbatas atau terjadwal, bukan genangan penuh. Pantau "
            "kondisi tanaman dan hentikan strategi bila tanaman menunjukkan tanda kekurangan air."
        ),
    },
)


def _upsert_rows(
    connection: Connection, table: Any, rows: Iterable[dict[str, Any]], update_columns: set[str]
) -> None:
    """Upsert rows using their deterministic primary keys."""
    for row in rows:
        statement = insert(table).values(row)
        connection.execute(
            statement.on_conflict_do_update(
                index_elements=[table.c.id],
                set_={column: statement.excluded[column] for column in update_columns},
            )
        )


def seed_reference_data(connection: Connection) -> None:
    """Idempotently write documented static development lookup data."""
    _upsert_rows(
        connection,
        RiceVariety.__table__,
        RICE_VARIETIES,
        {"code", "display_name", "total_duration_days", "phase_breakdown_percent"},
    )
    _upsert_rows(
        connection,
        RegionalClimateBaseline.__table__,
        REGIONAL_CLIMATE_BASELINES,
        {"province_code", "avg_daily_rainfall_mm", "avg_temperature_c", "avg_et0_mm"},
    )
    _upsert_rows(
        connection,
        EducationContent.__table__,
        EDUCATION_CONTENT,
        {"related_strategy", "display_order", "title", "body_markdown"},
    )
