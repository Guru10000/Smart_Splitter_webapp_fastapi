import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { groupAPI, authAPI } from '../services/api';
import './SettlementHistory.css';

const SettlementHistory = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();

  const [settlements, setSettlements] = useState([]);
  const [groupData, setGroupData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [undoingSettlement, setUndoingSettlement] = useState(null);
  const [currentUserRole, setCurrentUserRole] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [groupResponse, settlementsResponse] = await Promise.all([
          groupAPI.getGroup(groupId),
          groupAPI.getSettlementHistory(groupId)
        ]);

        setGroupData(groupResponse.data);
        setSettlements(settlementsResponse.data);

        // Get current user role
        const currentUser = await authAPI.getMe();
        const userRole = groupResponse.data.members.find(
          (m) => m.id === currentUser.data.id
        )?.role;
        setCurrentUserRole(userRole);
      } catch (error) {
        console.error('Failed to load settlement history:', error);
        navigate(`/groups/${groupId}/settlements`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [groupId, navigate]);

  const handleUndoSettlement = async (settlementId) => {
    setUndoingSettlement(settlementId);
    try {
      await groupAPI.undoSettlement(settlementId);

      // Refresh settlement history
      const settlementsResponse = await groupAPI.getSettlementHistory(groupId);
      setSettlements(settlementsResponse.data);
      alert('Settlement undone successfully!');
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to undo settlement');
    } finally {
      setUndoingSettlement(null);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return <div className="loading-screen">Loading settlement history...</div>;
  }

  return (
    <div className="settlement-history">
      {/* Header */}
      <div className="history-header">
        <button
          onClick={() => navigate(`/groups/${groupId}/settlements`)}
          className="back-btn"
        >
          ←
        </button>
        <h1>{groupData?.group?.name} Settlement History</h1>
      </div>

      {/* Content */}
      <div className="history-content">
        {settlements.length === 0 ? (
          <div className="empty-history">
            <div className="empty-icon">📋</div>
            <h3>No settlement history</h3>
            <p>No settlements have been generated yet</p>
          </div>
        ) : (
          <div className="settlements-list">
            {settlements.map((settlement) => (
              <div
                key={settlement.id}
                className={`settlement-card ${settlement.paid ? 'paid' : 'pending'}`}
              >
                <div className={`status-badge ${settlement.paid ? 'paid' : 'pending'}`}>
                  {settlement.paid ? 'PAID' : 'PENDING'}
                </div>

                <div className="settlement-content">
                  {/* Payer → Receiver */}
                  <div className="settlement-text">
                    <span className="payer-name">{settlement.from?.name}</span>
                    <span className="arrow-text">→</span>
                    <span className="receiver-name">{settlement.to?.name}</span>
                  </div>

                  {/* Footer: Amount, Date, Undo Button */}
                  <div className="settlement-footer">
                    <div className="settlement-details">
                      <div className="amount">₹{settlement.amount}</div>
                      <div className="settlement-date">{formatDate(settlement.date)}</div>
                    </div>

                    {currentUserRole === 'admin' && settlement.paid && (
                      <button
                        onClick={() => handleUndoSettlement(settlement.id)}
                        disabled={undoingSettlement === settlement.id}
                        className="undo-btn"
                      >
                        {undoingSettlement === settlement.id ? '⏳ Undoing...' : '↩️ Undo'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SettlementHistory;
