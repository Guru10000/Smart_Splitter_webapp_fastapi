import React, { useState, useEffect } from 'react';
import { groupAPI, authAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import SmartSplitterLogo from './SmartSplitterLogo';
import './GroupsList.css';
import './SmartSplitterLogo.css';

const GroupsList = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [inviteLink, setInviteLink] = useState('');
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userResponse, groupsResponse] = await Promise.all([
          authAPI.getMe(),
          groupAPI.getMyGroups()
        ]);
        setUser(userResponse.data);
        setGroups(groupsResponse.data);
      } catch (error) {
        window.location.href = '/';
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    setCreating(true);

    try {
      await groupAPI.createGroup(formData);
      const groupsResponse = await groupAPI.getMyGroups();
      setGroups(groupsResponse.data);
      setShowCreateForm(false);
      setFormData({ name: '', description: '' });
    } catch (error) {
      alert('Failed to create group');
    } finally {
      setCreating(false);
    }
  };

  const handleJoinGroup = async (e) => {
    e.preventDefault();
    setJoining(true);

    try {
      // Extract token from invite link
      const token = inviteLink.split('/').pop();
      await groupAPI.joinGroup(token);
      // Refresh groups list
      const groupsResponse = await groupAPI.getMyGroups();
      setGroups(groupsResponse.data);
      setShowJoinForm(false);
      setInviteLink('');
      alert('Successfully joined the group!');
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to join group');
    } finally {
      setJoining(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (loading) {
    return (
      <div className="loading-screen">
        🔄 Loading groups...
      </div>
    );
  }

  return (
    <div className="groups-container">
      <div className="groups-header">
        <div className="header-content">
          <div className="profile-section">
            <div className="profile-icon" onClick={() => navigate('/profile')}>
              👤
            </div>
            <div className="app-title">
              <SmartSplitterLogo size={40} className="logo-medium" />
              <h1>Smart Splitter</h1>
            </div>
          </div>
          <div className="header-actions">
            <button 
              onClick={() => setShowJoinForm(true)}
              className="header-btn join-btn"
            >
              🔗 Join Group
            </button>
            <button 
              onClick={() => setShowCreateForm(true)}
              className="header-btn create-btn"
            >
              ➕ Create Group
            </button>
            <button 
              onClick={() => navigate('/settings')}
              className="header-btn settings-btn"
            >
              ⚙️
            </button>
          </div>
        </div>
      </div>

      <div className="groups-list">
        {groups.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <h3>No Groups Yet</h3>
            <p>Create or join a group to start splitting expenses</p>
          </div>
        ) : (
          groups.map((group) => (
            <div 
              key={group.id} 
              className="group-item"
              onClick={() => navigate(`/groups/${group.id}`)}
            >
              <div className="group-avatar">
                <span>{group.name ? group.name.charAt(0).toUpperCase() : 'G'}</span>
              </div>
              <div className="group-content">
                <div className="group-title">{group.name }</div>
                <div className="group-description">
                  {group.description}
                </div>
              </div>
              <div className="group-meta">
                <div className="group-time">📊</div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mobile-action-buttons">
        <button 
          onClick={() => setShowJoinForm(true)}
          className="mobile-action-btn join-mobile-btn"
        >
          🔗 Join Group
        </button>
        <button 
          onClick={() => setShowCreateForm(true)}
          className="mobile-action-btn create-mobile-btn"
        >
          ➕ Create Group
        </button>
      </div>

      {showCreateForm && (
        <div className="modal-overlay">
          <div className="create-form">
            <h3>✨ Create New Group</h3>
            <form onSubmit={handleCreateGroup}>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Group Name"
                required
              />
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Description (optional)"
                rows="3"
              />
              <div className="form-buttons">
                <button 
                  type="button" 
                  onClick={() => setShowCreateForm(false)}
                  className="cancel-btn"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={creating}
                  className="submit-btn"
                >
                  {creating ? '⏳ Creating...' : '🚀 Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showJoinForm && (
        <div className="modal-overlay">
          <div className="create-form">
            <h3>🔗 Join Group</h3>
            <form onSubmit={handleJoinGroup}>
              <input
                type="text"
                value={inviteLink}
                onChange={(e) => setInviteLink(e.target.value)}
                placeholder="Paste invite link here"
                required
              />
              <div className="form-buttons">
                <button 
                  type="button" 
                  onClick={() => setShowJoinForm(false)}
                  className="cancel-btn"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={joining}
                  className="submit-btn"
                >
                  {joining ? '⏳ Joining...' : '🚀 Join Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupsList;