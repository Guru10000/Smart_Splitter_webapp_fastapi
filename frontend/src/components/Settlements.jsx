import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { groupAPI } from '../services/api';
import './Settlements.css';

const Settlements = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [pendingSettlements, setPendingSettlements] = useState([]);
  const [groupData, setGroupData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [settling, setSettling] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showPendingSettlements, setShowPendingSettlements] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [groupResponse, expensesResponse, settlementsResponse, pendingResponse] = await Promise.all([
          groupAPI.getGroup(groupId),
          groupAPI.getExpenses(groupId),
          groupAPI.getSettlementHistory(groupId),
          groupAPI.getPendingSettlements(groupId)
        ]);
        setGroupData(groupResponse.data);
        setExpenses(expensesResponse.data);
        setSettlements(settlementsResponse.data);
        setPendingSettlements(pendingResponse.data);
        
        // Show pending settlements if any exist
        if (pendingResponse.data.length > 0) {
          setShowPendingSettlements(true);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
        navigate(`/groups/${groupId}`);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [groupId, navigate]);

  const handleSettle = async () => {
    setSettling(true);
    try {
      await groupAPI.settleGroup(groupId);
      // Fetch pending settlements and show them
      const pendingResponse = await groupAPI.getPendingSettlements(groupId);
      setPendingSettlements(pendingResponse.data);
      setShowPendingSettlements(true);
      // Refresh paid settlement history
      const settlementsResponse = await groupAPI.getSettlementHistory(groupId);
      setSettlements(settlementsResponse.data);
      alert('Settlements generated successfully!');
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to generate settlements');
    } finally {
      setSettling(false);
    }
  };

  const handleMarkPaid = async (settlementId) => {
    try {
      await groupAPI.markSettlementPaid(settlementId);
      // Refresh pending settlements
      const pendingResponse = await groupAPI.getPendingSettlements(groupId);
      setPendingSettlements(pendingResponse.data);
      alert('Settlement marked as paid!');
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to mark settlement as paid');
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
    return <div className="loading-screen">Loading settlements...</div>;
  }

  return (
    <div className="settlements">
      <div className="settlements-header">
        <button onClick={() => navigate(`/groups/${groupId}`)} className="back-btn">
          ←
        </button>
        <h1>{groupData?.group?.name} Settlements</h1>
        <div className="header-buttons">
          <button 
            onClick={handleSettle}
            disabled={settling || expenses.length === 0}
            className="settle-btn-header"
          >
            {settling ? 'Generating Settlements...' : '💰 Generate Settlement'}
          </button>
          <button 
            onClick={() => navigate(`/groups/${groupId}/settlement-history`)}
            className="history-btn"
          >
            📋 History ({settlements.length})
          </button>
        </div>
      </div>

      <div className="settlements-content">
        {!showPendingSettlements ? (
          /* Expenses Section */
          <div className="section">
            <h3>💸 Expenses ({expenses.length})</h3>
            {expenses.length === 0 ? (
              <div className="empty-state">
                <p>No expenses found</p>
              </div>
            ) : (
              <div className="expenses-list">
                {expenses.slice(0, 5).map((expense) => (
                  <div key={expense.id} className="expense-item">
                    <div className="expense-info">
                      <div className="expense-note">{expense.note || 'Expense'}</div>
                      <div className="expense-payer">Paid by {expense.payer_name}</div>
                    </div>
                    <div className="expense-amount">₹{expense.amount}</div>
                  </div>
                ))}
                {expenses.length > 5 && (
                  <button 
                    onClick={() => navigate(`/groups/${groupId}/expenses`)}
                    className="view-all-btn"
                  >
                    View All {expenses.length} Expenses
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Pending Settlements Section */
          <div className="section">
            <h3>⏳ Pending Settlements ({pendingSettlements.length})</h3>
            {pendingSettlements.length === 0 ? (
              <div className="empty-state">
                <p>No pending settlements</p>
              </div>
            ) : (
              <div className="settlements-list">
                {pendingSettlements.map((settlement) => (
                  <div key={settlement.id} className="settlement-card pending">
                    <div className="status-badge pending">
                      PENDING
                    </div>
                    
                    <div className="settlement-content">
                      <div className="settlement-text">
                        <span className="payer-name">{settlement.from?.name}</span>
                        <span className="arrow-text">→</span>
                        <span className="receiver-name">{settlement.to?.name}</span>
                      </div>
                      
                      <div className="settlement-footer">
                        <div className="settlement-details">
                          <div className="amount">₹{settlement.amount}</div>
                          <div className="settlement-date">
                            {formatDate(settlement.date)}
                          </div>
                        </div>
                        
                        <button 
                          onClick={() => handleMarkPaid(settlement.id)}
                          className="paid-btn"
                        >
                          ✅ Mark Paid
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Settlement Description */}
        <div className="section">
          <p className="section-description">
            {!showPendingSettlements 
              ? "Generate settlements to optimize payments between group members."
              : "These are the pending settlements that need to be completed."}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settlements;