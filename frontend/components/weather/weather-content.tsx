'use client';

import { WeatherData } from '@/lib/mock-data';
import { Droplets, Wind, Thermometer, Eye } from 'lucide-react';

interface Props { weather: WeatherData[]; }

const weatherIcon = (c: string) => {
  if (c === 'sunny') return '☀️';
  if (c === 'rainy') return '🌧️';
  if (c === 'cloudy') return '☁️';
  return '⛅';
};

const weatherBg = (c: string) => {
  if (c === 'sunny') return 'linear-gradient(135deg, #fef3c7, #fde68a)';
  if (c === 'rainy') return 'linear-gradient(135deg, #dbeafe, #bfdbfe)';
  if (c === 'cloudy') return 'linear-gradient(135deg, #f1f5f9, #e2e8f0)';
  return 'linear-gradient(135deg, #f0fdf4, #dcfce7)';
};

export function WeatherContent({ weather }: Props) {
  const today = weather[0];

  return (
    <div className="wc-root">

      <div className="wc-header">
        <div>
          <p className="wc-eyebrow">Weather Intelligence</p>
          <h1 className="wc-h1">Forecast &amp; Conditions</h1>
          <p className="wc-desc">Hyper-local 7-day forecast for your farm location in Klaten, Central Java.</p>
        </div>
        <div className="wc-location-badge">
          <span>📍</span> Klaten, Central Java
        </div>
      </div>

      {/* Today hero */}
      <div className="wc-today" style={{ background: weatherBg(today.condition) }}>
        <div className="wc-today-left">
          <div className="wc-today-label">Today</div>
          <div className="wc-today-temp">{today.temperature}<span className="wc-temp-unit">°C</span></div>
          <div className="wc-today-condition">{today.condition.replace('-', ' ')}</div>
          <div className="wc-today-desc">
            {today.condition === 'sunny'
              ? 'Clear skies expected throughout the day. Optimal conditions for field work.'
              : today.condition === 'rainy'
              ? 'Rainfall expected. Consider delaying irrigation — natural water input will be sufficient.'
              : 'Partly cloudy conditions. Good visibility for field monitoring.'}
          </div>
          <div className="wc-irrig-impact">
            <span className="wc-irrig-dot" style={{ background: today.precipitation > 10 ? '#C0392B' : '#14532D' }} />
            <span className="wc-irrig-text">
              {today.precipitation > 10
                ? 'Skip irrigation today — rain provides sufficient water'
                : 'Proceed with recommended irrigation schedule'}
            </span>
          </div>
        </div>
        <div className="wc-today-right">
          <div className="wc-today-icon">{weatherIcon(today.condition)}</div>
          <div className="wc-today-stats">
            {[
              { icon: <Droplets size={16}/>, label: 'Humidity', val: `${today.humidity}%` },
              { icon: <Wind size={16}/>, label: 'Wind', val: `${today.windSpeed} km/h` },
              { icon: <Thermometer size={16}/>, label: 'Rain', val: `${today.precipitation} mm` },
            ].map(s => (
              <div key={s.label} className="wc-today-stat">
                <div className="wc-ts-icon">{s.icon}</div>
                <div>
                  <div className="wc-ts-label">{s.label}</div>
                  <div className="wc-ts-val">{s.val}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 7-day strip */}
      <div className="wc-section">
        <h3 className="wc-section-title">7-Day Outlook</h3>
        <div className="wc-week">
          {weather.map((d, i) => (
            <div key={i} className={`wc-day-card${i === 0 ? ' today' : ''}`}>
              <div className="wc-day-name">
                {i === 0 ? 'Today' : d.date.toLocaleDateString('en', { weekday: 'short' })}
              </div>
              <div className="wc-day-date">
                {d.date.toLocaleDateString('en', { day: 'numeric', month: 'short' })}
              </div>
              <div className="wc-day-icon">{weatherIcon(d.condition)}</div>
              <div className="wc-day-temp">{d.temperature}°</div>
              <div className="wc-day-hum">💧 {d.humidity}%</div>
              {d.precipitation > 0 && (
                <div className="wc-day-rain">🌧 {d.precipitation}mm</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Impact on irrigation */}
      <div className="wc-section">
        <h3 className="wc-section-title">Irrigation Impact This Week</h3>
        <div className="wc-impact-grid">
          {weather.map((d, i) => {
            const skip = d.precipitation >= 10;
            const reduce = d.precipitation > 0 && d.precipitation < 10;
            return (
              <div key={i} className="wc-impact-card">
                <div className="wc-impact-day">
                  {i === 0 ? 'Today' : d.date.toLocaleDateString('en', { weekday: 'short', day: 'numeric' })}
                </div>
                <div className="wc-impact-icon">{weatherIcon(d.condition)}</div>
                <div
                  className="wc-impact-action"
                  style={{
                    color: skip ? '#C0392B' : reduce ? '#b07d10' : '#14532D',
                    background: skip ? '#fde8e5' : reduce ? '#fdf0d0' : '#e8f5ee',
                  }}
                >
                  {skip ? '⛔ Skip' : reduce ? '⬇ Reduce' : '✅ Proceed'}
                </div>
                {d.precipitation > 0 && (
                  <div className="wc-impact-rain">{d.precipitation}mm rain</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Agronomic tips */}
      <div className="wc-section">
        <h3 className="wc-section-title">Agronomic Insights</h3>
        <div className="wc-tips">
          {[
            { icon: '🌡️', title: 'Temperature in Range', desc: `At ${today.temperature}°C, rice growth is optimal. Tillering and root development proceed well between 20–35°C.` },
            { icon: '💨', title: 'Wind Speed Moderate', desc: `${today.windSpeed} km/h wind helps reduce leaf fungal disease risk. Avoid spraying pesticides on windy days.` },
            { icon: '💧', title: 'Humidity Advisory', desc: `Relative humidity at ${today.humidity}% is in the preferred range. Monitor for blast fungus if humidity exceeds 90% for 3+ days.` },
          ].map(t => (
            <div key={t.title} className="wc-tip-card">
              <div className="wc-tip-icon">{t.icon}</div>
              <div>
                <div className="wc-tip-title">{t.title}</div>
                <div className="wc-tip-desc">{t.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .wc-root { display: flex; flex-direction: column; gap: 2.5rem; }

        .wc-header { display: flex; justify-content: space-between; align-items: flex-start; }
        .wc-eyebrow { font-size: .68rem; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: #14532D; margin-bottom: .4rem; }
        .wc-h1 { font-size: clamp(1.75rem, 3vw, 2.5rem); font-weight: 800; letter-spacing: -.025em; color: #161616; margin: 0 0 .3rem; }
        .wc-desc { font-size: .9rem; color: #787878; }
        .wc-location-badge { display: flex; align-items: center; gap: .4rem; font-size: .8rem; font-weight: 600; color: #161616; background: #fff; border: 1px solid #E8E2D9; border-radius: 999px; padding: .5rem 1.1rem; flex-shrink: 0; }

        .wc-today { border-radius: 24px; padding: 2.5rem; display: grid; grid-template-columns: 1.2fr 1fr; gap: 2rem; align-items: center; }
        .wc-today-label { font-size: .72rem; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: rgba(0,0,0,0.4); margin-bottom: .5rem; }
        .wc-today-temp { font-size: 5rem; font-weight: 900; letter-spacing: -.04em; color: #161616; line-height: 1; }
        .wc-temp-unit { font-size: 2.5rem; }
        .wc-today-condition { font-size: 1rem; font-weight: 600; color: rgba(0,0,0,0.5); text-transform: capitalize; margin: .25rem 0 .75rem; }
        .wc-today-desc { font-size: .875rem; color: rgba(0,0,0,0.55); line-height: 1.6; margin-bottom: 1rem; }
        .wc-irrig-impact { display: flex; align-items: center; gap: .6rem; font-size: .8rem; color: rgba(0,0,0,0.6); font-weight: 500; }
        .wc-irrig-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .wc-today-right { display: flex; flex-direction: column; align-items: center; gap: 1.5rem; }
        .wc-today-icon { font-size: 5rem; filter: drop-shadow(0 4px 12px rgba(0,0,0,0.1)); }
        .wc-today-stats { display: flex; flex-direction: column; gap: .75rem; width: 100%; }
        .wc-today-stat { display: flex; align-items: center; gap: .75rem; background: rgba(255,255,255,0.6); border-radius: 12px; padding: .75rem 1rem; }
        .wc-ts-icon { color: rgba(0,0,0,0.4); flex-shrink: 0; }
        .wc-ts-label { font-size: .65rem; font-weight: 600; color: rgba(0,0,0,0.4); text-transform: uppercase; letter-spacing: .08em; }
        .wc-ts-val { font-size: .95rem; font-weight: 700; color: #161616; }

        .wc-section { display: flex; flex-direction: column; gap: 1rem; }
        .wc-section-title { font-size: 1.1rem; font-weight: 800; color: #161616; margin: 0; }

        .wc-week { display: grid; grid-template-columns: repeat(7, 1fr); gap: .75rem; }
        .wc-day-card { background: #fff; border: 1px solid #E8E2D9; border-radius: 18px; padding: 1.25rem .75rem; text-align: center; display: flex; flex-direction: column; gap: .4rem; align-items: center; transition: transform .2s, box-shadow .2s; }
        .wc-day-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
        .wc-day-card.today { background: #14532D; border-color: #14532D; }
        .wc-day-card.today .wc-day-name, .wc-day-card.today .wc-day-date, .wc-day-card.today .wc-day-temp, .wc-day-card.today .wc-day-hum { color: rgba(255,255,255,0.9); }
        .wc-day-name { font-size: .72rem; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: #a09589; }
        .wc-day-date { font-size: .65rem; color: #a09589; }
        .wc-day-icon { font-size: 1.5rem; margin: .25rem 0; }
        .wc-day-temp { font-size: 1.1rem; font-weight: 800; color: #161616; }
        .wc-day-hum { font-size: .65rem; color: #787878; }
        .wc-day-rain { font-size: .65rem; color: #2563eb; font-weight: 600; }

        .wc-impact-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: .75rem; }
        .wc-impact-card { background: #fff; border: 1px solid #E8E2D9; border-radius: 14px; padding: 1rem .75rem; text-align: center; display: flex; flex-direction: column; gap: .4rem; align-items: center; }
        .wc-impact-day { font-size: .65rem; font-weight: 700; color: #a09589; text-transform: uppercase; letter-spacing: .06em; }
        .wc-impact-icon { font-size: 1.25rem; }
        .wc-impact-action { font-size: .65rem; font-weight: 700; padding: .25rem .5rem; border-radius: 999px; }
        .wc-impact-rain { font-size: .6rem; color: #787878; }

        .wc-tips { display: flex; flex-direction: column; gap: 1rem; }
        .wc-tip-card { display: flex; align-items: flex-start; gap: 1rem; background: #fff; border: 1px solid #E8E2D9; border-radius: 16px; padding: 1.25rem; }
        .wc-tip-icon { font-size: 1.5rem; flex-shrink: 0; width: 44px; height: 44px; background: #FAF8F3; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
        .wc-tip-title { font-size: .9rem; font-weight: 700; color: #161616; margin-bottom: .25rem; }
        .wc-tip-desc { font-size: .82rem; color: #787878; line-height: 1.65; }

        @media (max-width: 900px) {
          .wc-today { grid-template-columns: 1fr; }
          .wc-week, .wc-impact-grid { grid-template-columns: repeat(4, 1fr); }
        }
        @media (max-width: 600px) {
          .wc-week, .wc-impact-grid { grid-template-columns: repeat(2, 1fr); }
          .wc-header { flex-direction: column; gap: 1rem; }
        }
      `}</style>
    </div>
  );
}
