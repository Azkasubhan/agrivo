'use client';

import { Bell, Search, Settings, Check } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { apiClient } from '@/lib/api-client';

interface NotificationItem {
  id: string;
  field_id: string;
  recommendation_id: string | null;
  channel: string;
  message: string;
  delivery_status: string;
  is_read: boolean;
  sent_at: string | null;
  read_at: string | null;
  created_at: string;
}

export function Header() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [userInitials, setUserInitials] = useState('FH');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const settingsDropdownRef = useRef<HTMLDivElement>(null);

  // Settings states matching DB fields
  const [whatsappEnabled, setWhatsappEnabled] = useState(true);
  const [recAlertEnabled, setRecAlertEnabled] = useState(true);
  const [weatherAlertEnabled, setWeatherAlertEnabled] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);

  const fetchUserData = async () => {
    try {
      const res = (await apiClient('/users/me')) as any;
      if (res.success && res.data) {
        if (res.data.full_name) {
          const names = res.data.full_name.trim().split(/\s+/);
          const initials = names.slice(0, 2).map((n: string) => n[0].toUpperCase()).join('');
          setUserInitials(initials || 'FH');
        }
        if (res.data.notification_preference) {
          setWhatsappEnabled(res.data.notification_preference.whatsapp_enabled);
          setRecAlertEnabled(res.data.notification_preference.recommendation_change_alert);
          setWeatherAlertEnabled(res.data.notification_preference.weather_risk_alert);
        }
      }
    } catch (err) {
      console.error('Error fetching user for header avatar:', err);
    }
  };

  const handleSaveNotifications = async () => {
    setSavingSettings(true);
    setSettingsMessage(null);
    try {
      await apiClient('/users/me/notifications', {
        method: 'PATCH',
        body: JSON.stringify({
          whatsapp_enabled: whatsappEnabled,
          recommendation_change_alert: recAlertEnabled,
          weather_risk_alert: weatherAlertEnabled,
        }),
      });
      setSettingsMessage('Settings saved successfully!');
      setTimeout(() => setSettingsMessage(null), 3000);
    } catch (err) {
      console.error('Failed to update notification preferences', err);
      setSettingsMessage('Failed to save settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = (await apiClient('/notifications?page=1&page_size=15')) as any;
      if (res.success && res.data?.items) {
        setNotifications(res.data.items);
        const unread = res.data.items.filter((item: NotificationItem) => !item.is_read).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const res = (await apiClient(`/notifications/${id}/read`, { method: 'PATCH' })) as any;
      if (res.success) {
        setNotifications((prev) =>
          prev.map((item) => (item.id === id ? { ...item, is_read: true } : item))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    const unreadItems = notifications.filter((item) => !item.is_read);
    for (const item of unreadItems) {
      await markAsRead(item.id);
    }
  };

  useEffect(() => {
    fetchUserData();
    fetchNotifications();

    // Poll every 30 seconds for new notifications
    const interval = setInterval(fetchNotifications, 30000);

    // Close dropdown on click outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
      if (settingsDropdownRef.current && !settingsDropdownRef.current.contains(event.target as Node)) {
        setShowSettingsDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      clearInterval(interval);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="ag-header">
      <div className="ag-header-left">
      </div>

      <div className="ag-header-right" ref={dropdownRef}>
        <div style={{ position: 'relative' }}>
          <button
            className={`ag-header-icon-btn ${showDropdown ? 'active' : ''}`}
            aria-label="Notifications"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <Bell size={18} />
            {unreadCount > 0 && <span className="ag-notif-dot" />}
          </button>

          {showDropdown && (
            <div className="ag-notif-dropdown">
              <div className="ag-notif-header">
                <span className="ag-notif-title">Notifications ({unreadCount})</span>
                {unreadCount > 0 && (
                  <button className="ag-notif-clear-btn" onClick={markAllAsRead}>
                    Mark all as read
                  </button>
                )}
              </div>

              <div className="ag-notif-list">
                {notifications.length === 0 ? (
                  <div className="ag-notif-empty">No new notifications.</div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`ag-notif-item ${notif.is_read ? 'read' : 'unread'}`}
                      onClick={() => !notif.is_read && markAsRead(notif.id)}
                    >
                      <div className="ag-notif-indicator" />
                      <div className="ag-notif-content">
                        <p className="ag-notif-msg">{notif.message}</p>
                        <span className="ag-notif-time">
                          {new Date(notif.created_at).toLocaleDateString('en-US', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      {!notif.is_read && (
                        <button className="ag-notif-action-btn" title="Mark as read">
                          <Check size={14} />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div style={{ position: 'relative' }} ref={settingsDropdownRef}>
          <button
            className={`ag-header-icon-btn ${showSettingsDropdown ? 'active' : ''}`}
            aria-label="Settings"
            onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
          >
            <Settings size={18} />
          </button>

          {showSettingsDropdown && (
            <div className="ag-settings-dropdown">
              <div className="ag-settings-header">
                <span className="ag-settings-title">Alert & Notification Settings</span>
              </div>
              <div className="ag-settings-body">
                <p className="ag-settings-sub">Receive daily irrigation recommendations and weather risks directly on your device.</p>
                <div className="ag-settings-checkboxes">
                  <label className="ag-settings-label">
                    <input
                      type="checkbox"
                      checked={whatsappEnabled}
                      onChange={(e) => setWhatsappEnabled(e.target.checked)}
                    />
                    Enable System Alerts
                  </label>
                  <label className="ag-settings-label">
                    <input
                      type="checkbox"
                      checked={recAlertEnabled}
                      onChange={(e) => setRecAlertEnabled(e.target.checked)}
                    />
                    Alert on Recommendation Changes
                  </label>
                  <label className="ag-settings-label">
                    <input
                      type="checkbox"
                      checked={weatherAlertEnabled}
                      onChange={(e) => setWeatherAlertEnabled(e.target.checked)}
                    />
                    Alert on Extreme Weather Risks
                  </label>
                </div>

                <button
                  onClick={handleSaveNotifications}
                  disabled={savingSettings}
                  className="ag-settings-save-btn"
                >
                  {savingSettings ? 'Saving...' : 'Save Preferences'}
                </button>

                {settingsMessage && (
                  <div className={`ag-settings-msg ${settingsMessage.includes('Failed') ? 'error' : 'success'}`}>
                    {settingsMessage}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="ag-header-divider" />
        <Link href="/profile" className="ag-header-avatar" aria-label="Profile">
          <span>{userInitials}</span>
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
          position: relative;
        }
        .ag-header-icon-btn {
          position: relative; width: 36px; height: 36px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 10px; background: none; border: none;
          color: #787878; cursor: pointer;
          transition: background .15s, color .15s;
        }
        .ag-header-icon-btn:hover, .ag-header-icon-btn.active { background: #FAF8F3; color: #161616; }
        .ag-notif-dot {
          position: absolute; top: 7px; right: 7px;
          width: 7px; height: 7px; border-radius: 50%;
          background: #DC2626; border: 2px solid #fff;
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

        /* Notification Dropdown styles */
        .ag-notif-dropdown {
          position: absolute; top: 45px; right: 0;
          width: 380px; max-height: 480px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border: 1px solid #E8E2D9;
          border-radius: 14px;
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.08), 0 8px 10px -6px rgba(0,0,0,0.03);
          z-index: 1000;
          display: flex; flex-direction: column;
          overflow: hidden;
        }
        .ag-notif-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 1rem 1.25rem; border-bottom: 1px solid #E8E2D9;
          background: #FAF8F3;
        }
        .ag-notif-title { font-size: .85rem; font-weight: 600; color: #161616; }
        .ag-notif-clear-btn {
          font-size: .75rem; color: #14532D; font-weight: 500;
          background: none; border: none; cursor: pointer;
        }
        .ag-notif-clear-btn:hover { text-decoration: underline; }
        
        .ag-notif-list {
          overflow-y: auto; max-height: 380px;
          display: flex; flex-direction: column;
        }
        .ag-notif-empty {
          padding: 3rem 1.5rem; text-align: center;
          font-size: .85rem; color: #787878;
        }
        .ag-notif-item {
          display: flex; align-items: flex-start; gap: .75rem;
          padding: 1rem 1.25rem; border-bottom: 1px solid #FAF8F3;
          cursor: pointer; position: relative;
          transition: background .15s;
        }
        .ag-notif-item:hover { background: #FAF8F3; }
        .ag-notif-item.unread { background: rgba(20,83,45,0.02); }
        .ag-notif-item.unread:hover { background: rgba(20,83,45,0.04); }
        
        .ag-notif-indicator {
          width: 6px; height: 6px; border-radius: 50%;
          background: transparent; flex-shrink: 0; margin-top: .4rem;
        }
        .ag-notif-item.unread .ag-notif-indicator { background: #14532D; }

        .ag-notif-content { flex: 1; }
        .ag-notif-msg {
          font-size: .8rem; line-height: 1.4; color: #161616;
          white-space: pre-wrap; margin: 0 0 .35rem;
        }
        .ag-notif-time { font-size: .7rem; color: #a09589; }

        .ag-notif-action-btn {
          opacity: 0; width: 24px; height: 24px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 6px; border: 1px solid #E8E2D9;
          background: #fff; color: #787878; cursor: pointer;
          transition: opacity .15s, background .15s;
          margin-top: .2rem;
        }
        .ag-notif-item:hover .ag-notif-action-btn { opacity: 1; }
        .ag-notif-action-btn:hover { background: #FAF8F3; color: #14532D; }

        /* Settings Dropdown styles */
        .ag-settings-dropdown {
          position: absolute; top: 45px; right: 0;
          width: 320px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border: 1px solid #E8E2D9;
          border-radius: 14px;
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.08), 0 8px 10px -6px rgba(0,0,0,0.03);
          z-index: 1000;
          display: flex; flex-direction: column;
          overflow: hidden;
        }
        .ag-settings-header {
          padding: 1rem 1.25rem; border-bottom: 1px solid #E8E2D9;
          background: #FAF8F3;
        }
        .ag-settings-title { font-size: .85rem; font-weight: 600; color: #161616; }
        .ag-settings-body {
          padding: 1.25rem;
          display: flex; flex-direction: column; gap: 1rem;
        }
        .ag-settings-sub {
          font-size: .75rem; color: #787878; line-height: 1.5; margin: 0;
        }
        .ag-settings-checkboxes {
          display: flex; flex-direction: column; gap: .75rem;
        }
        .ag-settings-label {
          display: flex; align-items: center; gap: .6rem;
          font-size: .8rem; color: #161616; cursor: pointer;
          user-select: none;
        }
        .ag-settings-label input {
          width: 15px; height: 15px; accent-color: #14532D; cursor: pointer;
        }
        .ag-settings-save-btn {
          width: 100%; padding: .6rem;
          background: #14532D; color: #fff;
          border: none; border-radius: 8px;
          font-size: .8rem; font-weight: 700;
          cursor: pointer; transition: background .2s;
        }
        .ag-settings-save-btn:hover { background: #114022; }
        .ag-settings-save-btn:disabled { background: #a09589; cursor: not-allowed; }
        .ag-settings-msg {
          font-size: .75rem; font-weight: 600; text-align: center;
          margin-top: 0.25rem;
        }
        .ag-settings-msg.success { color: #14532D; }
        .ag-settings-msg.error { color: #DC2626; }
      `}</style>
    </header>
  );
}
