import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import './Profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await authAPI.getMe();
        setUser(response.data);
      } catch (error) {
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      window.location.href = '/';
    } catch (error) {
      window.location.href = '/';
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        🔄 Loading profile...
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <button onClick={() => navigate('/groups')} className="back-btn">
          ← Back
        </button>
        <h1>✨ My Profile</h1>
      </div>

      <div className="profile-content">
        <div className="profile-hero">
          <div className="profile-avatar-large">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="profile-welcome">
            <h2>Welcome back, {user?.name}! 👋</h2>
            <p>Manage your account and preferences</p>
          </div>
        </div>

        <div className="profile-cards">
          <div className="info-card">
            <div className="card-icon">👤</div>
            <div className="card-content">
              <h3>Full Name</h3>
              <p>{user?.name}</p>
            </div>
          </div>

          <div className="info-card">
            <div className="card-icon">📱</div>
            <div className="card-content">
              <h3>Phone Number</h3>
              <p>{user?.phone}</p>
            </div>
          </div>

          <div className="info-card">
            <div className="card-icon">📧</div>
            <div className="card-content">
              <h3>Email Address</h3>
              <p>{user?.email || 'Not provided'}</p>
            </div>
          </div>

          <div className="info-card">
            <div className="card-icon">🆔</div>
            <div className="card-content">
              <h3>User ID</h3>
              <p>#{user?.id}</p>
            </div>
          </div>
        </div>

        <div className="profile-actions">
          <button onClick={() => navigate('/groups')} className="primary-btn">
            🏠 Go to Groups
          </button>
          <button onClick={handleLogout} className="logout-btn">
            🚪 Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;