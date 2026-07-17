'use client';

import { useState, useEffect, useRef } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { apiClient } from '@/lib/api-client';
import { ArrowRight, CheckCircle, Clock, AlertCircle, Zap, Loader, Cloud, Cpu, Database, Sparkles } from 'lucide-react';
import { CustomSelect } from '@/components/ui/custom-select';

const STRATEGIES = [
  { key: 'AWD_MILD', name: 'Alternate Wetting & Drying (Mild)', icon: '🔄', desc: 'Allow field to dry moderately between irrigation events. Great balance of water saving and yield stability.', water: '15-25%', gwp: '−20-30%', yield: 'Stable / +1%' },
  { key: 'AWD_STRICT', name: 'Alternate Wetting & Drying (Strict)', icon: '🔄', desc: 'Allow field to dry deeply between irrigation events. Maximizes water savings and GWP reduction.', water: '30-40%', gwp: '−40-50%', yield: '−2%' },
  { key: 'CONTINUOUS_FLOODING', name: 'Continuous Flooding', icon: '🌊', desc: 'Maintain standing water throughout the season. Traditional method, higher greenhouse gas emissions.', water: 'Baseline', gwp: 'Baseline', yield: 'Stable' },
  { key: 'CONTINUOUS_FLOODING_MODIFIED', name: 'Continuous Flooding (Modified)', icon: '🌊', desc: 'Slightly reduced standing water depths to save water.', water: '10%', gwp: '−15%', yield: 'Stable' },
  { key: 'DELAYED_IRRIGATION', name: 'Delayed Irrigation', icon: '⏳', desc: 'Delay initial flooding after transplanting to reduce early methane.', water: '8%', gwp: '−10%', yield: 'No loss' },
  { key: 'PARTIAL_IRRIGATION', name: 'Partial Irrigation', icon: '💧', desc: 'Reduce irrigation frequency in the mid-season. Moderate water savings.', water: '18%', gwp: '−20%', yield: '−4%' },
];

