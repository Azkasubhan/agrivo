"""Notification service orchestrating Fonnte WhatsApp API messaging and DB logging."""

import json
import logging
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.field import Field
from app.models.recommendation import Recommendation
from app.models.user import User
from app.repositories.notification_repository import NotificationRepository

logger = logging.getLogger(__name__)


class NotificationService:
    """Manages WhatsApp messages delivery and records local user notifications."""

    def __init__(self, session: Session) -> None:
        self.session = session
        self.repo = NotificationRepository(session)

    def send_whatsapp_message(self, target: str, message: str) -> str:
        """Send a WhatsApp message via Fonnte API Gateway.
        
        Returns 'sent', 'failed', or 'simulated'.
        """
        settings = get_settings()
        token = settings.fonnte_api_token

        # Clean target number: remove '+' or spaces
        clean_target = target.replace("+", "").replace(" ", "")

        if not token or token == "your-fonnte-api-token":
            logger.info(
                f"[SIMULATION] Sending WA to {clean_target} using Fonnte: {message}"
            )
            return "simulated"

        url = f"{settings.fonnte_base_url.rstrip('/')}/send"
        headers = {
            "Authorization": token,
            "Content-Type": "application/x-www-form-urlencoded",
        }
        data = {
            "target": clean_target,
            "message": message,
            "countryCode": "62",
        }

        try:
            payload = urllib.parse.urlencode(data).encode("utf-8")
            req = urllib.request.Request(
                url, data=payload, headers=headers, method="POST"
            )
            with urllib.request.urlopen(req, timeout=10) as response:
                resp_data = json.loads(response.read().decode("utf-8"))
                
            if resp_data.get("status") is True:
                logger.info(f"WhatsApp notification sent successfully to {clean_target}")
                return "sent"
            else:
                logger.error(
                    f"Fonnte gateway returned error for {clean_target}: {resp_data}"
                )
                return "failed"
        except Exception as e:
            logger.error(
                f"Exception encountered while sending WA to {clean_target} via Fonnte: {str(e)}"
            )
            return "failed"

    def notify_recommendation_change(
        self, user: User, field: Field, new_rec: Recommendation
    ) -> None:
        """Send a WhatsApp alert when a field's recommended irrigation strategy changes."""
        # Check preferences
        pref = user.notification_preference
        if not pref or not pref.whatsapp_enabled or not pref.recommendation_change_alert:
            logger.info(
                f"Skipping WA alert for User {user.id} - Preference disabled"
            )
            return

        # Format strategy names
        strategy_display = new_rec.recommended_strategy.value.replace("_", " ").title()

        # Build message
        why_explanation = ""
        how_to_implement = ""
        water_saved = "0%"
        net_gwp = "0%"
        expected_yield = "0.0"

        if new_rec.prediction:
            water_saved = f"{new_rec.prediction.water_saving_percent}%"
            prefix_gwp = "-" if float(new_rec.prediction.net_gwp_reduction_percent) > 0 else "+"
            net_gwp = f"{prefix_gwp}{abs(float(new_rec.prediction.net_gwp_reduction_percent))}%"
            expected_yield = f"{new_rec.prediction.expected_yield_ton_per_ha}"
            explanation = new_rec.prediction.explanation
            if explanation:
                why_explanation = explanation.get("why", "")
                how_to_implement = explanation.get("how_to_implement", "")

        message = (
            f"Halo {user.full_name},\n\n"
            f"Rekomendasi irigasi untuk lahan Anda \"{field.name}\" hari ini telah diperbarui:\n"
            f"👉 *{strategy_display}* (Akurasi: {int(new_rec.confidence_score * 100)}%)\n\n"
            f"💡 *Mengapa:* {why_explanation}\n\n"
            f"🔧 *Langkah Penerapan:* {how_to_implement}\n\n"
            f"📈 *Dampak Lingkungan & Hasil:*\n"
            f"💧 Hemat Air: {water_saved}\n"
            f"🌍 Reduksi Gas (GWP): {net_gwp}\n"
            f"🌾 Est. Hasil Panen: {expected_yield} t/ha\n\n"
            f"Buka dashboard AGRIVO Anda untuk detail selengkapnya.\n"
            f"Salam Lestari,\n"
            f"Tim AGRIVO"
        )

        status = self.send_whatsapp_message(user.phone_number, message)

        # Persist notification record
        self.repo.create(
            user_id=user.id,
            field_id=field.id,
            recommendation_id=new_rec.id,
            channel="whatsapp",
            message=message,
            delivery_status=status,
            sent_at=datetime.now(timezone.utc) if status in ("sent", "simulated") else None,
        )

    def notify_weather_risk(
        self, user: User, field: Field, weather_risk_index: str, weather_snapshot_id: UUID
    ) -> None:
        """Send a WhatsApp warning alert when weather risk is moderate or high."""
        if weather_risk_index == "NORMAL":
            return

        # Check preferences
        pref = user.notification_preference
        if not pref or not pref.whatsapp_enabled or not pref.weather_risk_alert:
            logger.info(
                f"Skipping WA Weather alert for User {user.id} - Preference disabled"
            )
            return

        risk_label = "SANGAT TINGGI" if weather_risk_index == "HIGH" else "SEDANG"

        message = (
            f"⚠️ *PERINGATAN RISIKO CUACA - AGRIVO* ⚠️\n\n"
            f"Halo {user.full_name},\n"
            f"Sistem mendeteksi tingkat risiko cuaca *{risk_label}* untuk lahan Anda \"{field.name}\" dalam beberapa hari ke depan.\n\n"
            f"Mohon periksa grafik cuaca dan rekomendasi irigasi terbaru di dashboard Anda untuk mengantisipasi potensi kekeringan atau luapan air.\n\n"
            f"Salam Lestari,\n"
            f"Tim AGRIVO"
        )

        status = self.send_whatsapp_message(user.phone_number, message)

        # Persist notification record
        self.repo.create(
            user_id=user.id,
            field_id=field.id,
            recommendation_id=None,
            channel="whatsapp",
            message=message,
            delivery_status=status,
            sent_at=datetime.now(timezone.utc) if status in ("sent", "simulated") else None,
        )
