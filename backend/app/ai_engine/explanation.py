"""Explanation generator for the AGRIVO AI Engine.

Assembles human-readable, structured explanations from rule engine outputs
and ML model decisions. All text is in Bahasa Indonesia.
"""

from app.ai_engine.schemas import (
    ExplanationResult,
    FeatureInfluence,
    GrowthStage,
    IrrigationStrategyEnum,
    IrrigationSystemTypeEnum,
    MLReasoning,
    SoilTypeEnum,
    WaterBalanceIndex,
    WeatherRiskIndex,
)

# ---------------------------------------------------------------------------
# Human-readable labels
# ---------------------------------------------------------------------------

_STRATEGY_NAMES: dict[str, str] = {
    "CONTINUOUS_FLOODING":          "Penggenangan Terus-Menerus",
    "CONTINUOUS_FLOODING_MODIFIED": "Penggenangan Termodifikasi",
    "AWD_MILD":                     "AWD Ringan",
    "AWD_STRICT":                   "AWD Ketat",
    "DELAYED_IRRIGATION":           "Irigasi Tertunda",
    "PARTIAL_IRRIGATION":           "Irigasi Parsial",
}

_STAGE_LABELS: dict[str, str] = {
    "LAND_PREPARATION": "persiapan lahan",
    "VEGETATIVE":       "vegetatif (pertumbuhan anakan)",
    "REPRODUCTIVE":     "reproduktif (pembungaan)",
    "RIPENING":         "pematangan menjelang panen",
}

_SOIL_LABELS: dict[str, str] = {
    "SANDY": "tanah berpasir (drainase cepat)",
    "LOAM":  "tanah lempung (drainase seimbang)",
    "CLAY":  "tanah liat (retensi air tinggi)",
    "SILTY": "tanah lanau (retensi air tinggi)",
}

_WB_LABELS: dict[str, str] = {
    "SURPLUS": "surplus air (tanah cenderung basah)",
    "NORMAL":  "kelembapan normal",
    "DEFICIT": "defisit air (tanah cenderung kering)",
}

_RISK_LABELS: dict[str, str] = {
    "DROUGHT_HIGH":     "risiko kekeringan tinggi dalam 14 hari ke depan",
    "DROUGHT_MODERATE": "risiko kekeringan sedang dalam 14 hari ke depan",
    "NORMAL":           "cuaca normal (tanpa risiko ekstrem)",
    "EXCESS_HIGH":      "risiko hujan berlebih dalam 14 hari ke depan",
}

_FEATURE_LABELS: dict[str, str] = {
    "soil_type":              "jenis tanah",
    "growth_stage":           "fase pertumbuhan padi",
    "water_balance_index":    "kondisi kelembapan tanah",
    "weather_risk_index":     "risiko cuaca 14 hari ke depan",
    "irrigation_system_type": "jenis sistem irigasi",
    "rice_variety_code":      "varietas padi",
    "is_weather_estimated":   "ketersediaan data cuaca",
}

# Benefits per strategy
_BENEFITS: dict[str, list[str]] = {
    "CONTINUOUS_FLOODING": [
        "Menyediakan genangan stabil yang dibutuhkan padi pada fase kritis",
        "Mudah dipantau dan diterapkan tanpa peralatan khusus",
    ],
    "CONTINUOUS_FLOODING_MODIFIED": [
        "Menghemat air sekitar 10% dibanding penggenangan penuh",
        "Mengurangi emisi metana ~15% tanpa risiko tekanan air pada tanaman",
        "Mudah diterapkan tanpa perubahan besar pada kebiasaan irigasi",
    ],
    "AWD_MILD": [
        "Menghemat air sekitar 22% dibanding Continuous Flooding",
        "Mengurangi emisi metana ~35% dengan dampak positif pada net GWP",
        "Meningkatkan aerasi akar sehingga sering memperbaiki kualitas hasil panen",
    ],
    "AWD_STRICT": [
        "Menghemat air maksimal sekitar 35% dibanding Continuous Flooding",
        "Mengurangi emisi metana ~50% — dampak lingkungan terbesar dari semua strategi",
        "Efektif pada kondisi tanah dan sistem irigasi yang mendukung kontrol ketat",
    ],
    "DELAYED_IRRIGATION": [
        "Mendorong perkembangan akar lebih dalam sebelum genangan",
        "Menghemat air tahap awal tanam ~8%",
        "Membantu mengurangi kebutuhan irigasi di awal musim tanam",
    ],
    "PARTIAL_IRRIGATION": [
        "Menghemat air sekitar 18% melalui pemberian air terjadwal",
        "Mengurangi emisi metana ~20% tanpa siklus kering-basah penuh",
        "Memberikan kontrol volume yang lebih presisi dibanding genangan penuh",
    ],
}

# Trade-offs per strategy
_TRADEOFFS: dict[str, list[str]] = {
    "CONTINUOUS_FLOODING": [
        "Konsumsi air paling tinggi dari semua strategi",
        "Emisi metana paling besar karena kondisi anaerobik terus-menerus",
    ],
    "CONTINUOUS_FLOODING_MODIFIED": [
        "Penghematan air lebih terbatas dibanding AWD",
        "Emisi N2O sedikit meningkat (~2%), namun net GWP tetap positif",
    ],
    "AWD_MILD": [
        "Emisi N2O meningkat sekitar 8% — namun net GWP tetap positif karena penurunan CH4 dominan",
        "Memerlukan pemantauan rutin agar re-irigasi dilakukan tepat waktu",
    ],
    "AWD_STRICT": [
        "Emisi N2O meningkat sekitar 14% — net GWP tetap positif namun margin lebih tipis",
        "Risiko penurunan hasil panen ~2% jika timing re-irigasi terlambat",
        "Memerlukan kontrol air yang andal dan pemantauan intensif",
    ],
    "DELAYED_IRRIGATION": [
        "Sedikit menekan pertumbuhan awal tanaman (~-1% estimasi hasil)",
        "Hanya efektif pada fase persiapan lahan — tidak bisa diterapkan di fase lain",
    ],
    "PARTIAL_IRRIGATION": [
        "Estimasi hasil sedikit lebih rendah (~-4%) karena volume air terbatas",
        "Emisi N2O meningkat ~5%, namun net GWP tetap lebih baik dari Continuous Flooding",
        "Memerlukan pemantauan kondisi tanaman lebih sering",
    ],
}

# How to implement per strategy
_HOW_TO: dict[str, str] = {
    "CONTINUOUS_FLOODING": (
        "Pertahankan ketinggian air 5–10 cm di atas permukaan tanah secara konsisten. "
        "Periksa debit air masuk/keluar setiap hari dan pastikan tidak ada kebocoran di pematang."
    ),
    "CONTINUOUS_FLOODING_MODIFIED": (
        "Pertahankan genangan dangkal 2–5 cm. Izinkan lahan mengering sebentar (1–2 hari) "
        "bila kondisi cuaca mendukung, lalu irigasi kembali. "
        "Hindari pengeringan total — tanah harus tetap lembap."
    ),
    "AWD_MILD": (
        "Biarkan muka air turun hingga sekitar 15 cm di bawah permukaan tanah (gunakan pipa "
        "perforated atau tongkat ukur sederhana), lalu irigasi ulang. "
        "Jangan terapkan AWD saat fase reproduktif (pembungaan). "
        "Rekam jadwal pengeringan dan re-irigasi untuk evaluasi."
    ),
    "AWD_STRICT": (
        "Biarkan muka air turun hingga 30 cm atau lebih di bawah permukaan tanah sebelum "
        "irigasi ulang. Pantau kondisi tanaman setiap hari — hentikan pengeringan segera "
        "bila tanaman menunjukkan tanda layu. Pastikan sumber air tersedia untuk re-irigasi cepat."
    ),
    "DELAYED_IRRIGATION": (
        "Tunda pemberian air pertama selama 7–14 hari setelah tanam pindah atau sebar. "
        "Biarkan akar berkembang lebih dalam sebelum digenangi. "
        "Pantau kelembapan tanah dan mulai irigasi saat tanaman mulai menunjukkan tekanan ringan."
    ),
    "PARTIAL_IRRIGATION": (
        "Berikan air dalam volume terbatas sesuai jadwal (bukan hingga tergenang penuh). "
        "Pantau kondisi tanaman dan kelembapan tanah setiap 2–3 hari. "
        "Tingkatkan volume bila tanaman menunjukkan tanda kekurangan air."
    ),
}


# ---------------------------------------------------------------------------
# Governance note generator
# ---------------------------------------------------------------------------

