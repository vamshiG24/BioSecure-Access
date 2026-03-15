import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

export const api = {
  // Authentication & Registration
  register: async (username, audioBlob, imageBlob) => {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('audio', audioBlob, 'voice.webm');
    formData.append('image', imageBlob, 'face.jpg');
    const res = await axios.post(`${API_BASE}/register`, formData);
    return res.data;
  },

  verifyVoice: async (audioBlob) => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'voice.webm');
    const res = await axios.post(`${API_BASE}/verify_voice`, formData);
    return res.data;
  },

  verifyFace: async (username, imageBlob) => {
    const formData = new FormData();
    formData.append('image', imageBlob, 'face.jpg');
    formData.append('username', username);
    const res = await axios.post(`${API_BASE}/verify_face`, formData);
    return res.data;
  },

  // User Management
  getUsers: async () => {
    const res = await axios.get(`${API_BASE}/users`);
    return res.data;
  },

  deleteUser: async (username) => {
    const res = await axios.post(`${API_BASE}/delete_user`, { username });
    return res.data;
  }
};
