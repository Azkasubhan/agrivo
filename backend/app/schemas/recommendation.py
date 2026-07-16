"""Pydantic schemas for AI recommendations."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models.enums import IrrigationStrategy


class ExplanationDetail(BaseModel):
    """Structured explanation details mapped to frontend expectations."""

    model_config = ConfigDict(extra="forbid")

    why: str
    benefits: list[str]
    tradeoffs: list[str]
    how_to_implement: str
    governance_note: str | None
    rule_constraints_applied: list[str]


class PredictionDetail(BaseModel):
    """Quantitative prediction details."""

    model_config = ConfigDict(extra="forbid")

    water_saving_percent: float
    expected_yield_ton_per_ha: float
    yield_baseline_ton_per_ha: float
    ch4_reduction_percent: float
    n2o_change_percent: float
    net_gwp_reduction_percent: float


class RecommendationResponse(BaseModel):
    """Full detail of a recommendation."""

    model_config = ConfigDict(extra="forbid")

    id: UUID
    field_id: UUID
    weather_snapshot_id: UUID
    recommended_strategy: IrrigationStrategy
    recommended_strategy_display: str
    confidence_score: float
    engine_type: str
    model_version: str
    created_at: datetime

    # UI helpers
    title: str
    description: str
    category: str
    urgency: str
    metrics: list[str]

    # Nested quantitative and narrative prediction details
    prediction: PredictionDetail | None
    explanation: ExplanationDetail | None
