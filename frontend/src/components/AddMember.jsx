import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { groupAPI } from '../services/api';
import './AddMember.css';

const AddMember = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [adding, setAdding] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [generating, setGenerating] = useState(false);

  const handleAddMember = async (e) => {
    e.preventDefault();
    setAdding(true);

    try {
      await groupAPI.addMember(groupId, { phone: phoneNumber });
      alert('Member added successfully!');
      setPhoneNumber('');
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to add member');
    } finally {
      setAdding(false);
    }
  };

  const handleGenerateInvite = async () => {
    setGenerating(true);
    try {
      const response = await groupAPI.createInvite(groupId);
      setInviteLink(response.data.invite_link);
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to generate invite');
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    alert('Invite link copied to clipboard!');
  };

  const shareInvite = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join our group!',
          text: 'You\'re invited to join our expense splitting group.',
          url: inviteLink,
        });
      } catch (error) {
        copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
  };

  return (
    <div className="add-member-page">
      <div className="page-header">
        <button onClick={() => navigate(`/groups/${groupId}/details`)} className="back-btn">
          ←
        </button>
        <h1>Add Members</h1>
      </div>

      <div className="add-member-content">
        <div className="method-card">
          <h2>📱 Add by Phone Number</h2>
          <p>Add a member directly by their registered phone number</p>
          <form onSubmit={handleAddMember}>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Enter phone number"
              required
            />
            <button type="submit" disabled={adding} className="add-btn">
              {adding ? '⏳ Adding...' : '✅ Add Member'}
            </button>
          </form>
        </div>

        <div className="method-card">
          <h2>🔗 Generate Invite Link</h2>
          <p>Create a shareable link that expires in 24 hours</p>
          <button 
            onClick={handleGenerateInvite} 
            disabled={generating}
            className="generate-btn"
          >
            {generating ? '⏳ Generating...' : '🔗 Generate Invite Link'}
          </button>
          
          {inviteLink && (
            <div className="invite-result">
              <div className="invite-link">{inviteLink}</div>
              <div className="invite-actions">
                <button onClick={shareInvite} className="share-btn">
                  📤 Share Link
                </button>
                <button onClick={copyToClipboard} className="copy-btn">
                  📋 Copy Link
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddMember;