import React from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Users, Trash2, LogOut } from 'lucide-react';

const UserDashboard = ({ username, setMode, setAudioBlob, setImageBlob, setStep, setStatus, setDashboardOrigin, fetchAllUsers, handleDeleteAccount, reset, pv, pt }) => (
  <motion.div key="s6" initial={pv.initial} animate={pv.in} exit={pv.out} transition={pt}>
    <h2>Dashboard</h2>
    <p className="subtitle">Welcome back, <strong>{username}</strong>!</p>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 32 }}>
      <button className="btn btn-primary" onClick={() => {
        setMode('update'); setAudioBlob(null); setImageBlob(null);
        setStep(2); setStatus('Update your voice print');
      }}>
        <RefreshCw size={20} /> Update Biometrics
      </button>
      <button className="btn btn-secondary" onClick={() => {
        setDashboardOrigin(6); fetchAllUsers(); setStep(7);
      }}>
        <Users size={20} /> View All Users
      </button>
      <button className="btn btn-danger" onClick={handleDeleteAccount}>
        <Trash2 size={20} /> Delete Account
      </button>
      <button className="btn btn-secondary" onClick={reset}>
        <LogOut size={20} /> Sign Out
      </button>
    </div>
  </motion.div>
);

export default UserDashboard;
