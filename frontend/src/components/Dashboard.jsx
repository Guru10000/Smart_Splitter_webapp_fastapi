import React, { useEffect, useState } from 'react';
import { authAPI } from '../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await authAPI.getMe();
        setUser(response.data);
      } catch (error) {
        window.location.href = '/';
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

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
      <div className="loading-container">
        🔄 Loading...
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>🎉 Welcome to Smart Splitter!</h1>
        <button onClick={handleLogout} className="logout-btn">
          🚪 Logout
        </button>
      </div>
      
      <div className="user-card">
        <h3>✅ Login Successful!</h3>
        <div className="user-info">
          <p><strong>Name:</strong> {user?.name}</p>
          <p><strong>Phone:</strong> {user?.phone}</p>
          <p><strong>ID:</strong> {user?.id}</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;