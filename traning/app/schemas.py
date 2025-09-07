from pydantic import BaseModel, Field
from typing import Optional, Literal, List


class DatasetInfo(BaseModel):
    fileName: str
    fileSize: str
    records: int
    features: int
    passRate: int = Field(0, ge=0, le=100)
    dateRange: dict


class DateRangePeriod(BaseModel):
    start: str
    end: str
    days: int


class DateRanges(BaseModel):
    training: DateRangePeriod
    testing: DateRangePeriod
    simulation: DateRangePeriod


class TrainRequest(BaseModel):
    model: Literal["sklearn_logreg", "xgboost", "lightgbm"] = "sklearn_logreg"
    target: Optional[str] = None
    test_size: float = Field(0.2, gt=0, lt=1)
    random_state: int = 42


class TrainMetrics(BaseModel):
    accuracy: float
    precision: float
    recall: float
    f1Score: float
    trainingData: str = ""
    validationData: str = ""
    simulationData: str = ""


class TrainResponse(BaseModel):
    model_id: str
    algorithm: str
    metrics: TrainMetrics
    features: List[str]
    target: str
