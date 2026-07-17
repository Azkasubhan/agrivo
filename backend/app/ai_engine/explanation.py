"""Explanation generator for the AGRIVO AI Engine.

Assembles human-readable, structured explanations from rule engine outputs
and ML model decisions. All text is in English.
"""

from app.ai_engine.schemas import (
    ExplanationResult,
    FeatureInfluence,
    GrowthStage,
    IrrigationStrategyEnum,
    IrrigationSystemTypeEnum,
    MLReasoning,
    SoilTypeEnum,
    WaterBalanceIndex,
    WeatherRiskIndex,
)

# ---------------------------------------------------------------------------
# Human-readable labels
# ---------------------------------------------------------------------------

_STRATEGY_NAMES: dict[str, str] = {
    "CONTINUOUS_FLOODING":          "Continuous Flooding",
    "CONTINUOUS_FLOODING_MODIFIED": "Modified Continuous Flooding",
    "AWD_MILD":                     "Mild AWD",
    "AWD_STRICT":                   "Strict AWD",
    "DELAYED_IRRIGATION":           "Delayed Irrigation",
    "PARTIAL_IRRIGATION":           "Partial Irrigation",
}

_STAGE_LABELS: dict[str, str] = {
    "LAND_PREPARATION": "land preparation",
    "VEGETATIVE":       "vegetative (tillering)",
    "REPRODUCTIVE":     "reproductive (flowering)",
    "RIPENING":         "ripening (pre-harvest)",
}

_SOIL_LABELS: dict[str, str] = {
    "SANDY": "sandy soil (fast drainage)",
    "LOAM":  "loamy soil (balanced drainage)",
    "CLAY":  "clay soil (high water retention)",
    "SILTY": "silty soil (high water retention)",
}

_WB_LABELS: dict[str, str] = {
    "SURPLUS": "surplus soil moisture (wet)",
    "NORMAL":  "normal soil moisture",
    "DEFICIT": "deficit soil moisture (dry)",
}

_RISK_LABELS: dict[str, str] = {
    "DROUGHT_HIGH":     "high drought risk in the next 14 days",
    "DROUGHT_MODERATE": "moderate drought risk in the next 14 days",
    "NORMAL":           "normal weather risk",
    "EXCESS_HIGH":      "high rainfall risk in the next 14 days",
}

_FEATURE_LABELS: dict[str, str] = {
    "soil_type":              "soil type",
    "growth_stage":           "crop growth stage",
    "water_balance_index":    "soil water balance",
    "weather_risk_index":     "14-day weather risk",
    "irrigation_system_type": "irrigation system type",
    "rice_variety_code":      "rice variety",
    "is_weather_estimated":   "weather data availability",
}

# Benefits per strategy
_BENEFITS: dict[str, list[str]] = {
    "CONTINUOUS_FLOODING": [
        "Provides the stable flooding required by rice during critical stages",
        "Easy to monitor and implement without specialized equipment",
    ],
    "CONTINUOUS_FLOODING_MODIFIED": [
        "Saves approximately 10% water compared to full flooding",
        "Reduces methane emissions by ~15% with zero water-stress risk",
        "Easy to adopt with minimal changes to traditional practices",
    ],
    "AWD_MILD": [
        "Saves approximately 22% water compared to Continuous Flooding",
        "Reduces methane emissions by ~35% with positive net GWP impact",
        "Enhances root aeration, often improving crop yield quality",
    ],
    "AWD_STRICT": [
        "Maximizes water savings by ~35% compared to Continuous Flooding",
        "Reduces methane emissions by ~50% — highest environmental benefit",
        "Highly effective in soils and systems supporting precise water control",
    ],
    "DELAYED_IRRIGATION": [
        "Promotes deeper root development before initial flooding",
        "Saves around 8% water during the early crop establishment stage",
        "Reduces water demand during initial crop stages",
    ],
    "PARTIAL_IRRIGATION": [
        "Saves approximately 18% water via scheduled partial applications",
        "Reduces methane emissions by ~20% without full drying cycles",
        "Enables precise volume control compared to continuous flooding",
    ],
}

# Trade-offs per strategy
_TRADEOFFS: dict[str, list[str]] = {
    "CONTINUOUS_FLOODING": [
        "Highest water footprint among all strategies",
        "Highest methane footprint due to prolonged anaerobic conditions",
    ],
    "CONTINUOUS_FLOODING_MODIFIED": [
        "Limited water savings compared to AWD strategies",
        "Slightly increases N2O emissions (~2%), though net GWP remains positive",
    ],
    "AWD_MILD": [
        "N2O emissions rise by ~8% — net GWP remains positive due to dominant CH4 reduction",
        "Requires monitoring to ensure timely re-irrigation",
    ],
    "AWD_STRICT": [
        "Increases N2O emissions by ~14% — narrowing the net GWP benefit margin",
        "Carries a ~2% yield loss risk if re-irrigation timing is delayed",
        "Requires reliable water infrastructure and close monitoring",
    ],
    "DELAYED_IRRIGATION": [
        "May slightly suppress initial vegetative growth (~-1% yield impact)",
        "Only applicable during crop establishment",
    ],
    "PARTIAL_IRRIGATION": [
        "Slightly lower expected yield (~-4%) due to deficit volume",
        "N2O increases by ~5%, but net GWP is superior to Continuous Flooding",
        "Requires more frequent monitoring of crop health",
    ],
}

