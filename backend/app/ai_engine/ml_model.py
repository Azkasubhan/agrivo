"""ML Model loader and inference for the AGRIVO AI Engine.

Loads pre-trained XGBoost artifacts and exposes a predict() function
that returns the best strategy among valid rule-engine candidates plus
all quantitative predictions.
"""

import logging
from pathlib import Path

import joblib
import numpy as np

logger = logging.getLogger(__name__)

_ARTIFACTS_DIR = Path(__file__).parent / "artifacts"
_MODEL_VERSION = "xgb-v1.0.0"
_ARTIFACT_PATH = _ARTIFACTS_DIR / f"model_{_MODEL_VERSION}.joblib"

_CAT_FEATURES = [
    "soil_type",
    "growth_stage",
    "water_balance_index",
    "weather_risk_index",
    "irrigation_system_type",
    "rice_variety_code",
]
_NUM_FEATURES = ["is_weather_estimated"]

# Module-level cache — loaded once on first call
_artifacts: dict | None = None


def _load_artifacts() -> dict:
    """Load and cache model artifacts from disk."""
    global _artifacts
    if _artifacts is None:
        if not _ARTIFACT_PATH.exists():
            raise FileNotFoundError(
                f"Model artifact not found at {_ARTIFACT_PATH}. "
                "Run `python -m app.ai_engine.training.train` first."
            )
        _artifacts = joblib.load(_ARTIFACT_PATH)
        logger.info("AI Engine artifacts loaded", extra={"model_version": _MODEL_VERSION})
    return _artifacts


def _encode_row(row: dict, encoders: dict) -> np.ndarray:
    """Encode a feature dict to a numpy array using the stored label encoders."""
    encoded = []
    for col in _CAT_FEATURES:
        val = str(row[col])
        le = encoders[col]
        encoded.append(le.transform([val])[0] if val in le.classes_ else 0)
    encoded.append(int(row["is_weather_estimated"]))
    return np.array(encoded, dtype=float).reshape(1, -1)


def predict(
    feature_row: dict,
    valid_candidates: list[str],
    confidence_penalty_factor: float = 1.0,
) -> tuple[str, float, dict[str, float]]:
    """Run ML inference and return (strategy, confidence_score, quantitative_targets).

    Args:
        feature_row: flat dict with keys matching ALL_FEATURES.
        valid_candidates: list of strategy codes allowed by the rule engine.
        confidence_penalty_factor: multiplier applied to confidence score
            (0.85 when weather data is estimated, 1.0 otherwise).

    Returns:
        (chosen_strategy, confidence_score, {target: predicted_value, ...})
    """
    arts = _load_artifacts()
    clf = arts["classifier"]
    regressors: dict = arts["regressors"]
    encoders: dict = arts["feature_encoders"]
    strategy_encoder = arts["strategy_encoder"]

    X = _encode_row(feature_row, encoders)

    # Get raw probabilities
    proba = clf.predict_proba(X)[0]
    all_classes: list[str] = list(strategy_encoder.classes_)

    # Mask out invalid candidates (rule engine constraint enforcement)
    masked = proba.copy()
    for i, cls in enumerate(all_classes):
        if cls not in valid_candidates:
            masked[i] = 0.0

    if masked.sum() == 0:
        # Extreme edge case — fall back to first valid candidate
        chosen = valid_candidates[0]
        confidence = 0.5
    else:
        # Softmax normalise over valid candidates only
        masked_sum = masked.sum()
        normalised = masked / masked_sum
        best_idx = int(normalised.argmax())
        chosen = all_classes[best_idx]
        confidence = float(normalised[best_idx]) * confidence_penalty_factor
        confidence = round(min(confidence, 1.0), 3)

    # Run regressors for the chosen strategy's quantitative predictions
    quantitative: dict[str, float] = {}
    for target, reg in regressors.items():
        val = float(reg.predict(X)[0])
        quantitative[target] = round(val, 2)

    # Feature importances (global, top-3) for explanation
    importances = clf.feature_importances_
    feature_names = _CAT_FEATURES + _NUM_FEATURES
    top_features = sorted(
        zip(feature_names, importances), key=lambda t: t[1], reverse=True
    )[:3]

    quantitative["_top_features"] = [
        {"feature": name, "influence": round(float(imp), 4)}
        for name, imp in top_features
    ]
    quantitative["_model_version"] = _MODEL_VERSION

    return chosen, confidence, quantitative


def get_model_version() -> str:
    """Return the version string of the currently loaded model."""
    return _MODEL_VERSION
