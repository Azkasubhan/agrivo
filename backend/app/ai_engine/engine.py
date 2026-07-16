"""Main AI Engine entry point.

Service layer calls only: infer(input: AIEngineInput) -> AIEngineOutput

Internal implementation:
  1. Rule Engine  → filter valid candidates
  2. ML Model     → choose best candidate + quantitative predictions
  3. Explanation  → assemble structured narrative

If the ML model fails (missing artifact, library error), the engine gracefully
degrades to rule_only mode: picks the first valid candidate from the rule engine
priority order and returns confidence = 0.5.
"""

import logging

from app.ai_engine.explanation import build_explanation
from app.ai_engine.rule_engine import get_valid_candidates
from app.ai_engine.schemas import (
    AIEngineInput,
    AIEngineOutput,
    IrrigationStrategyEnum,
    PredictionResult,
)

logger = logging.getLogger(__name__)


def infer(engine_input: AIEngineInput) -> AIEngineOutput:
    """Run the full AI Engine pipeline for one recommendation request.

    Args:
        engine_input: structured feature set prepared by the service layer.

    Returns:
        AIEngineOutput with strategy, confidence, predictions, and explanation.
    """
    # --- Step 1: Rule Engine ---
    valid_candidates, exclusion_reasons = get_valid_candidates(
        growth_stage=engine_input.growth_stage,
        soil_type=engine_input.soil_type,
        water_balance_index=engine_input.water_balance_index,
        weather_risk_index=engine_input.weather_risk_index,
        irrigation_system_type=engine_input.irrigation_system_type,
    )
    valid_candidate_codes = [c.value for c in valid_candidates]

    # --- Step 2: ML Model (with graceful degradation) ---
    engine_type = "hybrid"
    ml_failed = False
    chosen_strategy: str
    confidence: float
    quantitative: dict

    try:
        from app.ai_engine.ml_model import predict  # noqa: PLC0415

        feature_row = {
            "soil_type": engine_input.soil_type.value,
            "growth_stage": engine_input.growth_stage.value,
            "water_balance_index": engine_input.water_balance_index.value,
            "weather_risk_index": engine_input.weather_risk_index.value,
            "irrigation_system_type": (
                engine_input.irrigation_system_type.value
                if engine_input.irrigation_system_type
                else "NONE"
            ),
            "rice_variety_code": engine_input.rice_variety_code,
            "is_weather_estimated": int(engine_input.is_weather_estimated),
        }

        confidence_penalty = 0.85 if engine_input.is_weather_estimated else 1.0

        chosen_strategy, confidence, quantitative = predict(
            feature_row=feature_row,
            valid_candidates=valid_candidate_codes,
            confidence_penalty_factor=confidence_penalty,
        )

    except Exception as exc:  # noqa: BLE001
        # Graceful degradation to rule_only — logged as WARNING, not ERROR
        logger.warning(
            "ML model unavailable — falling back to rule_only mode",
            extra={"error": str(exc)},
        )
        ml_failed = True
        engine_type = "rule_only"
        chosen_strategy = valid_candidate_codes[0]  # First in priority order
        confidence = 0.5
        quantitative = _rule_only_quantitative(chosen_strategy, engine_input.rice_variety_code)

    # --- Step 3: Explanation ---
    top_features: list[dict] = quantitative.pop("_top_features", []) if not ml_failed else []
    model_version: str = quantitative.pop("_model_version", "rule_only") if not ml_failed else "rule_only"

    if ml_failed:
        exclusion_reasons.append(
            "Nota: model AI sedang tidak tersedia — rekomendasi ini menggunakan mode aturan "
            "ilmiah saja (rule_only) dengan keyakinan yang lebih rendah."
        )

    explanation = build_explanation(
        strategy=chosen_strategy,
        soil_type=engine_input.soil_type,
        growth_stage=engine_input.growth_stage,
        water_balance_index=engine_input.water_balance_index,
        weather_risk_index=engine_input.weather_risk_index,
        irrigation_system_type=engine_input.irrigation_system_type,
        candidates_considered=valid_candidates,
        rule_exclusion_reasons=exclusion_reasons,
        top_features=top_features,
    )

    # --- Assemble output ---
    try:
        mv = model_version if not ml_failed else "rule_only"
    except Exception:  # noqa: BLE001
        mv = "rule_only"

    return AIEngineOutput(
        recommended_strategy=IrrigationStrategyEnum(chosen_strategy),
        confidence_score=confidence,
        engine_type=engine_type,  # type: ignore[arg-type]
        model_version=mv,
        predictions=PredictionResult(
            water_saving_percent=quantitative.get("water_saving_percent", 0.0),
            expected_yield_ton_per_ha=quantitative.get("expected_yield_ton_per_ha", 0.0),
            yield_baseline_ton_per_ha=quantitative.get("yield_baseline_ton_per_ha", 0.0),
            ch4_reduction_percent=quantitative.get("ch4_reduction_percent", 0.0),
            n2o_change_percent=quantitative.get("n2o_change_percent", 0.0),
            net_gwp_reduction_percent=quantitative.get("net_gwp_reduction_percent", 0.0),
        ),
        explanation=explanation,
    )


