from typing import Dict, Any, List
from fastapi import APIRouter
from app.adapters.goods_forecast_adapter import GoodsForecastAdapter

router = APIRouter(prefix="/api/goods-forecast", tags=["Goods Trains Forecast (FOIS)"])

@router.get("", response_model=Dict[str, Any])
def get_goods_forecast():
    """
    Returns anticipated goods trains forecast data from Freight Operations Information System (FOIS),
    including freight rake categories, corridor density, and loop regulation strategies during blocks.
    """
    adapter = GoodsForecastAdapter()
    return adapter.load_goods_forecast()
