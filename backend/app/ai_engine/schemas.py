"""Structured input/output contracts for the AGRIVO AI Engine.

Service layer communicates with the engine exclusively through these types.
The internal implementation (rule thresholds, model algorithm) may change
freely as long as this contract is respected.
"""

from enum import Enum
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


# ---------------------------------------------------------------------------
# Domain enums used as AI Engine features
# ---------------------------------------------------------------------------


class GrowthStage(str, Enum):
    """Rice growth phase derived from planting date and variety duration."""

    LAND_PREPARATION = "LAND_PREPARATION"
    VEGETATIVE = "VEGETATIVE"
    REPRODUCTIVE = "REPRODUCTIVE"
    RIPENING = "RIPENING"


class WaterBalanceIndex(str, Enum):
    """10-day soil water balance category (see 04-input-specification §3.2)."""

    SURPLUS = "SURPLUS"    # WB > +15 mm
    NORMAL = "NORMAL"     # -15 mm <= WB <= +15 mm
    DEFICIT = "DEFICIT"   # WB < -15 mm


class WeatherRiskIndex(str, Enum):
    """14-day forecast risk category (see 04-input-specification §3.3)."""

    DROUGHT_HIGH = "DROUGHT_HIGH"
    DROUGHT_MODERATE = "DROUGHT_MODERATE"
    NORMAL = "NORMAL"
    EXCESS_HIGH = "EXCESS_HIGH"


class IrrigationStrategyEnum(str, Enum):
    """All irrigation strategies considered by the engine."""

    CONTINUOUS_FLOODING = "CONTINUOUS_FLOODING"
    CONTINUOUS_FLOODING_MODIFIED = "CONTINUOUS_FLOODING_MODIFIED"
    AWD_MILD = "AWD_MILD"
    AWD_STRICT = "AWD_STRICT"
    DELAYED_IRRIGATION = "DELAYED_IRRIGATION"
    PARTIAL_IRRIGATION = "PARTIAL_IRRIGATION"


class SoilTypeEnum(str, Enum):
    """Soil hydrology categories (mirrors models/enums.py)."""

    SANDY = "SANDY"
    LOAM = "LOAM"
    CLAY = "CLAY"
    SILTY = "SILTY"


class IrrigationSystemTypeEnum(str, Enum):
    """Water-source and governance categories (mirrors models/enums.py)."""

    TECHNICAL = "TECHNICAL"
    SEMI_TECHNICAL = "SEMI_TECHNICAL"
    RAINFED = "RAINFED"
    COMMUNAL_GRAVITY = "COMMUNAL_GRAVITY"


# ---------------------------------------------------------------------------
# AI Engine input
# ---------------------------------------------------------------------------


class AIEngineInput(BaseModel):
    """All features required by the AI engine to produce a recommendation.

    All derived inputs (growth_stage, water_balance_index, weather_risk_index)
    must be computed by the service layer before calling infer().
    """

    model_config = ConfigDict(extra="forbid")

    soil_type: SoilTypeEnum
    growth_stage: GrowthStage
    water_balance_index: WaterBalanceIndex
    weather_risk_index: WeatherRiskIndex
    irrigation_system_type: IrrigationSystemTypeEnum | None = None
    rice_variety_code: str
    is_weather_estimated: bool = False
    previous_irrigation_method: IrrigationStrategyEnum | None = None


# ---------------------------------------------------------------------------
# AI Engine output sub-types
# ---------------------------------------------------------------------------


class FeatureInfluence(BaseModel):
    """One feature's contribution to the ML model decision."""

    model_config = ConfigDict(extra="forbid")

    feature: str
    influence: float = Field(ge=0.0, le=1.0)


class MLReasoning(BaseModel):
    """ML-layer decision details surfaced in the explanation."""

    model_config = ConfigDict(extra="forbid")

    chosen_candidate: IrrigationStrategyEnum
    candidates_considered: list[IrrigationStrategyEnum]
    top_features: list[FeatureInfluence]


class ExplanationResult(BaseModel):
    """Structured explanation for the recommended strategy."""

    model_config = ConfigDict(extra="forbid")

    why: str
    benefits: list[str]
    tradeoffs: list[str]
    how_to_implement: str
    governance_note: str | None = None
    rule_constraints_applied: list[str]
    ml_reasoning: MLReasoning


class PredictionResult(BaseModel):
    """Quantitative impact predictions for the recommended strategy."""

    model_config = ConfigDict(extra="forbid")

    water_saving_percent: float
    expected_yield_ton_per_ha: float
    yield_baseline_ton_per_ha: float
    ch4_reduction_percent: float
    n2o_change_percent: float
    net_gwp_reduction_percent: float


# ---------------------------------------------------------------------------
# AI Engine output
# ---------------------------------------------------------------------------


class AIEngineOutput(BaseModel):
    """Complete result returned by the AI engine for one inference call."""

    model_config = ConfigDict(extra="forbid")

    recommended_strategy: IrrigationStrategyEnum
    confidence_score: float = Field(ge=0.0, le=1.0)
    engine_type: Literal["hybrid", "rule_only"]
    model_version: str
    predictions: PredictionResult
    explanation: ExplanationResult