# ---------------------------------------------------------------------------
# Rule-only quantitative fallback (from doc tables)
# ---------------------------------------------------------------------------

_WATER_SAVING_FALLBACK = {
    "CONTINUOUS_FLOODING":          0.0,
    "CONTINUOUS_FLOODING_MODIFIED": 10.0,
    "AWD_MILD":                     22.0,
    "AWD_STRICT":                   35.0,
    "DELAYED_IRRIGATION":           8.0,
    "PARTIAL_IRRIGATION":           18.0,
}

_YIELD_DELTA_FALLBACK = {
    "CONTINUOUS_FLOODING":          0.0,
    "CONTINUOUS_FLOODING_MODIFIED": 0.0,
    "AWD_MILD":                     1.0,
    "AWD_STRICT":                  -2.0,
    "DELAYED_IRRIGATION":          -1.0,
    "PARTIAL_IRRIGATION":          -4.0,
}

_VARIETY_BASELINE = {
    "CIHERANG": 6.0, "IR64": 5.5, "INPARI_32": 6.5,
    "INPARI_42_AGRITAN_GSR": 6.2, "MEKONGGA": 6.8,
}

_GHG_FALLBACK = {
    "CONTINUOUS_FLOODING":          (0.0,   0.0),
    "CONTINUOUS_FLOODING_MODIFIED": (15.0,  2.0),
    "AWD_MILD":                     (35.0,  8.0),
    "AWD_STRICT":                   (50.0, 14.0),
    "DELAYED_IRRIGATION":           (10.0,  3.0),
    "PARTIAL_IRRIGATION":           (20.0,  5.0),
}

_GWP_CH4 = 27.0
_GWP_N2O = 273.0


def _rule_only_quantitative(strategy: str, rice_variety_code: str) -> dict:
    """Return deterministic quantitative estimates from literature tables."""
    baseline = _VARIETY_BASELINE.get(rice_variety_code, 6.0)
    delta = _YIELD_DELTA_FALLBACK.get(strategy, 0.0)
    expected_yield = round(baseline * (1 + delta / 100), 2)

    ch4_r, n2o_c = _GHG_FALLBACK.get(strategy, (0.0, 0.0))
    ch4_base = 0.90 * _GWP_CH4
    n2o_base = 0.10 * _GWP_N2O
    total_base = ch4_base + n2o_base
    total_strategy = ch4_base * (1 - ch4_r / 100) + n2o_base * (1 + n2o_c / 100)
    net_gwp = round((total_base - total_strategy) / total_base * 100, 2)

    return {
        "water_saving_percent":      _WATER_SAVING_FALLBACK.get(strategy, 0.0),
        "expected_yield_ton_per_ha": expected_yield,
        "yield_baseline_ton_per_ha": baseline,
        "ch4_reduction_percent":     ch4_r,
        "n2o_change_percent":        n2o_c,
        "net_gwp_reduction_percent": net_gwp,
    }
