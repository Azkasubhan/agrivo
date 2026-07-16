"""PostgreSQL-backed AGRIVO domain enumerations."""

from enum import Enum


class SoilType(str, Enum):
    """Soil hydrology categories accepted for a field."""

    SANDY = "SANDY"
    LOAM = "LOAM"
    CLAY = "CLAY"
    SILTY = "SILTY"


class IrrigationStrategy(str, Enum):
    """Irrigation strategies considered by the recommendation engine."""

    CONTINUOUS_FLOODING = "CONTINUOUS_FLOODING"
    CONTINUOUS_FLOODING_MODIFIED = "CONTINUOUS_FLOODING_MODIFIED"
    AWD_MILD = "AWD_MILD"
    AWD_STRICT = "AWD_STRICT"
    DELAYED_IRRIGATION = "DELAYED_IRRIGATION"
    PARTIAL_IRRIGATION = "PARTIAL_IRRIGATION"


class IrrigationSystemType(str, Enum):
    """Water-source and irrigation governance categories for a field."""

    TECHNICAL = "TECHNICAL"
    SEMI_TECHNICAL = "SEMI_TECHNICAL"
    RAINFED = "RAINFED"
    COMMUNAL_GRAVITY = "COMMUNAL_GRAVITY"
