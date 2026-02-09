import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { groupAPI } from '../services/api';
import './GroupExpenses.css';

const GroupExpenses = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [groupData, setGroupData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [showExpenseDetail, setShowExpenseDetail] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const [groupResponse, expensesResponse] = await Promise.all([
        groupAPI.getGroup(groupId),
        groupAPI.getExpenses(groupId)
      ]);
      setGroupData(groupResponse.data);
      setExpenses(expensesResponse.data || []);
    } catch (error) {
      console.error('Failed to load data:', error);
      // Only redirect if the group itself doesn't exist
      if (error.response?.status === 404) {
        navigate(`/groups/${groupId}`);
      } else {
        // Still show the expenses page even if there's an error loading expenses
        // Try to at least load the group data
        try {
          const groupResponse = await groupAPI.getGroup(groupId);
          setGroupData(groupResponse.data);
          setExpenses([]);
        } catch {
          navigate(`/groups/${groupId}`);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [groupId, navigate, refreshTrigger]);

  // Auto-refresh when navigating back from AddExpense (componentDidMount style)
  useEffect(() => {
    // Force refresh whenever this component mounts/remounts
    setRefreshTrigger(prev => prev + 1);
  }, []);

  const handleExpenseClick = (expense) => {
    setSelectedExpense(expense);
    setShowExpenseDetail(true);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const getPayer = (expense) => {
    return expense.payer_name || 'Unknown';
  };

  if (loading) {
    return (
      <div className="loading-screen">
        🔄 Loading expenses...
      </div>
    );
  }

  return (
    <div className="group-expenses">
      <div className="expenses-header">
        <button onClick={() => navigate(`/groups/${groupId}`)} className="back-btn">
          ←
        </button>
        <h1>{groupData?.group?.name} Expenses</h1>
        <div className="header-buttons">
          <button
            onClick={() => navigate(`/groups/${groupId}/balances`)}
            className="view-balances-btn"
          >
            View Balances
          </button>
          <button
            onClick={() => navigate(`/groups/${groupId}/add-expense`)}
            className="add-expense-btn"
          >
            + Add
          </button>
        </div>
      </div>

      <div className="expenses-content">
        {expenses.length === 0 ? (
          <div className="empty-expenses">
            <div className="empty-icon">💸</div>
            <h3>No expenses yet</h3>
            <p>Start by adding your first expense</p>
            <button
              onClick={() => navigate(`/groups/${groupId}/add-expense`)}
              className="add-first-expense-btn"
            >
              Add First Expense
            </button>
          </div>
        ) : (
          <div className="expenses-list">
            {expenses.map((expense) => (
              <div
                key={expense.id}
                className="expense-card"
                onClick={() => handleExpenseClick(expense)}
              >
                <div className="expense-main">
                  <div className="expense-info">
                    <div className="expense-note">{expense.note || 'Expense'}</div>
                    <div className="expense-details">
                      <span className="expense-payer">Paid by {getPayer(expense)}</span>
                      <span className="expense-date">
                        {formatDate(expense.date)} at {formatTime(expense.date)}
                      </span>
                    </div>
                  </div>
                  <div className="expense-amount">₹{expense.amount}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showExpenseDetail && selectedExpense && (
        <div className="modal-overlay">
          <div className="expense-detail-modal">
            <div className="modal-header">
              <h3>{selectedExpense.note || 'Expense'}</h3>
              <button
                onClick={() => setShowExpenseDetail(false)}
                className="close-btn"
              >
                ×
              </button>
            </div>

            <div className="modal-content">
              <div className="expense-amount-large">₹{selectedExpense.amount}</div>

              <div className="expense-info-section">
                <div className="info-item">
                  <span className="info-label">💳 Paid by:</span>
                  <span className="info-value">{getPayer(selectedExpense)}</span>
                </div>

                <div className="info-item">
                  <span className="info-label">📅 Date:</span>
                  <span className="info-value">
                    {formatDate(selectedExpense.date)} at {formatTime(selectedExpense.date)}
                  </span>
                </div>
              </div>

              <div className="involved-users-section">
                <h4>👥 Split between:</h4>
                <div className="involved-users-list">
                  {selectedExpense.involved_users?.map((user) => (
                    <div key={user.id} className="involved-user">
                      <div className="user-avatar">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="user-name">{user.name}</span>
                      <span className="user-share">
                        ₹{(selectedExpense.amount / selectedExpense.involved_users.length).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupExpenses;