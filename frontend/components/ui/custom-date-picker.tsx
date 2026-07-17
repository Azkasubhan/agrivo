'use client';

import { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

interface CustomDatePickerProps {
  value: string; // expects YYYY-MM-DD
  onChange: (value: string) => void;
}

const MONTHS_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const DAYS_SHORT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export function CustomDatePicker({ value, onChange }: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse initial date
  const initialDate = value ? new Date(value) : new Date();
  const [viewDate, setViewDate] = useState(initialDate);

  // Synchronize viewDate when value updates externally
  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setViewDate(d);
      }
    }
  }, [value]);

  // Click outside listener to close calendar popover
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  // Get days in current month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Get weekday of 1st day of the month (0 = Sunday, 1 = Monday, etc)
  const firstDayIndex = new Date(year, month, 1).getDay();

  // Get days from previous month for padding
  const prevMonthDaysCount = new Date(year, month, 0).getDate();
  const paddingPrevDays = Array.from({ length: firstDayIndex }, (_, i) => {
    return {
      day: prevMonthDaysCount - firstDayIndex + i + 1,
      isCurrentMonth: false,
      monthOffset: -1
    };
  });

  // Days in current month
  const currentMonthDays = Array.from({ length: daysInMonth }, (_, i) => {
    return {
      day: i + 1,
      isCurrentMonth: true,
      monthOffset: 0
    };
  });

  // Padding next month days to make the grid full weeks (multiples of 7)
  const totalGridCells = Math.ceil((paddingPrevDays.length + currentMonthDays.length) / 7) * 7;
  const paddingNextDaysCount = totalGridCells - (paddingPrevDays.length + currentMonthDays.length);
  const paddingNextDays = Array.from({ length: paddingNextDaysCount }, (_, i) => {
    return {
      day: i + 1,
      isCurrentMonth: false,
      monthOffset: 1
    };
  });

  const allGridDays = [...paddingPrevDays, ...currentMonthDays, ...paddingNextDays];

  // Helper to format date as YYYY-MM-DD
  const formatDateString = (y: number, m: number, d: number) => {
    const pad = (num: number) => String(num).padStart(2, '0');
    return `${y}-${pad(m + 1)}-${pad(d)}`;
  };

  // Helper to format date for display in input
  const getDisplayDate = () => {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '';
    const pad = (num: number) => String(num).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  };

  const handleDayClick = (dayObj: { day: number; isCurrentMonth: boolean; monthOffset: number }) => {
    let targetYear = year;
    let targetMonth = month + dayObj.monthOffset;

    if (targetMonth < 0) {
      targetMonth = 11;
      targetYear -= 1;
    } else if (targetMonth > 11) {
      targetMonth = 0;
      targetYear += 1;
    }

    const formatted = formatDateString(targetYear, targetMonth, dayObj.day);
    onChange(formatted);
    setIsOpen(false);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(viewDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setViewDate(newDate);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDate = new Date(viewDate);
    newDate.setFullYear(parseInt(e.target.value));
    setViewDate(newDate);
  };

  // Generate list of years (e.g. 5 years ago to 1 year in the future)
  const currentYear = new Date().getFullYear();
  const yearsRange = Array.from({ length: 15 }, (_, i) => currentYear - 10 + i);

  // Check if a grid day is the currently selected date
  const isSelected = (dayObj: { day: number; isCurrentMonth: boolean; monthOffset: number }) => {
    if (!value) return false;
    const selDate = new Date(value);
    
    let checkMonth = month + dayObj.monthOffset;
    let checkYear = year;
    if (checkMonth < 0) {
      checkMonth = 11;
      checkYear -= 1;
    } else if (checkMonth > 11) {
      checkMonth = 0;
      checkYear += 1;
    }

    return (
      selDate.getDate() === dayObj.day &&
      selDate.getMonth() === checkMonth &&
      selDate.getFullYear() === checkYear
    );
  };

  return (
    <div className="custom-datepicker-container" ref={containerRef}>
      {/* Date Input Selector Box */}
      <div 
        className={`custom-datepicker-trigger ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="datepicker-display-value">
          {getDisplayDate() || 'Pilih tanggal...'}
        </span>
        <CalendarIcon size={16} className="datepicker-icon" />
      </div>

      {/* Calendar Dropdown Popover */}
      {isOpen && (
        <div className="datepicker-popover">
          {/* Header Controls */}
          <div className="datepicker-header">
            <button 
              type="button" 
              onClick={() => navigateMonth('prev')}
              className="datepicker-nav-btn"
            >
              <ChevronLeft size={16} />
            </button>

            <div className="datepicker-title-group">
              <span className="datepicker-month-label">{MONTHS_ID[month]}</span>
              
              <select 
                value={year} 
                onChange={handleYearChange}
                className="datepicker-year-select"
                onClick={(e) => e.stopPropagation()}
              >
                {yearsRange.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <button 
              type="button" 
              onClick={() => navigateMonth('next')}
              className="datepicker-nav-btn"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Days of Week Row */}
          <div className="datepicker-weekdays">
            {DAYS_SHORT.map((day) => (
              <div key={day} className="datepicker-weekday">
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="datepicker-grid">
            {allGridDays.map((dayObj, index) => {
              const selected = isSelected(dayObj);
              return (
                <button
                  key={`${dayObj.monthOffset}-${dayObj.day}-${index}`}
                  type="button"
                  onClick={() => handleDayClick(dayObj)}
                  className={`datepicker-day-cell ${
                    dayObj.isCurrentMonth ? 'current-month' : 'other-month'
                  } ${selected ? 'selected' : ''}`}
                >
                  <span>{dayObj.day}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <style>{`
        .custom-datepicker-container {
          position: relative;
          width: 100%;
        }

        .custom-datepicker-trigger {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #fff;
          border: 1px solid #E8E2D9;
          border-radius: 10px;
          padding: 0.75rem 1rem;
          font-size: 0.9rem;
          color: #161616;
          cursor: pointer;
          transition: border-color 0.2s, box-shadow 0.2s;
          user-select: none;
        }

        .custom-datepicker-trigger:hover {
          border-color: #5A6F45;
        }

        .custom-datepicker-trigger.active {
          border-color: #14532D;
          box-shadow: 0 0 0 3px rgba(20, 83, 45, 0.1);
        }

        .datepicker-display-value {
          font-family: inherit;
        }

        .datepicker-icon {
          color: #5A6F45;
        }

        /* Calendar Dropdown Card */
        .datepicker-popover {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          z-index: 9999;
          background: #FAF8F3;
          border: 1px solid #E8E2D9;
          border-radius: 16px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
          width: 290px;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          animation: slideDown 0.15s ease-out;
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

        /* Header Month/Year Selector */
        .datepicker-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #E8E2D9;
          padding-bottom: 0.5rem;
        }

        .datepicker-nav-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 6px;
          border: 1px solid #E8E2D9;
          background: #fff;
          color: #5A6F45;
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s;
        }

        .datepicker-nav-btn:hover {
          background: #FAF8F3;
          border-color: #5A6F45;
        }

        .datepicker-title-group {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .datepicker-month-label {
          font-size: 0.85rem;
          font-weight: 700;
          color: #161616;
        }

        .datepicker-year-select {
          font-size: 0.85rem;
          font-weight: 700;
          background: transparent;
          border: none;
          color: #5A6F45;
          cursor: pointer;
          outline: none;
          padding: 0 0.2rem;
          border-radius: 4px;
        }

        .datepicker-year-select:hover {
          background: rgba(90, 111, 69, 0.08);
        }

        /* Weekdays Row */
        .datepicker-weekdays {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          text-align: center;
        }

        .datepicker-weekday {
          font-size: 0.7rem;
          font-weight: 800;
          color: #787878;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 0.25rem 0;
        }

        /* Days Grid */
        .datepicker-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 4px;
        }

        .datepicker-day-cell {
          display: flex;
          align-items: center;
          justify-content: center;
          aspect-ratio: 1;
          border-radius: 8px;
          border: none;
          background: transparent;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.15s, color 0.15s;
          color: #161616;
        }

        .datepicker-day-cell.other-month {
          color: #A0A0A0;
          font-weight: 400;
        }

        .datepicker-day-cell:hover {
          background-color: rgba(90, 111, 69, 0.1);
          color: #14532D;
        }

        .datepicker-day-cell.selected {
          background-color: #14532D !important;
          color: #fff !important;
          font-weight: 700;
        }
      `}</style>
    </div>
  );
}
