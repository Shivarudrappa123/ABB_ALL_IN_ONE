import io
import os
from pathlib import Path
from typing import Optional

import pandas as pd
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response

from app.schemas import DatasetInfo, TrainRequest, TrainResponse, TrainMetrics, DateRanges
from app.storage import DATA_DIR, MODELS_DIR, META_PATH, save_file, save_json, load_json
from app.modeling import train_model, save_model, TrainingError

app = FastAPI(title="IntelliInspect Training API", version="1.0.0")

TRAINING_METRICS_PATH = DATA_DIR / "training_metrics.json"
TRAINING_RESULTS_PATH = DATA_DIR / "training_results.json"
SIM_STATE_PATH = DATA_DIR / "simulation_state.json"

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {"status": "ok"}

# ---------------- Simulation helpers ----------------

def _load_sim_state():
    st = load_json(SIM_STATE_PATH)
    if not st:
        st = {"running": False, "counter": 0}
    return st


def _save_sim_state(st):
    save_json(SIM_STATE_PATH, st)


def _random_between(a: float, b: float) -> float:
    import random
    return random.random() * (b - a) + a


def _determine_prediction(temp: float, pressure: float, humidity: float, confidence: float) -> str:
    temp_ok = 25 <= temp <= 35
    pressure_ok = 1010 <= pressure <= 1040
    humidity_ok = 40 <= humidity <= 70
    score = sum([temp_ok, pressure_ok, humidity_ok])
    return 'Pass' if (score >= 2 and confidence >= 75) else 'Fail'


@app.post("/api/simulation/start")
async def simulation_start():
    st = _load_sim_state()
    st["running"] = True
    _save_sim_state(st)
    return {"running": True}


@app.post("/api/simulation/stop")
async def simulation_stop():
    st = _load_sim_state()
    st["running"] = False
    _save_sim_state(st)
    return {"running": False}


@app.post("/api/simulation/clear")
async def simulation_clear():
    _save_sim_state({"running": False, "counter": 0})
    return {"cleared": True}


@app.get("/api/simulation/next")
async def simulation_next():
    from datetime import datetime

    st = _load_sim_state()
    if not st.get("running", False):
        raise HTTPException(status_code=400, detail="Simulation not running")

    st["counter"] = int(st.get("counter", 0)) + 1

    now = datetime.now().strftime("%H:%M:%S")
    sample_id = f"SAMPLE_{str(st['counter']).zfill(3)}"

    temperature = _random_between(20, 40)
    pressure = _random_between(1000, 1050)
    humidity = _random_between(30, 80)
    confidence = _random_between(70, 98)

    prediction = _determine_prediction(temperature, pressure, humidity, confidence)

    data = {
        "time": now,
        "sampleId": sample_id,
        "prediction": prediction,
        "confidence": round(confidence, 1),
        "temperature": round(temperature, 1),
        "pressure": round(pressure),
        "humidity": round(humidity, 1)
    }

    _save_sim_state(st)
    return data


