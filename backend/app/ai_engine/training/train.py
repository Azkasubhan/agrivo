"""Training script for the AGRIVO AI Engine ML models.

Trains:
  1. XGBoost Classifier — picks best strategy from valid rule-engine candidates.
  2. XGBoost Regressors — one per quantitative target (water saving, yield, GHG).

Saves model artifacts to app/ai_engine/artifacts/.

Usage:
    python -m app.ai_engine.training.train
"""

import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import accuracy_score, mean_absolute_error
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from xgboost import XGBClassifier, XGBRegressor

# Ensure project root is on sys.path when run as a script
_PROJECT_ROOT = Path(__file__).parents[4]
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))

from app.ai_engine.training.generate_synthetic_dataset import generate  # noqa: E402

MODEL_VERSION = "xgb-v1.0.0"
ARTIFACTS_DIR = Path(__file__).parent.parent / "artifacts"

# Categorical features that need label encoding
CAT_FEATURES = [
    "soil_type",
    "growth_stage",
    "water_balance_index",
    "weather_risk_index",
    "irrigation_system_type",
    "rice_variety_code",
]
NUM_FEATURES = ["is_weather_estimated"]
ALL_FEATURES = CAT_FEATURES + NUM_FEATURES

QUANTITATIVE_TARGETS = [
    "water_saving_percent",
    "expected_yield_ton_per_ha",
    "ch4_reduction_percent",
    "n2o_change_percent",
    "net_gwp_reduction_percent",
]


def _encode_features(df: pd.DataFrame) -> tuple[np.ndarray, dict[str, LabelEncoder]]:
    """Label-encode categorical features and return encoded array + encoders."""
    encoders: dict[str, LabelEncoder] = {}
    encoded_parts: list[np.ndarray] = []

    for col in CAT_FEATURES:
        le = LabelEncoder()
        encoded_parts.append(le.fit_transform(df[col].astype(str)).reshape(-1, 1))
        encoders[col] = le

    encoded_parts.append(df[NUM_FEATURES].values)
    X = np.hstack(encoded_parts)
    return X, encoders


def train() -> None:
    """Generate dataset, train all models, and persist artifacts."""
    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)

    print("=" * 60)
    print(f"AGRIVO AI Engine — Training ({MODEL_VERSION})")
    print("=" * 60)

    # --- Generate dataset ---
    print("\n[1/4] Generating synthetic dataset…")
    df = generate()
    print(f"      {len(df)} rows generated.")

    # --- Encode features ---
    print("\n[2/4] Encoding features…")
    X, encoders = _encode_features(df)

    # Encode strategy labels
    strategy_encoder = LabelEncoder()
    y_strategy = strategy_encoder.fit_transform(df["strategy"])

    # Train/test split (80/20, stratified)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y_strategy, test_size=0.2, random_state=42, stratify=y_strategy
    )
    df_train = df.iloc[: len(X_train)].reset_index(drop=True)
    df_test = df.iloc[len(X_train) :].reset_index(drop=True)

    # --- Train classifier ---
    print("\n[3/4] Training XGBoost Classifier (strategy selection)…")
    clf = XGBClassifier(
        n_estimators=300,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        use_label_encoder=False,
        eval_metric="mlogloss",
        random_state=42,
        n_jobs=-1,
    )
    clf.fit(X_train, y_train, eval_set=[(X_test, y_test)], verbose=False)
    y_pred = clf.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"      Classifier accuracy (test set): {acc:.4f}")

    # --- Train regressors ---
    print("\n[4/4] Training XGBoost Regressors (quantitative predictions)…")
    regressors: dict[str, XGBRegressor] = {}
    for target in QUANTITATIVE_TARGETS:
        y_reg_train = df.iloc[:len(X_train)][target].values
        y_reg_test = df.iloc[len(X_train):][target].values

        reg = XGBRegressor(
            n_estimators=200,
            max_depth=5,
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42,
            n_jobs=-1,
        )
        reg.fit(X_train, y_reg_train, eval_set=[(X_test, y_reg_test)], verbose=False)
        mae = mean_absolute_error(y_reg_test, reg.predict(X_test))
        print(f"      {target}: MAE = {mae:.4f}")
        regressors[target] = reg

    # --- Persist artifacts ---
    print("\n--- Saving artifacts ---")
    artifacts = {
        "classifier": clf,
        "regressors": regressors,
        "feature_encoders": encoders,
        "strategy_encoder": strategy_encoder,
        "all_features": ALL_FEATURES,
        "cat_features": CAT_FEATURES,
        "num_features": NUM_FEATURES,
        "model_version": MODEL_VERSION,
    }
    artifact_path = ARTIFACTS_DIR / f"model_{MODEL_VERSION}.joblib"
    joblib.dump(artifacts, artifact_path)
    print(f"      ✅  Artifacts saved → {artifact_path}")

    # Save dataset for reference
    dataset_path = ARTIFACTS_DIR / "synthetic_dataset.csv"
    df.to_csv(dataset_path, index=False)
    print(f"      ✅  Dataset saved    → {dataset_path}")

    # --- Decision matrix regression test ---
    print("\n--- Decision Matrix Regression Test (07-ai-engine.md §8) ---")
    _run_decision_matrix_test(artifacts)

    print("\n✅  Training complete.")


