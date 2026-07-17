'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
  error?: boolean;
}

export function CustomSelect({ value, onChange, options, placeholder, className, error }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`custom-select-container ${className || ''}`} ref={containerRef}>
      <button
        type="button"
        className={`custom-select-trigger ${isOpen ? 'active' : ''} ${error ? 'error' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="custom-select-value">
          {selectedOption ? selectedOption.label : placeholder || 'Select option'}
        </span>
        <ChevronDown size={16} className={`custom-select-chevron ${isOpen ? 'open' : ''}`} />
      </button>

      {isOpen && (
        <div className="custom-select-dropdown">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                className={`custom-select-option ${isSelected ? 'selected' : ''}`}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
              >
                <span className="custom-select-option-label">{opt.label}</span>
                {isSelected && <Check size={14} className="custom-select-check" />}
              </button>
            );
          })}
        </div>
      )}

      <style>{`
        .custom-select-container {
          position: relative;
          width: 100%;
        }

        .custom-select-trigger {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #fff;
          border: 1px solid #E8E2D9;
          border-radius: 10px;
          padding: 0.75rem 1rem;
          font-size: 0.9rem;
          color: #161616;
          transition: border-color 0.2s, box-shadow 0.2s;
          width: 100%;
          cursor: pointer;
          text-align: left;
        }

        .custom-select-trigger:focus, .custom-select-trigger.active {
          outline: none;
          border-color: #14532D;
          box-shadow: 0 0 0 3px rgba(20, 83, 45, 0.1);
        }

        .custom-select-trigger.error {
          border-color: #C0392B;
          box-shadow: 0 0 0 3px rgba(192, 57, 43, 0.1);
        }

        .custom-select-value {
          font-weight: 500;
        }

        .custom-select-chevron {
          color: #5A6F45;
          transition: transform 0.2s ease;
        }

        .custom-select-chevron.open {
          transform: rotate(180deg);
        }

        .custom-select-dropdown {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          width: 100%;
          background: #FAF8F3;
          border: 1px solid #E8E2D9;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
          z-index: 1050;
          padding: 0.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          max-height: 250px;
          overflow-y: auto;
          animation: slideDown 0.15s ease-out;
        }

        .custom-select-option {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 0.6rem 0.8rem;
          border-radius: 8px;
          border: none;
          background: transparent;
          font-size: 0.85rem;
          color: #444;
          text-align: left;
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
        }

        .custom-select-option:hover {
          background: #E8E2D9;
          color: #161616;
        }

        .custom-select-option.selected {
          background: #14532D;
          color: #fff;
          font-weight: 600;
        }

        .custom-select-check {
          color: inherit;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
