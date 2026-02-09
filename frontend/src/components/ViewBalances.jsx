import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { groupAPI } from '../services/api';
import './ViewBalances.css';

const ViewBalances = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [balances, setBalances] = useState([]);
  const [groupData, setGroupData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [groupResponse, balancesResponse] = await Promise.all([
          groupAPI.getGroup(groupId),
          groupAPI.getBalances(groupId)
        ]);
        setGroupData(groupResponse.data);
        
        // Map user names to balances
        const balancesWithNames = balancesResponse.data.balances.map(balance => {
          const user = groupResponse.data.members.find(m => m.id === balance.user_id);
          return {
            ...balance,
            user_name: user?.name || 'Unknown'
          };
        });
        setBalances(balancesWithNames);
      } catch (error) {
        console.error('Failed to load balances:', error);
        navigate(`/groups/${groupId}/expenses`);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [groupId, navigate]);

  if (loading) {
    return <div className="loading-screen">Loading balances...</div>;
  }

  return (
    <div className="view-balances">
      <div className="balances-header">
        <button onClick={() => navigate(`/groups/${groupId}/expenses`)} className="back-btn">
          ←
        </button>
        <h1>{groupData?.group?.name} Balances</h1>
      </div>

      <div className="balances-content">
        {balances.length === 0 ? (
          <div className="no-balances">
            <div className="balance-icon">⚖️</div>
            <h3>All settled up!</h3>
            <p>No outstanding balances in this group</p>
          </div>
        ) : (
          <div className="balances-list">
            {balances.map((balance) => (
              <div key={balance.user_id} className={`balance-card ${balance.balance > 0 ? 'positive' : 'negative'}`}>
                <div className="balance-user">
                  <div className="user-avatar">
                    {balance.user_name.charAt(0).toUpperCase()}
                  </div>
                  <span className="user-name">{balance.user_name}</span>
                </div>
                <div className="balance-amount">
                  {balance.balance > 0 ? '+' : '-'}₹{Math.abs(balance.balance)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewBalances;