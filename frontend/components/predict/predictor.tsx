'use client';

import { useState, useEffect } from 'react';
import { Sparkles, MapPin, Droplets, CloudRain, CheckCircle, ArrowRight } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

export function Predictor() {
  const [fields, setFields] = useState<any[]>([]);
  const [fieldId, setFieldId] = useState('');
  const [soilMoisture, setSoilMoisture] = useState(65);
  const [rainfall, setRainfall] = useState(0);
  const [stage, setStage] = useState('tillering');
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    async function fetchFields() {
      try {
        const res = await apiClient<{ data: any }>('/fields');
        const items = res.data.items || res.data;
        setFields(items);
        if (items.length > 0) {
          setFieldId(items[0].id);
        }
      } catch (err) {
        console.error('Failed to load fields for predictor', err);
      }
    }
    fetchFields();
  }, []);

  const handlePredict = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    // Simulate AI prediction inference delay
    setTimeout(() => {
      setLoading(false);
      setResult({
        strategy: 'AWD_MILD',
        name: 'Alternate Wetting & Drying (Mild)',
        waterSaved: '22%',
        yieldImpact: '+0.5%',
        gwpReduction: '-18%',
        confidence: '92%',
        explanation: 'Given the current soil moisture of ' + soilMoisture + '% and expected rainfall, allowing the field to dry slightly before the next irrigation will significantly reduce methane emissions without stressing the crop during the ' + stage + ' stage.',
      });
    }, 2500);
  };

  return (
    <div className="prd-root">
      <div className="prd-header">
        <p className="prd-eyebrow">Agrivo Engine</p>
        <h1 className="prd-title">AI Irrigation Predictor</h1>
        <p className="prd-desc">Simulate and generate optimal irrigation strategies based on real-time field data.</p>
      </div>

      <div className="prd-content">
        {/* INPUT FORM */}
        <div className="prd-panel">
          <h2 className="prd-panel-title">Field Parameters</h2>
          <form onSubmit={handlePredict} className="prd-form">
            
            <div className="prd-form-group">
              <label>Target Field</label>
              <div className="prd-input-wrap">
                <MapPin size={18} />
                <select value={fieldId} onChange={e => setFieldId(e.target.value)} required>
                  {fields.map(f => (
                    <option key={f.id} value={f.id}>{f.name} ({f.field_area_ha || 0} ha)</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="prd-form-group">
              <label>Crop Stage</label>
              <div className="prd-input-wrap">
                <select value={stage} onChange={e => setStage(e.target.value)}>
                  <option value="seedling">Seedling (0-20 days)</option>
                  <option value="tillering">Tillering (20-50 days)</option>
                  <option value="panicle_initiation">Panicle Initiation (50-70 days)</option>
                  <option value="flowering">Flowering (70-90 days)</option>
                  <option value="ripening">Ripening (90+ days)</option>
                </select>
              </div>
            </div>

            <div className="prd-form-group">
              <label>Current Soil Moisture (%)</label>
              <div className="prd-range-wrap">
                <Droplets size={18} color="#14532D" />
                <input type="range" min="10" max="100" value={soilMoisture} onChange={e => setSoilMoisture(Number(e.target.value))} />
                <span className="prd-range-val">{soilMoisture}%</span>
              </div>
            </div>

            <div className="prd-form-group">
              <label>Expected Rainfall (Next 7 days in mm)</label>
              <div className="prd-range-wrap">
                <CloudRain size={18} color="#14532D" />
                <input type="range" min="0" max="150" value={rainfall} onChange={e => setRainfall(Number(e.target.value))} />
                <span className="prd-range-val">{rainfall} mm</span>
              </div>
            </div>

            <button type="submit" className="prd-submit-btn" disabled={loading}>
              {loading ? (
                <span className="prd-loader" />
              ) : (
                <>
                  <Sparkles size={18} />
                  Generate Strategy
                </>
              )}
            </button>
          </form>
        </div>

        {/* RESULTS */}
        <div className="prd-results-panel">
          {!loading && !result && (
            <div className="prd-empty-state">
              <div className="prd-empty-icon"><Sparkles size={32} /></div>
              <h3>Ready to Predict</h3>
              <p>Adjust the parameters on the left and click "Generate Strategy" to see AI recommendations.</p>
            </div>
          )}

          {loading && (
            <div className="prd-loading-state">
              <div className="prd-spinner-wrap">
                <div className="prd-spinner-ring" />
                <Sparkles size={24} color="#14532D" className="prd-spinner-icon" />
              </div>
              <h3>Running Agrivo AI Engine...</h3>
              <p>Analyzing historical data, crop models, and weather forecasts.</p>
              <div className="prd-progress-bar"><div className="prd-progress-fill" /></div>
            </div>
          )}

          {result && (
            <div className="prd-result-view slide-up">
              <div className="prd-result-header">
                <div className="prd-badge">Recommended Strategy</div>
                <div className="prd-confidence">
                  <CheckCircle size={16} color="#14532D" />
                  <span>{result.confidence} Match</span>
                </div>
              </div>
              
              <h2 className="prd-strategy-name">{result.name}</h2>
              <p className="prd-explanation">{result.explanation}</p>

              <div className="prd-impact-grid">
                <div className="prd-impact-card">
                  <div className="prd-ic-val water">{result.waterSaved}</div>
                  <div className="prd-ic-lbl">Water Saved</div>
                </div>
                <div className="prd-impact-card">
                  <div className="prd-ic-val gwp">{result.gwpReduction}</div>
                  <div className="prd-ic-lbl">GHG Reduction</div>
                </div>
                <div className="prd-impact-card">
                  <div className="prd-ic-val yield">{result.yieldImpact}</div>
                  <div className="prd-ic-lbl">Yield Impact</div>
                </div>
              </div>

              <div className="prd-action-row">
                <button className="prd-apply-btn">
                  Apply Strategy to Field <ArrowRight size={16} />
                </button>
                <button className="prd-secondary-btn">View Details</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .prd-root { display: flex; flex-direction: column; gap: 2rem; max-width: 1200px; margin: 0 auto; width: 100%; }
        
        .prd-header { margin-bottom: 1rem; }
        .prd-eyebrow { font-size: .7rem; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: #14532D; margin-bottom: .5rem; }
        .prd-title { font-size: 2.5rem; font-weight: 800; color: #161616; margin: 0 0 .5rem; letter-spacing: -.02em; }
        .prd-desc { font-size: 1rem; color: #787878; }

        .prd-content { display: grid; grid-template-columns: 400px 1fr; gap: 2rem; align-items: start; }
        
        .prd-panel { background: #fff; border: 1px solid #E8E2D9; border-radius: 20px; padding: 2rem; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
        .prd-panel-title { font-size: 1.25rem; font-weight: 700; color: #161616; margin: 0 0 1.5rem; }
        
        .prd-form { display: flex; flex-direction: column; gap: 1.5rem; }
        .prd-form-group { display: flex; flex-direction: column; gap: .6rem; }
        .prd-form-group label { font-size: .85rem; font-weight: 600; color: #161616; }
        
        .prd-input-wrap { display: flex; align-items: center; gap: .75rem; background: #FAF8F3; border: 1px solid #E8E2D9; border-radius: 12px; padding: .75rem 1rem; color: #787878; }
        .prd-input-wrap select { flex: 1; background: transparent; border: none; outline: none; font-size: .95rem; color: #161616; font-weight: 500; cursor: pointer; }
        
        .prd-range-wrap { display: flex; align-items: center; gap: 1rem; background: #FAF8F3; border: 1px solid #E8E2D9; border-radius: 12px; padding: .75rem 1rem; }
        .prd-range-wrap input[type="range"] { flex: 1; accent-color: #14532D; }
        .prd-range-val { font-size: .9rem; font-weight: 700; color: #14532D; min-width: 45px; text-align: right; }

        .prd-submit-btn { margin-top: .5rem; display: flex; align-items: center; justify-content: center; gap: .5rem; background: #14532D; color: #fff; border: none; border-radius: 12px; padding: 1rem; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all .2s; }
        .prd-submit-btn:hover:not(:disabled) { background: #1a6b39; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(20,83,45,0.2); }
        .prd-submit-btn:disabled { opacity: 0.8; cursor: not-allowed; }
        
        .prd-loader { width: 20px; height: 20px; border: 3px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 1s linear infinite; }
        
        .prd-results-panel { background: #FAF8F3; border: 1px dashed #E8E2D9; border-radius: 20px; min-height: 500px; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; padding: 2rem; }
        
        .prd-empty-state, .prd-loading-state { text-align: center; display: flex; flex-direction: column; align-items: center; max-width: 300px; }
        .prd-empty-icon { width: 64px; height: 64px; background: #E8E2D9; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #a09589; margin-bottom: 1.5rem; }
        .prd-empty-state h3, .prd-loading-state h3 { font-size: 1.25rem; font-weight: 700; color: #161616; margin: 0 0 .75rem; }
        .prd-empty-state p, .prd-loading-state p { font-size: .9rem; color: #787878; line-height: 1.5; margin: 0; }
        
        .prd-spinner-wrap { position: relative; width: 80px; height: 80px; margin-bottom: 1.5rem; display: flex; align-items: center; justify-content: center; }
        .prd-spinner-ring { position: absolute; inset: 0; border: 4px solid rgba(20,83,45,0.1); border-left-color: #14532D; border-radius: 50%; animation: spin 1.5s ease-in-out infinite; }
        .prd-spinner-icon { animation: pulse 2s infinite; }
        
        .prd-progress-bar { width: 100%; height: 6px; background: rgba(20,83,45,0.1); border-radius: 999px; margin-top: 2rem; overflow: hidden; }
        .prd-progress-fill { height: 100%; background: #14532D; width: 0%; animation: progress 2.5s ease-out forwards; }
        
        .prd-result-view { background: #fff; border: 1px solid #14532D; border-radius: 20px; padding: 2.5rem; width: 100%; box-shadow: 0 12px 32px rgba(20,83,45,0.08); }
        .prd-result-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
        .prd-badge { background: #e0f0d8; color: #14532D; font-size: .75rem; font-weight: 700; padding: .35rem .85rem; border-radius: 999px; text-transform: uppercase; letter-spacing: .05em; }
        .prd-confidence { display: flex; align-items: center; gap: .4rem; font-size: .85rem; font-weight: 700; color: #14532D; }
        
        .prd-strategy-name { font-size: 2rem; font-weight: 800; color: #161616; margin: 0 0 1rem; letter-spacing: -.02em; }
        .prd-explanation { font-size: 1rem; color: #5a5a5a; line-height: 1.6; margin: 0 0 2rem; }
        
        .prd-impact-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 2.5rem; }
        .prd-impact-card { background: #FAF8F3; border: 1px solid #E8E2D9; border-radius: 16px; padding: 1.25rem; text-align: center; }
        .prd-ic-val { font-size: 1.5rem; font-weight: 800; margin-bottom: .25rem; }
        .prd-ic-val.water { color: #2563EB; }
        .prd-ic-val.gwp { color: #14532D; }
        .prd-ic-val.yield { color: #D97706; }
        .prd-ic-lbl { font-size: .75rem; color: #787878; font-weight: 600; text-transform: uppercase; }
        
        .prd-action-row { display: flex; gap: 1rem; }
        .prd-apply-btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: .5rem; background: #14532D; color: #fff; font-weight: 600; font-size: 1rem; padding: 1rem; border-radius: 12px; border: none; cursor: pointer; transition: background .2s; }
        .prd-apply-btn:hover { background: #0f3d20; }
        .prd-secondary-btn { padding: 1rem 1.5rem; background: #fff; border: 1px solid #E8E2D9; border-radius: 12px; font-weight: 600; color: #161616; cursor: pointer; transition: background .2s; }
        .prd-secondary-btn:hover { background: #FAF8F3; }
        
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @keyframes pulse { 50% { transform: scale(1.1); opacity: .8; } }
        @keyframes progress { 0% { width: 0%; } 100% { width: 100%; } }
        .slide-up { animation: slideUp .4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes slideUp { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }

        @media (max-width: 992px) {
          .prd-content { grid-template-columns: 1fr; }
          .prd-results-panel { min-height: 400px; }
        }
      `}</style>
    </div>
  );
}
