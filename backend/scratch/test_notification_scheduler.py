import asyncio
import sys
import os

# Adjust path to import app package
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.services.scheduler_service import run_daily_recommendation_job
from app.models.notification import Notification
from sqlalchemy import select

async def main():
    session = SessionLocal()
    try:
        from sqlalchemy import delete
        session.execute(delete(Notification))
        session.commit()
        print("Tabel notifications dikosongkan untuk pengujian bersih.")
    finally:
        session.close()

    print("Memicu background recommendation & notification job...")
    await run_daily_recommendation_job()
    
    print("\nMemverifikasi database notifications...")
    session = SessionLocal()
    try:
        stmt = select(Notification).order_by(Notification.created_at.desc())
        notifs = session.execute(stmt).scalars().all()
        print(f"Total notifikasi di DB: {len(notifs)}")
        for idx, n in enumerate(notifs[:5]):
            print(f"\n[{idx+1}] User ID: {n.user_id}")
            print(f"Field ID: {n.field_id}")
            print(f"Status: {n.delivery_status}")
            print(f"Message:\n{n.message}\n" + "-"*40)
    finally:
        session.close()

if __name__ == "__main__":
    asyncio.run(main())
