'use client';

import { WeatherData } from '@/lib/mock-data';
import { Droplets, Wind, CloudRain } from 'lucide-react';

interface Props { weather: WeatherData[]; }

const conditionLabel = (c: string) => {
  if (c === 'sunny') return 'Sunny';
  if (c === 'rainy') return 'Rainy';
  if (c === 'cloudy') return 'Cloudy';
  return 'Partly Cloudy';
};

const conditionBg = (c: string) => {
  if (c === 'sunny') return 'linear-gradient(135deg, #fef9ee, #fef3c7)';
  if (c === 'rainy') return 'linear-gradient(135deg, #eef4ff, #dbeafe)';
  if (c === 'cloudy') return 'linear-gradient(135deg, #f3f4f6, #e5e7eb)';
  return 'linear-gradient(135deg, #f0fdf4, #dcfce7)';
};

// Simple SVG-based weather icons — no emojis
const WeatherIcon = ({ condition, size = 36 }: { condition: string; size?: number }) => {
  const s = size;
  if (condition === 'sunny') return (
    <svg width={s} height={s} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="18" cy="18" r="7" fill="#FBBF24"/>
      {[0,45,90,135,180,225,270,315].map((deg, i) => (
        <line key={i} x1="18" y1="4" x2="18" y2="8" stroke="#FBBF24" strokeWidth="2.5" strokeLinecap="round"
          transform={`rotate(${deg} 18 18)`}/>
      ))}
    </svg>
  );
  if (condition === 'rainy') return (
    <svg width={s} height={s} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 20a7 7 0 1 1 13.5-2H22a5 5 0 0 1 0 10H9a7 7 0 0 1-1-8z" fill="#94A3B8"/>
      <line x1="12" y1="28" x2="10" y2="33" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round"/>
      <line x1="18" y1="28" x2="16" y2="33" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round"/>
      <line x1="24" y1="28" x2="22" y2="33" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
  if (condition === 'cloudy') return (
    <svg width={s} height={s} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 22a8 8 0 1 1 15.5-2.5H22a6 6 0 0 1 0 12H8a6 6 0 0 1-2-11.5z" fill="#CBD5E1"/>
    </svg>
  );
  // partly-cloudy default
  return (
    <svg width={s} height={s} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="13" cy="12" r="5" fill="#FBBF24"/>
      {[0,60,120,180,240,300].map((deg, i) => (
        <line key={i} x1="13" y1="4" x2="13" y2="6.5" stroke="#FBBF24" strokeWidth="1.8" strokeLinecap="round"
          transform={`rotate(${deg} 13 12)`}/>
      ))}
      <path d="M8 22a6 6 0 1 1 11.5-2H20a4.5 4.5 0 0 1 0 9H9a6 6 0 0 1-1-7z" fill="#CBD5E1"/>
    </svg>
  );
};

export function WeatherContent({ weather }: Props) {
  // Use only the first 7 items to avoid duplicates and wrapping
  const days = weather.slice(0, 7);
  const today = days[0];

  return (
    <div className="wc-root">

      <div className="wc-header">
        <div>
          <p className="wc-eyebrow">Weather Intelligence</p>
          <h1 className="wc-h1">Forecast & Conditions</h1>
        </div>
      </div>

      {/* Today hero — compact */}
      <div className="wc-today" style={{ background: conditionBg(today.condition) }}>
        <div className="wc-today-left">
          <div className="wc-today-label">Today</div>
          <div className="wc-today-temp">{today.temperature}<span className="wc-temp-unit">°C</span></div>
          <div className="wc-today-condition">{conditionLabel(today.condition)}</div>
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
          <div className="wc-today-icon"><WeatherIcon condition={today.condition} size={56} /></div>
          <div className="wc-today-stats">
            {[
              { icon: <Droplets size={15}/>, label: 'Humidity', val: `${today.humidity}%` },
              { icon: <Wind size={15}/>, label: 'Wind', val: `${today.windSpeed} km/h` },
              { icon: <CloudRain size={15}/>, label: 'Rain', val: `${today.precipitation} mm` },
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

      {/* 7-day strip — all 7 days in one row, no wrapping */}
      <div className="wc-section">
        <h3 className="wc-section-title">7-Day Outlook</h3>
        <div className="wc-week">
          {days.map((d, i) => (
            <div key={i} className={`wc-day-card${i === 0 ? ' today' : ''}`}>
              <div className="wc-day-name">
                {i === 0 ? 'Today' : d.date.toLocaleDateString('en', { weekday: 'short' })}
              </div>
              <div className="wc-day-date">
                {d.date.toLocaleDateString('en', { day: 'numeric', month: 'short' })}
              </div>
              <div className="wc-day-icon"><WeatherIcon condition={d.condition} size={28} /></div>
              <div className="wc-day-temp">{d.temperature}°</div>
              <div className="wc-day-hum">{d.humidity}%</div>
              {d.precipitation > 0 && (
                <div className="wc-day-rain">{d.precipitation}mm</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Impact on irrigation */}
      <div className="wc-section">
        <h3 className="wc-section-title">Irrigation Impact This Week</h3>
        <div className="wc-impact-grid">
          {days.map((d, i) => {
            const skip = d.precipitation >= 10;
            const reduce = d.precipitation > 0 && d.precipitation < 10;
            return (
              <div key={i} className="wc-impact-card">
                <div className="wc-impact-day">
                  {i === 0 ? 'Today' : d.date.toLocaleDateString('en', { weekday: 'short', day: 'numeric' })}
                </div>
                <div className="wc-impact-icon"><WeatherIcon condition={d.condition} size={22} /></div>
                <div
                  className="wc-impact-action"
                  style={{
                    color: skip ? '#C0392B' : reduce ? '#b07d10' : '#14532D',
                    background: skip ? '#fde8e5' : reduce ? '#fdf0d0' : '#e8f5ee',
                  }}
                >
                  {skip ? 'Skip' : reduce ? 'Reduce' : 'Proceed'}
                </div>
                {d.precipitation > 0 && (
                  <div className="wc-impact-rain">{d.precipitation}mm rain</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Agronomic tips — no emojis */}
      <div className="wc-section">
        <h3 className="wc-section-title">Agronomic Insights</h3>
        <div className="wc-tips">
          {[
            { label: 'TEMP', title: 'Temperature in Range', desc: `At ${today.temperature}°C, rice growth is optimal. Tillering and root development proceed well between 20–35°C.` },
            { label: 'WIND', title: 'Wind Speed Moderate', desc: `${today.windSpeed} km/h wind helps reduce leaf fungal disease risk. Avoid spraying pesticides on windy days.` },
            { label: 'HUM', title: 'Humidity Advisory', desc: `Relative humidity at ${today.humidity}% is in the preferred range. Monitor for blast fungus if humidity exceeds 90% for 3+ days.` },
          ].map(t => (
            <div key={t.title} className="wc-tip-card">
              <div className="wc-tip-icon-box">{t.label}</div>
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
        .wc-h1 { font-size: clamp(1.5rem, 2.5vw, 2rem); font-weight: 800; letter-spacing: -.025em; color: #161616; margin: 0 0 .3rem; }

        .wc-today { border-radius: 20px; padding: 2rem; display: grid; grid-template-columns: 1.2fr 1fr; gap: 2rem; align-items: center; }
        .wc-today-label { font-size: .68rem; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: rgba(0,0,0,0.4); margin-bottom: .4rem; }
        .wc-today-temp { font-size: 3.5rem; font-weight: 900; letter-spacing: -.04em; color: #161616; line-height: 1; }
        .wc-temp-unit { font-size: 1.75rem; }
        .wc-today-condition { font-size: .9rem; font-weight: 600; color: rgba(0,0,0,0.5); text-transform: capitalize; margin: .2rem 0 .6rem; }
        .wc-today-desc { font-size: .82rem; color: rgba(0,0,0,0.55); line-height: 1.6; margin-bottom: .85rem; }
        .wc-irrig-impact { display: flex; align-items: center; gap: .6rem; font-size: .78rem; color: rgba(0,0,0,0.6); font-weight: 500; }
        .wc-irrig-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
        .wc-today-right { display: flex; flex-direction: column; align-items: center; gap: 1.25rem; }
        .wc-today-icon { }
        .wc-today-stats { display: flex; flex-direction: column; gap: .65rem; width: 100%; }
        .wc-today-stat { display: flex; align-items: center; gap: .65rem; background: rgba(255,255,255,0.65); border-radius: 10px; padding: .6rem .9rem; }
        .wc-ts-icon { color: rgba(0,0,0,0.4); flex-shrink: 0; }
        .wc-ts-label { font-size: .6rem; font-weight: 600; color: rgba(0,0,0,0.4); text-transform: uppercase; letter-spacing: .08em; }
        .wc-ts-val { font-size: .9rem; font-weight: 700; color: #161616; }

        .wc-section { display: flex; flex-direction: column; gap: 1rem; }
        .wc-section-title { font-size: 1rem; font-weight: 800; color: #161616; margin: 0; }

        .wc-week { display: grid; grid-template-columns: repeat(7, 1fr); gap: .65rem; }
        .wc-day-card { background: #fff; border: 1px solid #E8E2D9; border-radius: 14px; padding: 1rem .6rem; text-align: center; display: flex; flex-direction: column; gap: .35rem; align-items: center; transition: transform .2s, box-shadow .2s; min-width: 0; }
        .wc-day-card:hover { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(0,0,0,0.07); }
        .wc-day-card.today { background: #14532D; border-color: #14532D; }
        .wc-day-card.today .wc-day-name, .wc-day-card.today .wc-day-date, .wc-day-card.today .wc-day-temp, .wc-day-card.today .wc-day-hum { color: rgba(255,255,255,0.9); }
        .wc-day-name { font-size: .65rem; font-weight: 700; text-transform: uppercase; letter-spacing: .07em; color: #a09589; }
        .wc-day-date { font-size: .6rem; color: #a09589; }
        .wc-day-icon { margin: .2rem 0; }
        .wc-day-temp { font-size: 1rem; font-weight: 800; color: #161616; }
        .wc-day-hum { font-size: .6rem; color: #787878; }
        .wc-day-rain { font-size: .6rem; color: #2563eb; font-weight: 600; }

        .wc-impact-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: .65rem; }
        .wc-impact-card { background: #fff; border: 1px solid #E8E2D9; border-radius: 12px; padding: .85rem .6rem; text-align: center; display: flex; flex-direction: column; gap: .35rem; align-items: center; min-width: 0; }
        .wc-impact-day { font-size: .6rem; font-weight: 700; color: #a09589; text-transform: uppercase; letter-spacing: .05em; }
        .wc-impact-icon { }
        .wc-impact-action { font-size: .62rem; font-weight: 700; padding: .2rem .5rem; border-radius: 999px; }
        .wc-impact-rain { font-size: .58rem; color: #787878; }

        .wc-tips { display: flex; flex-direction: column; gap: 1rem; }
        .wc-tip-card { display: flex; align-items: flex-start; gap: 1rem; background: #fff; border: 1px solid #E8E2D9; border-radius: 14px; padding: 1.1rem; }
        .wc-tip-icon-box { font-size: .6rem; font-weight: 800; letter-spacing: .05em; color: #14532D; background: #edf7f0; border-radius: 8px; min-width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .wc-tip-title { font-size: .88rem; font-weight: 700; color: #161616; margin-bottom: .2rem; }
        .wc-tip-desc { font-size: .8rem; color: #787878; line-height: 1.6; }

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
