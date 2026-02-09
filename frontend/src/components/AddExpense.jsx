import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { groupAPI } from '../services/api';
import './AddExpense.css';

const AddExpense = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [groupData, setGroupData] = useState(null);
  const [showMemberSelection, setShowMemberSelection] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    note: '',
    involved_user_ids: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        const response = await groupAPI.getGroup(groupId);
        setGroupData(response.data);
      } catch (error) {
        console.error('Failed to load group:', error);
        navigate(`/groups/${groupId}`);
      }
    };
    fetchGroup();
  }, [groupId, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || (formData.involved_user_ids || []).length === 0) {
      setError('Please fill all required fields');
      return;
    }

    setError('');
    setLoading(true);
    try {
      console.log('Submitting expense with data:', {
        ...formData,
        amount: parseFloat(formData.amount)
      });

      const payload = {
        ...formData,
        amount: parseFloat(formData.amount)
      };


      const response = await groupAPI.addExpense(groupId, payload);

      console.log('Expense added successfully:', response);

      // Show success message
      setSuccess('✓ Expense added successfully!');

      // Reset form
      setFormData({
        amount: '',
        note: '',
        involved_user_ids: []
      });
      setShowMemberSelection(false);
      setLoading(false);

      // Redirect to expenses page after 2 seconds
      setTimeout(() => {
        setSuccess('');
        navigate(`/groups/${groupId}/expenses`);
      }, 2000);


    } catch (error) {
      console.error('Failed to add expense:', error);
      console.error('Error response:', error.response?.data ?? error.response);
      // Normalize error to a string so React won't try to render an object
      const detail = error.response?.data?.detail ?? error.response?.data ?? null;
      let message = '';
      if (detail) {
        if (Array.isArray(detail)) {
          // pydantic validation errors from FastAPI are arrays of objects
          message = detail.map(d => (d.msg ? d.msg : JSON.stringify(d))).join('; ');
        } else if (typeof detail === 'object') {
          message = JSON.stringify(detail);
        } else {
          message = String(detail);
        }
      } else {
        message = error.message || 'Failed to add expense. Please try again.';
      }
      setError(message);
      setLoading(false);
    }
  };

  const toggleMember = (memberId) => {
    setFormData(prev => {
      const list = prev.involved_user_ids || [];
      const exists = list.includes(memberId);
      return {
        ...prev,
        involved_user_ids: exists ? list.filter(id => id !== memberId) : [...list, memberId]
      };
    });
  };

  if (!groupData) return <div className="loading-screen">Loading...</div>;

  return (
    <div className="add-expense">
      <div className="add-expense-header">
        <button onClick={() => navigate(`/groups/${groupId}/expenses`)} className="back-btn">
          ←
        </button>
        <h1>Add Expense</h1>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <form onSubmit={handleSubmit} className="expense-form">
        <div className="form-group">
          <label>Amount (₹)</label>
          <input
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
            placeholder="0.00"
            required
          />
        </div>

        <div className="form-group">
          <label>Description</label>
          <input
            type="text"
            value={formData.note}
            onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
            placeholder="What was this expense for?"
          />
        </div>

        <div className="form-group">
          <div
            className="split-between-header"
            onClick={() => setShowMemberSelection(!showMemberSelection)}
          >
            <label>Split between ({(formData.involved_user_ids || []).length} members)</label>
            <span className="dropdown-arrow">{showMemberSelection ? '▲' : '▼'}</span>
          </div>

          {showMemberSelection && (
            <div className="members-list">
              {groupData?.members?.map(member => (
                <div key={member.id} className="member-item">
                  <label className="member-checkbox">
                    <input
                      type="checkbox"
                      checked={(formData.involved_user_ids || []).includes(member.id)}
                      onChange={() => toggleMember(member.id)}
                    />
                    <span className="member-name">{member.name}</span>
                  </label>
                </div>
              )) || []}
            </div>
          )}
        </div>

        <button type="submit" disabled={loading || !formData.amount} className="submit-btn">
          {loading ? 'Adding...' : 'Add Expense'}
        </button>
      </form>
    </div>
  );
};

export default AddExpense;