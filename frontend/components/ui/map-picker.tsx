'use client';

import { useState, useEffect } from 'react';
import { Map as MapIcon, AlertCircle } from 'lucide-react';

interface MapPickerProps {
  latitude: number | null;
  longitude: number | null;
  onChange: (lat: number, lng: number) => void;
}

export function MapPicker({ latitude, longitude, onChange }: MapPickerProps) {
  const [lat, setLat] = useState<number | ''>(latitude ?? -2.5489);
  const [lng, setLng] = useState<number | ''>(longitude ?? 118.0149);

  // Sync props -> state
  useEffect(() => {
    if (latitude !== null) setLat(latitude);
    if (longitude !== null) setLng(longitude);
  }, [latitude, longitude]);

  const handleApply = () => {
    onChange(Number(lat) || 0, Number(lng) || 0);
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '400px', background: '#F0EDE6', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <MapIcon size={48} color="#a09589" style={{ opacity: 0.5, marginBottom: '1rem' }} />
      <h3 style={{ color: '#161616', fontWeight: 700, marginBottom: '0.5rem' }}>Mode Peta Sederhana</h3>
      <p style={{ color: '#787878', fontSize: '0.9rem', maxWidth: '340px', textAlign: 'center', marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start', lineHeight: 1.5 }}>
        <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px', color: '#b07d10' }} />
        Plugin peta belum terinstal akibat gangguan jaringan NPM. Anda tetap dapat memasukkan koordinat secara manual.
      </p>
      
      <div style={{ display: 'flex', gap: '0.75rem', background: '#fff', padding: '1rem', borderRadius: '14px', border: '1px solid #E8E2D9', alignItems: 'flex-end', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#a09589', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Latitude</label>
          <input 
            type="number" 
            value={lat} 
            onChange={(e) => setLat(e.target.value === '' ? '' : parseFloat(e.target.value))}
            style={{ width: '110px', padding: '0.6rem', borderRadius: '8px', border: '1px solid #E8E2D9', fontSize: '0.9rem' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#a09589', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Longitude</label>
          <input 
            type="number" 
            value={lng} 
            onChange={(e) => setLng(e.target.value === '' ? '' : parseFloat(e.target.value))}
            style={{ width: '110px', padding: '0.6rem', borderRadius: '8px', border: '1px solid #E8E2D9', fontSize: '0.9rem' }}
          />
        </div>
        <button 
          type="button"
          onClick={handleApply}
          style={{ padding: '0.6rem 1.25rem', background: '#14532D', color: '#fff', borderRadius: '8px', border: 'none', fontWeight: 700, cursor: 'pointer', height: '38px' }}
        >
          Terapkan
        </button>
      </div>
    </div>
  );
}
