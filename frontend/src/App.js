import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import GroupsList from './components/GroupsList';
import GroupDashboard from './components/GroupDashboard';
import GroupDetails from './components/GroupDetails';
import AddMember from './components/AddMember';
import GroupExpenses from './components/GroupExpenses';
import AddExpense from './components/AddExpense';
import ViewBalances from './components/ViewBalances';
import Settlements from './components/Settlements';
import SettlementHistory from './components/SettlementHistory';
import GroupChat from './components/GroupChat';
import Profile from './components/Profile';
import Settings from './components/Settings';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/groups" element={<GroupsList />} />
          <Route path="/groups/:groupId" element={<GroupDashboard />} />
          <Route path="/groups/:groupId/details" element={<GroupDetails />} />
          <Route path="/groups/:groupId/add-member" element={<AddMember />} />
          <Route path="/groups/:groupId/chat" element={<GroupChat />} />
          <Route path="/groups/:groupId/expenses" element={<GroupExpenses />} />
          <Route path="/groups/:groupId/add-expense" element={<AddExpense />} />
          <Route path="/groups/:groupId/balances" element={<ViewBalances />} />
          <Route path="/groups/:groupId/settlements" element={<Settlements />} />
          <Route path="/groups/:groupId/settlement-history" element={<SettlementHistory />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
