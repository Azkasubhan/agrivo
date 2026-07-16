'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { apiClient } from '@/lib/api-client';
import { ArrowRight, CheckCircle, Clock, AlertCircle, Zap, Loader } from 'lucide-react';

const STRATEGIES = [
  { key: 'AWD_MILD', name: 'Alternate Wetting & Drying (Mild)', icon: '🔄', desc: 'Allow field to dry moderately between irrigation events. Great balance of water saving and yield stability.', water: '15-25%', gwp: '−20-30%', yield: 'Stable / +1%' },
  { key: 'AWD_STRICT', name: 'Alternate Wetting & Drying (Strict)', icon: '🔄', desc: 'Allow field to dry deeply between irrigation events. Maximizes water savings and GWP reduction.', water: '30-40%', gwp: '−40-50%', yield: '−2%' },
  { key: 'CONTINUOUS_FLOODING', name: 'Continuous Flooding', icon: '🌊', desc: 'Maintain standing water throughout the season. Traditional method, higher greenhouse gas emissions.', water: 'Baseline', gwp: 'Baseline', yield: 'Stable' },
  { key: 'CONTINUOUS_FLOODING_MODIFIED', name: 'Continuous Flooding (Modified)', icon: '🌊', desc: 'Slightly reduced standing water depths to save water.', water: '10%', gwp: '−15%', yield: 'Stable' },
  { key: 'DELAYED_IRRIGATION', name: 'Delayed Irrigation', icon: '⏳', desc: 'Delay initial flooding after transplanting to reduce early methane.', water: '8%', gwp: '−10%', yield: 'No loss' },
  { key: 'PARTIAL_IRRIGATION', name: 'Partial Irrigation', icon: '💧', desc: 'Reduce irrigation frequency in the mid-season. Moderate water savings.', water: '18%', gwp: '−20%', yield: '−4%' },
];

const urgencyStyle = (u: string) => {
  if (u === 'high') return { bg: '#fdf2f0', border: '#e8b4b0', pill: '#C0392B', pillBg: '#fde8e5' };
  if (u === 'medium') return { bg: '#fdf8ed', border: '#e8d4a0', pill: '#b07d10', pillBg: '#fdf0d0' };
  return { bg: '#f0f7ec', border: '#c0d9b4', pill: '#14532D', pillBg: '#e0f0d8' };
};

