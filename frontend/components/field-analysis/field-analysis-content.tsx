'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Field } from '@/lib/mock-data';
import { apiClient } from '@/lib/api-client';
import { Plus, X, Loader2 } from 'lucide-react';
import { CustomSelect } from '../ui/custom-select';
import { CustomDatePicker } from '../ui/custom-date-picker';
import dynamic from 'next/dynamic';

const MapPicker = dynamic(
  () => import('../ui/map-picker').then((mod) => mod.MapPicker),
  {
    ssr: false,
    loading: () => (
      <div style={{
        height: '280px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#FAF8F3',
        borderRadius: '12px',
        border: '1px solid #E8E2D9',
        color: '#787878',
        fontSize: '0.85rem',
        fontWeight: 500
      }}>
        Loading interactive map...
      </div>
    ),
  }
);

const soilTypeOptions = [
  { value: 'CLAY', label: 'Clay' },
  { value: 'LOAM', label: 'Loam' },
  { value: 'SANDY', label: 'Sandy' },
  { value: 'SILTY', label: 'Silty' },
];

const riceVarietyOptions = [
  { value: 'CIHERANG', label: 'Ciherang' },
  { value: 'IR64', label: 'IR64' },
  { value: 'INPARI_32', label: 'Inpari 32' },
  { value: 'INPARI_42_AGRITAN_GSR', label: 'Inpari 42 Agritan GSR' },
  { value: 'MEKONGGA', label: 'Mekongga' },
];

const irrigationSystemOptions = [
  { value: 'TECHNICAL', label: 'Technical' },
  { value: 'SEMI_TECHNICAL', label: 'Semi-Technical' },
  { value: 'RAINFED', label: 'Rainfed' },
  { value: 'COMMUNAL_GRAVITY', label: 'Communal Gravity' },
];

const prevIrrigationOptions = [
  { value: 'CONTINUOUS_FLOODING', label: 'Continuous Flooding' },
  { value: 'CONTINUOUS_FLOODING_MODIFIED', label: 'Modified Continuous Flooding' },
  { value: 'AWD_MILD', label: 'AWD (Alternate Wetting and Drying) - Mild' },
  { value: 'AWD_STRICT', label: 'AWD (Alternate Wetting and Drying) - Strict' },
  { value: 'DELAYED_IRRIGATION', label: 'Delayed Irrigation' },
  { value: 'PARTIAL_IRRIGATION', label: 'Partial Irrigation' },
];

interface Props {
  fields: Field[];
  onFieldAdded?: () => void;
}

