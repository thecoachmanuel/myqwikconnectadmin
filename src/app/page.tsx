'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [appName, setAppName] = useState('Orange');
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Forgot password form fields
  const [dbUsername, setDbUsername] = useState('');
  const [dbPassword, setDbPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');

  useEffect(() => {
    // If already authenticated, redirect to dashboard
    const hasSession = document.cookie
      .split(';')
      .some((c) => c.trim().startsWith('admin_session=') && c.split('=')[1]?.trim() !== '');
    if (hasSession) {
      router.push('/dashboard');
    }

    fetch('/api/getSettingData')
      .then((res) => res.json())
      .then((res) => {
        if (res.data?.appdata?.app_name) {
          setAppName(res.data.appdata.app_name);
        }
      })
      .catch(() => {});
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/loginForm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_name: username, user_password: password }),
      });
      const data = await res.json();

      if (data.status) {
        router.push('/dashboard');
      } else {
        setErrorMsg(data.message || 'Invalid username or password');
      }
    } catch (err: any) {
      setErrorMsg('Login failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setForgotMsg('Passwords do not match');
      return;
    }
    try {
      const res = await fetch('/forgotPassword', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          database_username: dbUsername,
          database_password: dbPassword,
          new_password: newPassword,
        }),
      });
      const data = await res.json();
      setForgotMsg(data.message || (data.status ? 'Password reset successfully' : 'Reset failed'));
      if (data.status) {
        setTimeout(() => setShowForgotModal(false), 1200);
      }
    } catch (err: any) {
      setForgotMsg('Error: ' + err.message);
    }
  };

  return (
    <div className="login-page">
      <div className="container">
        <div className="row align-items-center justify-content-center mt-5">
          <div className="col-lg-5 col-md-5 col-sm-12">
            <div className="login-box">
              <div className="text-center mb-4">
                <h3>{appName}</h3>
              </div>
              <div className="card login-card">
                <div className="card-header">
                  <h4>Log In</h4>
                </div>
                <div className="card-body">
                  {errorMsg && (
                    <div className="alert alert-danger py-2 mb-3" role="alert">
                      {errorMsg}
                    </div>
                  )}
                  <form id="loginForm" onSubmit={handleLogin}>
                    <div className="mb-3">
                      <label htmlFor="user_name" className="form-label">
                        Username
                      </label>
                      <input
                        className="form-control"
                        type="text"
                        id="user_name"
                        name="user_name"
                        required
                        placeholder="Enter your username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        autoComplete="username"
                      />
                    </div>
                    <div className="mb-3">
                      <label htmlFor="user_password" className="form-label">
                        Password
                      </label>
                      <div className="position-relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          id="user_password"
                          name="user_password"
                          className="form-control"
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          autoComplete="current-password"
                        />
                        <div
                          className="password-icon"
                          onClick={() => setShowPassword(!showPassword)}
                          style={{
                            cursor: 'pointer',
                            position: 'absolute',
                            right: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#6c757d',
                          }}
                        >
                          <i className={`fas ${showPassword ? 'fa-eye' : 'fa-eye-slash'}`}></i>
                        </div>
                      </div>
                    </div>
                    <div className="mb-0 text-center">
                      <button className="btn btn-primary w-100 shadow-none" type="submit" disabled={loading}>
                        {loading ? 'Logging in...' : 'Log In'}
                      </button>
                    </div>
                    <hr />
                    <div>
                      <div className="text-center">
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setForgotMsg('');
                            setShowForgotModal(true);
                          }}
                        >
                          Forgot Password?
                        </a>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showForgotModal && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Forgot Password</h4>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowForgotModal(false)}
                  aria-label="Close"
                ></button>
              </div>
              <form id="forgotPasswordForm" onSubmit={handleForgotPassword}>
                <div className="modal-body">
                  {forgotMsg && (
                    <div className="alert alert-info py-2 mb-3" role="alert">
                      {forgotMsg}
                    </div>
                  )}
                  <div className="mb-3">
                    <label htmlFor="database_username" className="form-label">
                      Database Username
                    </label>
                    <input
                      className="form-control"
                      type="text"
                      id="database_username"
                      name="database_username"
                      placeholder="Enter your database username"
                      required
                      value={dbUsername}
                      onChange={(e) => setDbUsername(e.target.value)}
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="database_password" className="form-label">
                      Database Password
                    </label>
                    <input
                      type="password"
                      id="database_password"
                      name="database_password"
                      className="form-control"
                      placeholder="Enter your database password"
                      required
                      value={dbPassword}
                      onChange={(e) => setDbPassword(e.target.value)}
                    />
                  </div>
                  <hr />
                  <div className="mb-3">
                    <label htmlFor="new_password" className="form-label">
                      New Password
                    </label>
                    <input
                      type="password"
                      id="new_password"
                      name="new_password"
                      className="form-control"
                      placeholder="Enter new your password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="confirm_password" className="form-label">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      id="confirm_password"
                      name="confirm_password"
                      className="form-control"
                      placeholder="Re-enter new password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowForgotModal(false)}>
                    Close
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Submit
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