const GENERATE_STEPS = [
  { icon: Cloud, label: 'Fetching weather data', desc: '14-day forecast & 30-day history' },
  { icon: Cpu, label: 'Running Rule Engine', desc: 'Filtering by scientific constraints' },
  { icon: Sparkles, label: 'ML Inference (XGBoost)', desc: 'Predicting strategy, yield & GWP' },
  { icon: Database, label: 'Saving recommendation', desc: 'Storing result to history' },
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
  const [genStep, setGenStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [previewRec, setPreviewRec] = useState<any>(null);
  const [savingRec, setSavingRec] = useState(false);

  const [activeStrategyKey, setActiveStrategyKey] = useState('AWD_MILD');
  const activeStrategy = STRATEGIES.find(s => s.key === activeStrategyKey) || STRATEGIES[0];
  const [showAllHistory, setShowAllHistory] = useState(false);

  const genTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
        setError('Failed to load fields. Please ensure you are logged in.');
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
      setError('Failed to load recommendations.');
    } finally {
      setLoadingRecs(false);
    }
  };

  useEffect(() => {
    if (selectedFieldId) {
      fetchRecommendations(selectedFieldId);
    }
  }, [selectedFieldId]);

  // Cleanup generate step timer on unmount
  useEffect(() => {
    return () => {
      if (genTimerRef.current) clearInterval(genTimerRef.current);
    };
  }, []);

  // 3. Trigger new recommendation run with step-by-step progress
  const handleGenerate = async () => {
    if (!selectedFieldId) return;
    setGenerating(true);
    setGenStep(0);
    setError(null);
    setPreviewRec(null);

    // Simulate step progression while waiting for API
    let currentStep = 0;
    genTimerRef.current = setInterval(() => {
      currentStep++;
      if (currentStep < GENERATE_STEPS.length) {
        setGenStep(currentStep);
      } else {
        if (genTimerRef.current) clearInterval(genTimerRef.current);
      }
    }, 8000);

    try {
      // 120 second timeout — AI Engine can take 30-60s
      // We call POST without preview=true so that it is persisted instantly as active
      const res = await apiClient<{ data: any }>(`/fields/${selectedFieldId}/recommendations`, {
        method: 'POST',
        timeout: 120000,
      });
      if (genTimerRef.current) clearInterval(genTimerRef.current);
      setGenStep(GENERATE_STEPS.length); // all done

      // Trigger Native Desktop Notification immediately
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          const activeField = fields.find(f => f.id === selectedFieldId);
          const fieldName = activeField ? activeField.name : "your field";
          const strategyName = res.data?.recommended_strategy_display || "New Strategy";
          
          new Notification("Agrivo AI Recommendation", {
            body: `Strategy for "${fieldName}" updated to: ${strategyName}`,
            icon: '/favicon.ico'
          });
        }
      }

      await fetchRecommendations(selectedFieldId);
    } catch (err: any) {
      console.error('Failed to generate recommendation', err);
      setError(err.message || 'Failed to run AI Engine.');
    } finally {
      if (genTimerRef.current) clearInterval(genTimerRef.current);
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
      <div className="rp-page-bg" />
      <div className="rp-root">
        {/* Header */}
        <div className="rp-header" style={{ marginBottom: '2.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#e8f5ee', color: '#14532D', padding: '0.5rem 1rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem', boxShadow: '0 2px 10px rgba(20,83,45,0.1)' }}>
            <Sparkles size={16} /> Core Feature
          </div>
          <h1 className="rp-h1" style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)', fontWeight: 800, letterSpacing: '-0.03em', color: '#161616', margin: '0 0 0.75rem' }}>AI Irrigation Recommendations</h1>
          <p className="rp-desc" style={{ fontSize: '1.1rem', maxWidth: '650px', color: '#555', lineHeight: 1.6 }}>Your central hub for data-driven strategies updated daily based on weather, soil conditions, and current crop stage.</p>
        </div>

        {/* ── Control Panel (Field Selector & AI Engine) ── */}
        <div style={{ 
          background: 'linear-gradient(to right, #ffffff, #f0f7ec)', 
          border: '1px solid #c0d9b4', 
          borderRadius: '24px', 
          padding: '1.75rem 2rem', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          gap: '1rem',
          boxShadow: '0 8px 32px rgba(20,83,45,0.08)',
          marginBottom: '3rem'
        }}>
          {fields.length > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: '1 1 300px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#f0f7ec', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                🌾
              </div>
              <div style={{ flex: 1, maxWidth: '280px' }}>
                <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#a09589', marginBottom: '0.25rem' }}>
                  Active Field
                </span>
                <CustomSelect
                  value={selectedFieldId}
                  onChange={setSelectedFieldId}
                  options={fields.map((f) => ({
                    value: f.id,
                    label: `${f.name} (${f.field_area_ha} ha)`,
                  }))}
                />
              </div>
            </div>
          ) : (
            <div style={{ color: '#787878', fontSize: '0.9rem' }}>No fields yet. Please add a field first.</div>
          )}

          {/* AI Engine Button */}
          {selectedFieldId && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', borderRight: '1px solid #E8E2D9', paddingRight: '1.5rem' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#161616', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Zap size={16} color="#14532D" />
                  Agrivo Hybrid AI Engine
                </span>
                <span style={{ fontSize: '0.75rem', color: '#787878', marginTop: '0.2rem' }}>Rule Engine + XGBoost ML</span>
              </div>
              <button
                onClick={handleGenerate}
                disabled={generating}
                style={{
                  background: 'linear-gradient(135deg, #14532D 0%, #0f3d20 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '1rem 2rem',
                  fontWeight: 800,
                  fontSize: '1.05rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  cursor: generating ? 'not-allowed' : 'pointer',
                  boxShadow: '0 8px 24px rgba(20,83,45,0.35)',
                  opacity: generating ? 0.8 : 1,
                  transition: 'all 0.2s',
                  minWidth: '230px',
                  justifyContent: 'center',
                  transform: generating ? 'none' : 'scale(1)',
                }}
                onMouseOver={(e) => { if (!generating) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 28px rgba(20,83,45,0.45)'; } }}
                onMouseOut={(e) => { if (!generating) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(20,83,45,0.35)'; } }}
              >
                {generating ? (
                  <>
                    <Loader size={18} className="rp-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    Run AI Engine
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* ── Generating Overlay ── */}
        {generating && (
          <div className="rp-gen-overlay">
            <div className="rp-gen-card">
              <div className="rp-gen-header">
                <div className="rp-gen-pulse" />
                <h3 className="rp-gen-title">AI Engine is running...</h3>
                <p className="rp-gen-subtitle">This takes about 30–60 seconds. Please wait.</p>
              </div>
              <div className="rp-gen-steps">
                {GENERATE_STEPS.map((step, i) => {
                  const StepIcon = step.icon;
                  const isDone = genStep > i;
                  const isActive = genStep === i;
                  return (
                    <div key={i} className={`rp-gen-step ${isDone ? 'done' : ''} ${isActive ? 'active' : ''}`}>
                      <div className="rp-gen-step-icon">
                        {isDone ? (
                          <CheckCircle size={20} />
                        ) : isActive ? (
                          <Loader size={20} className="rp-spin" />
                        ) : (
                          <StepIcon size={20} />
                        )}
                      </div>
                      <div className="rp-gen-step-text">
                        <span className="rp-gen-step-label">{step.label}</span>
                        <span className="rp-gen-step-desc">{step.desc}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}


        {error && (
          <div style={{ padding: '1rem', background: '#fdf2f0', color: '#C0392B', borderRadius: '16px', border: '1px solid #e8b4b0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {loadingRecs ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#14532D', fontWeight: 600 }}>
            Loading recommendation list...
          </div>
        ) : latestRec ? (
          <>
            {/* Featured AI Recommendation */}
            <div className="rp-featured">
              <div className="rp-featured-header" style={{ alignItems: 'flex-start' }}>
                <div className="rp-featured-left" style={{ width: '100%' }}>
                  <span className="rp-feat-tag">Current Primary Recommendation</span>
                  <h2 className="rp-feat-title">{latestRec.recommended_strategy_display}</h2>
                  <p className="rp-feat-desc" style={{ fontStyle: 'italic', marginBottom: '1.25rem' }}>
                    {latestRec.description || 'Loading justification details...'}
                  </p>
                  
                  {latestRec.explanation && (
                    <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {/* Implementation Guide */}
                      <div className="rp-feat-inner-card">
                        <h4 className="rp-feat-inner-title">
                          Implementation Guide
                        </h4>
                        <p className="rp-feat-inner-text">
                          {latestRec.explanation.how_to_implement}
                        </p>
                      </div>

                      {/* Climate Adaptation & Crop Security */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        {/* Benefits (Yield & Resource Optimization) */}
                        {latestRec.explanation.benefits && latestRec.explanation.benefits.length > 0 && (
                          <div className="rp-feat-inner-card">
                            <h4 className="rp-feat-inner-title">
                              Yield and Resource Benefits
                            </h4>
                            <ol className="rp-feat-inner-list">
                              {latestRec.explanation.benefits.map((b: string, idx: number) => (
                                <li key={idx} style={{ marginBottom: '0.35rem' }}>{b}</li>
                              ))}
                            </ol>
                          </div>
                        )}

                        {/* Trade-offs & Risk Warnings */}
                        {latestRec.explanation.tradeoffs && latestRec.explanation.tradeoffs.length > 0 && (
                          <div className="rp-feat-inner-card rp-feat-inner-warning">
                            <h4 className="rp-feat-inner-title rp-feat-inner-title-warning">
                              Agronomic Considerations and Risks
                            </h4>
                            <ol className="rp-feat-inner-list">
                              {latestRec.explanation.tradeoffs.map((t: string, idx: number) => (
                                <li key={idx} style={{ marginBottom: '0.35rem' }}>{t}</li>
                              ))}
                            </ol>
                          </div>
                        )}
                      </div>

                      {/* Security Constraints (Why other strategies were excluded to prevent failure) */}
                      {latestRec.explanation.rule_constraints_applied && latestRec.explanation.rule_constraints_applied.length > 0 && (
                        <div className="rp-feat-inner-card">
                          <h4 className="rp-feat-inner-title">
                            Crop Protection and Safeguards
                          </h4>
                          <ol className="rp-feat-inner-list">
                            {latestRec.explanation.rule_constraints_applied.map((reason: string, idx: number) => (
                              <li key={idx} style={{ marginBottom: '0.35rem' }}>{reason}</li>
                            ))}
                          </ol>
                        </div>
                      )}

                      {/* Social Governance note for communal systems */}
                      {latestRec.explanation.governance_note && (
                        <div className="rp-feat-inner-card">
                          <strong>Water Supply Coordination:</strong> {latestRec.explanation.governance_note}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {latestRec.prediction && (
                <div className="rp-feat-metrics">
                  {[
                    { icon:'💧', val:`${latestRec.prediction.water_saving_percent}%`, lbl:'Water Saved' },
                    { icon:'🌾', val:`${latestRec.prediction.expected_yield_ton_per_ha} t/ha`, lbl:'Expected Yield' },
                    { icon:'🌍', val:`-${latestRec.prediction.net_gwp_reduction_percent}%`, lbl:'Net GWP Reduction' },
                  ].map(m => (
                    <div key={m.lbl} className="rp-feat-metric-card">
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
                <h3 className="rp-section-title">Recommendation History</h3>
                <div className="rp-rec-list">
                  {(showAllHistory ? previousRecs : previousRecs.slice(0, 3)).map(rec => {
                    const dateObj = new Date(rec.created_at || new Date());
                    return (
                      <div key={rec.id} className="rp-rec-item" style={{ background: '#fff', borderColor: '#E8E2D9' }}>
                        <div className="rp-rec-left">
                          <h4 className="rp-rec-title" style={{ marginTop: 0 }}>{rec.recommended_strategy_display}</h4>
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
                {previousRecs.length > 3 && (
                  <button
                    onClick={() => setShowAllHistory(v => !v)}
                    style={{
                      alignSelf: 'center',
                      background: '#fff',
                      border: '1px solid #E8E2D9',
                      borderRadius: '999px',
                      padding: '0.5rem 1.5rem',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: '#14532D',
                      cursor: 'pointer',
                      marginTop: '1rem',
                      transition: 'all 0.2s',
                    }}
                  >
                    {showAllHistory ? 'Hide History' : `View ${previousRecs.length - 3} More`}
                  </button>
                )}
              </div>
            )}
          </>
        ) : (
          <div style={{ padding: '4rem', textAlign: 'center', background: '#fff', borderRadius: '24px', border: '1px dashed #E8E2D9' }}>
            <SparklesIcon />
            <h3 style={{ margin: '1rem 0 0.5rem', fontWeight: 700 }}>No recommendations yet</h3>
            <p style={{ color: '#787878', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Please click the &quot;Agrivo Hybrid AI Engine&quot; button above to generate your first irrigation recommendation.
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
        .rp-page-bg {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: url('/rice-terraces-hero.png') center/cover no-repeat;
          opacity: 0.15;
          z-index: 0;
          pointer-events: none;
        }

        .rp-root { display: flex; flex-direction: column; gap: 2.5rem; position: relative; z-index: 1; }

        .rp-header { display: flex; justify-content: space-between; align-items: flex-start; }
        .rp-eyebrow { font-size: .68rem; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: #14532D; margin-bottom: .4rem; }
        .rp-h1 { font-size: clamp(1.75rem, 3vw, 2.5rem); font-weight: 800; letter-spacing: -.025em; color: #161616; margin: 0 0 .4rem; }
        .rp-desc { font-size: .9rem; color: #787878; }

        .rp-featured { 
          background: linear-gradient(145deg, #0f3d20 0%, #165c30 100%); 
          color: #fff; 
          border: none; 
          border-radius: 28px; 
          padding: 2.5rem; 
          box-shadow: 0 12px 32px rgba(20,83,45,0.25); 
          position: relative;
          overflow: hidden;
        }
        .rp-featured::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23ffffff' fill-opacity='0.05' fill-rule='evenodd'/%3E%3C/svg%3E");
          opacity: 0.7;
          pointer-events: none;
        }
        .rp-featured-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; gap: 2rem; position: relative; z-index: 1; }
        .rp-feat-tag { font-size: .7rem; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; color: #0f3d20; background: #c0d9b4; padding: .4rem .85rem; border-radius: 999px; display: inline-block; margin-bottom: 1rem; box-shadow: 0 2px 8px rgba(0,0,0,0.15); }
        .rp-feat-title { font-size: 2.2rem; font-weight: 800; letter-spacing: -.02em; color: #fff; margin: 0 0 .75rem; text-shadow: 0 2px 4px rgba(0,0,0,0.2); }
        .rp-feat-desc { font-size: .95rem; color: #e0f0d8; line-height: 1.75; margin: 0; }
        
        .rp-feat-inner-card { background: rgba(255,255,255,0.08); padding: 1.25rem; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); backdrop-filter: blur(8px); }
        .rp-feat-inner-title { font-size: 0.85rem; font-weight: 700; color: #e0f0d8; margin-bottom: 0.6rem; margin-top: 0; text-transform: uppercase; letter-spacing: 0.05em; }
        .rp-feat-inner-text { font-size: 0.85rem; color: #fff; line-height: 1.6; margin: 0; }
        .rp-feat-inner-list { font-size: 0.85rem; color: #fff; line-height: 1.6; margin: 0; padding-left: 1.2rem; list-style-type: decimal; }
        .rp-feat-inner-warning { background: rgba(253, 240, 208, 0.1); border-color: rgba(253, 240, 208, 0.2); }
        .rp-feat-inner-title-warning { color: #fdf0d0; }

        .rp-conf-wrap { display: flex; flex-direction: column; align-items: center; gap: .3rem; flex-shrink: 0; }
        .rp-conf-circle { position: relative; }
        .rp-conf-pct { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 1rem; font-weight: 800; color: #14532D; }
        .rp-conf-lbl { font-size: .65rem; color: #a09589; font-weight: 600; }
        
        .rp-feat-metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; position: relative; z-index: 1; margin-top: 1.5rem; }
        .rp-feat-metric-card { border-radius: 16px; padding: 1.5rem; text-align: center; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.15); backdrop-filter: blur(10px); }
        .rp-fm-icon { font-size: 1.8rem; margin-bottom: .6rem; }
        .rp-fm-val { font-size: 1.5rem; font-weight: 800; color: #fff; text-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .rp-fm-lbl { font-size: .75rem; color: #e0f0d8; margin-top: .3rem; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em; }

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

        /* ── Generate Overlay ── */
        .rp-gen-overlay {
          background: rgba(255,255,255,0.92);
          backdrop-filter: blur(8px);
          border-radius: 24px;
          border: 1px solid #E8E2D9;
          padding: 2.5rem;
          box-shadow: 0 8px 32px rgba(20,83,45,0.1);
        }
        .rp-gen-card { max-width: 480px; margin: 0 auto; }
        .rp-gen-header { text-align: center; margin-bottom: 2rem; }
        .rp-gen-pulse {
          width: 48px; height: 48px; border-radius: 50%;
          background: radial-gradient(circle, #14532D, #1a6b3a);
          margin: 0 auto 1rem;
          animation: rp-pulse 2s ease-in-out infinite;
        }
        @keyframes rp-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(20,83,45,0.4); transform: scale(1); }
          50% { box-shadow: 0 0 0 16px rgba(20,83,45,0); transform: scale(1.05); }
        }
        .rp-gen-title { font-size: 1.2rem; font-weight: 800; color: #14532D; margin: 0 0 0.3rem; }
        .rp-gen-subtitle { font-size: 0.82rem; color: #787878; margin: 0; }

        .rp-gen-steps { display: flex; flex-direction: column; gap: 0.75rem; }
        .rp-gen-step {
          display: flex; align-items: center; gap: 1rem;
          padding: 0.85rem 1rem; border-radius: 14px;
          background: #F5F3EF; border: 1px solid #E8E2D9;
          color: #a09589; transition: all 0.4s ease;
        }
        .rp-gen-step.active {
          background: #e8f5ee; border-color: #14532D;
          color: #14532D; box-shadow: 0 2px 12px rgba(20,83,45,0.08);
        }
        .rp-gen-step.done {
          background: #f0f7ec; border-color: #c0d9b4; color: #2d6a4f;
        }
        .rp-gen-step-icon { flex-shrink: 0; display: flex; align-items: center; }
        .rp-gen-step-text { display: flex; flex-direction: column; }
        .rp-gen-step-label { font-size: 0.85rem; font-weight: 700; }
        .rp-gen-step-desc { font-size: 0.72rem; opacity: 0.75; margin-top: 0.1rem; }

        @keyframes rp-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .rp-spin { animation: rp-spin 1s linear infinite; }

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
