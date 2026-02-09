import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { groupAPI } from '../services/api';
import './GroupDashboard.css';

const GroupDashboard = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [groupData, setGroupData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        const response = await groupAPI.getGroup(groupId);
        setGroupData(response.data);
      } catch (error) {
        navigate('/groups');
      } finally {
        setLoading(false);
      }
    };

    fetchGroupData();
  }, [groupId, navigate]);

  const handleExitGroup = async () => {
    setExiting(true);
    try {
      await groupAPI.exitGroup(groupId);
      navigate('/groups');
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to exit group');
    } finally {
      setExiting(false);
      setShowExitConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        🔄 Loading group...
      </div>
    );
  }

  return (
    <div className="group-dashboard">
      <div className="dashboard-navbar">
        <button onClick={() => navigate('/groups')} className="back-btn">
          ←
        </button>
        <div className="group-header-info">
          <h1 
            className="group-title"
            onClick={() => navigate(`/groups/${groupId}/details`)}
          >
            {groupData.group.name}
          </h1>
          <button 
            className="exit-btn"
            onClick={() => setShowExitConfirm(true)}
          >
            🚪 Exit Group
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="group-overview">
          <div className="overview-header">
            <h3>📊 Group Overview</h3>
          </div>
          
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-info">
                <div className="stat-number">{groupData.members.length}</div>
                <div className="stat-label">Members</div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">💸</div>
              <div className="stat-info">
                <div className="stat-number">{groupData.expenses.length}</div>
                <div className="stat-label">Expenses</div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">💰</div>
              <div className="stat-info">
                <div className="stat-number">
                  ₹{groupData.expenses.reduce((sum, exp) => sum + exp.amount, 0).toFixed(2)}
                </div>
                <div className="stat-label">Total Spent</div>
              </div>
            </div>
          </div>
          
          <div className="quick-actions">
            <h4>⚡ Quick Actions</h4>
            <div className="actions-grid">
              <button 
                className="action-card"
                onClick={() => navigate(`/groups/${groupId}/add-expense`)}
              >
                <div className="action-icon">💸</div>
                <div className="action-text">
                  <div className="action-title">Add Expense</div>
                  <div className="action-desc">Record a new expense</div>
                </div>
              </button>
              
              <button 
                className="action-card"
                onClick={() => navigate(`/groups/${groupId}/balances`)}
              >
                <div className="action-icon">⚖️</div>
                <div className="action-text">
                  <div className="action-title">View Balances</div>
                  <div className="action-desc">Check who owes what</div>
                </div>
              </button>
              
              <button 
                className="action-card"
                onClick={() => navigate(`/groups/${groupId}/add-member`)}
              >
                <div className="action-icon">👥</div>
                <div className="action-text">
                  <div className="action-title">Add Member</div>
                  <div className="action-desc">Invite someone new</div>
                </div>
              </button>
              
              <button 
                className="action-card"
                onClick={() => navigate(`/groups/${groupId}/details`)}
              >
                <div className="action-icon">⚙️</div>
                <div className="action-text">
                  <div className="action-title">Group Settings</div>
                  <div className="action-desc">Manage group details</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-footer">
        <button 
          className="footer-btn chat-btn"
          onClick={() => navigate(`/groups/${groupId}/chat`)}
        >
          <div className="btn-icon">💬</div>
          <div className="btn-label">Chat</div>
        </button>
        <button 
          className="footer-btn expenses-btn"
          onClick={() => {
            navigate(`/groups/${groupId}/expenses`, { replace: false });
          }}
        >
          <div className="btn-icon">💸</div>
          <div className="btn-label">Expenses</div>
        </button>
        <button 
          className="footer-btn settlements-btn"
          onClick={() => navigate(`/groups/${groupId}/settlements`)}
        >
          <div className="btn-icon">💰</div>
          <div className="btn-label">Settlements</div>
        </button>
      </div>

      {showExitConfirm && (
        <div className="modal-overlay">
          <div className="exit-confirm-form">
            <h3>⚠️ Exit Group</h3>
            <p>Are you sure you want to exit this group? You won't be able to see expenses or participate anymore.</p>
            <div className="form-buttons">
              <button 
                type="button" 
                onClick={() => setShowExitConfirm(false)}
                className="cancel-btn"
              >
                Cancel
              </button>
              <button 
                onClick={handleExitGroup}
                disabled={exiting}
                className="exit-confirm-btn"
              >
                {exiting ? '⏳ Exiting...' : '🚪 Exit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupDashboard;