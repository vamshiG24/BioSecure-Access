import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, UserPlus } from 'lucide-react';

const UsernameForm = ({ username, setUsername, setStep, setStatus, pv, pt }) => (
  <motion.div key="s1" initial={pv.initial} animate={pv.in} exit={pv.out} transition={pt}>
    <h2>Who are you?</h2>
    <p className="subtitle">Enter a unique username to register.</p>
    <div className="input-field" style={{ marginTop: 20 }}>
      <input
        type="text"
        placeholder="e.g. janesmith"
        value={username}
        onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
      />
    </div>
    <div className="btn-group">
      <button className="btn btn-secondary" onClick={() => { setStep(0); setStatus(''); }}>
        <ArrowLeft size={18} /> Back
      </button>
      <button className="btn btn-primary" disabled={username.length < 3} onClick={() => { setStep(2); setStatus('Record your voice'); }}>
        Next Step
      </button>
    </div>
  </motion.div>
);

export default UsernameForm;