export default function RecommendationsPage() {
  const [fields, setFields] = useState<any[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string>('');
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loadingFields, setLoadingFields] = useState(true);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeStrategyKey, setActiveStrategyKey] = useState('AWD_MILD');
  const activeStrategy = STRATEGIES.find(s => s.key === activeStrategyKey) || STRATEGIES[0];

  // 1. Fetch user fields
  useEffect(() => {
    async function loadFields() {
      try {
        const res = await apiClient<{ data: { items: any[] } | any[] }>('/fields');
        const items = (res.data as any).items || res.data;
        setFields(items);
        if (items.length > 0) {
          setSelectedFieldId(items[0].id);
        }
      } catch (err) {
        console.error('Failed to load fields', err);
        setError('Gagal memuat data lahan.');
      } finally {
        setLoadingFields(false);
      }
    }
    loadFields();
  }, []);

  // 2. Fetch recommendations when field selection changes
  const fetchRecommendations = async (fieldId: string) => {
    setLoadingRecs(true);
    setError(null);
    try {
      const res = await apiClient<{ data: { items: any[] } }>(`/fields/${fieldId}/recommendations`);
      setRecommendations(res.data.items);
    } catch (err) {
      console.error('Failed to load recommendations', err);
      setError('Gagal memuat rekomendasi.');
    } finally {
      setLoadingRecs(false);
    }
  };

  useEffect(() => {
    if (selectedFieldId) {
      fetchRecommendations(selectedFieldId);
    }
  }, [selectedFieldId]);

  // 3. Trigger new recommendation run
  const handleGenerate = async () => {
    if (!selectedFieldId) return;
    setGenerating(true);
    setError(null);
    try {
      await apiClient(`/fields/${selectedFieldId}/recommendations`, { method: 'POST' });
      await fetchRecommendations(selectedFieldId);
    } catch (err: any) {
      console.error('Failed to generate recommendation', err);
      setError(err.message || 'Gagal menjalankan engine rekomendasi AI.');
    } finally {
      setGenerating(false);
    }
  };

  if (loadingFields) {
    return (
      <MainLayout>
        <div style={{ padding: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#14532D', fontWeight: 600 }}>
          Loading fields...
        </div>
      </MainLayout>
    );
  }

  const latestRec = recommendations[0];
  const previousRecs = recommendations.slice(1);

  return (
    <MainLayout>
      <div className="rp-root">
        {/* Header */}
        <div className="rp-header">
          <div>
            <p className="rp-eyebrow">AI Recommendations</p>
            <h1 className="rp-h1">Irrigation Guidance</h1>
            <p className="rp-desc">Data-driven strategies updated daily based on weather, soil, and crop stage.</p>
          </div>
          {fields.length > 0 && (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: '#a09589' }}>
                Lahan:
              </span>
              <select
                value={selectedFieldId}
                onChange={(e) => setSelectedFieldId(e.target.value)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '10px',
                  border: '1px solid #E8E2D9',
                  background: '#fff',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                {fields.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.field_area_ha} ha)
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Generate Engine Banner */}
        {selectedFieldId && (
          <div className="bg-gradient-to-r from-primary to-primary/80 rounded-lg shadow-sm p-6 text-white" style={{ background: '#14532D', color: '#fff', borderRadius: '18px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                  <Zap size={18} />
                  Agrivo Hybrid AI Engine
                </h3>
                <p style={{ fontSize: '0.85rem', opacity: 0.9, marginTop: '0.25rem', margin: 0 }}>
                  Hitung rekomendasi AWD presisi menggunakan XGBoost + Rule Engine.
                </p>
              </div>
              <button
                onClick={handleGenerate}
                disabled={generating}
                style={{
                  background: '#fff',
                  color: '#14532D',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0.75rem 1.5rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: generating ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                  opacity: generating ? 0.8 : 1,
                }}
              >
                {generating ? (
                  <>
                    <Loader size={16} className="animate-spin" />
                    Menghitung...
                  </>
                ) : (
                  <>
                    <Zap size={16} />
                    Jalankan AI Engine
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {error && (
          <div style={{ padding: '1rem', background: '#fdf2f0', color: '#C0392B', borderRadius: '16px', border: '1px solid #e8b4b0' }}>
            {error}
          </div>
        )}

        {loadingRecs ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#14532D', fontWeight: 600 }}>
            Memuat daftar rekomendasi...
          </div>
        ) : latestRec ? (
          <>
            {/* Featured AI Recommendation */}
            <div className="rp-featured">
              <div className="rp-featured-header">
                <div className="rp-featured-left">
                  <span className="rp-feat-tag">Rekomendasi Utama Saat Ini</span>
                  <h2 className="rp-feat-title">{latestRec.recommended_strategy_display}</h2>
                  <p className="rp-feat-desc" style={{ color: '#555', fontStyle: 'italic', marginBottom: '1rem' }}>
                    {latestRec.description || 'Sedang memuat justifikasi...'}
                  </p>
                  
                  {latestRec.explanation && (
                    <div style={{ background: '#FAF8F3', padding: '1rem', borderRadius: '12px', border: '1px solid #E8E2D9', marginTop: '1rem' }}>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#14532D', marginBottom: '0.5rem' }}>Cara Implementasi:</h4>
                      <p style={{ fontSize: '0.8rem', color: '#666', lineHeight: 1.5 }}>
                        {latestRec.explanation.how_to_implement}
                      </p>
                    </div>
                  )}
                </div>
                <div className="rp-conf-wrap">
                  <div className="rp-conf-circle">
                    <svg viewBox="0 0 80 80" width="80" height="80">
                      <circle cx="40" cy="40" r="34" fill="none" stroke="#F0EDE6" strokeWidth="5"/>
                      <circle cx="40" cy="40" r="34" fill="none" stroke="#14532D" strokeWidth="5"
                        strokeDasharray={`${2*Math.PI*34*(latestRec.confidence_score)} ${2*Math.PI*34*(1 - latestRec.confidence_score)}`}
                        strokeDashoffset={2*Math.PI*34*0.25}
                        strokeLinecap="round"/>
                    </svg>
                    <span className="rp-conf-pct">{Math.round(latestRec.confidence_score * 100)}%</span>
                  </div>
                  <span className="rp-conf-lbl">Confidence</span>
                </div>
              </div>

              {latestRec.prediction && (
                <div className="rp-feat-metrics">
                  {[
                    { icon:'💧', val:`${latestRec.prediction.water_saving_percent}%`, lbl:'Water Saved', bg:'#e8f4fd' },
                    { icon:'🌾', val:`${latestRec.prediction.expected_yield_ton_per_ha} t/ha`, lbl:'Expected Yield', bg:'#f0f7ec' },
                    { icon:'🌍', val:`-${latestRec.prediction.net_gwp_reduction_percent}%`, lbl:'Net GWP Reduction', bg:'#faf3e8' },
                    { icon:'⚙️', val: latestRec.engine_type, lbl:'Engine Model', bg:'#f5f0fa' },
                  ].map(m => (
                    <div key={m.lbl} className="rp-feat-metric" style={{ background: m.bg }}>
                      <div className="rp-fm-icon">{m.icon}</div>
                      <div className="rp-fm-val">{m.val}</div>
                      <div className="rp-fm-lbl">{m.lbl}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Previous Recommendations History */}
            {previousRecs.length > 0 && (
              <div className="rp-section">
                <h3 className="rp-section-title">Riwayat Rekomendasi</h3>
                <div className="rp-rec-list">
                  {previousRecs.map(rec => {
                    const us = urgencyStyle(rec.urgency);
                    return (
                      <div key={rec.id} className="rp-rec-item" style={{ background: us.bg, borderColor: us.border }}>
                        <div className="rp-rec-left">
                          <div className="rp-rec-urgency-pill" style={{ background: us.pillBg, color: us.pill }}>
                            {rec.urgency === 'high' ? <AlertCircle size={12}/> : rec.urgency === 'medium' ? <Clock size={12}/> : <CheckCircle size={12}/>}
                            {rec.urgency}
                          </div>
                          <h4 className="rp-rec-title">{rec.recommended_strategy_display}</h4>
                          <p className="rp-rec-desc">{rec.description}</p>
                          <div className="rp-rec-metrics">
                            {rec.metrics.map((m: string) => <span key={m} className="rp-rec-metric-tag">{m}</span>)}
                          </div>
                        </div>
                        <div className="rp-rec-right">
                          <div className="rp-rec-cat">{rec.category}</div>
                          <ArrowRight size={18} color="#a09589" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        ) : (
          <div style={{ padding: '4rem', textAlign: 'center', background: '#fff', borderRadius: '24px', border: '1px dashed #E8E2D9' }}>
            <SparklesIcon />
            <h3 style={{ margin: '1rem 0 0.5rem', fontWeight: 700 }}>Belum ada rekomendasi</h3>
            <p style={{ color: '#787878', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Silakan tekan tombol "Jalankan AI Engine" di atas untuk menghasilkan rekomendasi irigasi pertama Anda.
            </p>
          </div>
        )}

        {/* Strategy Comparison Reference */}
        <div className="rp-section">
          <h3 className="rp-section-title">Strategy Comparison Reference</h3>
          <div className="rp-strategy-tabs">
            {STRATEGIES.map(s => (
              <button key={s.key} className={`rp-strategy-tab${activeStrategyKey === s.key ? ' active' : ''}`}
                onClick={() => setActiveStrategyKey(s.key)}>
                <span>{s.icon}</span> {s.name}
              </button>
            ))}
          </div>
          <div className="rp-strategy-panel">
            <p className="rp-strategy-desc">{activeStrategy.desc}</p>
            <div className="rp-strategy-stats">
              <div className="rp-ss"><span className="rp-ss-val">{activeStrategy.water}</span><span className="rp-ss-lbl">Water Saving</span></div>
              <div className="rp-ss"><span className="rp-ss-val">{activeStrategy.gwp}</span><span className="rp-ss-lbl">GWP Change</span></div>
              <div className="rp-ss"><span className="rp-ss-val">{activeStrategy.yield}</span><span className="rp-ss-lbl">Yield Impact</span></div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .rp-root { display: flex; flex-direction: column; gap: 2.5rem; }

        .rp-header { display: flex; justify-content: space-between; align-items: flex-start; }
        .rp-eyebrow { font-size: .68rem; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: #14532D; margin-bottom: .4rem; }
        .rp-h1 { font-size: clamp(1.75rem, 3vw, 2.5rem); font-weight: 800; letter-spacing: -.025em; color: #161616; margin: 0 0 .4rem; }
        .rp-desc { font-size: .9rem; color: #787878; }

        .rp-featured { background: #fff; border: 1px solid #E8E2D9; border-radius: 24px; padding: 2rem; box-shadow: 0 4px 16px rgba(0,0,0,0.05); }
        .rp-featured-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; gap: 2rem; }
        .rp-feat-tag { font-size: .68rem; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: #14532D; background: #e8f5ee; padding: .3rem .75rem; border-radius: 999px; display: inline-block; margin-bottom: .75rem; }
        .rp-feat-title { font-size: 1.6rem; font-weight: 800; letter-spacing: -.02em; color: #161616; margin: 0 0 .75rem; }
        .rp-feat-desc { font-size: .875rem; color: #787878; line-height: 1.75; margin: 0; }
        .rp-conf-wrap { display: flex; flex-direction: column; align-items: center; gap: .3rem; flex-shrink: 0; }
        .rp-conf-circle { position: relative; }
        .rp-conf-pct { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 1rem; font-weight: 800; color: #14532D; }
        .rp-conf-lbl { font-size: .65rem; color: #a09589; font-weight: 600; }
        .rp-feat-metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
        .rp-feat-metric { border-radius: 16px; padding: 1.25rem; text-align: center; border: 1px solid rgba(0,0,0,0.04); }
        .rp-fm-icon { font-size: 1.4rem; margin-bottom: .4rem; }
        .rp-fm-val { font-size: 1.3rem; font-weight: 800; color: #161616; }
        .rp-fm-lbl { font-size: .68rem; color: #787878; margin-top: .2rem; }

        .rp-section { display: flex; flex-direction: column; gap: 1rem; }
        .rp-section-title { font-size: 1.1rem; font-weight: 800; color: #161616; margin: 0; }

        .rp-strategy-tabs { display: flex; gap: .5rem; flex-wrap: wrap; }
        .rp-strategy-tab { display: flex; align-items: center; gap: .5rem; font-size: .8rem; font-weight: 600; color: #787878; background: #fff; border: 1px solid #E8E2D9; border-radius: 999px; padding: .45rem 1rem; cursor: pointer; transition: all .2s; }
        .rp-strategy-tab.active { background: #14532D; color: #fff; border-color: #14532D; }
        .rp-strategy-tab:hover:not(.active) { border-color: #14532D; color: #14532D; }
        .rp-strategy-panel { background: #FAF8F3; border: 1px solid #E8E2D9; border-radius: 16px; padding: 1.5rem; }
        .rp-strategy-desc { font-size: .875rem; color: #787878; line-height: 1.7; margin: 0 0 1.25rem; }
        .rp-strategy-stats { display: flex; gap: 2rem; }
        .rp-ss { display: flex; flex-direction: column; gap: .2rem; }
        .rp-ss-val { font-size: 1.4rem; font-weight: 800; color: #14532D; }
        .rp-ss-lbl { font-size: .72rem; color: #787878; font-weight: 500; }

        .rp-rec-list { display: flex; flex-direction: column; gap: .75rem; }
        .rp-rec-item { display: flex; align-items: center; justify-content: space-between; border: 1px solid; border-radius: 18px; padding: 1.5rem; gap: 1.5rem; cursor: pointer; transition: transform .2s, box-shadow .2s; }
        .rp-rec-item:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(0,0,0,0.08); }
        .rp-rec-left { flex: 1; }
        .rp-rec-urgency-pill { display: inline-flex; align-items: center; gap: .35rem; font-size: .65rem; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; padding: .25rem .7rem; border-radius: 999px; margin-bottom: .6rem; }
        .rp-rec-title { font-size: .95rem; font-weight: 700; color: #161616; margin: 0 0 .35rem; }
        .rp-rec-desc { font-size: .8rem; color: #787878; line-height: 1.6; margin: 0 0 .75rem; }
        .rp-rec-metrics { display: flex; gap: .4rem; flex-wrap: wrap; }
        .rp-rec-metric-tag { font-size: .65rem; font-weight: 600; color: #5A6F45; background: rgba(90,111,69,0.1); padding: .2rem .55rem; border-radius: 999px; }
        .rp-rec-right { display: flex; flex-direction: column; align-items: flex-end; gap: .75rem; flex-shrink: 0; }
        .rp-rec-cat { font-size: .65rem; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: #a09589; }

        @media (max-width: 768px) {
          .rp-header { flex-direction: column; gap: 1rem; }
          .rp-feat-metrics { grid-template-columns: repeat(2, 1fr); }
          .rp-featured-header { flex-direction: column; }
          .rp-strategy-stats { flex-direction: column; gap: 1rem; }
        }
      `}</style>
    </MainLayout>
  );
}


function SparklesIcon() {
  return (
    <div style={{
      width: '64px',
      height: '64px',
      background: '#E8E2D9',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#a09589',
      margin: '0 auto',
    }}>
      <Zap size={32} />
    </div>
  );
}