@app.post("/api/upload/dataset", response_model=DatasetInfo)
async def upload_dataset(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")

    content = await file.read()
    csv_path = DATA_DIR / "dataset.csv"
    save_file(csv_path, content)

    try:
        df = pd.read_csv(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV: {e}")

    records = int(df.shape[0])
    features = int(df.shape[1] - 1 if df.shape[1] > 0 else 0)

    # naive pass rate estimate if a plausible target is present
    pass_rate = 0
    target_candidates = ["target", "label", "pass", "passed", "is_pass", "y", "class"]
    for c in target_candidates:
        if c in df.columns:
            try:
                positive = int((df[c] == 1).sum() if df[c].dtype != "object" else (df[c].astype(str).str.lower().isin(["1", "true", "pass"]).sum()))
                pass_rate = int(round(100 * positive / max(records, 1)))
            except Exception:
                pass
            break

    # date range heuristic: look for first datetime-like column
    date_start = ""
    date_end = ""
    for col in df.columns:
        try:
            series = pd.to_datetime(df[col], errors="coerce")
            if series.notna().any():
                date_start = str(series.min().date())
                date_end = str(series.max().date())
                break
        except Exception:
            continue

    meta = {
        "fileName": file.filename,
        "fileSize": f"{len(content) / (1024*1024):.2f} MB",
        "records": records,
        "features": features,
        "passRate": pass_rate,
        "dateRange": {"start": date_start or "", "end": date_end or ""},
    }

    save_json(META_PATH, meta)
    return meta


@app.get("/api/upload/metadata", response_model=DatasetInfo)
async def get_metadata():
    meta = load_json(META_PATH)
    if not meta:
        raise HTTPException(status_code=404, detail="No dataset metadata found")
    return meta


@app.post("/api/dateranges/validate", response_model=DateRanges)
async def validate_date_ranges(ranges: DateRanges):
    save_json(DATA_DIR / "date_ranges.json", ranges.model_dump())
    return ranges


@app.get("/api/dateranges/summary.png")
async def dateranges_summary_png():
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt

    csv_path = DATA_DIR / "dataset.csv"
    if not csv_path.exists():
        raise HTTPException(status_code=400, detail="No dataset uploaded")

    ranges_path = DATA_DIR / "date_ranges.json"
    if not ranges_path.exists():
        raise HTTPException(status_code=400, detail="No date ranges configured")

    try:
        df = pd.read_csv(csv_path)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read dataset: {e}")

    # Try to find a datetime column for plotting counts per period
    time_col = None
    for col in df.columns:
        s = pd.to_datetime(df[col], errors='coerce')
        if s.notna().any():
            df[col] = s
            time_col = col
            break

    if time_col is None:
        # If no datetime column, create an index-based pseudo time
        df['_idx'] = range(len(df))
        time_col = '_idx'

    ranges = load_json(ranges_path)

    fig, ax = plt.subplots(figsize=(6, 3))
    ax.set_title('Selected Date Ranges Summary')

    # Plot total distribution (hist counts over time)
    if time_col == '_idx':
        ax.plot(df[time_col], [1] * len(df), alpha=0.3, label='All samples')
    else:
        df_sorted = df.sort_values(by=time_col)
        ax.plot(df_sorted[time_col], range(1, len(df_sorted) + 1), alpha=0.3, label='Cumulative count')

    # Shade training/testing/simulation windows if dates available
    def shade(period_key, color, label):
        start = pd.to_datetime(ranges[period_key]['start'], errors='coerce')
        end = pd.to_datetime(ranges[period_key]['end'], errors='coerce')
        if pd.notna(start) and pd.notna(end):
            ax.axvspan(start, end, color=color, alpha=0.2, label=label)

    shade('training', 'tab:green', 'Training')
    shade('testing', 'tab:orange', 'Testing')
    shade('simulation', 'tab:blue', 'Simulation')

    ax.legend(loc='best', fontsize=8)
    ax.grid(True, alpha=0.2)
    fig.autofmt_xdate()

    buf = io.BytesIO()
    plt.tight_layout()
    fig.savefig(buf, format='png', dpi=150)
    plt.close(fig)
    buf.seek(0)

    return Response(content=buf.getvalue(), media_type='image/png')


@app.post("/api/train", response_model=TrainResponse)
async def train(req: TrainRequest):
    csv_path = DATA_DIR / "dataset.csv"
    if not csv_path.exists():
        raise HTTPException(status_code=400, detail="No dataset uploaded")

    try:
        df = pd.read_csv(csv_path)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read dataset: {e}")

    try:
        model, metrics, features, target_col, y_true, y_pred, y_score = train_model(
            df=df,
            algorithm=req.model,
            target=req.target,
            test_size=req.test_size,
            random_state=req.random_state,
        )
    except TrainingError as te:
        raise HTTPException(status_code=400, detail=str(te))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Training failed: {e}")

    # Derive human-readable period summaries from saved date ranges if present
    ranges = load_json(DATA_DIR / "date_ranges.json")
    def fmt_period(period_key: str) -> str:
        try:
            p = ranges.get(period_key)
            if not p:
                return "N/A"
            start = p.get("start") or ""
            end = p.get("end") or ""
            days = p.get("days")
            if start and end and days:
                return f"{start} to {end} ({days} days)"
            if start and end:
                return f"{start} to {end}"
            return "N/A"
        except Exception:
            return "N/A"

    training_period = fmt_period("training")
    validation_period = fmt_period("testing")
    simulation_period = fmt_period("simulation")

    model_id = f"{req.model}"
    model_path = MODELS_DIR / f"{model_id}.joblib"
    save_model(model, str(model_path))

    resp = TrainResponse(
        model_id=model_id,
        algorithm=req.model,
        metrics=TrainMetrics(
            accuracy=metrics["accuracy"],
            precision=metrics["precision"],
            recall=metrics["recall"],
            f1Score=metrics["f1Score"],
            trainingData=training_period,
            validationData=validation_period,
            simulationData=simulation_period,
        ),
        features=features,
        target=target_col,
    )

    # persist last training response for verification
    save_json(TRAINING_METRICS_PATH, {
        "model_id": resp.model_id,
        "algorithm": resp.algorithm,
        "metrics": resp.metrics.model_dump(),
        "features": resp.features,
        "target": resp.target
    })

    # persist test predictions for plots
    save_json(TRAINING_RESULTS_PATH, {
        "y_true": y_true,
        "y_pred": y_pred,
        "y_score": y_score
    })

    return resp


@app.get("/api/training/metrics")
async def get_training_metrics():
    data = load_json(TRAINING_METRICS_PATH)
    if not data:
        raise HTTPException(status_code=404, detail="No training metrics available")
    return data


@app.get("/api/training/status")
async def get_training_status():
    models = [p.name for p in MODELS_DIR.glob("*.joblib")]
    exists = len(models) > 0
    return {"hasModel": exists, "models": models}


@app.get("/api/training/confusion-matrix.png")
async def training_confusion_matrix_png():
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    import numpy as np  # type: ignore
    from sklearn.metrics import confusion_matrix

    data = load_json(TRAINING_RESULTS_PATH)
    if not data or "y_true" not in data or "y_pred" not in data:
        raise HTTPException(status_code=404, detail="No training results available")

    y_true = np.array(data["y_true"])  # type: ignore
    y_pred = np.array(data["y_pred"])  # type: ignore

    cm = confusion_matrix(y_true, y_pred)

    fig, ax = plt.subplots(figsize=(3.5, 3))
    im = ax.imshow(cm, cmap='Blues')
    ax.set_title('Confusion Matrix')
    ax.set_xlabel('Predicted')
    ax.set_ylabel('Actual')
    for (i, j), val in np.ndenumerate(cm):
        ax.text(j, i, int(val), ha='center', va='center', color='black')
    plt.colorbar(im, ax=ax, fraction=0.046, pad=0.04)

    buf = io.BytesIO()
    plt.tight_layout()
    fig.savefig(buf, format='png', dpi=150)
    plt.close(fig)
    buf.seek(0)
    return Response(content=buf.getvalue(), media_type='image/png')


@app.get("/api/training/roc.png")
async def training_roc_png():
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    import numpy as np  # type: ignore
    from sklearn.metrics import roc_curve, auc

    data = load_json(TRAINING_RESULTS_PATH)
    if not data or data.get("y_score") is None:
        raise HTTPException(status_code=404, detail="No probability scores available for ROC")

    y_true = np.array(data["y_true"])  # type: ignore
    y_score = np.array(data["y_score"])  # type: ignore

    fpr, tpr, _ = roc_curve(y_true, y_score)
    roc_auc = auc(fpr, tpr)

    fig, ax = plt.subplots(figsize=(3.5, 3))
    ax.plot(fpr, tpr, label=f'ROC AUC = {roc_auc:.2f}')
    ax.plot([0, 1], [0, 1], 'k--', alpha=0.3)
    ax.set_xlim([0.0, 1.0])
    ax.set_ylim([0.0, 1.05])
    ax.set_xlabel('False Positive Rate')
    ax.set_ylabel('True Positive Rate')
    ax.set_title('ROC Curve')
    ax.legend(loc='lower right')

    buf = io.BytesIO()
    plt.tight_layout()
    fig.savefig(buf, format='png', dpi=150)
    plt.close(fig)
    buf.seek(0)
    return Response(content=buf.getvalue(), media_type='image/png')


# Entrypoint for uvicorn
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 7000)))
