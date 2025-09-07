# IntelliInspect Training Service

A FastAPI backend for dataset upload, metadata, and model training using scikit-learn, XGBoost, or LightGBM. Compatible with Python 3.13.

## Setup

```bash
cd traning
python -m venv .venv
# On Windows PowerShell
. .venv/Scripts/Activate.ps1
pip install -r requirements.txt
```

## Run

```bash
uvicorn main:app --host 0.0.0.0 --port 7000 --reload
```

## API

- POST `/api/upload/dataset` (multipart/form-data `file`): upload CSV; returns dataset metadata
- GET `/api/upload/metadata`: returns last stored metadata
- POST `/api/train` (JSON): train a model
  - body:
    ```json
    { "model": "sklearn_logreg" | "xgboost" | "lightgbm", "target": "optional_target_col", "test_size": 0.2 }
    ```
  - response: metrics and model id

Models are stored under `traning/models/` and dataset under `traning/data/dataset.csv`.
