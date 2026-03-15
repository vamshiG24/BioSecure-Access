import React from 'react';
import { motion } from 'framer-motion';
import { LogIn, UserPlus } from 'lucide-react';

const WelcomeScreen = ({ setMode, setStep, setStatus, pv, pt }) => (
  <motion.div key="s0" initial={pv.initial} animate={pv.in} exit={pv.out} transition={pt}>
    <h1>BioSecure</h1>
    <p className="subtitle">Voice & Face Authentication</p>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 40 }}>
      {/* Passwordless Login straight to voice */}
      <button className="btn btn-primary" onClick={() => { setMode('login'); setStep(2); setStatus('Identify your voice'); }}>
        <LogIn size={20} /> Login (Secure)
      </button>
      {/* Registration requires typing a username first */}
      <button className="btn btn-secondary" onClick={() => { setMode('register'); setStep(1); setStatus('Enter username'); }}>
        <UserPlus size={20} /> Register New Account
      </button>
    </div>
  </motion.div>
);

export default WelcomeScreen;