def _build_governance_note(
    strategy: str,
    irrigation_system_type: IrrigationSystemTypeEnum | None,
) -> str | None:
    """Return a governance note for communal/semi-technical systems, or None."""
    if irrigation_system_type not in (
        IrrigationSystemTypeEnum.COMMUNAL_GRAVITY,
        IrrigationSystemTypeEnum.SEMI_TECHNICAL,
    ):
        return None

    system_label = (
        "sistem irigasi gravitasi bersama (komunal)"
        if irrigation_system_type == IrrigationSystemTypeEnum.COMMUNAL_GRAVITY
        else "sistem irigasi semi-teknis"
    )

    if strategy in ("AWD_MILD", "AWD_STRICT"):
        return (
            f"Lahan Anda menggunakan {system_label}. Strategi ini memerlukan koordinasi jadwal "
            "pengeringan dengan petani di petak tetangga agar aliran air bersama tidak terganggu. "
            "Diskusikan rencana pengeringan dengan kelompok tani atau P3A sebelum memulai."
        )
    elif strategy == "PARTIAL_IRRIGATION":
        return (
            f"Lahan Anda menggunakan {system_label}. Pastikan jadwal pemberian air parsial "
            "tidak mengurangi jatah air untuk petani lain di blok yang sama."
        )
    elif strategy == "DELAYED_IRRIGATION":
        return (
            f"Lahan Anda menggunakan {system_label}. Koordinasikan waktu penundaan irigasi "
            "dengan pengelola saluran agar pasokan air tersedia saat Anda membutuhkannya."
        )
    # CFM and CF in communal/semi-technical: still add a light coordination note
    return (
        f"Lahan Anda menggunakan {system_label}. Pastikan jadwal irigasi Anda selaras "
        "dengan giliran air yang ditetapkan kelompok tani atau P3A di area Anda."
    )


# ---------------------------------------------------------------------------
# Summary sentence generator
# ---------------------------------------------------------------------------

def _build_why(
    strategy: str,
    soil_type: SoilTypeEnum,
    growth_stage: GrowthStage,
    water_balance_index: WaterBalanceIndex,
    weather_risk_index: WeatherRiskIndex,
    candidates_considered: list[str],
) -> str:
    """Build a 1–2 sentence summary of why this strategy was chosen."""
    soil = _SOIL_LABELS.get(soil_type.value, soil_type.value)
    stage = _STAGE_LABELS.get(growth_stage.value, growth_stage.value)
    wb = _WB_LABELS.get(water_balance_index.value, water_balance_index.value)
    risk = _RISK_LABELS.get(weather_risk_index.value, weather_risk_index.value)
    name = _STRATEGY_NAMES.get(strategy, strategy)

    n_candidates = len(candidates_considered)
    candidates_str = (
        f"Dari {n_candidates} strategi yang memenuhi syarat ilmiah untuk kondisi ini, "
        if n_candidates > 1
        else "Hanya satu strategi yang memenuhi syarat ilmiah untuk kondisi ini — "
    )

    return (
        f"{candidates_str}{name} dipilih sebagai rekomendasi terbaik. "
        f"Kondisi lahan: {soil}, fase {stage}, kelembapan tanah {wb}, dengan {risk}."
    )


# ---------------------------------------------------------------------------
# Public interface
# ---------------------------------------------------------------------------

def build_explanation(
    strategy: str,
    soil_type: SoilTypeEnum,
    growth_stage: GrowthStage,
    water_balance_index: WaterBalanceIndex,
    weather_risk_index: WeatherRiskIndex,
    irrigation_system_type: IrrigationSystemTypeEnum | None,
    candidates_considered: list[IrrigationStrategyEnum],
    rule_exclusion_reasons: list[str],
    top_features: list[dict],
) -> ExplanationResult:
    """Assemble the full structured explanation for a recommendation."""
    candidate_codes = [c.value for c in candidates_considered]

    return ExplanationResult(
        why=_build_why(
            strategy, soil_type, growth_stage,
            water_balance_index, weather_risk_index, candidate_codes,
        ),
        benefits=_BENEFITS.get(strategy, []),
        tradeoffs=_TRADEOFFS.get(strategy, []),
        how_to_implement=_HOW_TO.get(strategy, ""),
        governance_note=_build_governance_note(strategy, irrigation_system_type),
        rule_constraints_applied=rule_exclusion_reasons,
        ml_reasoning=MLReasoning(
            chosen_candidate=IrrigationStrategyEnum(strategy),
            candidates_considered=candidates_considered,
            top_features=[
                FeatureInfluence(
                    feature=_FEATURE_LABELS.get(f["feature"], f["feature"]),
                    influence=f["influence"],
                )
                for f in top_features
            ],
        ),
    )
