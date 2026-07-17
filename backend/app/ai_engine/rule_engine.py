"""Rule Engine — scientific constraint-based candidate filter.

Layer 1: validity per growth stage (from 07-ai-engine.md §4.1).
Layer 2: additional constraints from soil type, weather, and irrigation system
         (from 07-ai-engine.md §4.2, rules R5–R9).

This module is purely deterministic Python — no ML, no randomness.
It outputs a set of valid candidate strategies, never a single answer.
"""

from app.ai_engine.schemas import (
    GrowthStage,
    IrrigationStrategyEnum,
    IrrigationSystemTypeEnum,
    SoilTypeEnum,
    WaterBalanceIndex,
    WeatherRiskIndex,
)

# Short aliases for readability
_CF = IrrigationStrategyEnum.CONTINUOUS_FLOODING
_CFM = IrrigationStrategyEnum.CONTINUOUS_FLOODING_MODIFIED
_AWD_MILD = IrrigationStrategyEnum.AWD_MILD
_AWD_STRICT = IrrigationStrategyEnum.AWD_STRICT
_DELAYED = IrrigationStrategyEnum.DELAYED_IRRIGATION
_PARTIAL = IrrigationStrategyEnum.PARTIAL_IRRIGATION

_ALL_STRATEGIES: set[IrrigationStrategyEnum] = {
    _CF, _CFM, _AWD_MILD, _AWD_STRICT, _DELAYED, _PARTIAL
}

# Fallback priority order when rule engine produces empty set
# (should never happen, but safety net — see §4.2 fallback note)
FALLBACK_PRIORITY: list[IrrigationStrategyEnum] = [
    _CFM, _AWD_MILD, _CF, _PARTIAL, _DELAYED, _AWD_STRICT
]

# ---------------------------------------------------------------------------
# Layer 1 — Valid strategies per growth stage (07-ai-engine.md §4.1)
# ---------------------------------------------------------------------------

_LAYER1_VALID: dict[GrowthStage, set[IrrigationStrategyEnum]] = {
    GrowthStage.LAND_PREPARATION: {_CF, _CFM, _DELAYED},
    GrowthStage.VEGETATIVE:       {_CF, _CFM, _AWD_MILD, _AWD_STRICT, _PARTIAL},
    GrowthStage.REPRODUCTIVE:     {_CF, _CFM},
    GrowthStage.RIPENING:         {_CFM, _AWD_MILD, _AWD_STRICT, _PARTIAL},
}


def _apply_layer1(growth_stage: GrowthStage) -> set[IrrigationStrategyEnum]:
    """Return the set of strategies valid for the given growth stage."""
    return set(_LAYER1_VALID[growth_stage])


# ---------------------------------------------------------------------------
# Layer 2 — Additional constraints (R5–R9, 07-ai-engine.md §4.2)
# ---------------------------------------------------------------------------

