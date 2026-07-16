'use client';

import Image from 'next/image';

export function ProfileContent() {
  return (
    <div className="pc-root">

      {/* Hero */}
      <div className="pc-hero">
        <div className="pc-hero-img-wrap">
          <Image src="/farmer-portrait.png" alt="Farm profile" fill className="pc-hero-img" />
          <div className="pc-hero-overlay" />
        </div>
        <div className="pc-hero-content">
          <div className="pc-avatar">FH</div>
          <div>
            <h1 className="pc-hero-name">Pak Fajar Hartono</h1>
            <p className="pc-hero-loc">📍 Klaten, Central Java, Indonesia</p>
          </div>
        </div>
      </div>

      <div className="pc-body">
        {/* Farm overview */}
        <div className="pc-left">
          <div className="pc-card">
            <div className="pc-card-title">Farm Overview</div>
            <div className="pc-info-rows">
              {[
                { label: 'Total Area', val: '56.5 ha' },
                { label: 'Active Fields', val: '3' },
                { label: 'Primary Crop', val: 'Rice (Padi)' },
                { label: 'Farming Since', val: '1998' },
                { label: 'Irrigation Method', val: 'Alternate Wetting & Drying' },
                { label: 'Water Source', val: 'Subak irrigation system' },
              ].map(r => (
                <div key={r.label} className="pc-info-row">
                  <span className="pc-info-label">{r.label}</span>
                  <span className="pc-info-val">{r.val}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pc-card">
            <div className="pc-card-title">AGRIVO Account</div>
            <div className="pc-info-rows">
              {[
                { label: 'Member since', val: 'March 2024' },
                { label: 'Plan', val: 'Farmer Pro' },
                { label: 'Language', val: 'Bahasa Indonesia' },
                { label: 'WhatsApp alerts', val: 'Enabled ✓' },
                { label: 'Notifications', val: 'Daily 06:00 AM' },
              ].map(r => (
                <div key={r.label} className="pc-info-row">
                  <span className="pc-info-label">{r.label}</span>
                  <span className="pc-info-val">{r.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: impact stats + achievements */}
        <div className="pc-right">
          <div className="pc-card">
            <div className="pc-card-title">Your Environmental Impact</div>
            <p className="pc-card-sub">Cumulative savings since joining AGRIVO — March 2024 to present.</p>
            <div className="pc-impact-grid">
              {[
                { icon:'💧', val:'1.8M L', label:'Water Saved', color:'#e8f4fd' },
                { icon:'🌍', val:'−2.4 t', label:'CO₂-eq Avoided', color:'#f0f7ec' },
                { icon:'🌾', val:'5.8 t/ha', label:'Best Yield', color:'#faf3e8' },
                { icon:'📅', val:'472', label:'Days Using AWD', color:'#f5f0fa' },
              ].map(m => (
                <div key={m.label} className="pc-impact-card" style={{ background: m.color }}>
                  <div className="pc-imp-icon">{m.icon}</div>
                  <div className="pc-imp-val">{m.val}</div>
                  <div className="pc-imp-lbl">{m.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="pc-card">
            <div className="pc-card-title">Achievements</div>
            <div className="pc-achievements">
              {[
                { icon:'🏅', title:'Early Adopter', desc:'Joined AGRIVO in its first year', earned:true },
                { icon:'💧', title:'Water Saver', desc:'Saved over 1 million liters', earned:true },
                { icon:'🌍', title:'Climate Champion', desc:'Reduced net GWP by 20%+', earned:true },
                { icon:'📊', title:'Data Farmer', desc:'30+ consecutive days of field logging', earned:false },
                { icon:'🤝', title:'Community Leader', desc:'Referred 5+ farmers to AGRIVO', earned:false },
              ].map(a => (
                <div key={a.title} className={`pc-achievement${a.earned ? '' : ' locked'}`}>
                  <div className="pc-ach-icon">{a.icon}</div>
                  <div className="pc-ach-body">
                    <div className="pc-ach-title">{a.title}</div>
                    <div className="pc-ach-desc">{a.desc}</div>
                  </div>
                  {a.earned ? (
                    <div className="pc-ach-badge">Earned</div>
                  ) : (
                    <div className="pc-ach-locked">Locked</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .pc-root { display: flex; flex-direction: column; gap: 2rem; }

        .pc-hero { position: relative; height: 260px; border-radius: 24px; overflow: hidden; }
        .pc-hero-img { object-fit: cover; }
        .pc-hero-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0.1)); }
        .pc-hero-content { position: absolute; bottom: 2rem; left: 2rem; display: flex; align-items: center; gap: 1.25rem; }
        .pc-avatar { width: 64px; height: 64px; border-radius: 50%; background: #14532D; color: #fff; font-size: 1.25rem; font-weight: 800; display: flex; align-items: center; justify-content: center; border: 3px solid #fff; flex-shrink: 0; }
        .pc-hero-name { font-size: 1.6rem; font-weight: 800; color: #fff; margin: 0 0 .2rem; letter-spacing: -.02em; }
        .pc-hero-loc { font-size: .85rem; color: rgba(255,255,255,0.7); margin: 0; }

        .pc-body { display: grid; grid-template-columns: 1fr 1.6fr; gap: 1.5rem; }

        .pc-left, .pc-right { display: flex; flex-direction: column; gap: 1.5rem; }

        .pc-card { background: #fff; border: 1px solid #E8E2D9; border-radius: 20px; padding: 1.75rem; }
        .pc-card-title { font-size: 1rem; font-weight: 800; color: #161616; margin-bottom: 1.25rem; letter-spacing: -.01em; }
        .pc-card-sub { font-size: .82rem; color: #787878; line-height: 1.6; margin-bottom: 1.25rem; margin-top: -.5rem; }

        .pc-info-rows { display: flex; flex-direction: column; }
        .pc-info-row { display: flex; justify-content: space-between; align-items: center; padding: .7rem 0; border-bottom: 1px solid #F0EDE6; }
        .pc-info-row:last-child { border-bottom: none; }
        .pc-info-label { font-size: .8rem; color: #787878; }
        .pc-info-val { font-size: .85rem; font-weight: 600; color: #161616; text-align: right; }

        .pc-impact-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
        .pc-impact-card { border-radius: 14px; padding: 1.25rem; border: 1px solid rgba(0,0,0,0.04); display: flex; flex-direction: column; gap: .3rem; }
        .pc-imp-icon { font-size: 1.4rem; margin-bottom: .25rem; }
        .pc-imp-val { font-size: 1.4rem; font-weight: 800; color: #161616; }
        .pc-imp-lbl { font-size: .68rem; color: #787878; font-weight: 500; }

        .pc-achievements { display: flex; flex-direction: column; gap: .75rem; }
        .pc-achievement { display: flex; align-items: center; gap: 1rem; padding: 1rem; border-radius: 14px; background: #FAF8F3; border: 1px solid #E8E2D9; }
        .pc-achievement.locked { opacity: .45; filter: grayscale(.5); }
        .pc-ach-icon { font-size: 1.4rem; flex-shrink: 0; width: 40px; height: 40px; background: #fff; border-radius: 12px; display: flex; align-items: center; justify-content: center; border: 1px solid #E8E2D9; }
        .pc-ach-body { flex: 1; }
        .pc-ach-title { font-size: .875rem; font-weight: 700; color: #161616; }
        .pc-ach-desc { font-size: .72rem; color: #787878; margin-top: .15rem; }
        .pc-ach-badge { font-size: .65rem; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: #14532D; background: #e8f5ee; padding: .25rem .65rem; border-radius: 999px; flex-shrink: 0; }
        .pc-ach-locked { font-size: .65rem; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: #a09589; background: #F0EDE6; padding: .25rem .65rem; border-radius: 999px; flex-shrink: 0; }

        @media (max-width: 900px) {
          .pc-body { grid-template-columns: 1fr; }
          .pc-impact-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>
    </div>
  );
}
