"""Synthetic dataset generator for the AGRIVO AI Engine.

Generates a balanced, bias-checked training dataset from structured combinations
of input features and expected strategy labels derived from the decision matrix
in 07-ai-engine.md §8 and scientific constraints in §4.

Usage:
    python -m app.ai_engine.training.generate_synthetic_dataset

Output:
    app/ai_engine/artifacts/synthetic_dataset.csv
"""

import random
import sys
from pathlib import Path

import pandas as pd

# Ensure project root is on sys.path when run as a script
_PROJECT_ROOT = Path(__file__).parents[4]
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))

from app.ai_engine.rule_engine import get_valid_candidates  # noqa: E402
from app.ai_engine.schemas import (  # noqa: E402
    GrowthStage,
    IrrigationStrategyEnum,
    IrrigationSystemTypeEnum,
    SoilTypeEnum,
    WaterBalanceIndex,
    WeatherRiskIndex,
)

# ---------------------------------------------------------------------------
# Feature value pools
# ---------------------------------------------------------------------------

SOIL_TYPES = list(SoilTypeEnum)
GROWTH_STAGES = list(GrowthStage)
WATER_BALANCES = list(WaterBalanceIndex)
WEATHER_RISKS = list(WeatherRiskIndex)
IRRIGATION_SYSTEMS = list(IrrigationSystemTypeEnum) + [None]

# ---------------------------------------------------------------------------
# Decision matrix from 07-ai-engine.md §8
# These are the "ground truth" anchors — ML must reproduce them.
# ---------------------------------------------------------------------------

DECISION_MATRIX = [
    # (#, soil, stage, wb, risk, system, expected_strategy)
    (1,  "SANDY", "LAND_PREPARATION", "DEFICIT",  "NORMAL",          "TECHNICAL",        "DELAYED_IRRIGATION"),
    (2,  "SANDY", "VEGETATIVE",       "DEFICIT",  "DROUGHT_HIGH",    "RAINFED",           "PARTIAL_IRRIGATION"),
    (3,  "LOAM",  "VEGETATIVE",       "NORMAL",   "NORMAL",          "TECHNICAL",        "AWD_MILD"),
    (4,  "CLAY",  "VEGETATIVE",       "SURPLUS",  "NORMAL",          "COMMUNAL_GRAVITY", "CONTINUOUS_FLOODING_MODIFIED"),
    (5,  "CLAY",  "REPRODUCTIVE",     "SURPLUS",  "NORMAL",          "COMMUNAL_GRAVITY", "CONTINUOUS_FLOODING_MODIFIED"),
    (6,  "SILTY", "REPRODUCTIVE",     "NORMAL",   "EXCESS_HIGH",     "SEMI_TECHNICAL",   "CONTINUOUS_FLOODING_MODIFIED"),
    (7,  "SANDY", "REPRODUCTIVE",     "DEFICIT",  "DROUGHT_MODERATE","TECHNICAL",        "CONTINUOUS_FLOODING"),
    (8,  "LOAM",  "RIPENING",         "DEFICIT",  "NORMAL",          "TECHNICAL",        "AWD_STRICT"),
    (9,  "CLAY",  "RIPENING",         "SURPLUS",  "NORMAL",          "TECHNICAL",        "PARTIAL_IRRIGATION"),
    (10, "SANDY", "RIPENING",         "DEFICIT",  "DROUGHT_HIGH",    "RAINFED",          "AWD_MILD"),
    (11, "LOAM",  "LAND_PREPARATION", "NORMAL",   "NORMAL",          "TECHNICAL",        "CONTINUOUS_FLOODING"),
    (12, "CLAY",  "LAND_PREPARATION", "SURPLUS",  "EXCESS_HIGH",     "COMMUNAL_GRAVITY", "CONTINUOUS_FLOODING_MODIFIED"),
    (13, "SANDY", "LAND_PREPARATION", "DEFICIT",  "DROUGHT_HIGH",    "RAINFED",          "DELAYED_IRRIGATION"),
    (14, "LOAM",  "VEGETATIVE",       "DEFICIT",  "DROUGHT_MODERATE","SEMI_TECHNICAL",   "AWD_MILD"),
    (15, "CLAY",  "VEGETATIVE",       "DEFICIT",  "DROUGHT_HIGH",    "TECHNICAL",        "AWD_STRICT"),
    (16, "SANDY", "VEGETATIVE",       "SURPLUS",  "EXCESS_HIGH",     "TECHNICAL",        "AWD_MILD"),
    (17, "SILTY", "VEGETATIVE",       "NORMAL",   "NORMAL",          "RAINFED",          "AWD_MILD"),
    (18, "SILTY", "RIPENING",         "SURPLUS",  "NORMAL",          "RAINFED",          "PARTIAL_IRRIGATION"),
    (19, "LOAM",  "REPRODUCTIVE",     "DEFICIT",  "DROUGHT_HIGH",    "TECHNICAL",        "CONTINUOUS_FLOODING"),
    (20, "CLAY",  "LAND_PREPARATION", "DEFICIT",  "NORMAL",          "SEMI_TECHNICAL",   "CONTINUOUS_FLOODING"),
    (21, "SANDY", "RIPENING",         "NORMAL",   "NORMAL",          "TECHNICAL",        "PARTIAL_IRRIGATION"),
    (22, "LOAM",  "VEGETATIVE",       "SURPLUS",  "EXCESS_HIGH",     "COMMUNAL_GRAVITY", "AWD_MILD"),
]