def _apply_layer2(
    candidates: set[IrrigationStrategyEnum],
    soil_type: SoilTypeEnum,
    water_balance_index: WaterBalanceIndex,
    weather_risk_index: WeatherRiskIndex,
    irrigation_system_type: IrrigationSystemTypeEnum | None,
) -> tuple[set[IrrigationStrategyEnum], list[str]]:
    """Apply scientific constraints R5–R9, return surviving candidates and
    a list of human-readable exclusion reasons for the explanation generator.
    """
    excluded_reasons: list[str] = []

    # R5 — Sandy soil: exclude AWD_STRICT in all phases
    if soil_type == SoilTypeEnum.SANDY and _AWD_STRICT in candidates:
        candidates.discard(_AWD_STRICT)
        excluded_reasons.append(
            "Strict AWD excluded: sandy soils have high percolation rates, making water level drops "
            "difficult to control and risking crop water stress."
        )

    # R6 — Clay + SURPLUS water balance: exclude AWD_STRICT
    if (
        soil_type == SoilTypeEnum.CLAY
        and water_balance_index == WaterBalanceIndex.SURPLUS
        and _AWD_STRICT in candidates
    ):
        candidates.discard(_AWD_STRICT)
        excluded_reasons.append(
            "Strict AWD excluded: clay soils with surplus water have high moisture retention; "
            "aggressive drying risks cracking the soil and damaging root structures."
        )

    # R7 — DROUGHT_HIGH + non-technical water source: exclude CF and AWD_STRICT
    _non_technical = {
        IrrigationSystemTypeEnum.RAINFED,
        IrrigationSystemTypeEnum.SEMI_TECHNICAL,
        IrrigationSystemTypeEnum.COMMUNAL_GRAVITY,
    }
    if (
        weather_risk_index == WeatherRiskIndex.DROUGHT_HIGH
        and irrigation_system_type in _non_technical
    ):
        removed = candidates & {_CF, _AWD_STRICT}
        candidates -= removed
        if removed:
            excluded_reasons.append(
                "Continuous Flooding and Strict AWD excluded: high drought risk without a guaranteed "
                "technical water source makes these strategies unrealistic."
            )

    # R8 — EXCESS_HIGH: exclude DELAYED and PARTIAL
    if weather_risk_index == WeatherRiskIndex.EXCESS_HIGH:
        removed = candidates & {_DELAYED, _PARTIAL}
        candidates -= removed
        if removed:
            excluded_reasons.append(
                "Delayed and Partial Irrigation excluded: under excess rainfall, focus must be on "
                "drainage capacity rather than irrigation reductions."
            )

    # R9 — RAINFED: exclude AWD_STRICT in all conditions
    if (
        irrigation_system_type == IrrigationSystemTypeEnum.RAINFED
        and _AWD_STRICT in candidates
    ):
        candidates.discard(_AWD_STRICT)
        if "Strict AWD excluded: sandy soils" not in "\n".join(excluded_reasons):
            excluded_reasons.append(
                "Strict AWD excluded: without artificial irrigation source, there is no guarantee "
                "of timely re-flooding after aggressive drying cycles."
            )

    return candidates, excluded_reasons


# ---------------------------------------------------------------------------
# Public interface
# ---------------------------------------------------------------------------

def get_valid_candidates(
    growth_stage: GrowthStage,
    soil_type: SoilTypeEnum,
    water_balance_index: WaterBalanceIndex,
    weather_risk_index: WeatherRiskIndex,
    irrigation_system_type: IrrigationSystemTypeEnum | None,
) -> tuple[list[IrrigationStrategyEnum], list[str]]:
    """Return valid candidate strategies after Layer 1 + Layer 2 filtering.

    Returns:
        candidates: ordered list of valid strategies (fallback default if empty).
        exclusion_reasons: human-readable constraint messages for the explanation.

    The returned candidates are ordered by FALLBACK_PRIORITY for consistent
    behaviour when the ML model is unavailable (rule_only mode).
    """
    layer1_candidates = _apply_layer1(growth_stage)

    # Build Layer 1 exclusion reasons
    l1_reasons: list[str] = []
    all_excluded_l1 = _ALL_STRATEGIES - layer1_candidates
    _stage_exclusion_msgs: dict[GrowthStage, str] = {
        GrowthStage.LAND_PREPARATION: (
            "AWD and Partial Irrigation excluded during land preparation: "
            "fields require initial flooding for soil saturation and puddling."
        ),
        GrowthStage.VEGETATIVE: (
            "Delayed Irrigation excluded during vegetative phase: "
            "this strategy is only relevant during land preparation."
        ),
        GrowthStage.REPRODUCTIVE: (
            "AWD (both mild and strict) and Partial Irrigation excluded during reproductive phase: "
            "this stage is highly sensitive to water deficits — stable flooding must be maintained "
            "to prevent sterility."
        ),
        GrowthStage.RIPENING: (
            "Continuous Flooding (CF) and Delayed Irrigation excluded during ripening phase: "
            "fields are highly drought-tolerant, and drying is recommended to facilitate harvesting."
        ),
    }
    if all_excluded_l1 and growth_stage in _stage_exclusion_msgs:
        l1_reasons.append(_stage_exclusion_msgs[growth_stage])

    candidates = set(layer1_candidates)
    candidates, l2_reasons = _apply_layer2(
        candidates, soil_type, water_balance_index, weather_risk_index, irrigation_system_type
    )
    all_reasons = l1_reasons + l2_reasons

    if not candidates:
        # Extreme edge case — fall back to safest strategy
        candidates = {_CFM}
        all_reasons.append(
            "All strategies excluded by constraints — system defaults to "
            "Modified Continuous Flooding as the safest option."
        )

    # Sort by fallback priority for determinism
    ordered = [s for s in FALLBACK_PRIORITY if s in candidates]
    return ordered, all_reasons
