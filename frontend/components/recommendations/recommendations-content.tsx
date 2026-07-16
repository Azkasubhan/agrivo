'use client';

import { Field, Recommendation } from '@/lib/mock-data';
import { ArrowRight, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useState } from 'react';

interface Props {
  fields: Field[];
  recommendations: Recommendation[];
}

const STRATEGIES = [
  { key: 'awd', name: 'Alternate Wetting & Drying', icon: '🔄', desc: 'Allow field to dry between irrigation events. Most recommended for GWP reduction.', water: '38%', gwp: '−32%', yield: 'No loss' },
  { key: 'cf', name: 'Continuous Flooding', icon: '🌊', desc: 'Maintain standing water throughout the season. Traditional method, higher emissions.', water: 'Baseline', gwp: 'Baseline', yield: 'Stable' },
  { key: 'pi', name: 'Partial Irrigation', icon: '💧', desc: 'Reduce irrigation frequency in the mid-season. Moderate water savings.', water: '18%', gwp: '−12%', yield: '−2%' },
  { key: 'di', name: 'Delayed Irrigation', icon: '⏳', desc: 'Delay initial flooding after transplanting. Effective methane reduction.', water: '22%', gwp: '−18%', yield: 'No loss' },
];

const FILTERS = ['All', 'Irrigation', 'Fertilization', 'Pest Control'];

const urgencyStyle = (u: string) => {
  if (u === 'high') return { bg: '#fdf2f0', border: '#e8b4b0', pill: '#C0392B', pillBg: '#fde8e5' };
  if (u === 'medium') return { bg: '#fdf8ed', border: '#e8d4a0', pill: '#b07d10', pillBg: '#fdf0d0' };
  return { bg: '#f0f7ec', border: '#c0d9b4', pill: '#14532D', pillBg: '#e0f0d8' };
};

export function RecommendationsContent({ fields, recommendations }: Props) {
  const [filter, setFilter] = useState('All');
  const [activeStrategy, setActiveStrategy] = useState('awd');

  const filtered = filter === 'All' ? recommendations
    : recommendations.filter(r => r.category === filter.toLowerCase().replace(' ', '-'));

  const strategy = STRATEGIES.find(s => s.key === activeStrategy)!;

  return (
    <div className="rp-root">

      {/* Header */}
      <div className="rp-header">
        <div>
          <p className="rp-eyebrow">AI Recommendations</p>
          <h1 className="rp-h1">Irrigation Guidance</h1>
          <p className="rp-desc">Data-driven strategies updated daily based on weather, soil, and crop stage.</p>
        </div>
        <div className="rp-today-badge">
          <div className="rp-today-dot" />
          <span>Updated today · 05:47 AM</span>
        </div>
      </div>

      {/* Featured AI Recommendation */}
      <div className="rp-featured">
        <div className="rp-featured-header">
          <div className="rp-featured-left">
            <span className="rp-feat-tag">Today's Top Recommendation</span>
            <h2 className="rp-feat-title">Alternate Wetting &amp; Drying</h2>
            <p className="rp-feat-desc">
              Your North Field (15.5 ha) is in the tillering stage with 68% soil moisture. 
              No rain expected for 4 days. AWD is optimal: allow natural drying to −15 cm, 
              then re-flood to 3 cm. Repeat every 7–10 days.
            </p>
          </div>
          <div className="rp-conf-wrap">
            <div className="rp-conf-circle">
              <svg viewBox="0 0 80 80" width="80" height="80">
                <circle cx="40" cy="40" r="34" fill="none" stroke="#F0EDE6" strokeWidth="5"/>
                <circle cx="40" cy="40" r="34" fill="none" stroke="#14532D" strokeWidth="5"
                  strokeDasharray={`${2*Math.PI*34*0.92} ${2*Math.PI*34*0.08}`}
                  strokeDashoffset={2*Math.PI*34*0.25}
                  strokeLinecap="round"/>
              </svg>
              <span className="rp-conf-pct">92%</span>
            </div>
            <span className="rp-conf-lbl">Confidence</span>
          </div>
        </div>
        <div className="rp-feat-metrics">
          {[
            { icon:'💧', val:'38%', lbl:'Water Saved', bg:'#e8f4fd' },
            { icon:'🌾', val:'5.8 t/ha', lbl:'Yield Forecast', bg:'#f0f7ec' },
            { icon:'🌍', val:'−24%', lbl:'Net GWP', bg:'#faf3e8' },
            { icon:'⏱️', val:'7 days', lbl:'Cycle Duration', bg:'#f5f0fa' },
          ].map(m => (
            <div key={m.lbl} className="rp-feat-metric" style={{ background: m.bg }}>
              <div className="rp-fm-icon">{m.icon}</div>
              <div className="rp-fm-val">{m.val}</div>
              <div className="rp-fm-lbl">{m.lbl}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Strategy Comparison */}
      <div className="rp-section">
        <h3 className="rp-section-title">Strategy Comparison</h3>
        <div className="rp-strategy-tabs">
          {STRATEGIES.map(s => (
            <button key={s.key} className={`rp-strategy-tab${activeStrategy === s.key ? ' active' : ''}`}
              onClick={() => setActiveStrategy(s.key)}>
              <span>{s.icon}</span> {s.name}
            </button>
          ))}
        </div>
        <div className="rp-strategy-panel">
          <p className="rp-strategy-desc">{strategy.desc}</p>
          <div className="rp-strategy-stats">
            <div className="rp-ss"><span className="rp-ss-val">{strategy.water}</span><span className="rp-ss-lbl">Water Saving</span></div>
            <div className="rp-ss"><span className="rp-ss-val">{strategy.gwp}</span><span className="rp-ss-lbl">GWP Change</span></div>
            <div className="rp-ss"><span className="rp-ss-val">{strategy.yield}</span><span className="rp-ss-lbl">Yield Impact</span></div>
          </div>
        </div>
      </div>

      {/* Alert List */}
      <div className="rp-section">
        <div className="rp-section-row">
          <h3 className="rp-section-title">All Recommendations</h3>
          <div className="rp-filters">
            {FILTERS.map(f => (
              <button key={f} className={`rp-filter-btn${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>{f}</button>
            ))}
          </div>
        </div>
        <div className="rp-rec-list">
          {filtered.length === 0 ? (
            <div className="rp-empty">No recommendations in this category.</div>
          ) : filtered.map(rec => {
            const us = urgencyStyle(rec.urgency);
            return (
              <div key={rec.id} className="rp-rec-item" style={{ background: us.bg, borderColor: us.border }}>
                <div className="rp-rec-left">
                  <div className="rp-rec-urgency-pill" style={{ background: us.pillBg, color: us.pill }}>
                    {rec.urgency === 'high' ? <AlertCircle size={12}/> : rec.urgency === 'medium' ? <Clock size={12}/> : <CheckCircle size={12}/>}
                    {rec.urgency}
                  </div>
                  <h4 className="rp-rec-title">{rec.title}</h4>
                  <p className="rp-rec-desc">{rec.description}</p>
                  <div className="rp-rec-metrics">
                    {rec.metrics.map(m => <span key={m} className="rp-rec-metric-tag">{m}</span>)}
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

      <style>{`
        .rp-root { display: flex; flex-direction: column; gap: 2.5rem; }

        .rp-header { display: flex; justify-content: space-between; align-items: flex-start; }
        .rp-eyebrow { font-size: .68rem; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: #14532D; margin-bottom: .4rem; }
        .rp-h1 { font-size: clamp(1.75rem, 3vw, 2.5rem); font-weight: 800; letter-spacing: -.025em; color: #161616; margin: 0 0 .4rem; }
        .rp-desc { font-size: .9rem; color: #787878; }
        .rp-today-badge { display: flex; align-items: center; gap: .5rem; font-size: .75rem; color: #787878; background: #fff; border: 1px solid #E8E2D9; border-radius: 999px; padding: .4rem 1rem; flex-shrink: 0; }
        .rp-today-dot { width: 7px; height: 7px; border-radius: 50%; background: #14532D; }

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
        .rp-section-row { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; }

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

        .rp-filters { display: flex; gap: .4rem; flex-wrap: wrap; }
        .rp-filter-btn { font-size: .78rem; font-weight: 600; color: #787878; background: #fff; border: 1px solid #E8E2D9; border-radius: 999px; padding: .4rem .9rem; cursor: pointer; transition: all .2s; }
        .rp-filter-btn.active { background: #161616; color: #fff; border-color: #161616; }
        .rp-filter-btn:hover:not(.active) { border-color: #161616; color: #161616; }

        .rp-rec-list { display: flex; flex-direction: column; gap: .75rem; }
        .rp-empty { text-align: center; color: #a09589; font-size: .875rem; padding: 3rem; background: #fff; border-radius: 16px; border: 1px dashed #E8E2D9; }
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
    </div>
  );
}
