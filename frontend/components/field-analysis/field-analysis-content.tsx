'use client';

import Image from 'next/image';
import { Field } from '@/lib/mock-data';

interface Props { fields: Field[]; }

export function FieldAnalysisContent({ fields }: Props) {
  return (
    <div className="fa-root">

      <div className="fa-header">
        <div>
          <p className="fa-eyebrow">Field Analysis</p>
          <h1 className="fa-h1">Your Fields</h1>
          <p className="fa-desc">{fields.length} fields · {fields.reduce((s, f) => s + f.area, 0).toFixed(1)} ha total area</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="fa-summary-row">
        {[
          { label: 'Total Area', val: `${fields.reduce((s,f)=>s+f.area,0).toFixed(1)} ha`, icon: '🌾' },
          { label: 'Avg. Moisture', val: `${Math.round(fields.reduce((s,f)=>s+f.moisture,0)/fields.length)}%`, icon: '💧' },
          { label: 'Avg. pH', val: (fields.reduce((s,f)=>s+f.ph,0)/fields.length).toFixed(1), icon: '🧪' },
          { label: 'Avg. Temp', val: `${(fields.reduce((s,f)=>s+f.temperature,0)/fields.length).toFixed(1)}°C`, icon: '🌡️' },
        ].map(s => (
          <div key={s.label} className="fa-summary-card">
            <div className="fa-sum-icon">{s.icon}</div>
            <div className="fa-sum-val">{s.val}</div>
            <div className="fa-sum-lbl">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Field cards - editorial large format */}
      <div className="fa-fields">
        {fields.map((field, i) => (
          <div key={field.id} className={`fa-field-card${i % 2 === 1 ? ' reverse' : ''}`}>
            <div className="fa-field-img-wrap">
              <Image
                src={i === 0 ? '/rice-field-editorial.png' : i === 1 ? '/rice-terraces-hero.png' : '/rice-harvest-golden.png'}
                alt={field.name}
                fill
                className="fa-field-img"
              />
              <div className="fa-field-img-overlay" />
              <div className="fa-field-img-label">
                <span className="fa-crop-badge">{field.crop}</span>
                <span className="fa-area-badge">{field.area} ha</span>
              </div>
            </div>
            <div className="fa-field-info">
              <div className="fa-field-info-eyebrow">{field.location}</div>
              <h2 className="fa-field-name">{field.name}</h2>
              <p className="fa-field-soil">Soil type: {field.soilType}</p>

              {/* Moisture bar */}
              <div className="fa-moisture-section">
                <div className="fa-moisture-header">
                  <span className="fa-moisture-label">Soil Moisture</span>
                  <span className="fa-moisture-val" style={{ color: field.moisture < 60 ? '#C0392B' : '#14532D' }}>{field.moisture}%</span>
                </div>
                <div className="fa-moisture-bar-bg">
                  <div className="fa-moisture-bar" style={{
                    width: `${field.moisture}%`,
                    background: field.moisture < 60 ? '#C0392B' : field.moisture > 80 ? '#2563EB' : '#14532D'
                  }} />
                </div>
                <div className="fa-moisture-scale">
                  <span>Dry</span><span>Optimal</span><span>Wet</span>
                </div>
              </div>

              {/* Nutrient grid */}
              <div className="fa-nutrient-grid">
                {[
                  { label: 'pH Level', val: field.ph, unit: '', ideal: '6.0–7.0' },
                  { label: 'Temperature', val: field.temperature, unit: '°C', ideal: '15–25°C' },
                  { label: 'Nitrogen', val: field.nitrogen, unit: 'ppm', ideal: '40–60 ppm' },
                  { label: 'Phosphorus', val: field.phosphorus, unit: 'ppm', ideal: '15–25 ppm' },
                  { label: 'Potassium', val: field.potassium, unit: 'ppm', ideal: '130–180 ppm' },
                ].map(n => (
                  <div key={n.label} className="fa-nutrient-card">
                    <div className="fa-nut-label">{n.label}</div>
                    <div className="fa-nut-val">{n.val}<span className="fa-nut-unit">{n.unit}</span></div>
                    <div className="fa-nut-ideal">Ideal: {n.ideal}</div>
                  </div>
                ))}
              </div>

              <div className="fa-last-watered">
                Last irrigated: {field.lastWatered.toLocaleDateString('en', { day:'numeric', month:'long', year:'numeric' })}
              </div>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .fa-root { display: flex; flex-direction: column; gap: 2.5rem; }

        .fa-header { }
        .fa-eyebrow { font-size: .68rem; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: #14532D; margin-bottom: .4rem; }
        .fa-h1 { font-size: clamp(1.75rem, 3vw, 2.5rem); font-weight: 800; letter-spacing: -.025em; color: #161616; margin: 0 0 .3rem; }
        .fa-desc { font-size: .9rem; color: #787878; }

        .fa-summary-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
        .fa-summary-card { background: #fff; border: 1px solid #E8E2D9; border-radius: 18px; padding: 1.5rem; text-align: center; transition: box-shadow .2s, transform .2s; }
        .fa-summary-card:hover { box-shadow: 0 6px 20px rgba(0,0,0,0.07); transform: translateY(-2px); }
        .fa-sum-icon { font-size: 1.75rem; margin-bottom: .6rem; }
        .fa-sum-val { font-size: 1.75rem; font-weight: 900; letter-spacing: -.02em; color: #161616; }
        .fa-sum-lbl { font-size: .72rem; color: #787878; margin-top: .2rem; font-weight: 500; }

        .fa-fields { display: flex; flex-direction: column; gap: 3rem; }
        .fa-field-card { display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; align-items: center; }
        .fa-field-card.reverse { direction: rtl; }
        .fa-field-card.reverse > * { direction: ltr; }
        .fa-field-img-wrap { position: relative; height: 460px; border-radius: 24px; overflow: hidden; box-shadow: 0 16px 48px rgba(0,0,0,0.12); }
        .fa-field-img { object-fit: cover; }
        .fa-field-img-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.45), transparent 50%); }
        .fa-field-img-label { position: absolute; bottom: 1.25rem; left: 1.25rem; display: flex; gap: .5rem; }
        .fa-crop-badge { font-size: .72rem; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: #fff; background: rgba(20,83,45,0.85); padding: .3rem .8rem; border-radius: 999px; }
        .fa-area-badge { font-size: .72rem; font-weight: 700; color: #fff; background: rgba(255,255,255,0.18); backdrop-filter: blur(8px); padding: .3rem .8rem; border-radius: 999px; }

        .fa-field-info { display: flex; flex-direction: column; gap: 1rem; }
        .fa-field-info-eyebrow { font-size: .68rem; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: #a09589; }
        .fa-field-name { font-size: clamp(1.5rem, 2.5vw, 2rem); font-weight: 800; letter-spacing: -.025em; color: #161616; margin: 0; }
        .fa-field-soil { font-size: .85rem; color: #787878; }

        .fa-moisture-section { background: #FAF8F3; border: 1px solid #E8E2D9; border-radius: 14px; padding: 1.25rem; }
        .fa-moisture-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: .75rem; }
        .fa-moisture-label { font-size: .8rem; font-weight: 600; color: #161616; }
        .fa-moisture-val { font-size: 1.1rem; font-weight: 800; }
        .fa-moisture-bar-bg { height: 8px; background: #E8E2D9; border-radius: 999px; overflow: hidden; margin-bottom: .4rem; }
        .fa-moisture-bar { height: 100%; border-radius: 999px; transition: width .8s ease; }
        .fa-moisture-scale { display: flex; justify-content: space-between; font-size: .6rem; color: #a09589; }

        .fa-nutrient-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: .75rem; }
        .fa-nutrient-card { background: #fff; border: 1px solid #E8E2D9; border-radius: 12px; padding: 1rem; }
        .fa-nut-label { font-size: .65rem; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: #a09589; margin-bottom: .3rem; }
        .fa-nut-val { font-size: 1.3rem; font-weight: 800; color: #161616; line-height: 1; }
        .fa-nut-unit { font-size: .7rem; font-weight: 500; color: #a09589; margin-left: .2rem; }
        .fa-nut-ideal { font-size: .65rem; color: #787878; margin-top: .2rem; }

        .fa-last-watered { font-size: .78rem; color: #a09589; font-style: italic; }

        @media (max-width: 1024px) {
          .fa-summary-row { grid-template-columns: repeat(2, 1fr); }
          .fa-field-card, .fa-field-card.reverse { grid-template-columns: 1fr; direction: ltr; gap: 1.5rem; }
          .fa-field-img-wrap { height: 280px; }
          .fa-nutrient-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>
    </div>
  );
}
