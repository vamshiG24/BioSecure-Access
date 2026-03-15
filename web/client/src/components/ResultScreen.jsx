import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle } from 'lucide-react';

const ResultScreen = ({ authResult, username, reset, pv, pt }) => (
  <motion.div key="s5" initial={pv.initial} animate={pv.in} exit={pv.out} transition={pt}>
    <div className={`result-icon ${authResult?.success ? 'result-success' : 'result-error'}`}>
      {authResult?.success ? <CheckCircle size={32} /> : <XCircle size={32} />}
    </div>
    <h2>{authResult?.success ? 'Success!' : 'Failed'}</h2>
    <p className="subtitle" style={{ color: authResult?.success ? 'var(--success)' : 'var(--danger)', fontSize: '1.1rem' }}>
      {authResult?.message ?? (authResult?.success ? `Action completed for ${username}` : 'Access Denied')}
    </p>
    <button className="btn btn-primary" style={{ width: '100%', marginTop: 30 }} onClick={reset}>
      Done
    </button>
  </motion.div>
);

export default ResultScreen;
