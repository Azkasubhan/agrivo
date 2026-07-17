'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { BarChart3, Cloud, User, Lightbulb, Leaf, ChevronRight, ArrowLeft, Sparkles, LogOut } from 'lucide-react';
import { useState } from 'react';
import { clearAuthToken } from '@/lib/api-client';

const routes = [
  { href: '/dashboard', label: 'Dashboard', icon: BarChart3, sub: 'Overview & metrics' },
  { href: '/recommendations', label: 'Recommendations', icon: Lightbulb, sub: 'AI irrigation advice' },
  { href: '/field-analysis', label: 'Field Analysis', icon: Leaf, sub: 'Soil & crop data' },
  { href: '/weather', label: 'Weather', icon: Cloud, sub: '7-day forecast' },
  { href: '/profile', label: 'Profile', icon: User, sub: 'Account settings' },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    clearAuthToken();
    window.location.replace('/login');
  };

  return (
    <aside className={`ag-sidebar${collapsed ? ' collapsed' : ''}`}>
      {/* Logo */}
      <div className="ag-sidebar-logo">
        {!collapsed && (
          <Link href="/dashboard" className="ag-sidebar-brand">
            <Image src="/logofix.PNG" alt="AGRIVO" width={110} height={40} className="ag-sidebar-logo-img" priority />
          </Link>
        )}
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

      {/* Bottom: logout */}
      <div className="ag-sidebar-bottom" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <button onClick={handleLogout} className="ag-sidebar-logout-link" title={collapsed ? 'Sign Out' : undefined}>
          <LogOut size={16} />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>

      <style>{`
        .ag-sidebar {
          width: 240px;
          background: rgba(255, 255, 255, 0.35);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border-right: 1px solid rgba(255, 255, 255, 0.6);
          box-shadow: 4px 0 24px rgba(0, 0, 0, 0.03);
          display: flex;
          flex-direction: column;
          height: 100vh;
          flex-shrink: 0;
          transition: width .3s cubic-bezier(.4,0,.2,1);
          position: relative;
        }
        .ag-sidebar.collapsed { width: 68px; }
 
        .ag-sidebar-logo {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.5rem 1rem 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.4);
          flex-shrink: 0;
          position: relative;
          min-height: 73px;
          box-sizing: border-box;
        }
        .ag-sidebar.collapsed .ag-sidebar-logo {
          justify-content: center;
          padding: 1.5rem 0.5rem 1rem;
        }
        .ag-sidebar-brand {
          display: flex; align-items: center; gap: .75rem;
          text-decoration: none; overflow: hidden; white-space: nowrap;
        }
        .ag-sidebar.collapsed .ag-sidebar-brand {
          justify-content: center;
          width: 100%;
        }
        .ag-sidebar-logo-img { object-fit:contain; }
        .ag-sidebar-icon-wrap {
          width: 32px; height: 32px;
          background: #14532D; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .ag-sidebar-collapse-btn {
          position: absolute;
          right: -12px;
          top: 50%;
          transform: translateY(-50%);
          z-index: 10;
          display: flex; align-items: center; justify-content: center;
          width: 24px; height: 24px; border-radius: 50%;
          background: #ffffff; border: 1px solid #E8E2D9;
          cursor: pointer; color: #787878; flex-shrink: 0;
          transition: background .2s, border-color .2s, box-shadow .2s;
          box-shadow: 0 2px 4px rgba(0,0,0,0.06);
        }
        .ag-sidebar-collapse-btn:hover {
          background: #FAF8F3;
          border-color: #c8c0b4;
          box-shadow: 0 3px 6px rgba(0,0,0,0.1);
        }
 
        .ag-sidebar-nav {
          flex: 1; padding: 1.25rem .75rem;
          display: flex; flex-direction: column; gap: .25rem;
          overflow-y: auto; overflow-x: hidden;
        }
        .ag-sidebar.collapsed .ag-sidebar-nav {
          padding: 1.25rem 0.5rem;
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
        .ag-sidebar.collapsed .ag-sidebar-link {
          padding: .75rem 0;
          justify-content: center;
          gap: 0;
        }
        .ag-sidebar.collapsed .ag-sidebar-link-icon {
          margin: 0;
        }
 
        .ag-sidebar-bottom {
          padding: 1rem .75rem 1.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.4);
          flex-shrink: 0;
        }
        .ag-sidebar.collapsed .ag-sidebar-bottom {
          padding: 1rem 0.5rem 1.5rem;
        }
        .ag-sidebar-landing-link {
          display: flex; align-items: center; gap: .6rem;
          font-size: .8rem; font-weight: 500; color: #a09589;
          text-decoration: none; padding: .5rem .75rem; border-radius: 8px;
          transition: color .2s, background .2s; white-space: nowrap;
        }
        .ag-sidebar-landing-link:hover { color: #14532D; background: #FAF8F3; }
        .ag-sidebar-logout-link {
          display: flex; align-items: center; gap: .6rem;
          font-size: .8rem; font-weight: 500; color: #C0392B;
          text-decoration: none; padding: .5rem .75rem; border-radius: 8px;
          transition: color .2s, background .2s; white-space: nowrap;
          border: none; background: none; cursor: pointer; width: 100%;
          text-align: left; font-family: inherit;
        }
        .ag-sidebar-logout-link:hover { color: #A93226; background: #fdf2f0; }
        .ag-sidebar.collapsed .ag-sidebar-landing-link,
        .ag-sidebar.collapsed .ag-sidebar-logout-link {
          padding: .75rem 0;
          justify-content: center;
          gap: 0;
        }
      `}</style>
    </aside>
  );
}
