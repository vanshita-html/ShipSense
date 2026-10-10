import json
import os
from pathlib import Path
import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    mean_absolute_error,
    mean_squared_error,
)
import xgboost as xgb

try:
    from ml.generate_data import generate_synthetic_dataset
except ImportError:
    from generate_data import generate_synthetic_dataset

FEATURE_NUMERIC = [
    "distance_km",
    "lead_time_days",
    "weather_severity",
    "supplier_reliability",
    "hub_congestion",
    "inventory_level",
]

FEATURE_CATEGORICAL = [
    "origin",
    "destination",
    "transport_mode",
    "order_priority",
    "supplier_id",
]

ALL_FEATURES = FEATURE_NUMERIC + FEATURE_CATEGORICAL

def train_models(data_path: Path = None, models_dir: Path = None):
    """
    Trains XGBoost Classifier & XGBoost Regressor with 70/15/15 Stratified Split.
    Evaluates metrics strictly on the held-out Test Set.
    Saves models, preprocessor, and baseline statistics.
    """
    if models_dir is None:
        models_dir = Path(__file__).resolve().parent / "models"
    models_dir.mkdir(parents=True, exist_ok=True)

    if data_path is None or not data_path.exists():
        data_dir = Path(__file__).resolve().parent / "data"
        data_dir.mkdir(parents=True, exist_ok=True)
        data_path = data_dir / "shipments_seed.csv"
        print("Seed dataset not found. Generating fresh 5,000 synthetic records...")
        df = generate_synthetic_dataset(num_samples=5000, seed=42)
        df.to_csv(data_path, index=False)
    else:
        df = pd.read_csv(data_path)

    print(f"Loaded dataset with {len(df)} samples.")
    
    X = df[ALL_FEATURES]
    y_class = df["delayed"]
    y_reg = df["actual_delay_days"]

    # 1. Stratified 70/15/15 split
    # First split 70% train, 30% temp
    X_train, X_temp, y_cls_train, y_cls_temp, y_reg_train, y_reg_temp = train_test_split(
        X, y_class, y_reg, test_size=0.30, random_state=42, stratify=y_class
    )
    # Split temp into 50% val and 50% test (15% and 15% of total)
    X_val, X_test, y_cls_val, y_cls_test, y_reg_val, y_reg_test = train_test_split(
        X_temp, y_cls_temp, y_reg_temp, test_size=0.50, random_state=42, stratify=y_cls_temp
    )

    print(f"Dataset Split Sizes -> Train: {len(X_train)} (70%), Val: {len(X_val)} (15%), Test: {len(X_test)} (15%)")

    # 2. Preprocessor Pipeline
    preprocessor = ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), FEATURE_NUMERIC),
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), FEATURE_CATEGORICAL),
        ]
    )

    X_train_trans = preprocessor.fit_transform(X_train)
    X_val_trans = preprocessor.transform(X_val)
    X_test_trans = preprocessor.transform(X_test)

    # Feature names after transformation
    cat_encoder = preprocessor.named_transformers_["cat"]
    cat_feature_names = cat_encoder.get_feature_names_out(FEATURE_CATEGORICAL)
    transformed_feature_names = FEATURE_NUMERIC + list(cat_feature_names)

    # 3. Train XGBoost Classifier for Delay Probability
    print("\nTraining XGBoost Classifier...")
    clf = xgb.XGBClassifier(
        n_estimators=160,
        max_depth=5,
        learning_rate=0.06,
        subsample=0.85,
        colsample_bytree=0.85,
        random_state=42,
        eval_metric="logloss"
    )
    clf.fit(
        X_train_trans,
        y_cls_train,
        eval_set=[(X_val_trans, y_cls_val)],
        verbose=False
    )

    # 4. Train XGBoost Regressor for Expected Delay Days (on delayed records or full distribution)
    print("Training XGBoost Regressor...")
    reg = xgb.XGBRegressor(
        n_estimators=150,
        max_depth=5,
        learning_rate=0.05,
        subsample=0.85,
        colsample_bytree=0.85,
        random_state=42,
        eval_metric="mae"
    )
    reg.fit(
        X_train_trans,
        y_reg_train,
        eval_set=[(X_val_trans, y_reg_val)],
        verbose=False
    )

    # 5. Evaluate strictly on Test Set
    y_cls_pred = clf.predict(X_test_trans)
    y_cls_prob = clf.predict_proba(X_test_trans)[:, 1]
    y_reg_pred = reg.predict(X_test_trans)

    # Classification Metrics
    accuracy = float(accuracy_score(y_cls_test, y_cls_pred))
    precision = float(precision_score(y_cls_test, y_cls_pred, zero_division=0))
    recall = float(recall_score(y_cls_test, y_cls_pred, zero_division=0))
    f1 = float(f1_score(y_cls_test, y_cls_pred, zero_division=0))
    roc_auc = float(roc_auc_score(y_cls_test, y_cls_prob))

    # Regression Metrics
    mae = float(mean_absolute_error(y_reg_test, y_reg_pred))
    rmse = float(np.sqrt(mean_squared_error(y_reg_test, y_reg_pred)))

    test_metrics = {
        "sample_size_test": len(X_test),
        "classification": {
            "accuracy": round(accuracy, 4),
            "precision": round(precision, 4),
            "recall": round(recall, 4),
            "f1": round(f1, 4),
            "roc_auc": round(roc_auc, 4),
        },
        "regression": {
            "mae_days": round(mae, 4),
            "rmse_days": round(rmse, 4),
        },
        "model_architecture": {
            "classifier": "XGBoost Classifier (n_estimators=160, max_depth=5)",
            "regressor": "XGBoost Regressor (n_estimators=150, max_depth=5)",
            "features_count": len(transformed_feature_names)
        }
    }

    print("\n================ TEST SET METRICS ================")
    print(f"Accuracy:  {accuracy * 100:.2f}%")
    print(f"Precision: {precision * 100:.2f}%")
    print(f"Recall:    {recall * 100:.2f}%")
    print(f"F1-Score:  {f1 * 100:.2f}%")
    print(f"ROC-AUC:   {roc_auc:.4f}")
    print(f"MAE:       {mae:.2f} days")
    print(f"RMSE:      {rmse:.2f} days")
    print("===================================================\n")

    # 6. Save Baseline Feature Statistics for PSI / Drift Tracking
    baseline_stats = {
        "train_samples_count": len(X_train),
        "features": {},
        "metrics": test_metrics,
        "feature_names_raw": ALL_FEATURES,
        "feature_names_transformed": transformed_feature_names,
    }

    for col in FEATURE_NUMERIC:
        baseline_stats["features"][col] = {
            "type": "numeric",
            "mean": float(X_train[col].mean()),
            "std": float(X_train[col].std()),
            "min": float(X_train[col].min()),
            "max": float(X_train[col].max()),
            "quantiles": [float(q) for q in np.quantile(X_train[col], [0.1, 0.25, 0.5, 0.75, 0.9])],
        }

    for col in FEATURE_CATEGORICAL:
        val_counts = X_train[col].value_counts(normalize=True).to_dict()
        baseline_stats["features"][col] = {
            "type": "categorical",
            "distribution": {str(k): float(v) for k, v in val_counts.items()},
        }

    # 7. Persist Artifacts
    joblib.dump(clf, models_dir / "delay_classifier.joblib")
    joblib.dump(reg, models_dir / "delay_regressor.joblib")
    joblib.dump(preprocessor, models_dir / "preprocessor.joblib")
    
    with open(models_dir / "baseline_stats.json", "w") as f:
        json.dump(baseline_stats, f, indent=2)

    print(f"Successfully serialized models and baseline metrics to {models_dir}")
    return test_metrics

if __name__ == "__main__":
    train_models()
