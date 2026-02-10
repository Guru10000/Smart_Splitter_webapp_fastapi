import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
console.log(API_BASE_URL)

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

export const authAPI = {
  login: async (data) => {
    const formData = new FormData();
    formData.append('username', data.username);
    formData.append('password', data.password);

    return api.post('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  },

  sendOTP: async (phone) => {
    return api.post(`/auth/register/send-otp?phone=${phone}`);
  },

  register: async (data, otp) => {
    return api.post(`/auth/register/verify?otp=${otp}`, data, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },

  logout: async () => {
    return api.post('/auth/logout');
  },

  getMe: async () => {
    return api.get('/auth/me');
  },
};

export const groupAPI = {
  getMyGroups: async () => {
    return api.get('/groups/my-groups');
  },

  getGroup: async (groupId) => {
    return api.get(`/groups/${groupId}`);
  },

  createGroup: async (data) => {
    return api.post('/groups/create', data);
  },

  addMember: async (groupId, data) => {
    return api.post(`/groups/${groupId}/add_member`, data);
  },

  createInvite: async (groupId) => {
    return api.post(`/groups/${groupId}/invite`);
  },

  joinGroup: async (token) => {
    return api.get(`/groups/join/${token}`);
  },

  getMemberProfile: async (groupId, userId) => {
    return api.get(`/groups/${groupId}/members/${userId}`);
  },

  removeMember: async (groupId, userId) => {
    return api.delete(`/admin/${groupId}/${userId}`);
  },

  getExpenses: async (groupId) => {
    return api.get(`/expenses/${groupId}`);
  },

  addExpense: async (groupId, data) => {
    return api.post(`/expenses/${groupId}/add`, data);
  },

  getBalances: async (groupId) => {
    return api.get(`/expenses/${groupId}/balance`);
  },

  settleGroup: async (groupId) => {
    return api.post(`/settlements/${groupId}/settle`);
  },

  getSettlementHistory: async (groupId) => {
    return api.get(`/settlements/history/${groupId}`);
  },

  getPendingSettlements: async (groupId) => {
    return api.get(`/settlements/pending_history/${groupId}`);
  },

  markSettlementPaid: async (settlementId) => {
    return api.post(`/settlements/${settlementId}/mark_paid`);
  },

  undoSettlement: async (settlementId) => {
    return api.delete(`/admin/settlement/${settlementId}`);
  },

  exitGroup: async (groupId) => {
    return api.delete(`/groups/${groupId}/exit`);
  },

  deleteGroup: async (groupId) => {
    return api.delete(`/admin/${groupId}`);
  },
};


export const chatAPI = {
  getMessages: async (groupId) => {
    return api.get(`/chat/${groupId}/messages`);
  },
};

export const aboutAPI = {
  submitFeedback: async (data) => {
    return api.post('/about/feedback', data);
  },
};

export default api;