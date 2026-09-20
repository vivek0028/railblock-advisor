from app.routers.health import router as health_router
from app.routers.tasks import router as tasks_router, requests_router
from app.routers.movements import router as movements_router
from app.routers.block_windows import router as block_windows_router
from app.routers.resources import router as resources_router
from app.routers.data_sources import router as data_sources_router
from app.routers.conflicts import router as conflicts_router
from app.routers.optimization import router as optimization_router
from app.routers.simulation import router as simulation_router
from app.routers.compatibility import router as compatibility_router
from app.routers.priority import router as priority_router
from app.routers.dashboard import router as dashboard_router
from app.routers.audit import router as audit_router, audit_alias_router
from app.routers.goods_forecast import router as goods_forecast_router

__all__ = [
    "health_router",
    "tasks_router",
    "requests_router",
    "movements_router",
    "block_windows_router",
    "resources_router",
    "data_sources_router",
    "conflicts_router",
    "optimization_router",
    "simulation_router",
    "compatibility_router",
    "priority_router",
    "dashboard_router",
    "audit_router",
    "audit_alias_router",
    "goods_forecast_router"
]

