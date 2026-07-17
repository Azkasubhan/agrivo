"""Recommendation Service coordinating Weather fetches, AI Engine inference, and database persistence."""

from typing import Any
from uuid import UUID

from sqlalchemy.orm import Session

from app.ai_engine.engine import infer
from app.ai_engine.schemas import (
    AIEngineInput,
    AIEngineOutput,
    GrowthStage,
    IrrigationStrategyEnum,
    IrrigationSystemTypeEnum,
    SoilTypeEnum,
    WaterBalanceIndex,
    WeatherRiskIndex,
)
from app.models.enums import IrrigationStrategy
from app.models.field import Field
from app.models.recommendation import Recommendation
from app.repositories.recommendation_repository import RecommendationRepository
from app.services.field_service import FieldService
from app.services.weather_service import WeatherService


class RecommendationService:
    """Orchestrates the AI recommendation generation process."""

    def __init__(self, session: Session) -> None:
        self.session = session
        self.repo = RecommendationRepository(session)
        self.field_service = FieldService(session)
        self.weather_service = WeatherService(session)

    def _get_strategy_display(self, strategy: IrrigationStrategy) -> str:
        """Return user-friendly display name for the strategy."""
        mapping = {
            IrrigationStrategy.CONTINUOUS_FLOODING: "Continuous Flooding",
            IrrigationStrategy.CONTINUOUS_FLOODING_MODIFIED: "Continuous Flooding (Modified)",
            IrrigationStrategy.AWD_MILD: "Alternate Wetting & Drying (Mild)",
            IrrigationStrategy.AWD_STRICT: "Alternate Wetting & Drying (Strict)",
            IrrigationStrategy.DELAYED_IRRIGATION: "Delayed Irrigation",
            IrrigationStrategy.PARTIAL_IRRIGATION: "Partial Irrigation",
        }
        return mapping.get(strategy, strategy.value)

    def _determine_urgency(self, strategy: IrrigationStrategy, field: Field, derived: dict) -> str:
        """Calculate urgency category based on strategy transitions and field state."""
        wb = derived.get("water_balance_index", "NORMAL")
        # Deficit soil water balance with AWD is critical
        if strategy in (IrrigationStrategy.AWD_MILD, IrrigationStrategy.AWD_STRICT) and wb == "DEFICIT":
            return "high"
        # Strategy transition requires user attention
        if field.previous_irrigation_method and field.previous_irrigation_method != strategy:
            return "medium"
        return "normal"

    def _map_to_response(self, rec: Recommendation) -> dict[str, Any]:
        """Map Recommendation ORM object to its response payload dict."""
        pred = rec.prediction
        raw_derived = rec.weather_snapshot.raw_data.get("_derived", {})

        # Compute dynamic UI helpers
        strategy_display = self._get_strategy_display(rec.recommended_strategy)
        urgency = self._determine_urgency(rec.recommended_strategy, rec.field, raw_derived)

        # Generate metrics tags dynamically from prediction
        metrics_list = []
        if pred:
            if float(pred.water_saving_percent) > 0:
                metrics_list.append(f"{pred.water_saving_percent}% Water Saved")
            else:
                metrics_list.append("Baseline Water")

            if float(pred.net_gwp_reduction_percent) != 0:
                prefix = "-" if float(pred.net_gwp_reduction_percent) > 0 else "+"
                val = abs(float(pred.net_gwp_reduction_percent))
                metrics_list.append(f"{prefix}{val}% Net GWP")

            metrics_list.append(f"{pred.expected_yield_ton_per_ha} t/ha Yield")

        explanation_dict = None
        if pred and pred.explanation:
            explanation_dict = {
                "why": pred.explanation.get("why", ""),
                "benefits": pred.explanation.get("benefits", []),
                "tradeoffs": pred.explanation.get("tradeoffs", []),
                "how_to_implement": pred.explanation.get("how_to_implement", ""),
                "governance_note": pred.explanation.get("governance_note"),
                "rule_constraints_applied": pred.explanation.get("rule_constraints_applied", []),
            }

        prediction_dict = None
        if pred:
            prediction_dict = {
                "water_saving_percent": float(pred.water_saving_percent),
                "expected_yield_ton_per_ha": float(pred.expected_yield_ton_per_ha),
                "yield_baseline_ton_per_ha": float(pred.yield_baseline_ton_per_ha),
                "ch4_reduction_percent": float(pred.ch4_reduction_percent),
                "n2o_change_percent": float(pred.n2o_change_percent),
                "net_gwp_reduction_percent": float(pred.net_gwp_reduction_percent),
            }

        return {
            "id": str(rec.id),
            "field_id": str(rec.field_id),
            "weather_snapshot_id": str(rec.weather_snapshot_id),
            "recommended_strategy": rec.recommended_strategy.value,
            "recommended_strategy_display": strategy_display,
            "confidence_score": float(rec.confidence_score),
            "engine_type": rec.engine_type,
            "model_version": rec.model_version,
            "created_at": rec.created_at.isoformat(),
            "title": strategy_display,
            "description": explanation_dict.get("why", "") if explanation_dict else "",
            "category": "irrigation",
            "urgency": urgency,
            "metrics": metrics_list,
            "prediction": prediction_dict,
            "explanation": explanation_dict,
        }

    def generate_recommendation(self, user_id: UUID, field_id: UUID, preview: bool = False) -> dict[str, Any]:
        """Trigger a fresh recommendation cycle for a field."""
        # 1. Fetch Field (verifies ownership)
        field = self.field_service._get_owned_or_raise(user_id, field_id)

        # 2. Get Weather Snapshot (caches/fetches and derives inputs)
        weather_snapshot = self.weather_service.get_weather_for_field(field)
        derived = weather_snapshot.raw_data.get("_derived", {})

        # 3. Assemble AI Engine Input
        engine_input = AIEngineInput(
            soil_type=SoilTypeEnum(field.soil_type.value),
            growth_stage=GrowthStage(derived["growth_stage"]),
            water_balance_index=WaterBalanceIndex(derived["water_balance_index"]),
            weather_risk_index=WeatherRiskIndex(derived["weather_risk_index"]),
            irrigation_system_type=(
                IrrigationSystemTypeEnum(field.irrigation_system_type.value)
                if field.irrigation_system_type
                else None
            ),
            rice_variety_code=field.rice_variety.code,
            is_weather_estimated=weather_snapshot.is_estimated,
            previous_irrigation_method=(
                IrrigationStrategyEnum(field.previous_irrigation_method.value)
                if field.previous_irrigation_method
                else None
            ),
        )

        # 4. Invoke AI Engine Inference
        engine_output: AIEngineOutput = infer(engine_input)

        # 5. Persist Recommendation to Database
        rec_model = self.repo.create(
            field_id=field.id,
            weather_snapshot_id=weather_snapshot.id,
            input_snapshot=engine_input.model_dump(mode="json"),
            recommended_strategy=IrrigationStrategy(engine_output.recommended_strategy.value),
            confidence_score=engine_output.confidence_score,
            engine_type=engine_output.engine_type,
            model_version=engine_output.model_version,
            is_saved=not preview,
        )

        # 6. Persist Predictions & Explanation
        self.repo.create_prediction(
            recommendation_id=rec_model.id,
            water_saving_percent=engine_output.predictions.water_saving_percent,
            expected_yield_ton_per_ha=engine_output.predictions.expected_yield_ton_per_ha,
            yield_baseline_ton_per_ha=engine_output.predictions.yield_baseline_ton_per_ha,
            ch4_reduction_percent=engine_output.predictions.ch4_reduction_percent,
            n2o_change_percent=engine_output.predictions.n2o_change_percent,
            net_gwp_reduction_percent=engine_output.predictions.net_gwp_reduction_percent,
            explanation=engine_output.explanation.model_dump(mode="json"),
        )

        # Reload to get prediction relation
        rec_model = self.repo.get_by_id(rec_model.id)
        assert rec_model is not None

        return self._map_to_response(rec_model)

    def list_recommendations_for_field(
        self, user_id: UUID, field_id: UUID, page: int, page_size: int
    ) -> dict[str, Any]:
        """List recommendations for a field with page/total metadata."""
        # Verify ownership
        self.field_service._get_owned_or_raise(user_id, field_id)

        items, total = self.repo.list_by_field(field_id, page, page_size)
        return {
            "items": [self._map_to_response(item) for item in items],
            "total": total,
            "page": page,
            "page_size": page_size,
        }

    def get_recommendation_detail(self, user_id: UUID, rec_id: UUID) -> dict[str, Any]:
        """Retrieve full details of a specific recommendation (verifying owner access)."""
        rec = self.repo.get_by_id(rec_id)
        if rec is None:
            # Raise NOT FOUND
            from app.core.exceptions import FieldNotFoundError  # reuse 404
            raise FieldNotFoundError()

        # Verify field ownership
        self.field_service._get_owned_or_raise(user_id, rec.field_id)

        return self._map_to_response(rec)

    def save_recommendation(self, user_id: UUID, rec_id: UUID) -> dict[str, Any]:
        """Mark a draft recommendation as saved."""
        rec = self.repo.get_by_id(rec_id)
        if rec is None:
            from app.core.exceptions import FieldNotFoundError
            raise FieldNotFoundError()

        # Verify field ownership
        self.field_service._get_owned_or_raise(user_id, rec.field_id)

        rec.is_saved = True
        self.repo.session.commit()
        
        return self._map_to_response(rec)
