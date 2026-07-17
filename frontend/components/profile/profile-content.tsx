'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { apiClient } from '@/lib/api-client';

export function ProfileContent() {
  const [profile, setProfile] = useState<any>(null);
  const [fields, setFields] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [impactStats, setImpactStats] = useState({
    waterSavedL: 0,
    co2AvoidedKg: 0,
    bestYield: 0,
    totalRecommendations: 0,
    hasData: false
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [profileRes, fieldsRes] = await Promise.all([
          apiClient<{ data: any }>('/users/me'),
          apiClient<{ data: { items: any[] } | any[] }>('/fields'),
        ]);

        const uData = profileRes.data;
        setProfile(uData);

        const items = (fieldsRes.data as any).items || fieldsRes.data || [];
        setFields(items);

        // Fetch recommendations for all fields to compute impact stats
        if (items.length > 0) {
          let totalWaterSavedL = 0;
          let totalCo2AvoidedKg = 0;
          let maxYield = 0;
          let totalRecsCount = 0;

          await Promise.all(
            items.map(async (field: any) => {
              try {
                const recsRes = await apiClient<{ data: any[] | { items: any[] } }>(`/fields/${field.id}/recommendations`);
                const recs = (recsRes.data as any).items || recsRes.data || [];
                totalRecsCount += recs.length;

                recs.forEach((rec: any) => {
                  if (rec.prediction) {
                    const area = parseFloat(field.field_area_ha || 0);
                    // 1 hectare uses ~100,000 Liters of irrigation water per day
                    const waterSavingPct = parseFloat(rec.prediction.water_saving_percent || 0);
                    const waterSaved = area * 100000 * (waterSavingPct / 100);
                    totalWaterSavedL += waterSaved;

                    // Net GWP reduction percent
                    const gwpPct = parseFloat(rec.prediction.net_gwp_reduction_percent || 0);
                    // Standard daily GWP emission per ha is ~25 kg CO2-eq
                    const co2Avoided = area * 25 * (gwpPct / 100);
                    totalCo2AvoidedKg += co2Avoided;

                    const expectedYield = parseFloat(rec.prediction.expected_yield_ton_per_ha || 0);
                    if (expectedYield > maxYield) {
                      maxYield = expectedYield;
                    }
                  }
                });
              } catch (err) {
                console.error(`Failed to load recommendations for field ${field.id}`, err);
              }
            })
          );

          setImpactStats({
            waterSavedL: Math.round(totalWaterSavedL),
            co2AvoidedKg: Math.round(totalCo2AvoidedKg),
            bestYield: maxYield,
            totalRecommendations: totalRecsCount,
            hasData: totalRecsCount > 0
          });
        }
      } catch (err) {
        console.error('Failed to load profile or fields', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#14532D', fontWeight: 600 }}>
        Loading profile...
      </div>
    );
  }

  const initials = profile?.full_name ? profile.full_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'US';
  const totalArea = fields.reduce((sum, f) => sum + parseFloat(f.field_area_ha || 0), 0).toFixed(1);

  return (
    <div className="pc-root">
      {/* Hero */}
      <div className="pc-hero">
        <div className="pc-hero-img-wrap">
          <Image src="/farmer-portrait.png" alt="Farm profile" fill className="pc-hero-img" />
          <div className="pc-hero-overlay" />
        </div>
        <div className="pc-hero-content">
          <div className="pc-avatar">{initials}</div>
          <div>
            <h1 className="pc-hero-name">{profile?.full_name || 'Agrivo Farmer'}</h1>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <p className="pc-hero-phone">📞 {profile?.phone_number || '-'}</p>
              {fields.length > 0 && fields[0].subdistrict && fields[0].province && (
                <p className="pc-hero-loc">📍 {fields[0].subdistrict}, {fields[0].province}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="pc-body">
        {/* Farm overview */}
        <div className="pc-card">
          <div className="pc-card-title">Farm Overview</div>
          <div className="pc-overview-grid">
            {[
              { label: 'Total Area', val: `${totalArea} ha`, icon: '🌾' },
              { label: 'Active Fields', val: fields.length.toString(), icon: '🗺️' },
            ].map(r => (
              <div key={r.label} className="pc-overview-item">
                <span className="pc-overview-icon">{r.icon}</span>
                <div className="pc-overview-details">
                  <span className="pc-overview-label">{r.label}</span>
                  <span className="pc-overview-val">{r.val}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Environmental Impact */}
        {impactStats.hasData ? (
          <div className="pc-card">
            <div className="pc-card-title">Your Environmental Impact</div>
            <p className="pc-card-sub">Cumulative savings calculated from active irrigation runs.</p>
            <div className="pc-impact-grid">
              {[
                { icon: '💧', val: impactStats.waterSavedL >= 1000000 ? `${(impactStats.waterSavedL / 1000000).toFixed(1)}M L` : impactStats.waterSavedL >= 1000 ? `${(impactStats.waterSavedL / 1000).toFixed(1)}k L` : `${impactStats.waterSavedL} L`, label: 'Water Saved' },
                { icon: '🌍', val: impactStats.co2AvoidedKg >= 1000 ? `−${(impactStats.co2AvoidedKg / 1000).toFixed(1)} t` : `−${impactStats.co2AvoidedKg} kg`, label: 'CO₂-eq Avoided' },
                { icon: '🌾', val: impactStats.bestYield > 0 ? `${impactStats.bestYield.toFixed(1)} t/ha` : '−', label: 'Best Yield' },
                { icon: '📅', val: impactStats.totalRecommendations.toString(), label: 'Recommendations Generated' },
              ].map(m => (
                <div key={m.label} className="pc-impact-card">
                  <div className="pc-imp-icon">{m.icon}</div>
                  <div className="pc-imp-val">{m.val}</div>
                  <div className="pc-imp-lbl">{m.label}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="pc-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '240px', textAlign: 'center', color: '#787878' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🍃</div>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#161616', marginBottom: '0.5rem' }}>No Impact Data Yet</h3>
            <p style={{ fontSize: '0.82rem', color: '#787878', lineHeight: 1.6, margin: 0, maxWidth: '280px' }}>
              Your cumulative environmental impact statistics will display here once irrigation recommendations are generated.
            </p>
          </div>
        )}
      </div>

      <style>{`
        .pc-root { display: flex; flex-direction: column; gap: 2rem; }
 
        .pc-hero { position: relative; height: 260px; border-radius: 24px; overflow: hidden; }
        .pc-hero-img { object-fit: cover; }
        .pc-hero-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0.1)); }
        .pc-hero-content { position: absolute; bottom: 2rem; left: 2rem; display: flex; align-items: center; gap: 1.25rem; }
        .pc-avatar { width: 64px; height: 64px; border-radius: 50%; background: #14532D; color: #fff; font-size: 1.25rem; font-weight: 800; display: flex; align-items: center; justify-content: center; border: 3px solid #fff; flex-shrink: 0; }
        .pc-hero-name { font-size: 1.6rem; font-weight: 800; color: #fff; margin: 0 0 .2rem; letter-spacing: -.02em; }
        .pc-hero-phone { font-size: .85rem; color: rgba(255,255,255,0.85); margin: 0; font-weight: 500; }
        .pc-hero-loc { font-size: .85rem; color: rgba(255,255,255,0.7); margin: 0; }
 
        .pc-body { display: flex; flex-direction: column; gap: 1.5rem; }
 
        .pc-card { background: #fff; border: 1px solid #E8E2D9; border-radius: 20px; padding: 1.75rem; }
        .pc-card-title { font-size: 1rem; font-weight: 800; color: #161616; margin-bottom: 1.25rem; letter-spacing: -.01em; }
        .pc-card-sub { font-size: .82rem; color: #787878; line-height: 1.6; margin-bottom: 1.25rem; margin-top: -.5rem; }
 
        .pc-overview-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
        }
        .pc-overview-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          background: #FAF8F3;
          padding: 1.25rem;
          border-radius: 14px;
          border: 1px solid #E8E2D9;
        }
        .pc-overview-icon {
          font-size: 1.8rem;
        }
        .pc-overview-details {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
        }
        .pc-overview-label {
          font-size: 0.75rem;
          color: #787878;
        }
        .pc-overview-val {
          font-size: 1.1rem;
          font-weight: 800;
          color: #161616;
        }
 
        .pc-impact-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
        .pc-impact-card { background: #fff; border-radius: 14px; padding: 1.25rem; border: 1px solid #E8E2D9; display: flex; flex-direction: column; gap: .3rem; }
        .pc-imp-icon { font-size: 1.4rem; margin-bottom: .25rem; }
        .pc-imp-val { font-size: 1.4rem; font-weight: 800; color: #161616; }
        .pc-imp-lbl { font-size: .68rem; color: #787878; font-weight: 500; }
 
        @media (max-width: 900px) {
          .pc-overview-grid { grid-template-columns: 1fr; }
          .pc-impact-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>
    </div>
  );
}
