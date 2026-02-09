import React, { useState } from 'react';
import { authAPI } from '../services/api';
import './Login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [registerData, setRegisterData] = useState({
    name: '',
    phone: '',
    email: '',
    password: ''
  });
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [displayOtp, setDisplayOtp] = useState('');
  const [copied, setCopied] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegisterChange = (e) => {
    setRegisterData({
      ...registerData,
      [e.target.name]: e.target.value,
    });
  };

  React.useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleCopyOTP = () => {
    navigator.clipboard.writeText(displayOtp);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await authAPI.login(formData);
      window.location.href = '/groups';
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authAPI.sendOTP(registerData.phone);
      setOtpSent(true);
      setResendTimer(60);
      setDisplayOtp(response.data.otp);
      setShowOtpModal(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    setError('');
    setOtp('');

    try {
      const response = await authAPI.sendOTP(registerData.phone);
      setResendTimer(60);
      setDisplayOtp(response.data.otp);
      setShowOtpModal(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await authAPI.register(registerData, otp);
      alert('✅ Account created successfully! Please login.');
      setIsLogin(true);
      setRegisterData({ name: '', phone: '', email: '', password: '' });
      setOtpSent(false);
      setOtp('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>💰 Smart Splitter</h1>
          <p>Split expenses with friends easily</p>
        </div>

        <div className="auth-tabs">
          <button 
            className={`tab ${isLogin ? 'active' : ''}`}
            onClick={() => setIsLogin(true)}
          >
            Login
          </button>
          <button 
            className={`tab ${!isLogin ? 'active' : ''}`}
            onClick={() => setIsLogin(false)}
          >
            Register
          </button>
        </div>

        {isLogin ? (
          <form onSubmit={handleLogin} className="auth-form">
            <div className="input-group">
              <input
                type="tel"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Phone Number"
                required
              />
            </div>

            <div className="input-group">
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Password"
                required
              />
            </div>

            {error && <div className="error">{error}</div>}

            <button type="submit" disabled={loading} className="auth-btn">
              {loading ? '🔄 Logging in...' : '🚀 Login'}
            </button>
          </form>
        ) : (
          <form onSubmit={otpSent ? handleRegister : handleSendOTP} className="auth-form">
            <div className="input-group">
              <input
                type="text"
                name="name"
                value={registerData.name}
                onChange={handleRegisterChange}
                placeholder="Full Name"
                required
                disabled={otpSent}
              />
            </div>

            <div className="input-group">
              <input
                type="tel"
                name="phone"
                value={registerData.phone}
                onChange={handleRegisterChange}
                placeholder="Phone Number"
                required
                disabled={otpSent}
              />
            </div>

            <div className="input-group">
              <input
                type="email"
                name="email"
                value={registerData.email}
                onChange={handleRegisterChange}
                placeholder="Email Address"
                required
                disabled={otpSent}
              />
            </div>

            <div className="input-group">
              <input
                type="password"
                name="password"
                value={registerData.password}
                onChange={handleRegisterChange}
                placeholder="Password"
                required
                disabled={otpSent}
              />
            </div>

            {otpSent && (
              <div className="input-group">
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  maxLength="6"
                  required
                />
              </div>
            )}

            {error && <div className="error">{error}</div>}

            <button type="submit" disabled={loading} className="auth-btn">
              {loading ? '🔄 Processing...' : otpSent ? '✅ Verify & Register' : '📱 Send OTP'}
            </button>

            {otpSent && (
              <>
                <button 
                  type="button" 
                  onClick={handleResendOTP}
                  disabled={resendTimer > 0 || loading}
                  className="resend-otp-btn"
                >
                  {resendTimer > 0 ? `⏳ Resend OTP in ${resendTimer}s` : '🔄 Resend OTP'}
                </button>
                <button 
                  type="button" 
                  onClick={() => { setOtpSent(false); setOtp(''); setError(''); setResendTimer(0); }}
                  className="back-to-form-btn"
                >
                  ← Change Details
                </button>
              </>
            )}
          </form>
        )}

        <div className="auth-footer">
          <p>🔒 Your data is secure with us</p>
        </div>
      </div>

      {showOtpModal && (
        <div className="otp-modal-overlay" onClick={() => setShowOtpModal(false)}>
          <div className="otp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="otp-modal-header">
              <h3>📱 OTP Sent Successfully!</h3>
              <button onClick={() => setShowOtpModal(false)} className="close-modal-btn">×</button>
            </div>
            <div className="otp-modal-content">
              <p className="otp-label">🔑 Your OTP is:</p>
              <div className="otp-display-wrapper">
                <div className="otp-display">{displayOtp}</div>
                <button onClick={handleCopyOTP} className="copy-otp-btn">
                  {copied ? '✅ Copied!' : '📋 Copy'}
                </button>
              </div>
              <p className="otp-info">⏰ Valid for 10 minutes</p>
              <p className="otp-hint">Enter this code in the OTP field to verify your account</p>
            </div>
            <button onClick={() => setShowOtpModal(false)} className="otp-modal-btn">
              Got it!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;