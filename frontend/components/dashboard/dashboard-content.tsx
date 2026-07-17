'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Droplets, ThermometerSun, Wind, ArrowRight } from 'lucide-react';
import { CustomSelect } from '../ui/custom-select';

interface DashboardContentProps {
  fields: any[];
  selectedFieldId?: string;
  onFieldSelect?: (id: string) => void;
  weather: any;
  recommendations: any[];
  profile: any;
}

const weatherIcon = (c: string) => {
  if (!c) return '☁️';
  const cond = c.toLowerCase();
  if (cond.includes('sunny') || cond.includes('clear')) return '☀️';
  if (cond.includes('rain') || cond.includes('drizzle')) return '🌧️';
  if (cond.includes('cloud')) return '☁️';
  return '⛅';
};

const weatherBg = (c: string) => {
  if (!c) return 'url("https://images.unsplash.com/photo-1534088568595-a066f410cbda?auto=format&fit=crop&w=800&q=80")';
  const cond = c.toLowerCase();
  if (cond.includes('sunny') || cond.includes('clear')) 
    return 'url("https://images.unsplash.com/photo-1601297183305-6df142704ea2?auto=format&fit=crop&w=800&q=80")';
  if (cond.includes('rain') || cond.includes('drizzle')) 
    return 'url("https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=800&q=80")';
  if (cond.includes('cloud')) 
    return 'url("https://images.unsplash.com/photo-1534088568595-a066f410cbda?auto=format&fit=crop&w=800&q=80")';
  return 'url("https://images.unsplash.com/photo-1534088568595-a066f410cbda?auto=format&fit=crop&w=800&q=80")';
};

const urgencyColor = (u: string) => {
  const urg = (u || 'low').toLowerCase();
  if (urg === 'high' || urg === 'urgent') return { bg: '#fdf2f0', border: '#e8b4b0', dot: '#C0392B', label: 'Urgent' };
  if (urg === 'medium') return { bg: '#fdf8ed', border: '#e8d4a0', dot: '#D4A017', label: 'Medium' };
  return { bg: '#f0f7ec', border: '#c0d9b4', dot: '#14532D', label: 'Normal' };
};

export function DashboardContent({ fields, selectedFieldId, onFieldSelect, weather, recommendations, profile }: DashboardContentProps) {
  const totalArea = fields.reduce((s, f) => s + f.area, 0);
  const avgMoisture = fields.length > 0 ? Math.round(fields.reduce((s, f) => s + f.moisture, 0) / fields.length) : 0;
  const criticals = recommendations.filter(r => (r.urgency || '').toLowerCase() === 'high').length;
  
  // Real latest recommendation
  const topRec = recommendations[0];

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Extract current weather from API response (mapping from database snapshot layout)
  const todayWeather = weather ? {
    temperature_mean: weather.temperature_c,
    relative_humidity_mean: weather.humidity_percent,
    precipitation_sum: weather.precipitation_mm,
    wind_speed_max: weather.wind_speed_kmh,
    weather_condition: weather.weather_condition
  } : {
    temperature_mean: 28,
    relative_humidity_mean: 75,
    precipitation_sum: 0,
    wind_speed_max: 10,
    weather_condition: 'sunny'
  };

  const forecastList = weather?.forecast || [];

  return (
    <div className="db-root">
      {/* ── Greeting & Field Selector ── */}
      <div className="db-greeting" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <p className="db-greeting-sub">{currentDate}</p>
          <h1 className="db-greeting-h1">Good morning, {profile?.full_name || 'Farmer'}</h1>
          <p className="db-greeting-desc">
            {fields.length === 0 
              ? 'Welcome to AGRIVO! Get started by adding your first rice field.'
              : `Here's your farm overview for today. ${criticals === 0 ? 'All fields are healthy.' : `${criticals} critical alert(s) need attention.`}`}
          </p>
        </div>
        {fields.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', minWidth: '220px' }}>
            <label style={{ fontSize: '0.68rem', fontWeight: 800, color: '#a09589', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Active Field</label>
            <CustomSelect
              value={selectedFieldId || ''}
              onChange={(val) => onFieldSelect?.(val)}
              options={fields.map(f => ({
                value: f.id,
                label: `${f.name} (${f.area.toFixed(1)} ha)`
              }))}
            />
          </div>
        )}
      </div>

      {/* ── Metric Cards ── */}
      <div className="db-metrics">
        {[
          { label: 'Total Farm Area', value: `${totalArea.toFixed(1)} ha`, sub: `${fields.length} active fields`, trend: 'Map and soil-type synced' },
          { label: 'Avg. Soil Moisture', value: `${avgMoisture}%`, sub: 'Across all fields', trend: 'Optimal range: 65–80%' },
          { label: 'Critical Alerts', value: String(criticals), sub: criticals === 0 ? 'No immediate threats' : 'Action recommended', trend: 'Check AI Engine output' },
        ].map(m => (
          <div key={m.label} className="db-metric-card">
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
          {topRec ? (
            <>
              <div className="db-rec-panel-header">
                <div>
                  <div className="db-panel-eyebrow">AI Recommendation · Latest</div>
                  <h2 className="db-panel-h2">{topRec.recommended_strategy_display}</h2>
                </div>
              </div>

              <p className="db-rec-desc">{topRec.description}</p>

              {/* Strategy metrics */}
              {topRec.prediction && (
                <div className="db-rec-stats">
                  {[
                    { icon: '💧', val: `${Math.round(topRec.prediction.water_saving_percent)}%`, label: 'Water Saving' },
                    { icon: '🌾', val: `${parseFloat(topRec.prediction.expected_yield_ton_per_ha).toFixed(1)} t/ha`, label: 'Yield Forecast' },
                    { icon: '🌍', val: `${topRec.prediction.net_gwp_reduction_percent > 0 ? '+' : ''}${Math.round(topRec.prediction.net_gwp_reduction_percent)}%`, label: 'Net GWP' },
                  ].map(s => (
                    <div key={s.label} className="db-rec-stat">
                      <span>{s.icon}</span>
                      <div className="db-rec-stat-val">{s.val}</div>
                      <div className="db-rec-stat-lbl">{s.label}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Timeline implementation text */}
              {topRec.explanation?.how_to_implement && (
                <div style={{ background: '#FAF8F3', padding: '1rem', borderRadius: '12px', border: '1px solid #E8E2D9', marginBottom: '1.5rem', fontSize: '0.85rem', color: '#555' }}>
                  <strong style={{ display: 'block', color: '#161616', marginBottom: '0.25rem' }}>Implementation Guidance:</strong>
                  {topRec.explanation.how_to_implement}
                </div>
              )}

              <Link href="/recommendations" className="db-rec-link">
                View recommendation history <ArrowRight size={14} />
              </Link>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '220px', textAlign: 'center', color: '#787878' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🤖</div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#161616', marginBottom: '0.5rem' }}>No Active Recommendation</h3>
              <p style={{ fontSize: '0.85rem', maxWidth: '320px', margin: '0 auto 1.5rem', lineHeight: 1.6 }}>
                {fields.length === 0 
                  ? 'Please register your first field before running the AI Engine.' 
                  : "Click 'Run AI Engine' on the Recommendations page to evaluate and compute your first watering strategy."}
              </p>
              {fields.length > 0 && (
                <Link href="/recommendations" style={{ background: '#14532D', color: '#fff', padding: '0.6rem 1.2rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700, textDecoration: 'none' }}>
                  Go to Recommendations
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Weather panel */}
        <div className="db-weather-panel" style={{ 
          backgroundImage: `linear-gradient(to bottom, rgba(255,255,255,0.7), rgba(255,255,255,0.95)), ${weatherBg(todayWeather.weather_condition)}`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)'
        }}>
          <div className="db-panel-eyebrow">Weather Forecast</div>
          {weather ? (
            <>
              <div className="db-weather-today">
                <div>
                  <div className="db-weather-temp">{Math.round(todayWeather.temperature_mean)}°C</div>
                  <div className="db-weather-cond">{todayWeather.weather_condition.replace('-', ' ')}</div>
                </div>
                <div className="db-weather-emoji">{weatherIcon(todayWeather.weather_condition)}</div>
              </div>
              <div className="db-weather-details">
                <div className="db-weather-detail">
                  <Droplets size={14} className="db-wd-icon" />
                  <span>Humidity</span>
                  <span className="db-wd-val">{Math.round(todayWeather.relative_humidity_mean)}%</span>
                </div>
                <div className="db-weather-detail">
                  <Wind size={14} className="db-wd-icon" />
                  <span>Wind</span>
                  <span className="db-wd-val">{Math.round(todayWeather.wind_speed_max)} km/h</span>
                </div>
                <div className="db-weather-detail">
                  <ThermometerSun size={14} className="db-wd-icon" />
                  <span>Precipitation</span>
                  <span className="db-wd-val">{todayWeather.precipitation_sum} mm</span>
                </div>
              </div>
              
              {forecastList && forecastList.length > 0 && (
                <>
                  <div className="db-weather-week-label">Outlook</div>
                  <div className="db-weather-week">
                    {forecastList.slice(0, 4).map((d: any, i: number) => {
                      const t_mean = d.temperature_mean ?? ((d.temperature_max + d.temperature_min) / 2);
                      return (
                        <div key={i} className="db-weather-day">
                          <div className="db-weather-day-name">
                            {i === 0 ? 'Today' : new Date(d.date).toLocaleDateString('en', { weekday: 'short' })}
                          </div>
                          <div className="db-weather-day-icon">{weatherIcon(d.weather_condition)}</div>
                          <div className="db-weather-day-temp">{Math.round(t_mean)}°</div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '220px', textAlign: 'center', color: '#787878' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⛅</div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#161616', marginBottom: '0.25rem' }}>No Weather Data</h3>
              <p style={{ fontSize: '0.8rem', maxWidth: '240px', margin: '0 auto', lineHeight: 1.5 }}>
                Weather forecast will load automatically once a field is created.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Recommendation History ── */}
      {recommendations.length > 0 && (
        <div className="db-section">
          <div className="db-section-header">
            <h3 className="db-section-title">Recommendation History</h3>
            <Link href="/recommendations" className="db-see-all">Open AI Engine →</Link>
          </div>
          <div className="db-alerts-list">
            {recommendations.slice(0, 3).map(rec => {
              const dateObj = new Date(rec.created_at || new Date());
              return (
                <div key={rec.id} className="db-alert-item" style={{ background: '#fff', borderColor: '#E8E2D9' }}>
                  <div className="db-alert-dot" style={{ background: '#14532D' }} />
                  <div className="db-alert-body">
                    <div className="db-alert-title">{rec.recommended_strategy_display || 'Recommendation'}</div>
                    <div className="db-alert-desc" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {rec.description || 'Strategy detail.'}
                    </div>
                    <div className="db-alert-meta" style={{ marginTop: '0.75rem' }}>
                      <span className="db-alert-tag">{dateObj.toLocaleDateString()}</span>
                      {rec.prediction && (
                        <>
                          <span className="db-alert-tag">💧 {Math.round(rec.prediction.water_saving_percent)}% Water Saved</span>
                          <span className="db-alert-tag">🌾 {parseFloat(rec.prediction.expected_yield_ton_per_ha).toFixed(1)} t/ha</span>
                        </>
                      )}
                    </div>
                  </div>
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
          <Link href="/field-analysis" className="db-see-all">View analysis →</Link>
        </div>

        {fields.length > 0 ? (
          <div className="db-fields-grid">
            {fields.map(field => (
              <div key={field.id} className="db-field-card">
                <div className="db-field-img-wrap">
                  <Image src="/rice-field-editorial.png" alt={field.name} fill className="db-field-img" />
                  <div className="db-field-img-overlay" />
                </div>
                <div className="db-field-body">
                  <div className="db-field-name">{field.name}</div>
                  <div className="db-field-meta">{field.area} ha · Coordinate: {field.location}</div>
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
        ) : (
          <div style={{ background: '#fff', border: '1px solid #E8E2D9', borderRadius: '20px', padding: '3rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🌾</div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#161616', marginBottom: '0.5rem' }}>No Registered Fields</h3>
            <p style={{ fontSize: '0.85rem', color: '#787878', maxWidth: '360px', margin: '0 auto 1.5rem', lineHeight: 1.6 }}>
              Add your first agricultural field with location and rice variety to start monitoring water, weather, and AI recommendations.
            </p>
            <Link href="/field-analysis" style={{ background: '#14532D', color: '#fff', padding: '0.75rem 1.5rem', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 700, textDecoration: 'none' }}>
              Add Your First Field
            </Link>
          </div>
        )}
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
        .db-metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
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
          box-shadow: 0 4px 16px rgba(0,0,0,0.05); display: flex; flex-direction: column; justify-content: space-between;
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
        .db-rec-link { display: inline-flex; align-items: center; gap: .4rem; font-size: .85rem; font-weight: 600; color: #14532D; text-decoration: none; border-bottom: 1px solid #14532D; padding-bottom: .1rem; width: fit-content; }

        /* Weather Panel */
        .db-weather-panel { background: #fff; border: 1px solid #E8E2D9; border-radius: 24px; padding: 1.5rem; display: flex; flex-direction: column; justify-content: flex-start; gap: 1rem; }
        .db-weather-today { display: flex; justify-content: space-between; align-items: center; background: #FAF8F3; border: 1px solid #F0EDE6; border-radius: 16px; padding: 1rem 1.25rem; }
        .db-weather-temp { font-size: 2.2rem; font-weight: 900; letter-spacing: -.03em; color: #161616; line-height: 1; }
        .db-weather-cond { font-size: .8rem; color: #787878; margin-top: .15rem; text-transform: capitalize; }
        .db-weather-emoji { font-size: 2.2rem; }
        .db-weather-details { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.6rem; }
        .db-weather-detail { background: #fff; border: 1px solid #E8E2D9; border-radius: 12px; padding: 0.65rem 0.5rem; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 0.2rem; font-size: 0.72rem; }
        .db-weather-detail span { color: #787878; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
        .db-wd-icon { color: #a09589; flex-shrink: 0; }
        .db-wd-val { font-size: 0.82rem; font-weight: 700; color: #161616; }
        .db-weather-week-label { font-size: .65rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: #a09589; margin-top: 0.25rem; }
        .db-weather-week { display: grid; grid-template-columns: repeat(4, 1fr); gap: .5rem; }
        .db-weather-day { display: flex; flex-direction: column; align-items: center; gap: .25rem; padding: .6rem .25rem; border-radius: 12px; background: #FAF8F3; border: 1px solid #F0EDE6; }
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
