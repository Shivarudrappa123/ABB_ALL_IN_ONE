from __future__ import annotations

from typing import Dict, Tuple, List, Optional
import joblib
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score

try:
    from xgboost import XGBClassifier  # type: ignore
except Exception:  # pragma: no cover
    XGBClassifier = None  # type: ignore

try:
    from lightgbm import LGBMClassifier  # type: ignore
except Exception:  # pragma: no cover
    LGBMClassifier = None  # type: ignore


class TrainingError(Exception):
    pass


def split_features_target(df: pd.DataFrame, target: str | None) -> Tuple[pd.DataFrame, pd.Series, str]:
    target_col = target or _infer_target(df)
    if target_col not in df.columns:
        raise TrainingError(f"Target column '{target_col}' not found in dataset")

    # Use only numeric features for initial baseline model
    numeric_df = df.select_dtypes(include=["number"])
    if target_col in numeric_df.columns:
        X = numeric_df.drop(columns=[target_col])
    else:
        X = numeric_df

    if X.shape[1] == 0:
        raise TrainingError("No numeric feature columns found for training")

    y = df[target_col]
    # Encode non-numeric targets to integer codes
    if not pd.api.types.is_numeric_dtype(y):
        y = y.astype("category").cat.codes

    # Drop rows with NA in features or target
    valid_mask = X.notna().all(axis=1) & y.notna()
    X = X.loc[valid_mask]
    y = y.loc[valid_mask]

    # If target has a single class, try to synthesize a binary target from a numeric feature
    if y.nunique() < 2:
        for candidate in X.columns:
            col = X[candidate]
            if col.nunique() > 1:
                median_val = float(col.median())
                y_synth = (col > median_val).astype(int)
                if y_synth.nunique() == 2:
                    y = y_synth
                    target_col = f"{candidate}_gt_{median_val:.3g}"
                    break
        if y.nunique() < 2:
            raise TrainingError("Target must have at least two classes for classification")

    return X, y, target_col


def _infer_target(df: pd.DataFrame) -> str:
    candidates = [
        "target",
        "label",
        "y",
        "class",
        "passed",
        "pass",
        "is_pass",
    ]
    for c in candidates:
        if c in df.columns:
            return c
    return df.columns[-1]


def train_model(
    df: pd.DataFrame,
    algorithm: str,
    target: str | None,
    test_size: float,
    random_state: int,
) -> Tuple[object, Dict[str, float], List[str], str, List[int], List[int], Optional[List[float]]]:
    X, y, target_col = split_features_target(df, target)

    if algorithm == "sklearn_logreg":
        model = Pipeline(
            steps=[
                ("scaler", StandardScaler()),
                ("clf", LogisticRegression(max_iter=1000, n_jobs=None)),
            ]
        )
    elif algorithm == "xgboost":
        if XGBClassifier is None:
            raise TrainingError("xgboost is not installed")
        model = XGBClassifier(
            n_estimators=300,
            max_depth=6,
            learning_rate=0.1,
            subsample=0.9,
            colsample_bytree=0.9,
            random_state=random_state,
            n_jobs=0,
            tree_method="hist",
        )
    elif algorithm == "lightgbm":
        if LGBMClassifier is None:
            raise TrainingError("lightgbm is not installed")
        model = LGBMClassifier(
            n_estimators=400,
            max_depth=-1,
            num_leaves=31,
            learning_rate=0.05,
            subsample=0.9,
            colsample_bytree=0.9,
            random_state=random_state,
            n_jobs=0,
        )
    else:
        raise TrainingError(f"Unknown algorithm: {algorithm}")

    stratify = y if y.nunique() < 50 else None
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=random_state, stratify=stratify
    )

    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    average = "binary" if y.nunique() == 2 else "macro"
    metrics = {
        "accuracy": float(accuracy_score(y_test, y_pred)),
        "precision": float(precision_score(y_test, y_pred, zero_division=0, average=average)),
        "recall": float(recall_score(y_test, y_pred, zero_division=0, average=average)),
        "f1Score": float(f1_score(y_test, y_pred, zero_division=0, average=average)),
    }

    y_score: Optional[List[float]] = None
    try:
        # Prefer predict_proba for binary
        if hasattr(model, "predict_proba"):
            proba = model.predict_proba(X_test)
            if proba.shape[1] >= 2:
                y_score = proba[:, 1].tolist()
        elif hasattr(model, "decision_function"):
            scores = model.decision_function(X_test)
            # Normalize to 0-1 range roughly
            import numpy as np  # type: ignore
            scores = (scores - scores.min()) / (scores.max() - scores.min() + 1e-9)
            y_score = scores.tolist()
    except Exception:
        y_score = None

    return model, metrics, list(X.columns), target_col, y_test.tolist(), y_pred.tolist(), y_score


def save_model(model: object, path: str) -> None:
    joblib.dump(model, path)


def load_model(path: str) -> object:
    return joblib.load(path)
