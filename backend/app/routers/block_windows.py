from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import BlockWindow
from app.schemas.schemas import BlockWindowResponse

router = APIRouter(prefix="/api/block-windows", tags=["Block Windows"])

@router.get("", response_model=List[BlockWindowResponse])
def get_all_block_windows(
    section: Optional[str] = Query(None, description="Filter by section (e.g. Section A-B)"),
    date: Optional[str] = Query(None, description="Filter by date (YYYY-MM-DD)"),
    status: Optional[str] = Query(None, description="Filter by status (Available, Reserved, Cancelled)"),
    db: Session = Depends(get_db)
):
    query = db.query(BlockWindow)
    if section:
        query = query.filter(BlockWindow.section == section)
    if date:
        query = query.filter(BlockWindow.date == date)
    if status:
        query = query.filter(BlockWindow.status == status)
    return query.order_by(BlockWindow.date.asc(), BlockWindow.start_time.asc()).all()
