'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, setAuthToken } from '@/lib/api-client';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [phone, setPhone] = useState('+6281234567890');
  const [password, setPassword] = useState('password123');
  const [fullName, setFullName] = useState('Pak Farmer');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const res = await apiClient<{ data: { access_token: string } }>('/auth/login', {
          method: 'POST',
          requireAuth: false,
          body: JSON.stringify({
            phone_number: phone,
            password: password,
          }),
        });
        setAuthToken(res.data.access_token);
        router.push('/dashboard');
      } else {
        await apiClient('/auth/register', {
          method: 'POST',
          requireAuth: false,
          body: JSON.stringify({
            full_name: fullName,
            phone_number: phone,
            password: password,
          }),
        });
        // Auto login after register
        const res = await apiClient<{ data: { access_token: string } }>('/auth/login', {
          method: 'POST',
          requireAuth: false,
          body: JSON.stringify({
            phone_number: phone,
            password: password,
          }),
        });
        setAuthToken(res.data.access_token);
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">
      <div className="login-card">
        <h1>{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
        <p className="login-subtitle">
          {isLogin
            ? 'Enter your credentials to access your dashboard'
            : 'Sign up to start managing your fields'}
        </p>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          {!isLogin && (
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
          )}
          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+62..."
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" disabled={loading} className="login-btn">
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <p className="login-switch">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={() => setIsLogin(!isLogin)} className="switch-btn">
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>

      <style>{`
        .login-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #FAF8F3;
          padding: 1rem;
        }
        .login-card {
          background: #fff;
          padding: 2.5rem;
          border-radius: 24px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.05);
          width: 100%;
          max-width: 400px;
          border: 1px solid #E8E2D9;
        }
        h1 {
          margin: 0 0 0.5rem;
          font-size: 1.75rem;
          font-weight: 800;
          color: #161616;
          letter-spacing: -0.02em;
        }
        .login-subtitle {
          color: #787878;
          font-size: 0.9rem;
          margin-bottom: 2rem;
        }
        .login-error {
          background: #fdf2f0;
          color: #C0392B;
          padding: 0.75rem;
          border-radius: 8px;
          font-size: 0.85rem;
          margin-bottom: 1.5rem;
          border: 1px solid #e8b4b0;
        }
        .form-group {
          margin-bottom: 1.25rem;
        }
        .form-group label {
          display: block;
          font-size: 0.8rem;
          font-weight: 600;
          color: #161616;
          margin-bottom: 0.5rem;
        }
        .form-group input {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 1px solid #E8E2D9;
          border-radius: 12px;
          font-size: 1rem;
          transition: border-color 0.2s;
          box-sizing: border-box;
        }
        .form-group input:focus {
          outline: none;
          border-color: #14532D;
        }
        .login-btn {
          width: 100%;
          padding: 1rem;
          background: #14532D;
          color: #fff;
          border: none;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: opacity 0.2s;
          margin-top: 0.5rem;
        }
        .login-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .login-btn:hover:not(:disabled) {
          opacity: 0.9;
        }
        .login-switch {
          text-align: center;
          margin-top: 1.5rem;
          font-size: 0.85rem;
          color: #787878;
        }
        .switch-btn {
          background: none;
          border: none;
          color: #14532D;
          font-weight: 700;
          cursor: pointer;
          font-size: inherit;
          padding: 0;
        }
        .switch-btn:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
