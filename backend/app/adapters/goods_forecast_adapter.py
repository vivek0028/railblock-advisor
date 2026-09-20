from typing import Dict, Any, List

class GoodsForecastAdapter:
    """
    Mock adapter for Freight Operations Information System (FOIS) / Goods Forecast.
    Feeds anticipated freight traffic patterns and coal/container rake movements.
    NOTE: Uses synthetic demo data only. Does NOT connect to live Indian Railways FOIS.
    """
    SOURCE_NAME = "GOODS_FORECAST"
    FULL_NAME = "Freight Operations Information System (Goods Forecast)"
    SYSTEM_TYPE = "Freight Traffic Flow & Corridor Demand Forecasting"

    def load_goods_forecast(self) -> Dict[str, Any]:
        records: List[Dict[str, Any]] = [
            {
                "forecast_id": "GFC-101",
                "rake_id": "BOXNHL-COAL-42",
                "section": "Section A-B",
                "traffic_type": "Thermal Power Coal Freight (58 Wagons)",
                "expected_density": "High (Peak Night Haul)",
                "direction": "DOWN",
                "priority_window_gap": "01:00 - 05:30",
                "loop_regulation_station": "Station A Goods Loop Line 3",
                "regulation_strategy": "Regulated in Station A Yard Loop during 01:30 - 05:30 block window without affecting power plant deadline",
                "remarks": "Priority thermal coal rake for NTPC Super Thermal Power Plant",
                "data_label": "DEMO DATA"
            },
            {
                "forecast_id": "GFC-102",
                "rake_id": "BLC-CONCOR-88",
                "section": "Section B-C",
                "traffic_type": "CONCOR Double-Stack Export Container (45 Wagons)",
                "expected_density": "Moderate",
                "direction": "UP",
                "priority_window_gap": "11:00 - 14:00",
                "loop_regulation_station": "Station B Common Loop Line",
                "regulation_strategy": "Direct through-run scheduled post-14:00 block completion; speed restriction caution 30 km/h applied",
                "remarks": "Export container cargo corridor bound for JNPT Gateway Port",
                "data_label": "DEMO DATA"
            },
            {
                "forecast_id": "GFC-103",
                "rake_id": "BTPN-POL-19",
                "section": "Section C-D",
                "traffic_type": "POL Petroleum Oil Tanker Rake (50 Wagons)",
                "expected_density": "High (Hazardous Goods)",
                "direction": "DOWN",
                "priority_window_gap": "02:00 - 05:30",
                "loop_regulation_station": "Station C Siding 1",
                "regulation_strategy": "Stabled with safety earthing in Station C Siding during adjacent OHE power shutdown",
                "remarks": "Indian Oil Corporation refinery distribution rake",
                "data_label": "DEMO DATA"
            },
            {
                "forecast_id": "GFC-104",
                "rake_id": "BCN-FOOD-33",
                "section": "Section A-B",
                "traffic_type": "FCI Foodgrain Essential Supply Rake (42 Covered Wagons)",
                "expected_density": "Moderate",
                "direction": "BOTH",
                "priority_window_gap": "01:30 - 04:30",
                "loop_regulation_station": "Station B Loop 2",
                "regulation_strategy": "Pre-regulated at Station B before track machine posession begins",
                "remarks": "National Public Distribution System grain shipment",
                "data_label": "DEMO DATA"
            }
        ]
        metadata = {
            "source": self.SOURCE_NAME,
            "full_name": self.FULL_NAME,
            "status": "Connected (Demo Mode)",
            "record_count": len(records),
            "last_sync": "2026-09-17T10:20:00",
            "is_live_connection": False,
            "disclaimer": "Synthetic freight traffic forecast for demo purposes only."
        }
        return {"metadata": metadata, "records": records}
