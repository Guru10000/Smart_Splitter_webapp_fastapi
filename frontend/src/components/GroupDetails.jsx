import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { groupAPI, authAPI } from '../services/api';
import './GroupDetails.css';

const GroupDetails = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [groupData, setGroupData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddMember, setShowAddMember] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [adding, setAdding] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showMemberProfile, setShowMemberProfile] = useState(false);
  const [removingMember, setRemovingMember] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState(null);

  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        const response = await groupAPI.getGroup(groupId);
        setGroupData(response.data);
        // Find current user's role
        const currentUser = await authAPI.getMe();
        const userRole = response.data.members.find(m => m.id === currentUser.data.id)?.role;
        setCurrentUserRole(userRole);
      } catch (error) {
        navigate('/groups');
      } finally {
        setLoading(false);
      }
    };

    fetchGroupData();
  }, [groupId, navigate]);

  const handleDeleteGroup = async () => {
    setDeleting(true);
    try {
      await groupAPI.deleteGroup(groupId);
      navigate('/groups');
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to delete group');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleMemberClick = async (member) => {
    try {
      const response = await groupAPI.getMemberProfile(groupId, member.id);
      setSelectedMember(response.data);
      setShowMemberProfile(true);
    } catch (error) {
      alert('Failed to load member profile');
    }
  };

  const handleRemoveMember = async () => {
    setRemovingMember(true);
    try {
      await groupAPI.removeMember(groupId, selectedMember.id);
      // Refresh group data
      const response = await groupAPI.getGroup(groupId);
      setGroupData(response.data);
      setShowMemberProfile(false);
      alert('Member removed successfully!');
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to remove member');
    } finally {
      setRemovingMember(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setAdding(true);

    try {
      await groupAPI.addMember(groupId, { phone: phoneNumber });
      const response = await groupAPI.getGroup(groupId);
      setGroupData(response.data);
      setShowAddMember(false);
      setPhoneNumber('');
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to add member');
    } finally {
      setAdding(false);
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
    <div className="group-details">
      <div className="details-header">
        <button onClick={() => navigate(`/groups/${groupId}`)} className="back-btn">
          ←
        </button>
        <h1>Group Details</h1>
      </div>

      <div className="details-content">
        <div className="group-card">
          <div className="group-header">
            <div className="group-info">
              <div className="group-title-row">
                <h2>{groupData?.group?.name || 'Group Name'}</h2>
                <div className="group-stats">
                  <span className="stat">
                    <span className="stat-number">{groupData?.members?.length || 0}</span>
                    <span className="stat-label">Members</span>
                  </span>
                  <span className="stat">
                    <span className="stat-number">{groupData?.expenses?.length || 0}</span>
                    <span className="stat-label">Expenses</span>
                  </span>
                </div>
              </div>
              <p>{groupData?.group?.description || 'No description'}</p>
            </div>
          </div>
        </div>

        <div className="members-section">
          <div className="section-header">
            <h3>👥 Group Members</h3>
            <div className="header-buttons">
              <button 
                className="add-member-btn"
                onClick={() => navigate(`/groups/${groupId}/add-member`)}
              >
                + Add Member
              </button>
              <button 
                className="delete-group-btn"
                onClick={() => setShowDeleteConfirm(true)}
              >
                🗑️ Delete Group
              </button>
            </div>
          </div>
          
          <div className="members-list">
            {groupData.members.map((member) => (
              <div 
                key={member.id} 
                className="member-card"
                onClick={() => handleMemberClick(member)}
              >
                <div className="member-avatar">
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <div className="member-info">
                  <div className="member-name">{member.name}</div>
                  <div className="member-phone">{member.phone}</div>
                </div>
                <div className="member-badge">
                  {member.role === 'admin' ? '👑 Admin' : '👤 Member'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showMemberProfile && selectedMember && (
        <div className="modal-overlay">
          <div className="member-profile-card">
            <div className="profile-header">
              <div className="profile-avatar">
                {selectedMember.name.charAt(0).toUpperCase()}
              </div>
              <h3>{selectedMember.name}</h3>
              <span className="role-badge">
                {selectedMember.role === 'admin' ? '👑 Admin' : '👤 Member'}
              </span>
            </div>
            
            <div className="profile-details">
              <div className="profile-item">
                <span className="profile-label">📱 Phone:</span>
                <span className="profile-value">{selectedMember.phone}</span>
              </div>
              <div className="profile-item">
                <span className="profile-label">📧 Email:</span>
                <span className="profile-value">{selectedMember.email || 'Not provided'}</span>
              </div>
            </div>
            
            <div className="profile-actions">
              {currentUserRole === 'admin' && selectedMember.role !== 'admin' && (
                <button 
                  onClick={handleRemoveMember}
                  disabled={removingMember}
                  className="remove-member-btn"
                >
                  {removingMember ? '⏳ Removing...' : '👢 Remove Member'}
                </button>
              )}
              <button 
                onClick={() => setShowMemberProfile(false)}
                className="close-profile-btn"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="delete-confirm-form">
            <h3>⚠️ Delete Group</h3>
            <p>Are you sure you want to delete this group? This action cannot be undone.</p>
            <div className="form-buttons">
              <button 
                type="button" 
                onClick={() => setShowDeleteConfirm(false)}
                className="cancel-btn"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteGroup}
                disabled={deleting}
                className="delete-btn"
              >
                {deleting ? '⏳ Deleting...' : '🗑️ Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddMember && (
        <div className="modal-overlay">
          <div className="add-member-form">
            <h3>➕ Add New Member</h3>
            <form onSubmit={handleAddMember}>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Enter phone number"
                required
              />
              <div className="form-buttons">
                <button 
                  type="button" 
                  onClick={() => setShowAddMember(false)}
                  className="cancel-btn"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={adding}
                  className="submit-btn"
                >
                  {adding ? '⏳ Adding...' : '✅ Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupDetails;