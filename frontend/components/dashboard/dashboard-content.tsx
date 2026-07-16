'use client';

import Image from 'next/image';
import { Field, WeatherData, Recommendation } from '@/lib/mock-data';
import { Droplets, ThermometerSun, Wind, AlertCircle, CheckCircle, Clock, ArrowRight, TrendingUp } from 'lucide-react';

interface DashboardContentProps {
  fields: Field[];
  weather: WeatherData[];
  recommendations: Recommendation[];
}

const weatherIcon = (c: string) => {
  if (c === 'sunny') return '☀️';
  if (c === 'rainy') return '🌧️';
  if (c === 'cloudy') return '☁️';
  return '⛅';
};

const urgencyColor = (u: string) => {
  if (u === 'high') return { bg: '#fdf2f0', border: '#e8b4b0', dot: '#C0392B', label: 'Urgent' };
  if (u === 'medium') return { bg: '#fdf8ed', border: '#e8d4a0', dot: '#D4A017', label: 'Medium' };
  return { bg: '#f0f7ec', border: '#c0d9b4', dot: '#14532D', label: 'Normal' };
};

export function DashboardContent({ fields, weather, recommendations }: DashboardContentProps) {
  const totalArea = fields.reduce((s, f) => s + f.area, 0);
  const avgMoisture = fields.length > 0 ? Math.round(fields.reduce((s, f) => s + f.moisture, 0) / fields.length) : 0;
  const criticals = recommendations.filter(r => r.urgency === 'high').length;
  const topRec = recommendations[0];

  return (
    <div className="db-root">

      {/* ── Greeting ── */}
      <div className="db-greeting">
        <div>
          <p className="db-greeting-sub">Wednesday, 16 July 2025</p>
          <h1 className="db-greeting-h1">Good morning, Pak Farmer 👋</h1>
          <p className="db-greeting-desc">Here's your farm overview for today. 1 critical alert needs your attention.</p>
        </div>
        <div className="db-greeting-badge">
          <div className="db-greeting-badge-dot" />
          <span>Sync: 5 min ago</span>
        </div>
      </div>

      {/* ── Metric Cards ── */}
      <div className="db-metrics">
        {[
          { label: 'Total Farm Area', value: `${totalArea.toFixed(1)} ha`, sub: `${fields.length} active fields`, icon: '🌾', trend: '+2 fields this season' },
          { label: 'Avg. Soil Moisture', value: `${avgMoisture}%`, sub: 'Across all fields', icon: '💧', trend: 'Optimal range: 65–80%' },
          { label: 'Critical Alerts', value: String(criticals), sub: criticals === 0 ? 'All fields healthy' : 'Requires attention', icon: '⚠️', trend: 'Check recommendations' },
          { label: 'AI Accuracy', value: '92%', sub: 'Recommendation precision', icon: '🤖', trend: '↑ 3% this month' },
        ].map(m => (
          <div key={m.label} className="db-metric-card">
            <div className="db-metric-icon">{m.icon}</div>
            <div className="db-metric-body">
              <div className="db-metric-label">{m.label}</div>
              <div className="db-metric-value">{m.value}</div>
              <div className="db-metric-sub">{m.sub}</div>
            </div>
            <div className="db-metric-trend">{m.trend}</div>
          </div>
        ))}
      </div>

      {/* ── Main content: Recommendation + Weather ── */}
      <div className="db-main-grid">

        {/* AI Recommendation Centerpiece */}
        <div className="db-rec-panel">
          <div className="db-rec-panel-header">
            <div>
              <div className="db-panel-eyebrow">AI Recommendation · Today</div>
              <h2 className="db-panel-h2">Alternate Wetting &amp; Drying</h2>
            </div>
            <div className="db-confidence-badge">
              <div className="db-conf-ring">
                <svg viewBox="0 0 56 56" width="56" height="56">
                  <circle cx="28" cy="28" r="23" fill="none" stroke="#E8E2D9" strokeWidth="3.5"/>
                  <circle cx="28" cy="28" r="23" fill="none" stroke="#14532D" strokeWidth="3.5"
                    strokeDasharray={`${2*Math.PI*23*0.92} ${2*Math.PI*23*0.08}`}
                    strokeDashoffset={2*Math.PI*23*0.25}
                    strokeLinecap="round"/>
                </svg>
                <span className="db-conf-pct">92%</span>
              </div>
              <span className="db-conf-label">Confidence</span>
            </div>
          </div>

          <p className="db-rec-desc">
            Based on soil moisture at {avgMoisture}%, no rain forecast for 3 days, and your fields being in 
            the tillering stage — AGRIVO recommends Alternate Wetting &amp; Drying. Allow field to dry until 
            15 cm below surface, then re-flood to 2–5 cm.
          </p>

          {/* Strategy metrics */}
          <div className="db-rec-stats">
            {[
              { icon: '💧', val: '38%', label: 'Water Saving' },
              { icon: '🌾', val: '5.8 t/ha', label: 'Yield Forecast' },
              { icon: '🌍', val: '−24%', label: 'Net GWP' },
            ].map(s => (
              <div key={s.label} className="db-rec-stat">
                <span>{s.icon}</span>
                <div className="db-rec-stat-val">{s.val}</div>
                <div className="db-rec-stat-lbl">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Timeline */}
          <div className="db-timeline">
            {[
              { day: 'Day 1–3', action: 'Let field dry naturally' },
              { day: 'Day 4', action: 'Check water level (−15 cm)' },
              { day: 'Day 5', action: 'Re-flood to 2–5 cm depth' },
            ].map(t => (
              <div key={t.day} className="db-timeline-item">
                <div className="db-timeline-dot" />
                <span className="db-timeline-day">{t.day}</span>
                <span className="db-timeline-action">{t.action}</span>
              </div>
            ))}
          </div>

          <a href="/recommendations" className="db-rec-link">
            View all recommendations <ArrowRight size={14} />
          </a>
        </div>

        {/* Weather panel */}
        <div className="db-weather-panel">
          <div className="db-panel-eyebrow">Weather Forecast</div>
          <div className="db-weather-today">
            <div>
              <div className="db-weather-temp">{weather[0].temperature}°C</div>
              <div className="db-weather-cond">{weather[0].condition.replace('-', ' ')}</div>
            </div>
            <div className="db-weather-emoji">{weatherIcon(weather[0].condition)}</div>
          </div>
          <div className="db-weather-details">
            <div className="db-weather-detail">
              <Droplets size={14} className="db-wd-icon" />
              <span>Humidity</span>
              <span className="db-wd-val">{weather[0].humidity}%</span>
            </div>
            <div className="db-weather-detail">
              <Wind size={14} className="db-wd-icon" />
              <span>Wind</span>
              <span className="db-wd-val">{weather[0].windSpeed} km/h</span>
            </div>
            <div className="db-weather-detail">
              <ThermometerSun size={14} className="db-wd-icon" />
              <span>Rain</span>
              <span className="db-wd-val">{weather[0].precipitation}mm</span>
            </div>
          </div>
          <div className="db-weather-week-label">7-Day Outlook</div>
          <div className="db-weather-week">
            {weather.map((d, i) => (
              <div key={i} className="db-weather-day">
                <div className="db-weather-day-name">{i === 0 ? 'Today' : new Date(d.date).toLocaleDateString('en', {weekday:'short'})}</div>
                <div className="db-weather-day-icon">{weatherIcon(d.condition)}</div>
                <div className="db-weather-day-temp">{d.temperature}°</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Alerts ── */}
      {recommendations.length > 0 && (
        <div className="db-section">
          <div className="db-section-header">
            <h3 className="db-section-title">Active Alerts</h3>
            <a href="/recommendations" className="db-see-all">See all →</a>
          </div>
          <div className="db-alerts-list">
            {recommendations.map(rec => {
              const uc = urgencyColor(rec.urgency);
              return (
                <div key={rec.id} className="db-alert-item" style={{ background: uc.bg, borderColor: uc.border }}>
                  <div className="db-alert-dot" style={{ background: uc.dot }} />
                  <div className="db-alert-body">
                    <div className="db-alert-title">{rec.title}</div>
                    <div className="db-alert-desc">{rec.description}</div>
                    <div className="db-alert-meta">
                      <span className="db-alert-tag">{rec.category}</span>
                      <span className="db-alert-urgency" style={{ color: uc.dot }}>{uc.label}</span>
                    </div>
                  </div>
                  <ArrowRight size={16} color="#a09589" />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Fields Grid ── */}
      <div className="db-section">
        <div className="db-section-header">
          <h3 className="db-section-title">Your Fields</h3>
          <a href="/field-analysis" className="db-see-all">View analysis →</a>
        </div>
        <div className="db-fields-grid">
          {fields.map(field => (
            <div key={field.id} className="db-field-card">
              <div className="db-field-img-wrap">
                <Image src="/rice-field-editorial.png" alt={field.name} fill className="db-field-img" />
                <div className="db-field-img-overlay" />
                <div className="db-field-crop-badge">{field.crop}</div>
              </div>
              <div className="db-field-body">
                <div className="db-field-name">{field.name}</div>
                <div className="db-field-meta">{field.area} ha · {field.location}</div>
                <div className="db-field-metrics">
                  <div className="db-field-metric">
                    <span className="db-fm-label">Moisture</span>
                    <div className="db-fm-bar-wrap">
                      <div className="db-fm-bar" style={{ width: `${field.moisture}%`, background: field.moisture < 60 ? '#C0392B' : '#14532D' }} />
                    </div>
                    <span className="db-fm-val">{field.moisture}%</span>
                  </div>
                  <div className="db-field-metrics-row">
                    <div className="db-fm-pill">pH {field.ph}</div>
                    <div className="db-fm-pill">{field.temperature}°C</div>
                    <div className="db-fm-pill">N:{field.nitrogen}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .db-root { display: flex; flex-direction: column; gap: 2.5rem; }

        /* Greeting */
        .db-greeting { display: flex; justify-content: space-between; align-items: flex-start; }
        .db-greeting-sub { font-size: .75rem; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; color: #a09589; margin-bottom: .4rem; }
        .db-greeting-h1 { font-size: clamp(1.6rem, 3vw, 2.25rem); font-weight: 800; letter-spacing: -.025em; color: #161616; margin: 0 0 .4rem; }
        .db-greeting-desc { font-size: .9rem; color: #787878; }
        .db-greeting-badge {
          display: flex; align-items: center; gap: .5rem;
          font-size: .75rem; color: #787878; background: #fff;
          border: 1px solid #E8E2D9; border-radius: 999px; padding: .4rem 1rem;
          flex-shrink: 0;
        }
        .db-greeting-badge-dot { width: 7px; height: 7px; border-radius: 50%; background: #14532D; }

        /* Metrics */
        .db-metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
        .db-metric-card {
          background: #fff; border: 1px solid #E8E2D9; border-radius: 20px;
          padding: 1.5rem; display: flex; flex-direction: column; gap: .75rem;
          transition: box-shadow .2s, transform .2s;
        }
        .db-metric-card:hover { box-shadow: 0 8px 28px rgba(0,0,0,0.08); transform: translateY(-2px); }
        .db-metric-icon { font-size: 1.5rem; }
        .db-metric-body { flex: 1; }
        .db-metric-label { font-size: .72rem; font-weight: 600; color: #a09589; letter-spacing: .06em; text-transform: uppercase; margin-bottom: .25rem; }
        .db-metric-value { font-size: 2rem; font-weight: 900; letter-spacing: -.03em; color: #161616; line-height: 1; }
        .db-metric-sub { font-size: .78rem; color: #787878; margin-top: .25rem; }
        .db-metric-trend { font-size: .72rem; color: #14532D; font-weight: 600; border-top: 1px solid #F0EDE6; padding-top: .65rem; }

        /* Main Grid */
        .db-main-grid { display: grid; grid-template-columns: 1.6fr 1fr; gap: 1.5rem; }

        /* Rec Panel */
        .db-rec-panel {
          background: #fff; border: 1px solid #E8E2D9; border-radius: 24px; padding: 2rem;
          box-shadow: 0 4px 16px rgba(0,0,0,0.05);
        }
        .db-rec-panel-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.25rem; }
        .db-panel-eyebrow { font-size: .68rem; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: #14532D; margin-bottom: .4rem; }
        .db-panel-h2 { font-size: 1.5rem; font-weight: 800; letter-spacing: -.02em; color: #161616; margin: 0; }
        .db-confidence-badge { display: flex; flex-direction: column; align-items: center; gap: .25rem; flex-shrink: 0; }
        .db-conf-ring { position: relative; }
        .db-conf-pct { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: .8rem; font-weight: 800; color: #14532D; }
        .db-conf-label { font-size: .62rem; color: #a09589; font-weight: 600; }
        .db-rec-desc { font-size: .875rem; color: #787878; line-height: 1.75; margin-bottom: 1.5rem; }
        .db-rec-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
        .db-rec-stat { background: #FAF8F3; border: 1px solid #E8E2D9; border-radius: 14px; padding: 1rem; text-align: center; font-size: .9rem; display: flex; flex-direction: column; gap: .3rem; }
        .db-rec-stat-val { font-size: 1.4rem; font-weight: 800; color: #161616; }
        .db-rec-stat-lbl { font-size: .7rem; color: #787878; }
        .db-timeline { display: flex; flex-direction: column; gap: .6rem; margin-bottom: 1.5rem; }
        .db-timeline-item { display: grid; grid-template-columns: 10px 80px 1fr; gap: .75rem; align-items: center; font-size: .8rem; }
        .db-timeline-dot { width: 8px; height: 8px; border-radius: 50%; background: #14532D; }
        .db-timeline-day { color: #14532D; font-weight: 700; }
        .db-timeline-action { color: #787878; }
        .db-rec-link { display: inline-flex; align-items: center; gap: .4rem; font-size: .85rem; font-weight: 600; color: #14532D; text-decoration: none; border-bottom: 1px solid #14532D; padding-bottom: .1rem; }

        /* Weather Panel */
        .db-weather-panel { background: #fff; border: 1px solid #E8E2D9; border-radius: 24px; padding: 1.75rem; }
        .db-weather-today { display: flex; justify-content: space-between; align-items: center; margin: 1rem 0; }
        .db-weather-temp { font-size: 3rem; font-weight: 900; letter-spacing: -.04em; color: #161616; line-height: 1; }
        .db-weather-cond { font-size: .85rem; color: #787878; margin-top: .25rem; text-transform: capitalize; }
        .db-weather-emoji { font-size: 2.5rem; }
        .db-weather-details { display: flex; flex-direction: column; gap: .5rem; margin-bottom: 1.5rem; }
        .db-weather-detail { display: flex; align-items: center; gap: .6rem; font-size: .8rem; color: #787878; }
        .db-wd-icon { color: #a09589; flex-shrink: 0; }
        .db-wd-val { margin-left: auto; font-weight: 600; color: #161616; }
        .db-weather-week-label { font-size: .68rem; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: #a09589; margin-bottom: .75rem; }
        .db-weather-week { display: grid; grid-template-columns: repeat(7, 1fr); gap: .4rem; }
        .db-weather-day { display: flex; flex-direction: column; align-items: center; gap: .3rem; padding: .5rem .25rem; border-radius: 10px; background: #FAF8F3; }
        .db-weather-day-name { font-size: .6rem; font-weight: 600; color: #a09589; }
        .db-weather-day-icon { font-size: 1rem; }
        .db-weather-day-temp { font-size: .72rem; font-weight: 700; color: #161616; }

        /* Section */
        .db-section { display: flex; flex-direction: column; gap: 1rem; }
        .db-section-header { display: flex; justify-content: space-between; align-items: center; }
        .db-section-title { font-size: 1.1rem; font-weight: 800; color: #161616; margin: 0; letter-spacing: -.01em; }
        .db-see-all { font-size: .8rem; font-weight: 600; color: #14532D; text-decoration: none; }
        .db-see-all:hover { text-decoration: underline; }

        /* Alerts */
        .db-alerts-list { display: flex; flex-direction: column; gap: .75rem; }
        .db-alert-item {
          display: flex; align-items: center; gap: 1rem;
          border: 1px solid; border-radius: 16px; padding: 1.25rem;
          cursor: pointer; transition: transform .2s, box-shadow .2s;
        }
        .db-alert-item:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(0,0,0,0.07); }
        .db-alert-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .db-alert-body { flex: 1; }
        .db-alert-title { font-size: .9rem; font-weight: 700; color: #161616; margin-bottom: .25rem; }
        .db-alert-desc { font-size: .8rem; color: #787878; line-height: 1.5; margin-bottom: .5rem; }
        .db-alert-meta { display: flex; gap: .75rem; align-items: center; }
        .db-alert-tag { font-size: .65rem; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: #a09589; background: rgba(0,0,0,0.04); padding: .2rem .6rem; border-radius: 999px; }
        .db-alert-urgency { font-size: .72rem; font-weight: 700; }

        /* Fields */
        .db-fields-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.25rem; }
        .db-field-card { background: #fff; border: 1px solid #E8E2D9; border-radius: 20px; overflow: hidden; transition: box-shadow .2s, transform .2s; }
        .db-field-card:hover { box-shadow: 0 8px 28px rgba(0,0,0,0.1); transform: translateY(-3px); }
        .db-field-img-wrap { position: relative; height: 140px; overflow: hidden; }
        .db-field-img { object-fit: cover; transition: transform .4s ease; }
        .db-field-card:hover .db-field-img { transform: scale(1.05); }
        .db-field-img-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.35), transparent); }
        .db-field-crop-badge {
          position: absolute; bottom: .75rem; left: .75rem;
          font-size: .65rem; font-weight: 700; text-transform: uppercase; letter-spacing: .08em;
          color: #fff; background: rgba(20,83,45,0.85); padding: .25rem .65rem; border-radius: 999px;
        }
        .db-field-body { padding: 1.25rem; }
        .db-field-name { font-size: .95rem; font-weight: 700; color: #161616; margin-bottom: .2rem; }
        .db-field-meta { font-size: .75rem; color: #a09589; margin-bottom: .85rem; }
        .db-field-metrics { display: flex; flex-direction: column; gap: .5rem; }
        .db-field-metric { display: flex; align-items: center; gap: .5rem; }
        .db-fm-label { font-size: .65rem; font-weight: 600; color: #a09589; width: 52px; flex-shrink: 0; }
        .db-fm-bar-wrap { flex: 1; height: 4px; background: #F0EDE6; border-radius: 999px; overflow: hidden; }
        .db-fm-bar { height: 100%; border-radius: 999px; transition: width .6s ease; }
        .db-fm-val { font-size: .72rem; font-weight: 700; color: #161616; width: 34px; text-align: right; }
        .db-field-metrics-row { display: flex; gap: .4rem; flex-wrap: wrap; }
        .db-fm-pill { font-size: .65rem; font-weight: 600; color: #5A6F45; background: #f0f7ec; padding: .2rem .55rem; border-radius: 999px; }

        @media (max-width: 1100px) {
          .db-metrics { grid-template-columns: repeat(2, 1fr); }
          .db-main-grid { grid-template-columns: 1fr; }
          .db-fields-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 680px) {
          .db-metrics { grid-template-columns: 1fr; }
          .db-fields-grid { grid-template-columns: 1fr; }
          .db-greeting { flex-direction: column; gap: 1rem; }
        }
      `}</style>
    </div>
  );
}