def _run_decision_matrix_test(artifacts: dict) -> None:
    """Verify all 22 scenarios from the decision matrix produce the expected strategy."""
    from app.ai_engine.training.generate_synthetic_dataset import (  # noqa: E402
        DECISION_MATRIX,
        VARIETIES,
    )

    clf: XGBClassifier = artifacts["classifier"]
    encoders: dict = artifacts["feature_encoders"]
    strategy_encoder: LabelEncoder = artifacts["strategy_encoder"]

    passed = 0
    failed = 0

    for num, soil, stage, wb, risk, system, expected in DECISION_MATRIX:
        row = {
            "soil_type": soil,
            "growth_stage": stage,
            "water_balance_index": wb,
            "weather_risk_index": risk,
            "irrigation_system_type": system if system else "NONE",
            "rice_variety_code": VARIETIES[0],
            "is_weather_estimated": 0,
        }
        X_row = _encode_single_row(row, encoders)
        # Get probabilities for all classes
        proba = clf.predict_proba(X_row)[0]

        # Mask to only valid candidates (rule engine)
        from app.ai_engine.rule_engine import get_valid_candidates  # noqa: E402
        from app.ai_engine.schemas import (  # noqa: E402
            GrowthStage,
            IrrigationSystemTypeEnum,
            SoilTypeEnum,
            WaterBalanceIndex,
            WeatherRiskIndex,
        )

        valid_candidates, _ = get_valid_candidates(
            growth_stage=GrowthStage(stage),
            soil_type=SoilTypeEnum(soil),
            water_balance_index=WaterBalanceIndex(wb),
            weather_risk_index=WeatherRiskIndex(risk),
            irrigation_system_type=IrrigationSystemTypeEnum(system) if system else None,
        )
        valid_labels = [s.value for s in valid_candidates]
        all_classes = list(strategy_encoder.classes_)

        # Zero out invalid candidates before argmax
        masked_proba = proba.copy()
        for i, cls in enumerate(all_classes):
            if cls not in valid_labels:
                masked_proba[i] = 0.0

        predicted_idx = int(masked_proba.argmax())
        predicted = all_classes[predicted_idx]

        status = "✅" if predicted == expected else "❌"
        if predicted == expected:
            passed += 1
        else:
            failed += 1
            print(f"  {status} Skenario #{num:02d}: expected={expected}, got={predicted} "
                  f"[{soil}, {stage}, {wb}, {risk}, {system}]")

    print(f"\n  Passed: {passed}/22   Failed: {failed}/22")
    if failed > 0:
        print("  ⚠️  Some scenarios failed — consider increasing anchor_repeat or retuning hyperparameters.")


def _encode_single_row(row: dict, encoders: dict[str, LabelEncoder]) -> np.ndarray:
    """Encode a single feature dict into the model's input format."""
    encoded = []
    for col in CAT_FEATURES:
        val = str(row[col])
        le = encoders[col]
        # Handle unseen labels gracefully
        if val in le.classes_:
            encoded.append(le.transform([val])[0])
        else:
            encoded.append(0)
    encoded.append(row["is_weather_estimated"])
    return np.array(encoded).reshape(1, -1)


if __name__ == "__main__":
    train()