# How to implement per strategy
_HOW_TO: dict[str, str] = {
    "CONTINUOUS_FLOODING": (
        "Maintain a consistent water depth of 5–10 cm above the soil surface. "
        "Monitor inflow/outflow daily and prevent bund leaks."
    ),
    "CONTINUOUS_FLOODING_MODIFIED": (
        "Maintain a shallow water depth of 2–5 cm. Allow the field to dry briefly (1–2 days) "
        "under clear weather, then re-irrigate. Do not allow soil to crack."
    ),
    "AWD_MILD": (
        "Allow the water level to drop to 15 cm below the soil surface (using a simple "
        "perforated field pipe), then re-irrigate to 5 cm. Suspend AWD during flowering stage."
    ),
    "AWD_STRICT": (
        "Allow the water level to drop to 30 cm below the soil surface before re-irrigating. "
        "Stop drying immediately if crops show temporary wilting signs. Ensure supply is available for rapid re-irrigation."
    ),
    "DELAYED_IRRIGATION": (
        "Delay the first flush of irrigation for 7–14 days after transplanting or direct seeding "
        "to encourage deep root establishment. Begin regular schedule if severe wilting occurs."
    ),
    "PARTIAL_IRRIGATION": (
        "Apply water in limited volumes on a set schedule instead of complete flooding. "
        "Increase supply if crops show moisture stress."
    ),
}


# ---------------------------------------------------------------------------
# Governance note generator
# ---------------------------------------------------------------------------

def _build_governance_note(
    strategy: str,
    irrigation_system_type: IrrigationSystemTypeEnum | None,
) -> str | None:
    """Return a governance note for communal/semi-technical systems, or None."""
    if irrigation_system_type not in (
        IrrigationSystemTypeEnum.COMMUNAL_GRAVITY,
        IrrigationSystemTypeEnum.SEMI_TECHNICAL,
    ):
        return None

    system_label = (
        "communal gravity irrigation system"
        if irrigation_system_type == IrrigationSystemTypeEnum.COMMUNAL_GRAVITY
        else "semi-technical irrigation system"
    )

    if strategy in ("AWD_MILD", "AWD_STRICT"):
        return (
            f"Your field uses a {system_label}. This strategy requires coordinating drying schedules "
            "with neighboring farmers to avoid disrupting communal flows. "
            "Discuss your plan with the water users association (P3A) first."
        )
    elif strategy == "PARTIAL_IRRIGATION":
        return (
            f"Your field uses a {system_label}. Please ensure your scheduled partial water "
            "applications do not reduce water availability for other farmers in the same block."
        )
    elif strategy == "DELAYED_IRRIGATION":
        return (
            f"Your field uses a {system_label}. Coordinate the irrigation delay period "
            "with canal managers to ensure supply is available when you resume."
        )
    # CFM and CF in communal/semi-technical
    return (
        f"Your field uses a {system_label}. Ensure your irrigation timing aligns "
        "with the rotation schedule set by your local water users association."
    )


# ---------------------------------------------------------------------------
# Summary sentence generator
# ---------------------------------------------------------------------------

def _build_why(
    strategy: str,
    soil_type: SoilTypeEnum,
    growth_stage: GrowthStage,
    water_balance_index: WaterBalanceIndex,
    weather_risk_index: WeatherRiskIndex,
    candidates_considered: list[str],
) -> str:
    """Build a 1–2 sentence summary of why this strategy was chosen."""
    soil = _SOIL_LABELS.get(soil_type.value, soil_type.value)
    stage = _STAGE_LABELS.get(growth_stage.value, growth_stage.value)
    wb = _WB_LABELS.get(water_balance_index.value, water_balance_index.value)
    risk = _RISK_LABELS.get(weather_risk_index.value, weather_risk_index.value)
    name = _STRATEGY_NAMES.get(strategy, strategy)

    n_candidates = len(candidates_considered)
    candidates_str = (
        f"Out of {n_candidates} scientifically matching strategies for this state, "
        if n_candidates > 1
        else "Only one strategy scientifically matches this state — "
    )

    return (
        f"{candidates_str}{name} is chosen as the optimal recommendation. "
        f"Field conditions: {soil}, {stage} stage, {wb}, with {risk}."
    )


# ---------------------------------------------------------------------------
# Public interface
# ---------------------------------------------------------------------------

def build_explanation(
    strategy: str,
    soil_type: SoilTypeEnum,
    growth_stage: GrowthStage,
    water_balance_index: WaterBalanceIndex,
    weather_risk_index: WeatherRiskIndex,
    irrigation_system_type: IrrigationSystemTypeEnum | None,
    candidates_considered: list[IrrigationStrategyEnum],
    rule_exclusion_reasons: list[str],
    top_features: list[dict],
) -> ExplanationResult:
    """Assemble the full structured explanation for a recommendation."""
    candidate_codes = [c.value for c in candidates_considered]

    return ExplanationResult(
        why=_build_why(
            strategy, soil_type, growth_stage,
            water_balance_index, weather_risk_index, candidate_codes,
        ),
        benefits=_BENEFITS.get(strategy, []),
        tradeoffs=_TRADEOFFS.get(strategy, []),
        how_to_implement=_HOW_TO.get(strategy, ""),
        governance_note=_build_governance_note(strategy, irrigation_system_type),
        rule_constraints_applied=rule_exclusion_reasons,
        ml_reasoning=MLReasoning(
            chosen_candidate=IrrigationStrategyEnum(strategy),
            candidates_considered=candidates_considered,
            top_features=[
                FeatureInfluence(
                    feature=_FEATURE_LABELS.get(f["feature"], f["feature"]),
                    influence=f["influence"],
                )
                for f in top_features
            ],
        ),
    )
