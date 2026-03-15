import React from 'react';
import { motion } from 'framer-motion';
import { ScanFace } from 'lucide-react';

const VerifyingPulse = ({ pv, pt }) => (
  <motion.div key="s4" initial={pv.initial} animate={pv.in} exit={pv.out} transition={pt} style={{ paddingBlock: 20 }}>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
      <div style={{ position: 'relative', width: 120, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {[1, 2, 3].map(i => (
          <motion.div key={i}
            style={{ position: 'absolute', width: 120, height: 120, borderRadius: '50%', border: '2px solid var(--primary)', opacity: 0 }}
            animate={{ scale: [1, 2.5], opacity: [0.6, 0] }}
            transition={{ repeat: Infinity, duration: 2, delay: i * 0.5, ease: 'easeOut' }} />
        ))}
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(37,99,235,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}>
            <ScanFace size={40} color="var(--primary)" />
          </motion.div>
        </div>
      </div>
      <h2>Verifying Identity</h2>
      <p className="subtitle">Please wait while we process your biometrics…</p>
      <div style={{ display: 'flex', gap: 8 }}>
        {[0, 1, 2].map(i => (
          <motion.div key={i}
            style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--primary)' }}
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.2 }} />
        ))}
      </div>
    </div>
  </motion.div>
);

export default VerifyingPulse;