export function FieldAnalysisContent({ fields, onFieldAdded }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [errors, setErrors] = useState<{
    name?: string;
    area?: string;
    latitude?: string;
    longitude?: string;
  }>({});

  // Form State
  const [name, setName] = useState('');
  const [soilType, setSoilType] = useState('CLAY');
  const [riceVariety, setRiceVariety] = useState('CIHERANG');
  const [plantingDate, setPlantingDate] = useState(new Date().toISOString().split('T')[0]);
  const [area, setArea] = useState('1.0');
  const [latitude, setLatitude] = useState('-7.7025');
  const [longitude, setLongitude] = useState('110.6012');
  const [irrigationSystem, setIrrigationSystem] = useState('TECHNICAL');
  const [prevIrrigation, setPrevIrrigation] = useState('CONTINUOUS_FLOODING');

  useEffect(() => {
    if (errorMsg) {
      const timer = setTimeout(() => {
        setErrorMsg('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMsg]);

  const handleAreaChange = (val: string) => {
    if (/^\d*\.?\d*$/.test(val)) {
      setArea(val);
      if (errors.area) setErrors(prev => ({ ...prev, area: undefined }));
    }
  };

  const handleLatitudeChange = (val: string) => {
    if (/^-?\d*\.?\d*$/.test(val)) {
      setLatitude(val);
      if (errors.latitude) setErrors(prev => ({ ...prev, latitude: undefined }));
    }
  };

  const handleLongitudeChange = (val: string) => {
    if (/^\d*\.?\d*$/.test(val)) {
      setLongitude(val);
      if (errors.longitude) setErrors(prev => ({ ...prev, longitude: undefined }));
    }
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setErrorMsg('');
    setErrors({});
    // Reset defaults
    setName('');
    setSoilType('CLAY');
    setRiceVariety('CIHERANG');
    setPlantingDate(new Date().toISOString().split('T')[0]);
    setArea('1.0');
    setLatitude('-7.7025');
    setLongitude('110.6012');
    setIrrigationSystem('TECHNICAL');
    setPrevIrrigation('CONTINUOUS_FLOODING');
  };

  const validateForm = () => {
    const newErrors: typeof errors = {};
    if (!name.trim()) {
      newErrors.name = 'Field Name is required.';
    }

    const parsedArea = parseFloat(area);
    if (isNaN(parsedArea) || parsedArea <= 0 || parsedArea > 25) {
      newErrors.area = 'Area must be a number between 0.01 and 25.00 Ha.';
    }

    const parsedLat = parseFloat(latitude);
    if (isNaN(parsedLat) || parsedLat < -11.0000 || parsedLat > 6.1000) {
      newErrors.latitude = 'Latitude must be a number between -11.0000 and 6.1000 (Indonesian coordinate range).';
    }

    const parsedLng = parseFloat(longitude);
    if (isNaN(parsedLng) || parsedLng < 94.7000 || parsedLng > 141.1000) {
      newErrors.longitude = 'Longitude must be a number between 94.7000 and 141.1000 (Indonesian coordinate range).';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const payload = {
        name,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        soil_type: soilType,
        rice_variety_code: riceVariety,
        planting_date: plantingDate,
        field_area_ha: parseFloat(area),
        previous_irrigation_method: prevIrrigation || null,
        irrigation_system_type: irrigationSystem || null,
      };

      await apiClient('/fields', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (onFieldAdded) {
        onFieldAdded();
      }
      handleClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to add field. Please verify your input values.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fa-root">
      {errorMsg && (
        <div className="floating-toast error animate-slide-in-right">
          <div className="toast-content">
            <span className="toast-message">{errorMsg}</span>
          </div>
          <button className="toast-close" onClick={() => setErrorMsg('')}>&times;</button>
        </div>
      )}

      {!selectedField && (
        <>
          <div className="fa-header">
            <div>
              <p className="fa-eyebrow">Field Analysis</p>
              <h1 className="fa-h1">Your Fields</h1>
              <p className="fa-desc">{fields.length} fields · {fields.reduce((s, f) => s + parseFloat(f.area as any || 0), 0).toFixed(1)} ha total area</p>
            </div>
            <button className="fa-add-btn" onClick={() => setIsModalOpen(true)}>
              <Plus size={16} />
              <span>Add Field</span>
            </button>
          </div>

          {/* Summary cards */}
          <div className="fa-summary-row">
            {[
              { label: 'Total Area', val: `${fields.reduce((s,f)=>s+parseFloat(f.area as any || 0),0).toFixed(1)} ha`, icon: '🌾' },
              { label: 'Avg. Moisture', val: fields.length > 0 ? `${Math.round(fields.reduce((s,f)=>s+parseFloat(f.moisture as any || 0),0)/fields.length)}%` : '0%', icon: '💧' },
              { label: 'Avg. pH', val: fields.length > 0 ? (fields.reduce((s,f)=>s+parseFloat(f.ph as any || 0),0)/fields.length).toFixed(1) : '0.0', icon: '🧪' },
              { label: 'Avg. Temp', val: fields.length > 0 ? `${(fields.reduce((s,f)=>s+parseFloat(f.temperature as any || 0),0)/fields.length).toFixed(1)}°C` : '0°C', icon: '🌡️' },
            ].map(s => (
              <div key={s.label} className="fa-summary-card">
                <div className="fa-sum-icon">{s.icon}</div>
                <div className="fa-sum-val">{s.val}</div>
                <div className="fa-sum-lbl">{s.label}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {selectedField ? (
        <div className="fa-detail-view animate-scale-in">
          <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p className="fa-eyebrow">Field Analysis</p>
              <h1 className="fa-h1" style={{ fontSize: '2rem', fontWeight: 800, color: '#14532D', margin: '0.25rem 0 0' }}>{selectedField.name}</h1>
            </div>
            <button className="fa-back-btn-top" onClick={() => setSelectedField(null)}>
              &larr; Back to Fields
            </button>
          </div>
          
          <div className="fa-detail-layout">
            <div className="fa-detail-sidebar">
              <div className="fa-detail-img-wrap">
                <Image
                  src="/rice-field-editorial.png"
                  alt={selectedField.name}
                  fill
                  className="fa-detail-img"
                  priority
                />
                <div className="fa-detail-img-overlay" />
                <div className="fa-detail-img-label">
                  <span className="fa-crop-badge">{selectedField.crop}</span>
                  <span className="fa-area-badge">{selectedField.area} ha</span>
                </div>
              </div>
            </div>
            
            <div className="fa-detail-info">
              <div style={{ fontSize: '0.8rem', color: '#787878', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{selectedField.location}</div>
              <div style={{ fontSize: '1rem', fontWeight: 600, color: '#5A6F45', marginBottom: '1.5rem' }}>Soil type: {selectedField.soilType}</div>

              {/* Moisture bar */}
              <div className="fa-moisture-section">
                <div className="fa-moisture-header">
                  <span className="fa-moisture-label">Soil Moisture</span>
                  <span className="fa-moisture-val" style={{ color: selectedField.moisture < 60 ? '#C0392B' : '#14532D' }}>{selectedField.moisture}%</span>
                </div>
                <div className="fa-moisture-bar-bg">
                  <div className="fa-moisture-bar" style={{
                    width: `${selectedField.moisture}%`,
                    background: selectedField.moisture < 60 ? '#C0392B' : selectedField.moisture > 80 ? '#2563EB' : '#14532D'
                  }} />
                </div>
                <div className="fa-moisture-scale">
                  <span>Dry</span><span>Optimal</span><span>Wet</span>
                </div>
              </div>

              {/* Nutrient grid */}
              <div className="fa-nutrient-grid">
                {[
                  { label: 'pH Level', val: selectedField.ph, unit: '', ideal: '6.0–7.0' },
                  { label: 'Temperature', val: selectedField.temperature, unit: '°C', ideal: '15–25°C' },
                  { label: 'Nitrogen', val: selectedField.nitrogen, unit: 'ppm', ideal: '40–60 ppm' },
                  { label: 'Phosphorus', val: selectedField.phosphorus, unit: 'ppm', ideal: '15–25 ppm' },
                  { label: 'Potassium', val: selectedField.potassium, unit: 'ppm', ideal: '130–180 ppm' },
                ].map(n => (
                  <div key={n.label} className="fa-nutrient-card">
                    <div className="fa-nut-label">{n.label}</div>
                    <div className="fa-nut-val">{n.val}<span className="fa-nut-unit">{n.unit}</span></div>
                    <div className="fa-nut-ideal">Ideal: {n.ideal}</div>
                  </div>
                ))}
              </div>

              <div className="fa-last-watered">
                Last irrigated: {selectedField.lastWatered.toLocaleDateString('en', { day:'numeric', month:'long', year:'numeric' })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="fa-fields-list">
          {fields.map((field) => (
            <div key={field.id} className="fa-landscape-card" onClick={() => setSelectedField(field)}>
              <div className="fa-landscape-img-wrap">
                <Image
                  src="/rice-field-editorial.png"
                  alt={field.name}
                  fill
                  className="fa-landscape-img"
                />
                <span className="fa-landscape-crop-badge">{field.crop}</span>
              </div>
              <div className="fa-landscape-info">
                <div className="fa-landscape-meta">
                  <span className="fa-landscape-loc">{field.location}</span>
                  <span className="fa-landscape-dot">•</span>
                  <span className="fa-landscape-area">{field.area} ha</span>
                </div>
                <h2 className="fa-landscape-name">{field.name}</h2>
                <div className="fa-landscape-bottom">
                  <span className="fa-landscape-soil">Soil: {field.soilType}</span>
                  <span className="fa-landscape-action">View Analysis &rarr;</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Field Modal */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content animate-scale-in">
            <div className="modal-header">
              <h2 className="modal-title">Add New Field</h2>
              <button className="modal-close-btn" onClick={handleClose}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="modal-form">

              <div className="form-grid">
                <div className="form-group full-width">
                  <label className="form-label">Field Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. South Hill Field, Block C"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name) setErrors(prev => ({ ...prev, name: undefined }));
                    }}
                    className={`form-input${errors.name ? ' error' : ''}`}
                  />
                  {errors.name && <span className="field-error-text">{errors.name}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Soil Type *</label>
                  <CustomSelect
                    value={soilType}
                    onChange={setSoilType}
                    options={soilTypeOptions}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Rice Variety *</label>
                  <CustomSelect
                    value={riceVariety}
                    onChange={setRiceVariety}
                    options={riceVarietyOptions}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Planting Date *</label>
                  <CustomDatePicker
                    value={plantingDate}
                    onChange={setPlantingDate}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Field Area (Hectares) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1.5"
                    value={area}
                    onChange={(e) => handleAreaChange(e.target.value)}
                    className={`form-input${errors.area ? ' error' : ''}`}
                  />
                  {errors.area && <span className="field-error-text">{errors.area}</span>}
                </div>

                <div className="form-group full-width">
                  <label className="form-label">Select Location on Map *</label>
                  <MapPicker
                    latitude={latitude ? parseFloat(latitude) : null}
                    longitude={longitude ? parseFloat(longitude) : null}
                    onChange={(lat, lng) => {
                      setLatitude(String(lat));
                      setLongitude(String(lng));
                      setErrors(prev => ({ ...prev, latitude: undefined, longitude: undefined }));
                    }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Latitude * (-11.0000 to 6.1000)</label>
                  <input
                    type="text"
                    required
                    readOnly
                    placeholder="Select on map"
                    value={latitude}
                    className={`form-input${errors.latitude ? ' error' : ''}`}
                    style={{ background: '#F4F1EA', cursor: 'not-allowed', color: '#555' }}
                  />
                  {errors.latitude && <span className="field-error-text">{errors.latitude}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Longitude * (94.7000 to 141.1000)</label>
                  <input
                    type="text"
                    required
                    readOnly
                    placeholder="Select on map"
                    value={longitude}
                    className={`form-input${errors.longitude ? ' error' : ''}`}
                    style={{ background: '#F4F1EA', cursor: 'not-allowed', color: '#555' }}
                  />
                  {errors.longitude && <span className="field-error-text">{errors.longitude}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Irrigation System Type *</label>
                  <CustomSelect
                    value={irrigationSystem}
                    onChange={setIrrigationSystem}
                    options={irrigationSystemOptions}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Previous Irrigation Method *</label>
                  <CustomSelect
                    value={prevIrrigation}
                    onChange={setPrevIrrigation}
                    options={prevIrrigationOptions}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={handleClose} disabled={isSubmitting}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Field</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .fa-root { display: flex; flex-direction: column; gap: 2.5rem; }

        .fa-header { display: flex; justify-content: space-between; align-items: flex-end; }
        .fa-eyebrow { font-size: .68rem; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: #14532D; margin-bottom: .4rem; }
        .fa-h1 { font-size: clamp(1.75rem, 3vw, 2.5rem); font-weight: 800; letter-spacing: -.025em; color: #161616; margin: 0 0 .3rem; }
        .fa-desc { font-size: .9rem; color: #787878; }

        .fa-add-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #14532D;
          color: #fff;
          font-weight: 600;
          font-size: 0.85rem;
          padding: 0.75rem 1.25rem;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          transition: background 0.2s, transform 0.1s;
          box-shadow: var(--shadow-soft);
        }
        .fa-add-btn:hover {
          background: #0f3d21;
          transform: translateY(-1px);
        }
        .fa-add-btn:active {
          transform: translateY(0);
        }

        .fa-summary-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
        .fa-summary-card { background: #fff; border: 1px solid #E8E2D9; border-radius: 18px; padding: 1.5rem; text-align: center; transition: box-shadow .2s, transform .2s; }
        .fa-summary-card:hover { box-shadow: 0 6px 20px rgba(0,0,0,0.07); transform: translateY(-2px); }
        .fa-sum-icon { font-size: 1.75rem; margin-bottom: .6rem; }
        .fa-sum-val { font-size: 1.75rem; font-weight: 900; letter-spacing: -.02em; color: #161616; }
        .fa-sum-lbl { font-size: .72rem; color: #787878; margin-top: .2rem; font-weight: 500; }

        .fa-fields-list {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          margin-top: 1rem;
        }

        .fa-landscape-card {
          display: flex;
          background: #fff;
          border: 1px solid #E8E2D9;
          border-radius: 16px;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
        }

        .fa-landscape-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 20px -8px rgba(20, 83, 45, 0.08);
          border-color: #5A6F45;
        }

        .fa-landscape-img-wrap {
          position: relative;
          width: 240px;
          min-width: 240px;
          height: 160px;
          overflow: hidden;
        }

        .fa-landscape-img {
          object-fit: cover;
        }

        .fa-landscape-crop-badge {
          position: absolute;
          bottom: 10px;
          left: 10px;
          background: #14532D;
          color: #fff;
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 0.25rem 0.6rem;
          border-radius: 6px;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
        }

        .fa-landscape-info {
          flex: 1;
          padding: 1.5rem 1.75rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .fa-landscape-meta {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8rem;
          color: #787878;
          font-weight: 500;
        }

        .fa-landscape-dot {
          color: #C2BCAE;
        }

        .fa-landscape-name {
          font-size: 1.4rem;
          font-weight: 700;
          color: #14532D;
          margin: 0.5rem 0;
          letter-spacing: -0.01em;
        }

        .fa-landscape-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-top: 1px solid #F3EFE9;
          padding-top: 0.75rem;
          margin-top: 0.5rem;
        }

        .fa-landscape-soil {
          font-size: 0.8rem;
          font-weight: 600;
          color: #5A6F45;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .fa-landscape-action {
          font-size: 0.85rem;
          font-weight: 700;
          color: #14532D;
          transition: transform 0.2s;
        }

        .fa-landscape-card:hover .fa-landscape-action {
          transform: translateX(4px);
        }

        /* Detail View Styles */
        .fa-back-btn-top {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: #FAF8F3;
          border: 1px solid #E8E2D9;
          color: #5A6F45;
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          padding: 0.6rem 1.2rem;
          border-radius: 10px;
          transition: background 0.2s, color 0.2s;
        }

        .fa-back-btn-top:hover {
          background: #F0EDE6;
          color: #14532D;
        }

        .fa-detail-layout {
          display: grid;
          grid-template-columns: 360px 1fr;
          gap: 2.5rem;
          background: #fff;
          border: 1px solid #E8E2D9;
          border-radius: 20px;
          padding: 2rem;
        }

        .fa-detail-sidebar {
          display: flex;
          flex-direction: column;
        }

        .fa-detail-img-wrap {
          position: relative;
          width: 100%;
          height: 380px;
          border-radius: 16px;
          overflow: hidden;
        }

        .fa-detail-img {
          object-fit: cover;
        }

        .fa-detail-img-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, transparent 60%, rgba(0, 0, 0, 0.4) 100%);
        }

        .fa-detail-img-label {
          position: absolute;
          bottom: 1.25rem;
          left: 1.25rem;
          right: 1.25rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          z-index: 1;
        }

        .fa-crop-badge { font-size: .72rem; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: #fff; background: rgba(20,83,45,0.85); padding: .3rem .8rem; border-radius: 999px; }
        .fa-area-badge { font-size: .72rem; font-weight: 700; color: #fff; background: rgba(255,255,255,0.18); backdrop-filter: blur(8px); padding: .3rem .8rem; border-radius: 999px; }

        .fa-detail-eyebrow {
          font-size: 0.85rem;
          font-weight: 600;
          color: #787878;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .fa-detail-title {
          font-size: 2.2rem;
          font-weight: 800;
          color: #14532D;
          margin: 0.25rem 0 0.75rem;
          letter-spacing: -0.02em;
        }

        .fa-detail-soil {
          font-size: 0.95rem;
          font-weight: 500;
          color: #5A6F45;
          margin-bottom: 2rem;
        }

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

        /* Modal Styles */
        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(22, 22, 22, 0.4);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1.5rem;
        }

        .modal-content {
          background: #FAF8F3;
          border: 1px solid #E8E2D9;
          border-radius: 24px;
          max-width: 650px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: var(--shadow-modal);
          display: flex;
          flex-direction: column;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem 2rem;
          border-bottom: 1px solid #E8E2D9;
        }

        .modal-title {
          font-size: 1.25rem;
          font-weight: 800;
          color: #161616;
          margin: 0;
          letter-spacing: -0.01em;
        }

        .modal-close-btn {
          background: transparent;
          border: none;
          color: #787878;
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 8px;
          transition: background 0.2s, color 0.2s;
        }
        .modal-close-btn:hover {
          background: #E8E2D9;
          color: #161616;
        }

        .modal-form {
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .form-error-msg {
          background: #FDEDEC;
          border: 1px solid #FADBD8;
          color: #C0392B;
          padding: 0.75rem 1rem;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 500;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.25rem 1rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .form-group.full-width {
          grid-column: span 2;
        }

        .form-label {
          font-size: 0.75rem;
          font-weight: 700;
          color: #5A6F45;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .form-input {
          background: #fff;
          border: 1px solid #E8E2D9;
          border-radius: 10px;
          padding: 0.75rem 1rem;
          font-size: 0.9rem;
          color: #161616;
          transition: border-color 0.2s, box-shadow 0.2s;
          width: 100%;
        }

        .form-select {
          background: #fff;
          border: 1px solid #E8E2D9;
          border-radius: 10px;
          padding: 0.75rem 2.5rem 0.75rem 1rem;
          font-size: 0.9rem;
          color: #161616;
          transition: border-color 0.2s, box-shadow 0.2s;
          width: 100%;
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;
          background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%235A6F45' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E");
          background-position: right 1rem center;
          background-repeat: no-repeat;
          background-size: 1.25rem;
          cursor: pointer;
        }

        .form-input:focus, .form-select:focus {
          outline: none;
          border-color: #14532D;
          box-shadow: 0 0 0 3px rgba(20, 83, 45, 0.1);
        }

        .form-input.error, .form-select.error {
          border-color: #C0392B;
          box-shadow: 0 0 0 3px rgba(192, 57, 43, 0.1);
        }

        .field-error-text {
          color: #C0392B;
          font-size: 0.75rem;
          font-weight: 500;
          margin-top: 0.2rem;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          margin-top: 1rem;
          border-top: 1px solid #E8E2D9;
          padding-top: 1.5rem;
        }

        .btn-cancel {
          background: transparent;
          border: 1px solid #E8E2D9;
          color: #787878;
          padding: 0.75rem 1.5rem;
          border-radius: 10px;
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          transition: background 0.2s;
        }
        .btn-cancel:hover {
          background: #F0EDE6;
        }

        .btn-submit {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #14532D;
          border: none;
          color: #fff;
          padding: 0.75rem 1.5rem;
          border-radius: 10px;
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          transition: background 0.2s;
        }
        .btn-submit:hover {
          background: #0f3d21;
        }
        .btn-submit:disabled, .btn-cancel:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }


        /* Floating toast notification styles */
        .floating-toast {
          position: fixed;
          top: 2rem;
          right: 2rem;
          z-index: 10000;
          background: #fff;
          border: 1px solid #E8E2D9;
          border-left: 4px solid #C0392B;
          border-radius: 10px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.03);
          padding: 0.85rem 1.25rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          min-width: 320px;
          max-width: 420px;
          animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .toast-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
        }

        .toast-title {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #C0392B;
        }

        .toast-message {
          font-size: 0.85rem;
          color: #2c2c2c;
          font-weight: 600;
          line-height: 1.4;
        }

        .toast-close {
          background: transparent;
          border: none;
          color: #787878;
          font-size: 1.1rem;
          cursor: pointer;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s;
        }

        .toast-close:hover {
          color: #161616;
        }

        @media (max-width: 1024px) {
          .fa-header { flex-direction: column; align-items: flex-start; gap: 1rem; }
          .fa-add-btn { width: 100%; justify-content: center; }
          .fa-summary-row { grid-template-columns: repeat(2, 1fr); }
          .fa-landscape-card { flex-direction: column; }
          .fa-landscape-img-wrap { width: 100%; height: 180px; }
          .fa-detail-layout { grid-template-columns: 1fr; gap: 1.5rem; padding: 1.5rem; }
          .fa-detail-img-wrap { height: 250px; }
          .fa-nutrient-grid { grid-template-columns: repeat(2, 1fr); }
          .form-group.full-width { grid-column: span 1; }
        }
      `}</style>
    </div>
  );
}
