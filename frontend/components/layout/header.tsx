'use client';

import { Bell, Search, Settings } from 'lucide-react';
import Link from 'next/link';

export function Header() {
  return (
    <header className="ag-header">
      <div className="ag-header-left">
        <div className="ag-header-search">
          <Search size={15} className="ag-search-icon" />
          <input type="text" placeholder="Search fields, recommendations…" className="ag-search-input" />
          <kbd className="ag-search-kbd">⌘K</kbd>
        </div>
      </div>

      <div className="ag-header-right">
        <button className="ag-header-icon-btn" aria-label="Notifications" onClick={() => alert('No new notifications!')}>
          <Bell size={18} />
          <span className="ag-notif-dot" />
        </button>
        <Link href="/profile" className="ag-header-icon-btn" aria-label="Settings">
          <Settings size={18} />
        </Link>
        <div className="ag-header-divider" />
        <Link href="/profile" className="ag-header-avatar" aria-label="Profile">
          <span>FH</span>
        </Link>
      </div>

      <style>{`
        .ag-header {
          height: 60px; background: #fff;
          border-bottom: 1px solid #E8E2D9;
          display: flex; align-items: center;
          padding: 0 2rem; gap: 1.5rem;
          flex-shrink: 0;
        }
        .ag-header-left { flex: 1; }
        .ag-header-search {
          display: flex; align-items: center; gap: .6rem;
          background: #FAF8F3; border: 1px solid #E8E2D9;
          border-radius: 10px; padding: .5rem .85rem;
          max-width: 340px;
          transition: border-color .2s, box-shadow .2s;
        }
        .ag-header-search:focus-within {
          border-color: #14532D;
          box-shadow: 0 0 0 3px rgba(20,83,45,0.08);
        }
        .ag-search-icon { color: #a09589; flex-shrink: 0; }
        .ag-search-input {
          flex: 1; background: none; border: none; outline: none;
          font-size: .85rem; color: #161616;
          font-family: inherit;
        }
        .ag-search-input::placeholder { color: #a09589; }
        .ag-search-kbd {
          font-size: .65rem; color: #a09589; background: #E8E2D9;
          border-radius: 5px; padding: .15rem .4rem;
          font-family: inherit; flex-shrink: 0;
        }
        .ag-header-right {
          display: flex; align-items: center; gap: .5rem;
        }
        .ag-header-icon-btn {
          position: relative; width: 36px; height: 36px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 10px; background: none; border: none;
          color: #787878; cursor: pointer;
          transition: background .15s, color .15s;
        }
        .ag-header-icon-btn:hover { background: #FAF8F3; color: #161616; }
        .ag-notif-dot {
          position: absolute; top: 7px; right: 7px;
          width: 7px; height: 7px; border-radius: 50%;
          background: #14532D; border: 2px solid #fff;
        }
        .ag-header-divider {
          width: 1px; height: 24px; background: #E8E2D9; margin: 0 .25rem;
        }
        .ag-header-avatar {
          width: 36px; height: 36px; border-radius: 50%;
          background: #14532D; color: #fff;
          font-size: .75rem; font-weight: 700;
          border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: opacity .2s;
        }
        .ag-header-avatar:hover { opacity: .85; }
      `}</style>
    </header>
  );
}