# ---------------------------------------------------------------------------
# Quantitative impact tables (07-ai-engine.md §7, §10)
# ---------------------------------------------------------------------------

# Water saving % relative to Continuous Flooding
WATER_SAVING: dict[str, float] = {
    "CONTINUOUS_FLOODING":          0.0,
    "CONTINUOUS_FLOODING_MODIFIED": 10.0,
    "AWD_MILD":                     22.0,
    "AWD_STRICT":                   35.0,
    "DELAYED_IRRIGATION":           8.0,
    "PARTIAL_IRRIGATION":           18.0,
}

# Yield delta % vs CF baseline (07-ai-engine.md §7.2)
YIELD_DELTA: dict[str, float] = {
    "CONTINUOUS_FLOODING":          0.0,
    "CONTINUOUS_FLOODING_MODIFIED": 0.0,
    "AWD_MILD":                     1.0,
    "AWD_STRICT":                  -2.0,
    "DELAYED_IRRIGATION":          -1.0,
    "PARTIAL_IRRIGATION":          -4.0,
}

# Baseline yield per variety ton/ha under CF (07-ai-engine.md §7.1)
VARIETY_BASELINE_YIELD: dict[str, float] = {
    "CIHERANG":              6.0,
    "IR64":                  5.5,
    "INPARI_32":             6.5,
    "INPARI_42_AGRITAN_GSR": 6.2,
    "MEKONGGA":              6.8,
}

# CH4 reduction %, N2O change % (literature estimates)
GHG_IMPACT: dict[str, tuple[float, float]] = {
    # (ch4_reduction%, n2o_change%)
    "CONTINUOUS_FLOODING":          (0.0,   0.0),
    "CONTINUOUS_FLOODING_MODIFIED": (15.0,  2.0),
    "AWD_MILD":                     (35.0,  8.0),
    "AWD_STRICT":                   (50.0, 14.0),
    "DELAYED_IRRIGATION":           (10.0,  3.0),
    "PARTIAL_IRRIGATION":           (20.0,  5.0),
}

# IPCC AR6 GWP100 — 07-ai-engine.md §10
_GWP_CH4 = 27.0
_GWP_N2O = 273.0
# Baseline split: CH4 ≈ 90% of total GWP, N2O ≈ 10%
_CH4_SHARE = 0.90
_N2O_SHARE = 0.10


def _compute_net_gwp_reduction(ch4_reduction: float, n2o_change: float) -> float:
    """Return net GWP reduction % using IPCC AR6 GWP100 weights."""
    # Normalised baseline contributions (arbitrary unit = 1.0 total GWP)
    ch4_base = _CH4_SHARE * _GWP_CH4
    n2o_base = _N2O_SHARE * _GWP_N2O
    total_base = ch4_base + n2o_base

    ch4_strategy = ch4_base * (1 - ch4_reduction / 100)
    n2o_strategy = n2o_base * (1 + n2o_change / 100)
    total_strategy = ch4_strategy + n2o_strategy

    return round((total_base - total_strategy) / total_base * 100, 2)


def _add_noise(value: float, sigma: float = 0.5) -> float:
    """Add small Gaussian noise to prevent model memorisation of exact values."""
    return round(value + random.gauss(0, sigma), 2)


VARIETIES = list(VARIETY_BASELINE_YIELD.keys())


