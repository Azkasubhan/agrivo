'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Cloud, User, Lightbulb, Leaf, ChevronRight, ArrowLeft, Sparkles } from 'lucide-react';
import { useState } from 'react';

const routes = [
  { href: '/dashboard', label: 'Dashboard', icon: BarChart3, sub: 'Overview & metrics' },
  { href: '/recommendations', label: 'Recommendations', icon: Lightbulb, sub: 'AI irrigation advice' },
  { href: '/predict', label: 'AI Predictor', icon: Sparkles, sub: 'Generate AWD strategy' },
  { href: '/field-analysis', label: 'Field Analysis', icon: Leaf, sub: 'Soil & crop data' },
  { href: '/weather', label: 'Weather', icon: Cloud, sub: '7-day forecast' },
  { href: '/profile', label: 'Profile', icon: User, sub: 'Account settings' },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`ag-sidebar${collapsed ? ' collapsed' : ''}`}>
      {/* Logo */}
      <div className="ag-sidebar-logo">
        <Link href="/dashboard" className="ag-sidebar-brand">
          <div className="ag-sidebar-icon-wrap">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M10 2C5.58 2 2 5.58 2 10s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm0 3c1.1 0 2 .9 2 2v1h-4V7c0-1.1.9-2 2-2zm3 9H7v-1c0-1.1.9-2 2-2h2c1.1 0 2 .9 2 2v1z" fill="white"/>
            </svg>
          </div>
          {!collapsed && <span className="ag-sidebar-brand-text">AGRIVO</span>}
        </Link>
        <button className="ag-sidebar-collapse-btn" onClick={() => setCollapsed(!collapsed)} aria-label="Toggle sidebar">
          <ChevronRight size={16} style={{ transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform .3s' }} />
        </button>
      </div>

      {/* Nav */}
      <nav className="ag-sidebar-nav">
        {!collapsed && <div className="ag-sidebar-nav-label">Navigation</div>}
        {routes.map(({ href, label, icon: Icon, sub }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link key={href} href={href} className={`ag-sidebar-link${active ? ' active' : ''}`} title={collapsed ? label : undefined}>
              <div className="ag-sidebar-link-icon"><Icon size={18} /></div>
              {!collapsed && (
                <div className="ag-sidebar-link-text">
                  <span className="ag-sidebar-link-label">{label}</span>
                  <span className="ag-sidebar-link-sub">{sub}</span>
                </div>
              )}
              {!collapsed && active && <div className="ag-sidebar-active-dot" />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: back to landing */}
      <div className="ag-sidebar-bottom">
        <Link href="/landing" className="ag-sidebar-landing-link" title={collapsed ? 'Back to site' : undefined}>
          <ArrowLeft size={16} />
          {!collapsed && <span>Back to site</span>}
        </Link>
      </div>

      <style>{`
        .ag-sidebar {
          width: 240px;
          background: #ffffff;
          border-right: 1px solid #E8E2D9;
          display: flex;
          flex-direction: column;
          height: 100vh;
          flex-shrink: 0;
          transition: width .3s cubic-bezier(.4,0,.2,1);
          overflow: hidden;
        }
        .ag-sidebar.collapsed { width: 68px; }

        .ag-sidebar-logo {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.5rem 1rem 1rem;
          border-bottom: 1px solid #F0EDE6;
          flex-shrink: 0;
        }
        .ag-sidebar-brand {
          display: flex; align-items: center; gap: .75rem;
          text-decoration: none; overflow: hidden; white-space: nowrap;
        }
        .ag-sidebar-icon-wrap {
          width: 32px; height: 32px;
          background: #14532D; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .ag-sidebar-brand-text {
          font-size: .9rem; font-weight: 800; letter-spacing: .08em;
          color: #161616;
        }
        .ag-sidebar-collapse-btn {
          display: flex; align-items: center; justify-content: center;
          width: 28px; height: 28px; border-radius: 8px;
          background: #FAF8F3; border: 1px solid #E8E2D9;
          cursor: pointer; color: #787878; flex-shrink: 0;
          transition: background .2s;
        }
        .ag-sidebar-collapse-btn:hover { background: #F0EDE6; }

        .ag-sidebar-nav {
          flex: 1; padding: 1.25rem .75rem;
          display: flex; flex-direction: column; gap: .25rem;
          overflow-y: auto; overflow-x: hidden;
        }
        .ag-sidebar-nav-label {
          font-size: .6rem; font-weight: 700; letter-spacing: .12em;
          text-transform: uppercase; color: #c8c0b4;
          padding: 0 .5rem; margin-bottom: .5rem;
        }
        .ag-sidebar-link {
          display: flex; align-items: center; gap: .75rem;
          padding: .65rem .75rem; border-radius: 12px;
          text-decoration: none; color: #787878;
          transition: background .15s, color .15s;
          position: relative; overflow: hidden;
          white-space: nowrap;
        }
        .ag-sidebar-link:hover { background: #FAF8F3; color: #161616; }
        .ag-sidebar-link.active { background: #f0f7ec; color: #14532D; }
        .ag-sidebar-link-icon { flex-shrink: 0; display: flex; }
        .ag-sidebar-link.active .ag-sidebar-link-icon { color: #14532D; }
        .ag-sidebar-link-text { flex: 1; display: flex; flex-direction: column; min-width: 0; }
        .ag-sidebar-link-label { font-size: .875rem; font-weight: 600; }
        .ag-sidebar-link-sub { font-size: .7rem; color: #c8c0b4; margin-top: .05rem; }
        .ag-sidebar-link.active .ag-sidebar-link-sub { color: #5A6F45; }
        .ag-sidebar-active-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #14532D; flex-shrink: 0;
        }

        .ag-sidebar-bottom {
          padding: 1rem .75rem 1.5rem;
          border-top: 1px solid #F0EDE6;
          flex-shrink: 0;
        }
        .ag-sidebar-landing-link {
          display: flex; align-items: center; gap: .6rem;
          font-size: .8rem; font-weight: 500; color: #a09589;
          text-decoration: none; padding: .5rem .75rem; border-radius: 8px;
          transition: color .2s, background .2s; white-space: nowrap;
        }
        .ag-sidebar-landing-link:hover { color: #14532D; background: #FAF8F3; }
      `}</style>
    </aside>
  );
}
