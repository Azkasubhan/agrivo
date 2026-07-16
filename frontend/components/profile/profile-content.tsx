'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { apiClient } from '@/lib/api-client';

export function ProfileContent() {
  const [profile, setProfile] = useState<any>(null);
  const [fields, setFields] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Notifications state matching DB fields
  const [whatsappEnabled, setWhatsappEnabled] = useState(true);
  const [recAlertEnabled, setRecAlertEnabled] = useState(true);
  const [weatherAlertEnabled, setWeatherAlertEnabled] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [profileRes, fieldsRes] = await Promise.all([
          apiClient<{ data: any }>('/users/me'),
          apiClient<{ data: { items: any[] } | any[] }>('/fields'),
        ]);

        const uData = profileRes.data;
        setProfile(uData);

        const items = (fieldsRes.data as any).items || fieldsRes.data;
        setFields(items);

        // Prepopulate notifications
        if (uData.notification_preference) {
          setWhatsappEnabled(uData.notification_preference.whatsapp_enabled);
          setRecAlertEnabled(uData.notification_preference.recommendation_change_alert);
          setWeatherAlertEnabled(uData.notification_preference.weather_risk_alert);
        }
      } catch (err) {
        console.error('Failed to load profile or fields', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSaveNotifications = async () => {
    setUpdating(true);
    setMessage(null);
    try {
      await apiClient('/users/me/notifications', {
        method: 'PATCH',
        body: JSON.stringify({
          whatsapp_enabled: whatsappEnabled,
          recommendation_change_alert: recAlertEnabled,
          weather_risk_alert: weatherAlertEnabled,
        }),
      });
      setMessage('Notification preferences updated successfully!');
    } catch (err) {
      console.error('Failed to update notification preferences', err);
      setMessage('Failed to update preferences.');
    } finally {
      setUpdating(false);
    }
  };

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
            <p className="pc-hero-loc">📍 {profile?.subdistrict || 'Klaten'}, {profile?.province || 'Jawa Tengah'}</p>
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
                { label: 'Total Area', val: `${totalArea} ha` },
                { label: 'Active Fields', val: fields.length.toString() },
                { label: 'Primary Crop', val: 'Rice (Padi)' },
                { label: 'Province', val: profile?.province || 'Jawa Tengah' },
                { label: 'Subdistrict', val: profile?.subdistrict || 'Klaten' },
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
                { label: 'Email', val: profile?.email || '' },
                { label: 'Phone Number', val: profile?.phone_number || '-' },
              ].map(r => (
                <div key={r.label} className="pc-info-row">
                  <span className="pc-info-label">{r.label}</span>
                  <span className="pc-info-val">{r.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: impact stats + settings */}
        <div className="pc-right">
          {/* Notifications Settings Panel */}
          <div className="pc-card">
            <div className="pc-card-title">Alert & Notification Settings</div>
            <p className="pc-card-sub">Receive daily AWD recommendations and weather risks directly on your device.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                <input
                  type="checkbox"
                  checked={whatsappEnabled}
                  onChange={(e) => setWhatsappEnabled(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: '#14532D' }}
                />
                Enable WhatsApp Alerts (Notifikasi WhatsApp)
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                <input
                  type="checkbox"
                  checked={recAlertEnabled}
                  onChange={(e) => setRecAlertEnabled(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: '#14532D' }}
                />
                Alert on Recommendation Changes (Notifikasi Rekomendasi)
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                <input
                  type="checkbox"
                  checked={weatherAlertEnabled}
                  onChange={(e) => setWeatherAlertEnabled(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: '#14532D' }}
                />
                Alert on Extreme Weather Risks (Notifikasi Cuaca Ekstrem)
              </label>
            </div>

            <button
              onClick={handleSaveNotifications}
              disabled={updating}
              style={{
                width: '100%',
                padding: '0.75rem 1.5rem',
                background: '#14532D',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: updating ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s',
              }}
            >
              {updating ? 'Saving Changes...' : 'Save Notification Preferences'}
            </button>

            {message && (
              <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: message.includes('Failed') ? '#C0392B' : '#14532D', fontWeight: 600 }}>
                {message}
              </div>
            )}
          </div>

          <div className="pc-card">
            <div className="pc-card-title">Your Environmental Impact</div>
            <p className="pc-card-sub">Cumulative savings since joining AGRIVO — March 2024 to present.</p>
            <div className="pc-impact-grid">
              {[
                { icon:'💧', val:'1.8M L', label:'Water Saved', color:'#e8f4fd' },
                { icon:'🌍', val:'−2.4 t', label:'CO₂-eq Avoided', color:'#f0f7ec' },
                { icon:'🌾', val:'6.1 t/ha', label:'Best Yield', color:'#faf3e8' },
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

        @media (max-width: 900px) {
          .pc-body { grid-template-columns: 1fr; }
          .pc-impact-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>
    </div>
  );
}