def _build_row(
    soil: str,
    stage: str,
    wb: str,
    risk: str,
    system: str | None,
    strategy: str,
    variety: str,
    is_anchor: bool = False,
) -> dict:
    """Build one training row with all features and targets."""
    baseline_yield = VARIETY_BASELINE_YIELD[variety]
    expected_yield = round(baseline_yield * (1 + YIELD_DELTA[strategy] / 100), 2)

    ch4_r, n2o_c = GHG_IMPACT[strategy]
    if not is_anchor:
        ch4_r = _add_noise(ch4_r, 1.5)
        n2o_c = _add_noise(n2o_c, 0.8)
        ws = _add_noise(WATER_SAVING[strategy], 2.0)
        expected_yield = round(expected_yield + random.gauss(0, 0.1), 2)
    else:
        ws = WATER_SAVING[strategy]

    net_gwp = _compute_net_gwp_reduction(ch4_r, n2o_c)

    return {
        "soil_type": soil,
        "growth_stage": stage,
        "water_balance_index": wb,
        "weather_risk_index": risk,
        "irrigation_system_type": system if system else "NONE",
        "rice_variety_code": variety,
        "is_weather_estimated": 0,
        # Targets
        "strategy": strategy,
        "water_saving_percent": ws,
        "expected_yield_ton_per_ha": expected_yield,
        "yield_baseline_ton_per_ha": baseline_yield,
        "ch4_reduction_percent": ch4_r,
        "n2o_change_percent": n2o_c,
        "net_gwp_reduction_percent": net_gwp,
    }


def generate(n_random: int = 5000, anchor_repeat: int = 80, seed: int = 42) -> pd.DataFrame:
    """Generate the full training dataset.

    Strategy:
    - Each of the 22 decision-matrix scenarios is repeated `anchor_repeat` times
      (with small noise on quantitative targets) to ensure the model honours them.
    - `n_random` additional rows cover diverse feature combinations using the
      rule engine to determine valid candidates and pick one at random — this
      prevents bias towards any single strategy.
    """
    random.seed(seed)
    rows: list[dict] = []

    # 1. Anchor rows — decision matrix (07-ai-engine.md §8)
    for _, soil, stage, wb, risk, system, strategy in DECISION_MATRIX:
        for _ in range(anchor_repeat):
            variety = random.choice(VARIETIES)
            rows.append(_build_row(soil, stage, wb, risk, system, strategy, variety, is_anchor=True))

    # 2. Random diverse rows — use rule engine, pick random valid candidate
    soil_list = [s.value for s in SoilTypeEnum]
    stage_list = [s.value for s in GrowthStage]
    wb_list = [s.value for s in WaterBalanceIndex]
    risk_list = [s.value for s in WeatherRiskIndex]
    sys_list = [s.value for s in IrrigationSystemTypeEnum] + [None]

    for _ in range(n_random):
        soil = random.choice(soil_list)
        stage = random.choice(stage_list)
        wb = random.choice(wb_list)
        risk = random.choice(risk_list)
        system = random.choice(sys_list)
        variety = random.choice(VARIETIES)

        candidates, _ = get_valid_candidates(
            growth_stage=GrowthStage(stage),
            soil_type=SoilTypeEnum(soil),
            water_balance_index=WaterBalanceIndex(wb),
            weather_risk_index=WeatherRiskIndex(risk),
            irrigation_system_type=IrrigationSystemTypeEnum(system) if system else None,
        )

        # Weighted random: slightly prefer middle candidates to avoid imbalance
        strategy = random.choice(candidates).value
        rows.append(_build_row(soil, stage, wb, risk, system, strategy, variety))

    df = pd.DataFrame(rows)
    _verify_balance(df)
    return df


def _verify_balance(df: pd.DataFrame) -> None:
    """Warn if any strategy is drastically under-represented."""
    counts = df["strategy"].value_counts()
    total = len(df)
    for strategy in IrrigationStrategyEnum:
        n = counts.get(strategy.value, 0)
        pct = n / total * 100
        if pct < 2.0:
            print(f"  ⚠️  Strategy {strategy.value} only {pct:.1f}% of dataset — consider increasing n_random")


if __name__ == "__main__":
    out_dir = Path(__file__).parent.parent / "artifacts"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "synthetic_dataset.csv"

    print("Generating synthetic dataset…")
    df = generate()
    df.to_csv(out_path, index=False)
    print(f"  ✅  {len(df)} rows written to {out_path}")
    print("\nStrategy distribution:")
    print(df["strategy"].value_counts().to_string())
